import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';

const { width } = Dimensions.get('window');

type Props = {
  sentence: string; // Target sentence (e.g. "Kippu onegaishimasu")
  translation: string;
  jumbledWords: string[];
  onComplete?: () => void;
};

export default function ArrangeStep({ sentence, translation, jumbledWords, onComplete }: Props) {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Robust Fisher-Yates shuffle for available words
    const shuffle = (array: string[]) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    setAvailableWords(shuffle(jumbledWords));
    setSelectedWords([]);
  }, [jumbledWords]);

  const handleWordPress = (word: string, index: number) => {
    const newSelected = [...selectedWords, word];
    setSelectedWords(newSelected);
    
    const newAvailable = [...availableWords];
    newAvailable.splice(index, 1);
    setAvailableWords(newAvailable);

    // Check if the current selection is still correct according to the target sentence
    const targetWords = sentence.toLowerCase().split(' ');
    const currentMatches = newSelected.every((w, i) => w.toLowerCase() === targetWords[i]);

    if (!currentMatches) {
        setIsError(true);
        setTimeout(() => {
            // Reset on error with a fresh shuffle
            setIsError(false);
            const shuffled = [...jumbledWords];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setAvailableWords(shuffled);
            setSelectedWords([]);
        }, 800);
    } else if (newSelected.length === targetWords.length) {
        // Success!
        setTimeout(() => onComplete?.(), 600);
    }
  };

  const removeWord = (index: number) => {
    const word = selectedWords[index];
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    setSelectedWords(newSelected);
    
    setAvailableWords([...availableWords, word]);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: currentTheme.text + '80' }]}>Build the sentence</Text>
      
      <View style={[styles.translationContainer, { backgroundColor: currentTheme.primary + '08' }]}>
        <Ionicons name="chatbubble-outline" size={20} color={currentTheme.primary} />
        <Text style={[styles.translationText, { color: currentTheme.text }]}>{translation}</Text>
      </View>

      {/* Selected Words Area */}
      <View style={[
        styles.sentenceArea, 
        { borderColor: isError ? '#FF5252' : currentTheme.text + '10' }
      ]}>
        {selectedWords.length === 0 ? (
          <Text style={[styles.placeholder, { color: currentTheme.text + '20' }]}>Tap words below...</Text>
        ) : (
          <View style={styles.wordsRow}>
            {selectedWords.map((word, i) => (
              <TouchableOpacity 
                key={`${word}-${i}`} 
                style={[styles.wordBubble, { backgroundColor: currentTheme.primary }]}
                onPress={() => removeWord(i)}
              >
                <Text style={styles.wordTextSelected}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Available Words Area */}
      <View style={styles.availableSection}>
        <View style={styles.wordsRow}>
          {availableWords.map((word, i) => (
            <TouchableOpacity 
              key={`${word}-${i}`} 
              style={[styles.wordBubble, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '10', borderWidth: 1 }]}
              onPress={() => handleWordPress(word, i)}
            >
              <Text style={[styles.wordTextNormal, { color: currentTheme.text }]}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  translationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    gap: 12,
    width: '100%',
  },
  translationText: {
    fontSize: 20,
    fontWeight: '700',
  },
  sentenceArea: {
    width: '100%',
    minHeight: 120,
    borderBottomWidth: 3,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 18,
    fontStyle: 'italic',
  },
  availableSection: {
    width: '100%',
    marginTop: 20,
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  wordBubble: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  wordTextSelected: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  wordTextNormal: {
    fontSize: 18,
    fontWeight: '600',
  }
});
