
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  LayoutAnimation,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
// @ts-ignore
import { db, auth } from '@/firebaseConfig';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { INITIAL_ROAD_DATA, RoadNode, LessonStep } from '@/constants/roadData';

const { width } = Dimensions.get('window');

type TabType = 'passport' | 'vocabulary' | 'grammar';

export default function DiaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const [activeTab, setActiveTab] = useState<TabType>('passport');
  const [searchQuery, setSearchQuery] = useState('');
  const [collectedSouvenirs, setCollectedSouvenirs] = useState<string[]>([]);
  const [starredWords, setStarredWords] = useState<string[]>([]);
  const [roadProgress, setRoadProgress] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firebaseAuth = auth as Auth;
    let unsubscribeProgress: () => void;

    const authUnsubscribe = onAuthStateChanged(firebaseAuth, (user: User | null) => {
      if (!user) {
        if (unsubscribeProgress) unsubscribeProgress();
        return;
      }

      const docRef = doc(db, 'userProgress', user.uid);
      unsubscribeProgress = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCollectedSouvenirs(data.souvenirs || []);
          setStarredWords(data.starredWords || []);
          setRoadProgress(data.road || {});
        }
        setLoading(false);
      }, (error) => {
        console.error('Error listening to diary data:', error);
        setLoading(false);
      });
    });

    return () => {
      authUnsubscribe();
      if (unsubscribeProgress) unsubscribeProgress();
    };
  }, []);

  // Aggregated data from completed nodes
  const learnedContent = useMemo(() => {
    let vocab: { word: string; reading: string; meaning: string; nodeId: string; nodeTitle: string }[] = [];
    let grammar: { title: string; explanation: string; examples: any[]; nodeId: string; nodeTitle: string }[] = [];

    INITIAL_ROAD_DATA.forEach(node => {
      if (roadProgress[node.id] === 'completed') {
        node.steps.forEach(step => {
          if (step.type === 'vocabulary') {
            step.items.forEach(item => {
              if (!vocab.some(v => v.word === item.word)) {
                vocab.push({ ...item, nodeId: node.id, nodeTitle: node.title });
              }
            });
          } else if (step.type === 'grammar') {
            grammar.push({
              title: step.title,
              explanation: step.explanation,
              examples: step.examples || [],
              nodeId: node.id,
              nodeTitle: node.title
            });
          }
        });
      }
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      vocab = vocab.filter(v =>
        v.word.toLowerCase().includes(q) ||
        v.reading.toLowerCase().includes(q) ||
        v.meaning.toLowerCase().includes(q)
      );
      grammar = grammar.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.explanation.toLowerCase().includes(q)
      );
    }

    return { vocab, grammar };
  }, [roadProgress, searchQuery]);

  const allSouvenirs = INITIAL_ROAD_DATA
    .filter(node => node.souvenir)
    .map(node => node.souvenir!);

  const switchTab = (tab: TabType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const toggleStar = async (word: string) => {
    const firebaseAuth = auth as unknown as Auth;
    const user = firebaseAuth.currentUser;
    if (!user) return;

    const newStarred = starredWords.includes(word)
      ? starredWords.filter(w => w !== word)
      : [...starredWords, word];

    setStarredWords(newStarred);

    try {
      const { arrayUnion, arrayRemove, updateDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'userProgress', user.uid);
      await updateDoc(docRef, {
        starredWords: starredWords.includes(word) ? arrayRemove(word) : arrayUnion(word)
      });
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const renderPassportTab = () => (
    <>
      <View style={[styles.passportCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '05' }]}>
        <View style={styles.passportPattern}>
          {[...Array(5)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.patternLine,
                { backgroundColor: currentTheme.primary + '05', transform: [{ rotate: '45deg' }] }
              ]}
            />
          ))}
        </View>
        <View style={styles.passportHeader}>
          <View>
            <Text style={[styles.passportMainLabel, { color: currentTheme.text + '80' }]}>日本国旅券</Text>
            <Text style={[styles.passportSubLabel, { color: currentTheme.text + '40' }]}>TRAVELLER'S LOG</Text>
          </View>
          <Ionicons name="airplane" size={32} color={currentTheme.primary} />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: currentTheme.primary }]}>{collectedSouvenirs.length}</Text>
            <Text style={[styles.statLabel, { color: currentTheme.text + '60' }]}>Stamps</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: currentTheme.text + '10' }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: currentTheme.primary }]}>
              {Math.round((collectedSouvenirs.length / (allSouvenirs.length || 1)) * 100)}%
            </Text>
            <Text style={[styles.statLabel, { color: currentTheme.text + '60' }]}>Museum</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Memories Collected</Text>
      <View style={styles.stampsGrid}>
        {allSouvenirs.map(souvenir => {
          const isCollected = collectedSouvenirs.includes(souvenir.id);
          return (
            <View key={souvenir.id} style={styles.stampWrapper}>
              <View
                style={[
                  styles.stampInner,
                  {
                    backgroundColor: isCollected ? currentTheme.primary + '15' : currentTheme.surface,
                    borderColor: isCollected ? currentTheme.primary : currentTheme.text + '10',
                    borderStyle: isCollected ? 'solid' : 'dashed'
                  }
                ]}
              >
                {isCollected ? (
                  <>
                    <View style={[styles.stampIconContainer, { backgroundColor: currentTheme.primary }]}>
                      <Ionicons name={(souvenir.icon || 'trophy') as any} size={24} color="white" />
                    </View>
                    <Text style={[styles.stampName, { color: currentTheme.text }]}>{souvenir.name}</Text>
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={currentTheme.primary} />
                    </View>
                  </>
                ) : (
                  <>
                    <Ionicons name="lock-closed-outline" size={24} color={currentTheme.text + '20'} />
                    <Text style={[styles.stampName, { color: currentTheme.text + '30' }]}>Locked</Text>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </>
  );

  const renderVocabularyTab = () => (
    <View style={styles.notebookContainer}>
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Word Collection</Text>
      {learnedContent.vocab.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={48} color={currentTheme.text + '10'} />
          <Text style={[styles.emptyText, { color: currentTheme.text + '40' }]}>No words learned yet.</Text>
        </View>
      ) : (
        learnedContent.vocab.map((item, index) => {
          const isStarred = starredWords.includes(item.word);
          return (
            <View key={index} style={[styles.vocabRow, { borderBottomColor: currentTheme.text + '05' }]}>
              <TouchableOpacity
                style={styles.starSmall}
                onPress={() => toggleStar(item.word)}
              >
                <Ionicons
                  name={isStarred ? "star" : "star-outline"}
                  size={18}
                  color={isStarred ? "#FFD700" : currentTheme.text + '20'}
                />
              </TouchableOpacity>
              <View style={styles.vocabMain}>
                <Text style={[styles.vocabWord, { color: currentTheme.text }]}>{item.word}</Text>
                <Text style={[styles.vocabReading, { color: currentTheme.primary }]}>{item.reading}</Text>
              </View>
              <View style={styles.vocabMeaningContainer}>
                <Text style={[styles.vocabMeaning, { color: currentTheme.text + '70' }]}>{item.meaning}</Text>
                <Text style={[styles.vocabSource, { color: currentTheme.text + '30' }]}>{item.nodeTitle}</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const renderGrammarTab = () => (
    <View style={styles.notebookContainer}>
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Grammar Rules</Text>
      {learnedContent.grammar.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="library-outline" size={48} color={currentTheme.text + '10'} />
          <Text style={[styles.emptyText, { color: currentTheme.text + '40' }]}>No grammar rules learned yet.</Text>
        </View>
      ) : (
        learnedContent.grammar.map((item, index) => (
          <View key={index} style={[styles.grammarCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.primary + '20' }]}>
            <View style={[styles.grammarHeader, { borderBottomColor: currentTheme.text + '05' }]}>
              <Ionicons name="bookmark" size={20} color={currentTheme.primary} />
              <Text style={[styles.grammarTitle, { color: currentTheme.text }]}>{item.title}</Text>
            </View>
            <Text style={[styles.grammarExplanation, { color: currentTheme.text + '80' }]}>{item.explanation}</Text>
            {item.examples.slice(0, 1).map((ex, i) => (
              <View key={i} style={[styles.grammarExample, { backgroundColor: currentTheme.primary + '08' }]}>
                <Text style={[styles.exampleText, { color: currentTheme.text }]}>{ex.japanese}</Text>
                <Text style={[styles.exampleEnglish, { color: currentTheme.text + '50' }]}>{ex.english}</Text>
              </View>
            ))}
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={currentTheme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Travel Journal</Text>
          <View style={[styles.subtitleContainer, { backgroundColor: currentTheme.primary + '20' }]}>
            <Text style={[styles.headerSubtitle, { color: currentTheme.primary }]}>NOTEBOOK & PASSPORT</Text>
          </View>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        {(['passport', 'vocabulary', 'grammar'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => switchTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: currentTheme.primary, borderBottomWidth: 3 }
            ]}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? currentTheme.primary : currentTheme.text + '40' }
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Bar (Only for Notebook Tabs) */}
      {(activeTab === 'vocabulary' || activeTab === 'grammar') && (
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrapper, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '10' }]}>
            <Ionicons name="search-outline" size={18} color={currentTheme.text + '40'} />
            <TextInput
              style={[styles.searchInput, { color: currentTheme.text }]}
              placeholder={`Search ${activeTab}...`}
              placeholderTextColor={currentTheme.text + '30'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={currentTheme.text + '40'} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'passport' && renderPassportTab()}
        {activeTab === 'vocabulary' && renderVocabularyTab()}
        {activeTab === 'grammar' && renderGrammarTab()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.glow, { backgroundColor: currentTheme.primary + '05' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { marginLeft: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitleContainer: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  headerSubtitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    paddingVertical: 12,
    marginRight: 25,
    paddingHorizontal: 4,
  },
  tabText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: { padding: 20 },
  passportCard: {
    borderRadius: 24, padding: 25, marginBottom: 30, overflow: 'hidden', borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15 },
      android: { elevation: 10 },
    }),
  },
  passportPattern: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  patternLine: { width: 200, height: 1, position: 'absolute', left: -50 },
  passportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  passportMainLabel: { fontSize: 20, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  passportSubLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 16, padding: 15 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20, paddingLeft: 5 },
  stampsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  stampWrapper: { width: (width - 60) / 2, height: (width - 60) / 2, marginBottom: 20 },
  stampInner: { flex: 1, borderRadius: 20, borderWidth: 2, justifyContent: 'center', alignItems: 'center', padding: 15 },
  stampIconContainer: {
    width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4,
  },
  stampName: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  verifiedBadge: { position: 'absolute', top: 10, right: 10 },
  notebookContainer: { paddingBottom: 100 },
  vocabRow: {
    flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, alignItems: 'center', justifyContent: 'space-between',
  },
  vocabMain: { flex: 1, marginLeft: 10 },
  starSmall: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vocabWord: { fontSize: 22, fontWeight: '800' },
  vocabReading: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  vocabMeaningContainer: { alignItems: 'flex-end', flex: 1 },
  vocabMeaning: { fontSize: 16, fontWeight: '700', textAlign: 'right' },
  vocabSource: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  grammarCard: { borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1 },
  grammarHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1 },
  grammarTitle: { fontSize: 18, fontWeight: '800' },
  grammarExplanation: { fontSize: 14, lineHeight: 22, marginBottom: 15 },
  grammarExample: { padding: 12, borderRadius: 12 },
  exampleText: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  exampleEnglish: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 50, opacity: 0.5 },
  emptyText: { marginTop: 10, fontSize: 14, fontWeight: '600' },
  glow: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, zIndex: -1 },
});
