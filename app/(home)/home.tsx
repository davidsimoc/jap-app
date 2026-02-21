import React, { useState, useEffect } from 'react';
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
import { db, auth } from '@/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, Auth } from 'firebase/auth';

const { width } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function HomeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  
  const [roadData, setRoadData] = useState<RoadNode[]>(INITIAL_ROAD_DATA);
  const [selectedNode, setSelectedNode] = useState<RoadNode | null>(null);
  const [lessonVisible, setLessonVisible] = useState(false);
  
  // Animation state (initialized to a large value to hide the solid path at start)
  const pathLength = useSharedValue(3000);
  const progress = useSharedValue(0);

  // Load progress from Firebase on mount
  useEffect(() => {
    const firebaseAuth = auth as Auth;
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) return;

      try {
        console.log("Fetching progress for UID:", user.uid);
        const docRef = doc(db, 'userProgress', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().road) {
          const savedProgress = docSnap.data().road;
          setRoadData(prevData => prevData.map(node => ({
            ...node,
            status: savedProgress[node.id] || node.status
          })));
        }
      } catch (error: any) {
        console.error("Error loading progress details:", {
          message: error.message,
          code: error.code,
          uid: user.uid
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleNodeComplete = async (nodeId: string) => {
    const firebaseAuth = auth as Auth;
    const user = firebaseAuth.currentUser;
    let updatedData: RoadNode[] = [];
    
    setRoadData(prevData => {
      const currentIndex = prevData.findIndex(n => n.id === nodeId);
      if (currentIndex === -1) return prevData;

      const newData = [...prevData];
      newData[currentIndex] = { ...newData[currentIndex], status: 'completed' };

      if (currentIndex < newData.length - 1) {
        newData[currentIndex + 1] = { ...newData[currentIndex + 1], status: 'unlocked' };
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
        await setDoc(docRef, { road: progressMap }, { merge: true });
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

  // Calculate professional path progress based on pixel distances
  useEffect(() => {
    // 1. Calculate segment lengths
    let totalLen = 0;
    const segmentLengths = [0];
    
    for (let i = 1; i < roadData.length; i++) {
      const p1 = roadData[i-1].position;
      const p2 = roadData[i].position;
      const dx = (p2.x - p1.x) * width / 100;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      // Rough bezier approximation (S-curves are ~8% longer than straight lines)
      const approxDist = dist * 1.08; 
      totalLen += approxDist;
      segmentLengths.push(totalLen);
    }

    // 2. Find the target node (furthest completed index + 1)
    const lastCompletedIndex = [...roadData].reverse().findIndex(n => n.status === 'completed');
    const currentIndex = lastCompletedIndex === -1 ? -1 : (roadData.length - 1 - lastCompletedIndex);
    
    // Target: Reach the NEXT node if current is completed
    const targetNodeIndex = Math.min(currentIndex + 1, roadData.length - 1);
    const targetPixelLength = segmentLengths[targetNodeIndex];

    pathLength.value = totalLen || 1000;
    progress.value = withTiming(targetPixelLength, { duration: 1500 });
  }, [roadData, width]);

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
        <TouchableOpacity style={[styles.diaryButton, { backgroundColor: currentTheme.primary + '10' }]}>
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
        visible={lessonVisible}
        node={selectedNode}
        onClose={() => setLessonVisible(false)}
        onComplete={handleNodeComplete}
      />
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
});
