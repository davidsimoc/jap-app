import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';

const { width } = Dimensions.get('window');

type Props = {
  question: string;
  options: string[];
  correctAnswer: string;
  onComplete?: () => void;
};

export default function QuizStep({ question, options, correctAnswer, onComplete }: Props) {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

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
      <View style={[styles.badge, { backgroundColor: currentTheme.primary + '15' }]}>
        <Ionicons name="flash" size={14} color={currentTheme.primary} />
        <Text style={[styles.badgeText, { color: currentTheme.primary }]}>CHALLENGE</Text>
      </View>

      <View style={styles.questionCard}>
        <Text style={[styles.questionText, { color: currentTheme.text }]}>{question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            activeOpacity={0.7}
            style={[
              styles.optionButton,
              { 
                backgroundColor: currentTheme.surface, 
                borderColor: currentTheme.text + '10',
                borderWidth: 1,
              },
              selectedOption === option && option === correctAnswer && { 
                borderColor: '#4CAF50', 
                backgroundColor: '#4CAF5010',
                borderWidth: 2 
              },
              selectedOption === option && option !== correctAnswer && { 
                borderColor: '#FF5252', 
                backgroundColor: '#FF525210',
                borderWidth: 2 
              }
            ]}
            onPress={() => handleOptionPress(option)}
          >
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionText, 
                { color: currentTheme.text },
                selectedOption === option && option === correctAnswer && { color: '#4CAF50' },
                selectedOption === option && option !== correctAnswer && { color: '#FF5252' }
              ]}>
                {option}
              </Text>
              {selectedOption === option && (
                <Ionicons 
                  name={option === correctAnswer ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={option === correctAnswer ? "#4CAF50" : "#FF5252"} 
                />
              )}
            </View>
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
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  questionCard: {
    marginBottom: 40,
  },
  questionText: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  optionsContainer: {
    gap: 15,
  },
  optionButton: {
    paddingVertical: 22,
    paddingHorizontal: 25,
    borderRadius: 26,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  }
});
