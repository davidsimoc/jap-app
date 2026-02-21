import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import { speakJapanese } from '@/services/ttsService';

const { width } = Dimensions.get('window');

type Props = {
  audioText: string;
  question: string;
  options: string[];
  correctAnswer: string;
  onComplete?: () => void;
};

export default function ListeningStep({ audioText, question, options, correctAnswer, onComplete }: Props) {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const playAudio = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    
    await speakJapanese(audioText, {
      onDone: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const handleOptionPress = (option: string) => {
    if (selectedOption) return;
    
    setSelectedOption(option);
    if (option === correctAnswer) {
      setTimeout(() => onComplete?.(), 800);
    } else {
      setIsError(true);
      setTimeout(() => {
        setIsError(false);
        setSelectedOption(null);
      }, 800);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: currentTheme.text + '80' }]}>Listen carefully</Text>
      
      <TouchableOpacity 
        style={[styles.audioButton, { backgroundColor: currentTheme.primary }]}
        onPress={playAudio}
        activeOpacity={0.8}
      >
        <Ionicons 
            name={isPlaying ? "volume-high" : "play"} 
            size={42} 
            color="#fff" 
        />
        <Text style={styles.playText}>{isPlaying ? "Listening..." : "Play Audio"}</Text>
      </TouchableOpacity>

      <View style={styles.questionContainer}>
        <Text style={[styles.questionText, { color: currentTheme.text }]}>{question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '10', borderWidth: 1 },
              selectedOption === option && option === correctAnswer && { borderColor: '#4CAF50', borderWidth: 2 },
              selectedOption === option && option !== correctAnswer && { borderColor: '#FF5252', borderWidth: 2 }
            ]}
            onPress={() => handleOptionPress(option)}
          >
            <Text style={[
              styles.optionText, 
              { color: currentTheme.text },
              selectedOption === option && option === correctAnswer && { color: '#4CAF50' },
              selectedOption === option && option !== correctAnswer && { color: '#FF5252' }
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
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
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 40,
  },
  audioButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    gap: 10,
  },
  playText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  questionContainer: {
    marginBottom: 30,
    width: '100%',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionButton: {
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  }
});
