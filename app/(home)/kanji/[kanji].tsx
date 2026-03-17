import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import { toRomaji } from 'wanakana';
import { speakJapanese } from '@/services/ttsService';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import KanjiHandwriting from '@/components/KanjiHandwriting';

interface KanjiInfo {
  onyomi: string[];
  kunyomi: string[];
  meanings: string[];
  onyomiWords: { word: string; reading: string; meaning: string }[];
  kunyomiWords: { word: string; reading: string; meaning: string }[];
  examples: { sentence: string; reading: string; romanji: string, meaning: string }[];
}

export default function KanjiDetailsPage() {
  const { kanji: selectedKanji } = useLocalSearchParams();
  const [kanjiData, setKanjiData] = useState<KanjiInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHandwritingModalVisible, setIsHandwritingModalVisible] = useState(false);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const isDark = theme === 'dark';

  const fetchKanjiBasicInfo = async (kanji: string) => {
    try {
      const response = await fetch(`https://kanjiapi.dev/v1/kanji/${kanji}`);
      if (!response.ok) throw new Error('Failed to fetch kanji basic info');
      const data = await response.json();
      return {
        onyomi: data.on_readings || [],
        kunyomi: data.kun_readings || [],
        meanings: data.meanings || [],
      };
    } catch (error) {
      console.error('Error loading kanji details:', error);
      throw error;
    }
  };

  const fetchKanjiWords = async (kanji: string, officialOnyomi: string[], officialKunyomi: string[]) => {
    try {
      const response = await fetch(`https://jisho.org/api/v1/search/words?keyword=${kanji}`);
      const data = await response.json();
      const onyomiWords: any[] = [];
      const kunyomiWords: any[] = [];

      const onyomiRomanji = new Set(officialOnyomi.map(ony => toRomaji(ony).toLowerCase()));
      const kunyomiRomanji = new Set(officialKunyomi.map(kuny => toRomaji(kuny.replace(/[\.\s-]/g, '')).toLowerCase()));

      data.data.slice(0, 8).forEach((item: any) => {
        if (item.japanese && item.senses) {
          const word = item.japanese[0].word || item.japanese[0].reading;
          const reading = item.japanese[0].reading;
          const meaning = item.senses[0].english_definitions.join(', ');
          const wordRomanji = toRomaji(reading).toLowerCase();

          const matchesOnyomi = Array.from(onyomiRomanji).some(romanji => wordRomanji.includes(romanji));
          const matchesKunyomi = Array.from(kunyomiRomanji).some(romanji => wordRomanji.includes(romanji));

          let isOnyomi = matchesOnyomi && !matchesKunyomi;
          if (matchesOnyomi && matchesKunyomi) {
            const stringAfterKanji = word.substring(word.indexOf(kanji) + kanji.length);
            isOnyomi = !stringAfterKanji.match(/[ぁ-ん]/);
          }

          if (isOnyomi) onyomiWords.push({ word, reading, meaning });
          else kunyomiWords.push({ word, reading, meaning });
        }
      });
      return { onyomiWords, kunyomiWords };
    } catch (error) {
      console.error('Error loading words:', error);
      return { onyomiWords: [], kunyomiWords: [] };
    }
  };

  const fetchKanjiSentences = async (kanji: string) => {
    try {
      const response = await fetch(`https://tatoeba.org/en/api_v0/search?query=${kanji}&from=jpn&to=eng&limit=5`);
      const data = await response.json();
      const examples: any[] = [];

      if (data.results) {
        data.results.forEach((result: any) => {
          if (result.text) {
            const englishMeaning = result.translations?.[0]?.[0]?.text || 'No translation available';
            const furiganaTranscription = result.transcriptions?.find((t: any) => t.script === 'Hrkt' && t.type === 'altscript');
            let readingText = furiganaTranscription?.text?.replace(/\[([^|]+)\|([^\]]+)\]/g, '$2').replace(/[^ぁ-んァ-ヴ0-9.?!、。]+/g, '') || '';
            examples.push({
              sentence: result.text,
              reading: readingText,
              romanji: readingText ? toRomaji(readingText) : '',
              meaning: englishMeaning
            });
          }
        });
      }
      return examples;
    } catch (error) {
      console.error('Error loading sentences:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadAllDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const basic = await fetchKanjiBasicInfo(selectedKanji as string);
        const words = await fetchKanjiWords(selectedKanji as string, basic.onyomi, basic.kunyomi);
        const sentences = await fetchKanjiSentences(selectedKanji as string);

        setKanjiData({
          onyomi: basic.onyomi,
          kunyomi: basic.kunyomi,
          meanings: basic.meanings,
          onyomiWords: words.onyomiWords,
          kunyomiWords: words.kunyomiWords,
          examples: sentences
        });
      } catch (e) {
        setError('Could not load Kanji details.');
      } finally {
        setLoading(false);
      }
    };
    loadAllDetails();
  }, [selectedKanji]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  if (error || !kanjiData) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.background }]}>
        <Text style={{ color: 'red', fontSize: 16 }}>{error || 'Kanji not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push({ pathname: '/(home)/kanji/kana', params: { tab: 'kanji' } })}>
          <Text style={{ color: currentTheme.primary, marginTop: 20 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonIcon} onPress={() => router.push({ pathname: '/(home)/kanji/kana', params: { tab: 'kanji' } })}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Kanji Details</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Kanji Card */}
        <View style={[styles.mainCard, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.kanjiLarge, { color: currentTheme.accent }]}>
            {selectedKanji}
          </Text>
          <Text style={[styles.mainMeaning, { color: currentTheme.text }]}>
            {kanjiData.meanings[0]?.toUpperCase()}
          </Text>

          <TouchableOpacity
            style={[styles.practiceButton, { backgroundColor: currentTheme.primary }]}
            onPress={() => setIsHandwritingModalVisible(true)}
          >
            <Ionicons name="pencil" size={18} color="#fff" />
            <Text style={styles.practiceButtonText}>Practice Writing</Text>
          </TouchableOpacity>
        </View>

        {/* Handwriting Modal */}
        <Modal
          visible={isHandwritingModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setIsHandwritingModalVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }}>
            <View style={[styles.modalHeader, { paddingTop: Math.max(15, insets.top) }]}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsHandwritingModalVisible(false)}
              >
                <Ionicons name="close" size={28} color={currentTheme.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Handwriting Practice</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.targetKanji, { color: currentTheme.text }]}>{selectedKanji}</Text>
              <KanjiHandwriting kanji={selectedKanji as string} />
            </View>
          </SafeAreaView>
        </Modal>

        {/* Basic Info Section */}
        <View style={[styles.infoCard, { backgroundColor: currentTheme.surface }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: currentTheme.text + '80' }]}>ONYOMI</Text>
            <Text style={[styles.infoValue, { color: currentTheme.text }]}>
              {kanjiData.onyomi.map(on => `${on} (${toRomaji(on)})`).join(' ・ ') || 'None'}
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: currentTheme.text + '80' }]}>KUNYOMI</Text>
            <Text style={[styles.infoValue, { color: currentTheme.text }]}>
              {kanjiData.kunyomi.map(kun => `${kun} (${toRomaji(kun)})`).join(' ・ ') || 'None'}
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: currentTheme.text + '80' }]}>MEANINGS</Text>
            <Text style={[styles.infoValue, { color: currentTheme.text }]}>
              {kanjiData.meanings.join(', ')}
            </Text>
          </View>
        </View>

        {/* Vocabulary Sections */}
        {kanjiData.onyomiWords.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Onyomi Vocabulary</Text>
            {kanjiData.onyomiWords.map((item, i) => (
              <WordCard key={`ony-${i}`} item={item} theme={currentTheme} />
            ))}
          </View>
        )}

        {kanjiData.kunyomiWords.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Kunyomi Vocabulary</Text>
            {kanjiData.kunyomiWords.map((item, i) => (
              <WordCard key={`kun-${i}`} item={item} theme={currentTheme} />
            ))}
          </View>
        )}

        {/* Examples Section */}
        {kanjiData.examples.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Usage Examples</Text>
            {kanjiData.examples.map((item, i) => (
              <ExampleCard key={`ex-${i}`} item={item} theme={currentTheme} />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function WordCard({ item, theme }: any) {
  return (
    <View style={[styles.wordCard, { backgroundColor: theme.surface }]}>
      <View style={styles.wordHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.wordText, { color: theme.text }]}>{item.word}</Text>
          <Text style={[styles.readingText, { color: theme.primary }]}>{item.reading}</Text>
        </View>
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: theme.primary + '15' }]}
          onPress={() => speakJapanese(item.reading || item.word)}
        >
          <Ionicons name="volume-high" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.meaningText, { color: theme.text + '90' }]}>{item.meaning}</Text>
    </View>
  );
}

