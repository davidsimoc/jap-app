import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/components/ThemeContext'; 
import { lightTheme, darkTheme } from '@/constants/Colors';
import { isKana, toRomaji, toKatakana } from 'wanakana';
import { preloadVoices, speakJapanese } from '@/services/ttsService';
import { SafeAreaView } from 'react-native-safe-area-context';
interface KanjiInfo {

  onyomi: string[];
  kunyomi: string[];
  meaning: string[];
  onyomiWords: { word: string; reading: string; meaning: string }[];
  kunyomiWords: { word: string; reading: string; meaning: string }[];
  specialReadings: { word: string; reading: string; meaning: string }[];
  examples: { sentence: string; reading: string; romanji: string, meaning: string }[];
}

export default function KanjiDetailsPage() {
  const { kanji: selectedKanji } = useLocalSearchParams();
  const [kanjiData, setKanjiData] = useState<KanjiInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme(); 
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const fetchKanjiBasicInfo = async (kanji: string) => {
    try {
      const response = await fetch(`https://kanjiapi.dev/v1/kanji/${kanji}`);
      if (!response.ok) throw new Error('Failed to fetch kanji basic info');

      const data = await response.json();
      return {
        onyomi: data.on_readings || [],
        kunyomi: data.kun_readings || [],
        meaning: data.meanings || [],
      };
    } catch (error) {
      console.error('Error loading informations about kanji:', error);
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
      const kunyomiRomanji = new Set(officialKunyomi.map(kuny => {
        const cleanKuny = kuny.replace(/[\.\s-]/g, '');
        return toRomaji(cleanKuny).toLowerCase();
      }));

      data.data.slice(0, 5).forEach((item: any) => {
        if (item.japanese && item.senses) {
          const word = item.japanese[0].word || item.japanese[0].reading;
          const reading = item.japanese[0].reading;
          const meaning = item.senses[0].english_definitions.join(', ');

          let isOnyomi = false;

          const wordRomanji = toRomaji(reading).toLowerCase();

          const matchesOnyomi = Array.from(onyomiRomanji).some(romanji => wordRomanji.includes(romanji));
          const matchesKunyomi = Array.from(kunyomiRomanji).some(romanji => wordRomanji.includes(romanji));

          if (matchesOnyomi && !matchesKunyomi) {
            isOnyomi = true;
          } else if (!matchesOnyomi && matchesKunyomi) {
            isOnyomi = false;
          } else if (matchesOnyomi && matchesKunyomi) {
            const stringAfterKanji = word.substring(word.indexOf(kanji) + kanji.length);
            const hasOkurigana = stringAfterKanji.match(/[ぁ-ん]/);

            if (!hasOkurigana) {
              isOnyomi = true;
            }
          }
          if (isOnyomi) {
            onyomiWords.push({ word, reading, meaning });
          } else {
            kunyomiWords.push({ word, reading, meaning });
          }
        }
      });
      return { onyomiWords, kunyomiWords };
    } catch (error) {
      console.error('Error loading words for kanji:', error);
      return { onyomiWords: [], kunyomiWords: [] };
    }
  }

  const fetchKanjiSentences = async (kanji: string) => {
    try {
      const response = await fetch(`https://tatoeba.org/en/api_v0/search?query=${kanji}&from=jpn&to=eng&limit=3`);
      const data = await response.json();

      const examples: any[] = [];

      if (data.results) {
        data.results.slice(0,5).forEach((result: any) => {
          if (result.text) {
            let englishMeaning = 'No translation available';
            if (result.translations && result.translations.length > 0 && result.translations[0].length > 0) {
              englishMeaning = result.translations[0][0].text || 'No translation available';
            }

            const furiganaTranscription = result.transcriptions?.find((t: any) =>
              t.script === 'Hrkt' && t.type === 'altscript'
            );

            let readingText = '';
            if (furiganaTranscription?.text) {
              readingText = furiganaTranscription.text
                .replace(/\[([^|]+)\|([^\]]+)\]/g, '$2') // Ex: [人|ひと] -> ひと
                .replace(/[^ぁ-んァ-ヴ0-9.?!、。]+/g, ''); 
            }

            const romanjiText = readingText ? toRomaji(readingText) : '';

            examples.push({
              sentence: result.text,
              reading: readingText,  
              romanji: romanjiText,  
              meaning: englishMeaning 
            });
          }
        });
      }

      return examples;
    } catch (error) {
      console.error('Error loading sentences for kanji:', error);
      return [];
    }
  }

  useEffect(() => {
    // Preload TTS voices la montare pentru a evita lag la primul play
    preloadVoices();

    const fetchKanjiDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const basicInfo = await fetchKanjiBasicInfo(selectedKanji as string);

        const words = await fetchKanjiWords(
          selectedKanji as string,
          basicInfo.onyomi,
          basicInfo.kunyomi
        );

        const sentences = await fetchKanjiSentences(selectedKanji as string);

        const combinedData: KanjiInfo = {
          onyomi: basicInfo.onyomi,
          kunyomi: basicInfo.kunyomi,
          meaning: basicInfo.meaning,
          onyomiWords: words.onyomiWords,
          kunyomiWords: words.kunyomiWords,
          specialReadings: [],
          examples: sentences,
        };

        setKanjiData(combinedData);
      } catch (e: any) {
        setError('Error loading informations about kanji.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchKanjiDetails();
  }, [selectedKanji]);

  if (loading) {
    return <View style={styles.container}><Text style={styles.loadingText}>Loading informations...</Text></View>;
  }

  if (error) {
    return <View style={styles.container}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (!kanjiData) {
    return <View style={styles.container}><Text style={styles.notFoundText}>Kanji not found.</Text></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <TouchableOpacity style={{ marginLeft: 15, marginBottom: 20, marginTop: 5 }} onPress={() => router.replace('/(home)/kanji/kana')}>
        <Text style={{ fontSize: 18, color: currentTheme.accent }}>Back to Kana</Text>
      </TouchableOpacity>
      <ScrollView style={{ ...styles.contentContainer, backgroundColor: currentTheme.background }}>
        <Text style={styles.kanji}>{selectedKanji}</Text>
        <View style={styles.infoRow}>
          <Text style={{ ...styles.label, color: currentTheme.text }}>Onyomi:</Text>
          <Text style={{ ...styles.value, color: currentTheme.text }}>{kanjiData.onyomi.join(', ')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={{ ...styles.label, color: currentTheme.text }}>Kunyomi:</Text>
          <Text style={{ ...styles.value, color: currentTheme.text }}>{kanjiData.kunyomi.join(', ')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={{ ...styles.label, color: currentTheme.text }}>Meaning:</Text>
          <Text style={{ ...styles.value, color: currentTheme.text }}>{kanjiData.meaning.join(', ')}</Text>
        </View>

        {kanjiData.onyomiWords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Onyomi Readings:</Text>
            {kanjiData.onyomiWords.map((item, index) => (
              <View key={index} style={styles.wordItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ ...styles.word, color: currentTheme.text }}>{item.word} ({item.reading})</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={styles.speakerButton} onPress={() => speakJapanese(item.reading || item.word)}>
                      <Ionicons name="volume-high-outline" size={22} color={currentTheme.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.speakerButton} onPress={() => speakJapanese(item.reading || item.word, { slow: true })}>
                      <Ionicons name="volume-low-outline" size={22} color={currentTheme.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={{ ...styles.wordMeaning, color: currentTheme.secondaryText }}>{item.meaning}</Text>
              </View>
            ))}
          </View>
        )}

        {kanjiData.kunyomiWords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kunyomi Readings:</Text>
          {kanjiData.kunyomiWords.map((item, index) => (
            <View key={index} style={styles.wordItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ ...styles.word, color: currentTheme.text }}>{item.word} ({item.reading})</Text>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity style={styles.speakerButton} onPress={() => speakJapanese(item.reading || item.word)}>
                    <Ionicons name="volume-high-outline" size={22} color={currentTheme.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.speakerButton} onPress={() => speakJapanese(item.reading || item.word, { slow: true })}>
                    <Ionicons name="volume-low-outline" size={22} color={currentTheme.secondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={{ ...styles.wordMeaning, color: currentTheme.secondaryText }}>{item.meaning}</Text>
            </View>
          ))}
        </View>
        )}
        {kanjiData.specialReadings && kanjiData.specialReadings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Readings:</Text>
            {kanjiData.specialReadings.map((item, index) => (
              <View key={index} style={styles.wordItem}>
                <Text style={{ ...styles.word, color: currentTheme.text }}>{item.word} ({item.reading})</Text>
                <Text style={{ ...styles.wordMeaning, color: currentTheme.secondaryText }}>{item.meaning}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Examples:</Text>
          {kanjiData.examples.map((item, index) => (
            <View key={index} style={styles.exampleItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ ...styles.example, color: currentTheme.text }}>{item.sentence}</Text>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity style={styles.speakerButton} onPress={() => speakJapanese(item.reading || item.sentence)}>
                    <Ionicons name="volume-high-outline" size={22} color={currentTheme.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.speakerButton} onPress={() => speakJapanese(item.reading || item.sentence, { slow: true })}>
                    <Ionicons name="volume-low-outline" size={22} color={currentTheme.secondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={{ ...styles.exampleReading, color: currentTheme.secondaryText }}>{item.reading}</Text>
              <Text style={{ ...styles.exampleReading, color: currentTheme.secondaryText }}>{item.romanji}</Text>
              <Text style={{ ...styles.exampleMeaning, color: currentTheme.accent }}>{item.meaning}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: darkTheme.background,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    color: darkTheme.text,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  notFoundText: {
    color: darkTheme.text,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  kanji: {
    fontSize: 64,
    color: darkTheme.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    //  color: darkTheme.text,
    marginRight: 10,
    width: 100,
  },
  value: {
    fontSize: 18,
    // color: darkTheme.text,
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: darkTheme.accent,
    marginBottom: 10,
  },
  wordItem: {
    marginBottom: 8,
  },
  word: {
    fontSize: 20,
    //color: darkTheme.text,
  },
  wordMeaning: {
    fontSize: 16,
    // color: darkTheme.secondaryText,
  },
  exampleItem: {
    marginBottom: 15,
  },
  example: {
    fontSize: 20,
    // color: darkTheme.text,
    marginBottom: 4,
  },
  exampleReading: {
    fontSize: 16,
    //color: darkTheme.secondaryText,
    marginBottom: 2,
  },
  exampleMeaning: {
    fontSize: 16,
    // color: darkTheme.accent,
  },
  backButton: {
    marginLeft: 1,
  },
  backButtonText: {
    fontSize: 18,
    color: darkTheme.accent,
  },
  speakerButton: {
    marginLeft: 8,
    padding: 6,
  },
});