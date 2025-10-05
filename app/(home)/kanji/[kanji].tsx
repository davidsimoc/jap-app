import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import kanjiDataN5 from '@/assets/data/kanjiData_N5.json'; // Importă datele kanji
import { useTheme } from '@/components/ThemeContext'; // Calea corectă!
import { lightTheme, darkTheme } from '@/constants/Colors'; // Asigură-te că ai importat corect temele

interface KanjiInfo {

  onyomi: string[];
  kunyomi: string[];
  meaning: string;
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
  const { theme, toggleTheme } = useTheme(); // Acum funcționează corect!
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const fetchKanjiBasicInfo = async (kanji: string) => {
    try {
        const response = await fetch(`https://kanjiapi.dev/v1/kanji/${kanji}`);
        if(!response.ok) throw new Error('Failed to fetch kanji basic info');

        const data = await response.json();
        return {
          onyomi: data.on_readings || [],
          kunyomi: data.kun_readings || [],
          meaning: data.meaning ? data.meaning.split(',') : '',
        };
      } catch (error) {
        console.error('Error loading informations about kanji:', error);
        throw error;
      }
  };

  const fetchKanjiWords = async (kanji: string) => {
    try {
      const response = await fetch(`https://jisho.org/api/v1/search/words?keyword=${kanji}`);
      const data = await response.json();

      const onyomiWords: any[] = [];
      const kunyomiWords: any[] = [];

      data.data.slice(0,5).forEach((item: any) => {
        if(item.japanese && item.senses) {
          const word = item.japanese[0].word || item.japanese[0].reading;
          const reading = item.japanese[0].reading;
          const meaning = item.senses[0].english_definitions.join(', ');

          if (reading.match(/[ァ-ヴ]/)) { // Katakana = onyomi
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
        data.results.forEach((result: any) => {
          if (result.text) {
            // Caută traducerea în engleză în array-ul translations
            const englishTranslation = result.translations?.find((t: any) => t.lang === 'eng');
            
            // Caută transcrierea romanji în array-ul transcriptions
            const romanjiTranscription = result.transcriptions?.find((t: any) => 
              t.script === 'Latn' && t.type === 'transcription'
            );
            
            examples.push({
              sentence: result.text,
              reading: result.text, // Tatoeba nu oferă furigana separat
              romanji: romanjiTranscription?.text || '', // Romanji din transcriptions
              meaning: englishTranslation?.text || 'No translation available'
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
    const fetchKanjiDetails = async () => {
      setLoading(true);
      setError(null);
      // try {
      //   const data = (kanjiDataN5 as Record<string, KanjiInfo>)[selectedKanji as string];
      //   if (data) {
      //     setKanjiData(data);
      //   } else {
      //     setError('Informations for this kanji not found.');
      //   }
      // } catch (e: any) {
      //   setError('Error loading informations about kanji.');
      //   console.error(e);
      // } finally {
      //   setLoading(false);
      // }
      try {
        const [basicInfo, words, sentences] = await Promise.all([
          fetchKanjiBasicInfo(selectedKanji as string),
          fetchKanjiWords(selectedKanji as string),
          fetchKanjiSentences(selectedKanji as string),
        ]);

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
    return <View style={styles.container}><Text style={styles.loadingText}>Se încarcă informațiile...</Text></View>;
  }

  if (error) {
    return <View style={styles.container}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (!kanjiData) {
    return <View style={styles.container}><Text style={styles.notFoundText}>Kanji nu găsit.</Text></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <TouchableOpacity style={{ marginLeft: 15, marginBottom: 20, marginTop: 5 }} onPress={() => router.replace('/(home)/kanji/hiragana')}>
        <Text style={{ fontSize: 18, color: currentTheme.accent }}>Înapoi la Kana</Text>
      </TouchableOpacity>
      <ScrollView style={{...styles.contentContainer, backgroundColor: currentTheme.background}}>
        <Text style={styles.kanji}>{selectedKanji}</Text>
        <View style={styles.infoRow}>
          <Text style={{...styles.label, color: currentTheme.text}}>Onyomi:</Text>
          <Text style={{...styles.value, color:currentTheme.text }}>{kanjiData.onyomi.join(', ')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={{...styles.label, color: currentTheme.text}}>Kunyomi:</Text>
          <Text style={{...styles.value, color:currentTheme.text }}>{kanjiData.kunyomi.join(', ')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={{...styles.label, color: currentTheme.text}}>Meaning:</Text>
          <Text style={{...styles.value, color:currentTheme.text }}>{kanjiData.meaning}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Onyomi Readings:</Text>
          {kanjiData.onyomiWords.map((item, index) => (
            <View key={index} style={styles.wordItem}>
              <Text style={{...styles.word, color: currentTheme.text}}>{item.word} ({item.reading})</Text>
              <Text style={{...styles.wordMeaning, color: currentTheme.secondaryText}}>{item.meaning}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kunyomi Readings:</Text>
          {kanjiData.kunyomiWords.map((item, index) => (
            <View key={index} style={styles.wordItem}>
              <Text style={{...styles.word, color: currentTheme.text}}>{item.word} ({item.reading})</Text>
              <Text style={{...styles.wordMeaning, color: currentTheme.secondaryText}}>{item.meaning}</Text>
            </View>
          ))}
        </View>
        {kanjiData.specialReadings && kanjiData.specialReadings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Readings:</Text>
            {kanjiData.specialReadings.map((item, index) => (
              <View key={index} style={styles.wordItem}>
                <Text style={{...styles.word, color: currentTheme.text}}>{item.word} ({item.reading})</Text>
                <Text style={{...styles.wordMeaning, color: currentTheme.secondaryText}}>{item.meaning}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Examples:</Text>
          {kanjiData.examples.map((item, index) => (
            <View key={index} style={styles.exampleItem}>
              <Text style={{...styles.example, color: currentTheme.text}}>{item.sentence}</Text>
              <Text style={{...styles.exampleReading, color: currentTheme.secondaryText}}>{item.reading}</Text>
              <Text style={{...styles.exampleReading, color: currentTheme.secondaryText}}>{item.romanji}</Text>
              <Text style={{...styles.exampleMeaning, color: currentTheme.accent}}>{item.meaning}</Text>
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
    marginBottom: 12,
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
});