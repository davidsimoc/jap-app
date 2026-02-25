
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  LayoutAnimation
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate
} from 'react-native-reanimated';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import { INITIAL_ROAD_DATA } from '@/constants/roadData';
// @ts-ignore
import { db, auth } from '@/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

type FlashcardMetadata = {
  word: string;
  interval: number; // in days
  repetitions: number;
  easeFactor: number;
  nextReview: number; // timestamp
};

export default function FlashcardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [practiceAllMode, setPracticeAllMode] = useState(false);

  const rotateY = useSharedValue(0);

  const fetchFlashcards = async (ignoreDue: boolean = false) => {
    setLoading(true);
    // @ts-ignore
    const user = auth?.currentUser;
    if (!user) return;

    try {
      // 1. Get starred words from userProgress
      const progRef = doc(db, 'userProgress', user.uid);
      const progSnap = await getDoc(progRef);
      const starredWords = progSnap.exists() ? (progSnap.data().starredWords || []) : [];

      if (starredWords.length === 0) {
        setCards([]);
        setLoading(false);
        return;
      }

      // 2. Get SRS metadata from flashcards collection
      const flashRef = collection(db, 'users', user.uid, 'flashcards');
      const flashSnap = await getDocs(flashRef);
      const metadataMap: Record<string, FlashcardMetadata> = {};
      flashSnap.forEach(doc => {
        metadataMap[doc.id] = doc.data() as FlashcardMetadata;
      });

      // 3. Find full word data from roadData
      const allVocab: Record<string, any> = {};
      INITIAL_ROAD_DATA.forEach(node => {
        node.steps.forEach(step => {
          if (step.type === 'vocabulary') {
            step.items.forEach(item => {
              allVocab[item.word] = { ...item, nodeTitle: node.title };
            });
          }
        });
      });

      // 4. Combine and filter
      const now = Date.now();
      const processedCards = starredWords
        .map((word: string) => {
          const meta = metadataMap[word] || {
            word,
            interval: 0,
            repetitions: 0,
            easeFactor: 2.5,
            nextReview: 0
          };
          return { ...allVocab[word], ...meta };
        })
        .filter((card: any) => ignoreDue || card.nextReview <= now)
        // Sort by urgency (oldest first)
        .sort((a: any, b: any) => a.nextReview - b.nextReview);

      setCards(processedCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      rotateY.value = 0;
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards(false);
  }, []);

  const flipCard = () => {
    // Prevent multiple flips during animation
    if (Math.abs(rotateY.value % 180) > 1) return;

    const target = isFlipped ? 0 : 180;
    rotateY.value = withSpring(target, {
      damping: 20,
      stiffness: 90,
      mass: 0.8
    });
    setIsFlipped(!isFlipped);
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateY: `${rotateY.value}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateY: `${rotateY.value + 180}deg` }],
      backfaceVisibility: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  // SM-2 Algorithm Integration
  const handleReview = async (quality: number) => {
    const currentCard = cards[currentIndex];
    const user = (auth as any).currentUser;
    if (!user) return;

    let { interval, repetitions, easeFactor } = currentCard;

    // SM-2 Logic
    if (quality >= 3) {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      repetitions += 1;
    } else {
      repetitions = 0;
      interval = 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);

    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

    // Save to Firestore
    try {
      const cardRef = doc(db, 'users', user.uid, 'flashcards', currentCard.word);
      await setDoc(cardRef, {
        word: currentCard.word,
        interval,
        repetitions,
        easeFactor,
        nextReview
      });
    } catch (error) {
      console.error('Error saving SRS data:', error);
    }

    // Move to next card
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      rotateY.value = 0;
    } else {
      setCards([]); // Done!
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={currentTheme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: currentTheme.primary + '10' }]}>
            <Ionicons name="sparkles" size={64} color={currentTheme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>All Caught Up!</Text>
          <Text style={[styles.emptySubtitle, { color: currentTheme.text + '50' }]}>
            You've reviewed all your due flashcards. Come back later for more!
          </Text>
          <TouchableOpacity
            style={[styles.finishButton, { backgroundColor: currentTheme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.finishText}>Back to Journey</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.practiceAllButton, { marginTop: 15 }]}
            onPress={() => {
              setPracticeAllMode(true);
              fetchFlashcards(true);
            }}
          >
            <Text style={[styles.practiceAllText, { color: currentTheme.primary }]}>Practice All Starred Words</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={currentTheme.text} />
        </TouchableOpacity>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressText, { color: currentTheme.text + '50' }]}>
            {currentIndex + 1} OF {cards.length}
          </Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${((currentIndex + 1) / cards.length) * 100}%`, backgroundColor: currentTheme.primary }]} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={flipCard}
          style={styles.cardContainer}
        >
          {/* Front Side */}
          <Animated.View style={[styles.card, { backgroundColor: currentTheme.surface }, frontAnimatedStyle]}>
            <Text style={[styles.sourceLabel, { color: currentTheme.primary + '40' }]}>{currentCard.nodeTitle}</Text>
            <Text style={[styles.wordText, { color: currentTheme.text }]}>{currentCard.word}</Text>
            <Text style={[styles.readingText, { color: currentTheme.text + '30' }]}>{currentCard.reading}</Text>
            <View style={styles.flipHint}>
              <Ionicons name="refresh-outline" size={20} color={currentTheme.text + '20'} />
              <Text style={[styles.hintText, { color: currentTheme.text + '20' }]}>Tap to flip</Text>
            </View>
          </Animated.View>

          {/* Back Side */}
          <Animated.View style={[styles.card, { backgroundColor: currentTheme.surface }, backAnimatedStyle]}>
            <Text style={[styles.meaningText, { color: currentTheme.text }]}>{currentCard.meaning}</Text>
            <View style={styles.backReadingContainer}>
              <Text style={[styles.backWord, { color: currentTheme.text + '40' }]}>{currentCard.word}</Text>
              <Text style={[styles.backReading, { color: currentTheme.primary }]}>{currentCard.reading}</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Review Actions */}
      {isFlipped && (
        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.rateButton, { backgroundColor: '#FF3B3015' }]}
              onPress={() => handleReview(1)}
            >
              <Text style={[styles.rateLabel, { color: '#FF3B30' }]}>Again</Text>
              <Text style={[styles.rateTime, { color: '#FF3B30' }]}>1m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rateButton, { backgroundColor: '#FF950015' }]}
              onPress={() => handleReview(3)}
            >
              <Text style={[styles.rateLabel, { color: '#FF9500' }]}>Hard</Text>
              <Text style={[styles.rateTime, { color: '#FF9500' }]}>1d</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rateButton, { backgroundColor: '#34C75915' }]}
              onPress={() => handleReview(4)}
            >
              <Text style={[styles.rateLabel, { color: '#34C759' }]}>Good</Text>
              <Text style={[styles.rateTime, { color: '#34C759' }]}>4d</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rateButton, { backgroundColor: '#007AFF15' }]}
              onPress={() => handleReview(5)}
            >
              <Text style={[styles.rateLabel, { color: '#007AFF' }]}>Easy</Text>
              <Text style={[styles.rateTime, { color: '#007AFF' }]}>1w</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
  },
  backButton: { width: 44, height: 44, justifyContent: 'center' },
  progressHeader: { flex: 1, paddingRight: 44, alignItems: 'center' },
  progressText: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  progressBarBg: { width: '80%', height: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 2 },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  cardContainer: { width: '100%', height: height * 0.5, zIndex: 1 },
  card: {
    flex: 1,
    borderRadius: 40,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
  },
  sourceLabel: { position: 'absolute', top: 30, fontSize: 13, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  wordText: { fontSize: 72, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  readingText: { fontSize: 24, fontWeight: '600', letterSpacing: 1 },
  flipHint: { position: 'absolute', bottom: 30, alignItems: 'center', gap: 5 },
  hintText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  meaningText: { fontSize: 42, fontWeight: '900', textAlign: 'center', marginBottom: 40 },
  backReadingContainer: { alignItems: 'center' },
  backWord: { fontSize: 24, fontWeight: '700', marginBottom: 5 },
  backReading: { fontSize: 18, fontWeight: '600' },
  actions: { paddingHorizontal: 20, paddingTop: 10 },
  buttonRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  rateButton: {
    flex: 1,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  rateLabel: { fontSize: 13, fontWeight: '800' },
  rateTime: { fontSize: 12, fontWeight: '600', opacity: 0.6 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 50 },
  emptyIcon: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  emptyTitle: { fontSize: 28, fontWeight: '900', marginBottom: 15 },
  emptySubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  finishButton: { height: 60, paddingHorizontal: 35, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  finishText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  practiceAllButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  practiceAllText: {
    fontSize: 16,
    fontWeight: '700',
    textDecorationLine: 'underline'
  }
});
