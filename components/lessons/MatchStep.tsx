import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';

const { width } = Dimensions.get('window');

type Props = {
  pairs: { left: string; right: string }[];
  onComplete?: () => void;
};

type Item = {
  id: string;
  text: string;
  type: 'left' | 'right';
};

export default function MatchStep({ pairs, onComplete }: Props) {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const [leftItems, setLeftItems] = useState<Item[]>([]);
  const [rightItems, setRightItems] = useState<Item[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matches, setMatches] = useState<Set<string>>(new Set());
  const [wrongMatch, setWrongMatch] = useState<[string, string] | null>(null);

  // Initialize and shuffle
  useEffect(() => {
    const shuffle = (array: Item[]) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const left = pairs.map((p, i) => ({ id: `l-${i}`, text: p.left, type: 'left' as const }));
    const right = pairs.map((p, i) => ({ id: `r-${i}`, text: p.right, type: 'right' as const }));
    
    setLeftItems(shuffle(left));
    setRightItems(shuffle(right));
  }, [pairs]);

  const handlePress = (id: string, type: 'left' | 'right') => {
    if (matches.has(id)) return;

    if (type === 'left') {
      setSelectedLeft(id === selectedLeft ? null : id);
    } else {
      setSelectedRight(id === selectedRight ? null : id);
    }
  };

  // Check for match when both are selected
  useEffect(() => {
    if (selectedLeft && selectedRight) {
      const leftIndex = parseInt(selectedLeft.split('-')[1]);
      const rightIndex = parseInt(selectedRight.split('-')[1]);

      if (leftIndex === rightIndex) {
        // Match!
        const newMatches = new Set(matches);
        newMatches.add(selectedLeft);
        newMatches.add(selectedRight);
        setMatches(newMatches);
        setSelectedLeft(null);
        setSelectedRight(null);

        if (newMatches.size === pairs.length * 2) {
          setTimeout(() => onComplete?.(), 600);
        }
      } else {
        // Wrong match
        setWrongMatch([selectedLeft, selectedRight]);
        setTimeout(() => {
          setWrongMatch(null);
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 500);
      }
    }
  }, [selectedLeft, selectedRight]);

  const renderItem = (item: Item) => {
    const isMatched = matches.has(item.id);
    const isSelected = selectedLeft === item.id || selectedRight === item.id;
    const isWrong = wrongMatch?.includes(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.item,
          { backgroundColor: currentTheme.surface },
          isSelected && { borderColor: currentTheme.primary, borderWidth: 2 },
          isMatched && { opacity: 0.3, borderColor: '#4CAF50', borderWidth: 1 },
          isWrong && { borderColor: '#FF5252', borderWidth: 2 }
        ]}
        onPress={() => handlePress(item.id, item.type)}
        disabled={isMatched}
      >
        <Text style={[
          styles.itemText, 
          { color: currentTheme.text },
          isMatched && { color: '#4CAF50' }
        ]}>
          {item.text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: currentTheme.text }]}>Match the pairs</Text>
      <View style={styles.columnsContainer}>
        <View style={styles.column}>
          {leftItems.map(renderItem)}
        </View>
        <View style={styles.column}>
          {rightItems.map(renderItem)}
        </View>
      </View>
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
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 30,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  columnsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 15,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  item: {
    height: 70,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  }
});
