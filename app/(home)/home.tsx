import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import { INITIAL_ROAD_DATA, RoadNode, CHAPTERS, Chapter } from '@/constants/roadData';
import LessonRunner from '@/components/LessonRunner';
import { prefetchAudio, clearSpeechCache } from '@/services/ttsService';
import { db, auth } from '@/firebaseConfig';
import { doc, getDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { onAuthStateChanged, Auth } from 'firebase/auth';

const { width } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const [roadData, setRoadData] = useState<RoadNode[]>(INITIAL_ROAD_DATA);
  const [selectedNode, setSelectedNode] = useState<RoadNode | null>(null);
  const [lessonVisible, setLessonVisible] = useState(false);
  const [starredWords, setStarredWords] = useState<string[]>([]);

  // Animation state (initialized to a large value to hide the solid path at start)
  const pathLength = useSharedValue(3000);
  const progress = useSharedValue(0);
  const [maxCompletedIndex, setMaxCompletedIndex] = useState(-1);
  const [flashMeta, setFlashMeta] = useState<Record<string, any>>({});

  const dueCardsCount = useMemo(() => {
    const now = Date.now();
    return starredWords.filter(word => {
      const meta = flashMeta[word];
      // If no meta exists, it's a "new" card and interval is 0, so nextReview is 0
      // We should treat it as due if never reviewed
      return (meta?.nextReview ?? 0) <= now;
    }).length;
  }, [starredWords, flashMeta]);

  // Load progress from Firebase on mount
  useEffect(() => {
    clearSpeechCache();
    const firebaseAuth = auth as Auth;
    let unsubscribeProgress: () => void;
    let unsubscribeFlashcards: () => void;

    const authUnsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) {
        if (unsubscribeProgress) unsubscribeProgress();
        if (unsubscribeFlashcards) unsubscribeFlashcards();
        return;
      }

      // 1. Listen for userProgress (starredWords, road, etc.)
      const docRef = doc(db, 'userProgress', user.uid);
      unsubscribeProgress = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.road) {
            setRoadData(prevData => prevData.map(node => ({
              ...node,
              status: data.road[node.id] || node.status
            })));
          }
          setStarredWords(data.starredWords || []);
          setMaxCompletedIndex(data.maxCompletedIndex ?? -1);
        }
      }, (error) => {
        console.error("Error listening to progress:", error);
      });

      // 2. Listen for flashcards subcollection metadata
      const flashRef = collection(db, 'users', user.uid, 'flashcards');
      unsubscribeFlashcards = onSnapshot(flashRef, (snap) => {
        const meta: Record<string, any> = {};
        snap.forEach(doc => {
          meta[doc.id] = doc.data();
        });
        setFlashMeta(meta);
      });
    });

    return () => {
      authUnsubscribe();
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeFlashcards) unsubscribeFlashcards();
    };
  }, []);

  // Proactive pre-fetch for the NEXT unlocked node
  useEffect(() => {
    const nextNode = roadData.find(n => n.status === 'unlocked');
    if (nextNode) {
      const texts: string[] = [];
      nextNode.steps.forEach(step => {
        if (step.type === 'story') texts.push(step.text);
        else if (step.type === 'vocabulary') step.items.forEach(i => texts.push(i.word));
        else if (step.type === 'listening') texts.push(step.audioText);
      });
      if (texts.length > 0) prefetchAudio(texts);
    }
  }, [roadData]);

  const handleNodeComplete = async (nodeId: string) => {
    const firebaseAuth = auth as Auth;
    const user = firebaseAuth.currentUser;
    let updatedData: RoadNode[] = [];

    setRoadData(prevData => {
      const currentIndex = prevData.findIndex(n => n.id === nodeId);
      if (currentIndex === -1) return prevData;

      const newData = [...prevData];
      newData[currentIndex] = { ...newData[currentIndex], status: 'completed' };

      if (currentIndex < newData.length - 1 && newData[currentIndex + 1].status === 'locked') {
        newData[currentIndex + 1] = { ...newData[currentIndex + 1], status: 'unlocked' };
      }

      if (currentIndex > maxCompletedIndex) {
        setMaxCompletedIndex(currentIndex);
      }

      updatedData = newData;
      return newData;
    });

    // Persist to Firebase
    if (user && updatedData.length > 0) {
      try {
        console.log("Saving progress for UID:", user.uid, "Nodes:", updatedData.length);
        const progressMap = updatedData.reduce((acc, node: RoadNode) => ({
          ...acc,
          [node.id]: node.status
        }), {});

        const docRef = doc(db, 'userProgress', user.uid);
        const docSnap = await getDoc(docRef);
        let currentSouvenirs = [];
        if (docSnap.exists()) {
          currentSouvenirs = docSnap.data().souvenirs || [];
        }

        const completedNode = roadData.find(n => n.id === nodeId);
        if (completedNode?.souvenir && !currentSouvenirs.includes(completedNode.souvenir.id)) {
          currentSouvenirs.push(completedNode.souvenir.id);
        }

        await setDoc(docRef, {
          road: progressMap,
          souvenirs: currentSouvenirs,
          maxCompletedIndex: Math.max(maxCompletedIndex, roadData.findIndex(n => n.id === nodeId))
        }, { merge: true });
        console.log("Progress saved successfully!");
      } catch (error: any) {
        console.error("Error saving progress details:", {
          message: error.message,
          code: error.code,
          uid: user?.uid,
          progressCount: updatedData.length
        });
      }
    }
  };

  const toggleStar = async (word: string) => {
    const firebaseAuth = auth as any;
    const user = firebaseAuth.currentUser;
    if (!user) return;

    const isStarred = starredWords.includes(word);
    const newStarred = isStarred
      ? starredWords.filter(w => w !== word)
      : [...starredWords, word];

    setStarredWords(newStarred);

    try {
      const { arrayUnion, arrayRemove, updateDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'userProgress', user.uid);
      await updateDoc(docRef, {
        starredWords: isStarred ? arrayRemove(word) : arrayUnion(word)
      });
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  // Calculate professional path progress based on pixel distances
  useEffect(() => {
    // 1. Calculate segment lengths
    let totalLen = 0;
    const segmentLengths = [0];

    for (let i = 1; i < roadData.length; i++) {
      const p1 = roadData[i - 1].position;
      const p2 = roadData[i].position;
      const dx = (p2.x - p1.x) * width / 100;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Rough bezier approximation (S-curves are ~8% longer than straight lines)
      const approxDist = dist * 1.08;
      totalLen += approxDist;
      segmentLengths.push(totalLen);
    }

    // 2. Find the target node (max completed index + 1)
    const targetNodeIndex = Math.min(maxCompletedIndex + 1, roadData.length - 1);
    const targetPixelLength = segmentLengths[targetNodeIndex];

    pathLength.value = totalLen || 1000;
    progress.value = withTiming(targetPixelLength, { duration: 1500 });
  }, [roadData, width, maxCompletedIndex]);

  const animatedProps = useAnimatedProps(() => {
    // Show 'progress.value' pixels, then a huge gap to hide rest of solid line
    return {
      strokeDasharray: [progress.value, 5000],
    };
  });

  const renderRoadPath = () => {
    if (roadData.length < 2) return null;

    let pathData = "";
    roadData.forEach((node, index) => {
      const x = (node.position.x * width) / 100;
      const y = node.position.y + 40;

      if (index === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        const prevNode = roadData[index - 1];
        const prevX = (prevNode.position.x * width) / 100;
        const prevY = prevNode.position.y + 40;

        const cp1y = prevY + (y - prevY) / 2;
        const cp2y = prevY + (y - prevY) / 2;
        pathData += ` C ${prevX} ${cp1y}, ${x} ${cp2y}, ${x} ${y}`;
      }
    });

    return (
      <Svg style={StyleSheet.absoluteFill}>
        {/* Layer 1: Solid faint gray/beige base (The "road" base) */}
        <Path
          d={pathData}
          stroke={theme === 'dark' ? '#222' : '#F0EAD6'}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />

        {/* Layer 2: Dotted Red overlay (The "latent" or locked path) */}
        <Path
          d={pathData}
          stroke={currentTheme.primary + '35'}
          strokeWidth="8"
          fill="none"
          strokeDasharray="8, 16"
          strokeLinecap="round"
        />

        {/* Layer 3: Animated Solid Red (The completed progress) */}
        <AnimatedPath
          d={pathData}
          stroke={currentTheme.primary}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          animatedProps={animatedProps}
        />
      </Svg>
    );
  };

  const renderRoadNode = (node: RoadNode) => {
    const isLocked = node.status === 'locked';
    const isCompleted = node.status === 'completed';
    const leftPosition = (node.position.x * width) / 100;

    return (
      <View
        key={node.id}
        style={[styles.nodeAbsoluteContainer, { top: node.position.y }]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.nodeTouchable,
            { left: leftPosition - 60 } // Centered based on 120 width
          ]}
          onPress={() => {
            if (!isLocked) {
              // Pre-fetch immediately on tap for zero-delay
              const texts: string[] = [];
              node.steps.forEach(step => {
                if (step.type === 'story') texts.push(step.text);
                else if (step.type === 'vocabulary') step.items.forEach(i => texts.push(i.word));
                else if (step.type === 'listening') texts.push(step.audioText);
              });
              prefetchAudio(texts);

              setSelectedNode(node);
              setLessonVisible(true);
            }
          }}
        >
          <View style={[
            styles.nodeCircle,
            {
              backgroundColor: isLocked ? (theme === 'light' ? '#E8E8E8' : '#2A2A2A') : currentTheme.primary,
              borderColor: isCompleted ? '#4CAF50' : (isLocked ? 'transparent' : '#fff'),
              borderWidth: isCompleted ? 4 : (isLocked ? 0 : 3),
              transform: [{ scale: isLocked ? 0.9 : 1.1 }]
            }
          ]}>
            {isCompleted ? (
              <Ionicons name="checkmark" size={32} color="#fff" />
            ) : (
              <Ionicons
                name={node.type === 'story' ? 'book' : (node.type === 'quiz' ? 'flash' : 'flag')}
                size={28}
                color={isLocked ? currentTheme.text + '25' : '#fff'}
              />
            )}
          </View>

          <View style={[
            styles.labelContainer,
            {
              backgroundColor: currentTheme.surface,
              borderColor: isLocked ? currentTheme.text + '10' : currentTheme.primary + '15',
              borderWidth: 1
            }
          ]}>
            <Text style={[
              styles.nodeTitle,
              { color: isLocked ? currentTheme.text + '40' : currentTheme.text }
            ]}>
              {node.title}
            </Text>
            {isLocked && (
              <Ionicons name="lock-closed" size={10} color={currentTheme.text + '25'} />
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderChapterHeaders = () => {
    return CHAPTERS.map(chapter => {
      const firstNode = roadData.find(n => n.chapterId === chapter.id);
      if (!firstNode) return null;

      // Position header 120px above the first node of the chapter for perfect visibility
      const topOffset = firstNode.position.y - 120;

      return (
        <View
          key={chapter.id}
          style={[styles.chapterHeaderContainer, { top: topOffset }]}
        >
          <View style={[styles.chapterBadge, { backgroundColor: currentTheme.surface, borderColor: currentTheme.primary + '25' }]}>
            <Text style={[styles.chapterTitle, { color: currentTheme.primary }]}>
              {chapter.title.toUpperCase()}
            </Text>
          </View>
        </View>
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: currentTheme.text + '10' }]}>
        <View>
          <Text style={[styles.headerSubtitle, { color: currentTheme.text + '50' }]}>MY JOURNEY</Text>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Learning Path</Text>
        </View>
        <TouchableOpacity
          style={[styles.diaryButton, { backgroundColor: currentTheme.primary + '10' }]}
          onPress={() => router.push('/diary')}
        >
          <Ionicons name="journal-outline" size={20} color={currentTheme.primary} />
          <Text style={[styles.diaryButtonText, { color: currentTheme.primary }]}>Diary</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollPadding}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.roadMapContainer, { minHeight: 2500 }]}>
          {renderRoadPath()}
          {renderChapterHeaders()}
          {roadData.map(renderRoadNode)}
        </View>
      </ScrollView>

      <LessonRunner
        key={selectedNode?.id || 'none'}
        visible={lessonVisible}
        node={selectedNode}
        onClose={() => setLessonVisible(false)}
        onComplete={handleNodeComplete}
        starredWords={starredWords}
        onToggleStar={toggleStar}
      />

      {/* Floating Action Button for Review */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: currentTheme.primary }]}
        onPress={() => router.push('/flashcards')}
        activeOpacity={0.8}
      >
        <Ionicons name="layers" size={28} color="#fff" />
        {dueCardsCount > 0 && (
          <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
            <Text style={styles.badgeText}>{dueCardsCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
  },
  diaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  diaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  scrollPadding: {
    paddingBottom: 250,
  },
  roadMapContainer: {
    flex: 1,
    width: '100%',
  },
  chapterHeaderContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
  },
  chapterBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chapterTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3.5,
  },
  nodeAbsoluteContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'flex-start',
  },
  nodeTouchable: {
    alignItems: 'center',
    width: 120,
  },
  nodeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  labelContainer: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  nodeTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  fab: {
    position: 'absolute',
    bottom: 130,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  }
});