function ExampleCard({ item, theme }: any) {
  return (
    <View style={[styles.exampleCard, { backgroundColor: theme.surface }]}>
      <View style={styles.wordHeader}>
        <Text style={[styles.exampleText, { color: theme.text }]}>{item.sentence}</Text>
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: theme.primary + '15' }]}
          onPress={() => speakJapanese(item.sentence)}
        >
          <Ionicons name="volume-high" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.exampleReading, { color: theme.primary }]}>{item.reading}</Text>
      <Text style={[styles.exampleTranslation, { color: theme.text + '70' }]}>{item.meaning}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', marginLeft: 15 },
  backButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  mainCard: {
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 15 },
      android: { elevation: 4 },
    }),
  },
  kanjiLarge: { fontSize: 80, fontWeight: '900', marginBottom: 10 },
  mainMeaning: { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  infoRow: { paddingVertical: 12 },
  infoLabel: { fontSize: 10, fontWeight: '800', marginBottom: 6, letterSpacing: 1 },
  infoValue: { fontSize: 18, fontWeight: '600' },
  infoDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 15, letterSpacing: -0.5 },
  wordCard: { borderRadius: 18, padding: 18, marginBottom: 12 },
  wordHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  wordText: { fontSize: 22, fontWeight: '700' },
  readingText: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  playButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  meaningText: { fontSize: 15, lineHeight: 20 },
  exampleCard: { borderRadius: 18, padding: 18, marginBottom: 12 },
  exampleText: { fontSize: 18, fontWeight: '600', flex: 1, lineHeight: 26 },
  exampleReading: { fontSize: 14, fontWeight: '500', marginTop: 8 },
  exampleTranslation: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  backButton: { padding: 10 },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 20,
    gap: 8,
  },
  practiceButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetKanji: {
    fontSize: 40,
    fontWeight: '900',
    marginBottom: 10,
    opacity: 0.3,
  }
});