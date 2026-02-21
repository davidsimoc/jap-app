import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as wanakana from 'wanakana';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import { speakJapanese, stopSpeech } from '@/services/ttsService';

const { width } = Dimensions.get('window');

type VocabItem = {
  word: string;
  reading: string;
  romaji: string;
  meaning: string;
};

type Props = {
  item: VocabItem;
};

export default function VocabularyStep({ item }: Props) {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const [showMeaning, setShowMeaning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Reset showMeaning when item changes
  React.useEffect(() => {
    setShowMeaning(false);
    // Stop any speech when moving to a new word
    stopSpeech();
  }, [item]);

  // Force conversion to ensure beginner sees the right scripts
  // We use toHiragana for the Reading field and toRomaji for the Romaji field
  const displayKana = wanakana.toHiragana(item.reading || item.romaji);
  const displayRomaji = wanakana.toRomaji(item.romaji || item.reading);

  const playSound = async () => {
    // Avoid double play
    await stopSpeech();
    setIsPlaying(true);
    
    await speakJapanese(item.word, {
      onDone: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: currentTheme.text + '80' }]}>New Vocabulary</Text>
      
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: currentTheme.surface }]}
        onPress={() => setShowMeaning(!showMeaning)}
        activeOpacity={0.9}
      >
        <TouchableOpacity style={styles.soundIconButton} onPress={playSound}>
          <Ionicons 
            name={isPlaying ? "volume-high" : "volume-medium-outline"} 
            size={36} 
            color={currentTheme.primary} 
          />
        </TouchableOpacity>

        {/* Word Display (Big Kanji/Kana) */}
        <Text style={[styles.word, { color: currentTheme.text }]}>{item.word}</Text>
        
        {/* Pronunciation Stack (Fixed to force Kana vs Romaji) */}
        <View style={[styles.pronunciationCard, { backgroundColor: currentTheme.text + '05' }]}>
          <View style={styles.pillContainer}>
            <View style={[styles.pill, { backgroundColor: currentTheme.primary + '15' }]}><Text style={[styles.pillText, { color: currentTheme.primary }]}>Reading</Text></View>
            <Text style={[styles.reading, { color: currentTheme.text }]}>{displayKana}</Text>
          </View>
          <View style={styles.pillContainer}>
            <View style={[styles.pill, { backgroundColor: currentTheme.text + '08' }]}><Text style={[styles.pillText, { color: currentTheme.secondaryText }]}>Romaji</Text></View>
            <Text style={[styles.romaji, { color: currentTheme.secondaryText }]}>{displayRomaji}</Text>
          </View>
        </View>
        <View style={[styles.separator, { backgroundColor: currentTheme.text + '10' }]} />
        {showMeaning ? (
          <View style={styles.meaningContainer}>
            <Text style={[styles.meaning, { color: currentTheme.text }]}>{item.meaning}</Text>
          </View>
        ) : (
          <View style={styles.revealContainer}>
            <Ionicons name="eye-outline" size={20} color={currentTheme.text + '40'} />
            <Text style={[styles.hint, { color: currentTheme.text + '40' }]}>Tap to reveal meaning</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 30,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  card: {
    width: width * 0.88,
    minHeight: 420,
    borderRadius: 40,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 25,
    elevation: 10,
    position: 'relative',
  },
  soundIconButton: {
    position: 'absolute',
    top: 25,
    right: 25,
    padding: 10,
    backgroundColor: '#00000005',
    borderRadius: 20,
  },
  word: {
    fontSize: 64,
    fontWeight: '900',
    marginBottom: 25,
    textAlign: 'center',
  },
  pronunciationCard: {
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 24,
    width: '100%',
    gap: 14,
    marginBottom: 30,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 65,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  reading: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
  },
  romaji: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
  },
  separator: {
    height: 1,
    width: '100%',
    marginBottom: 30,
  },
  meaningContainer: {
    width: '100%',
    alignItems: 'center',
  },
  meaning: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  revealContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    fontSize: 14,
    fontWeight: '500',
  }
});
