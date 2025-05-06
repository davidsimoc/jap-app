import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { darkTheme } from '@/constants/Colors'; // Asigură-te că ai tema definită
import kanjiDataN5 from '@/assets/data/kanjiData_N5.json'; // Importă datele kanji

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

  useEffect(() => {
    const fetchKanjiDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = (kanjiDataN5 as Record<string, KanjiInfo>)[selectedKanji as string];
        if (data) {
          setKanjiData(data);
        } else {
          setError('Informațiile pentru acest kanji nu au fost găsite.');
        }
      } catch (e: any) {
        setError('Eroare la încărcarea informațiilor despre kanji.');
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
    <SafeAreaView style={{ flex: 1, backgroundColor: darkTheme.background }}>
      <TouchableOpacity style={{ marginLeft: 15, marginBottom: 20, marginTop: 5 }} onPress={() => router.replace('/(home)/kanji/hiragana')}>
        <Text style={{ fontSize: 18, color: darkTheme.accent }}>Înapoi la Kana</Text>
      </TouchableOpacity>
      <ScrollView style={styles.contentContainer}>
        <Text style={styles.kanji}>{selectedKanji}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Onyomi:</Text>
          <Text style={styles.value}>{kanjiData.onyomi.join(', ')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Kunyomi:</Text>
          <Text style={styles.value}>{kanjiData.kunyomi.join(', ')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Meaning:</Text>
          <Text style={styles.value}>{kanjiData.meaning}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Onyomi Readings:</Text>
          {kanjiData.onyomiWords.map((item, index) => (
            <View key={index} style={styles.wordItem}>
              <Text style={styles.word}>{item.word} ({item.reading})</Text>
              <Text style={styles.wordMeaning}>{item.meaning}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kunyomi Readings:</Text>
          {kanjiData.kunyomiWords.map((item, index) => (
            <View key={index} style={styles.wordItem}>
              <Text style={styles.word}>{item.word} ({item.reading})</Text>
              <Text style={styles.wordMeaning}>{item.meaning}</Text>
            </View>
          ))}
        </View>
        {kanjiData.specialReadings && kanjiData.specialReadings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Readings:</Text>
            {kanjiData.specialReadings.map((item, index) => (
              <View key={index} style={styles.wordItem}>
                <Text style={styles.word}>{item.word} ({item.reading})</Text>
                <Text style={styles.wordMeaning}>{item.meaning}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Examples:</Text>
          {kanjiData.examples.map((item, index) => (
            <View key={index} style={styles.exampleItem}>
              <Text style={styles.example}>{item.sentence}</Text>
              <Text style={styles.exampleReading}>{item.reading}</Text>
              <Text style={styles.exampleReading}>{item.romanji}</Text>
              <Text style={styles.exampleMeaning}>{item.meaning}</Text>
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
    color: darkTheme.text,
    marginRight: 10,
    width: 100,
  },
  value: {
    fontSize: 18,
    color: darkTheme.text,
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
    color: darkTheme.text,
  },
  wordMeaning: {
    fontSize: 16,
    color: darkTheme.secondaryText,
  },
  exampleItem: {
    marginBottom: 12,
  },
  example: {
    fontSize: 20,
    color: darkTheme.text,
    marginBottom: 4,
  },
  exampleReading: {
    fontSize: 16,
    color: darkTheme.secondaryText,
    marginBottom: 2,
  },
  exampleMeaning: {
    fontSize: 16,
    color: darkTheme.accent,
  },
  backButton: {
    marginLeft: 1,
  },
  backButtonText: {
    fontSize: 18,
    color: darkTheme.accent,
  },
});