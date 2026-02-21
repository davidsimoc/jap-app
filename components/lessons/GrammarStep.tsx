import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';

const { width } = Dimensions.get('window');

type Example = {
  japanese: string;
  reading?: string;
  english: string;
};

type Props = {
  title: string;
  explanation: string;
  examples?: Example[];
};

export default function GrammarStep({ title, explanation, examples }: Props) {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.badge, { backgroundColor: currentTheme.primary + '10' }]}>
          <Text style={[styles.badgeText, { color: currentTheme.primary }]}>GRAMMAR LESSON</Text>
        </View>

        <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
        
        <View style={[styles.explanationCard, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.explanationText, { color: currentTheme.text }]}>
            {explanation}
          </Text>
        </View>

        {examples && examples.length > 0 && (
          <View style={styles.examplesSection}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text + '60' }]}>EXAMPLES</Text>
            {examples.map((ex, i) => (
              <View key={i} style={[styles.exampleCard, { backgroundColor: currentTheme.surface }]}>
                <View style={styles.exampleHeader}>
                   <Ionicons name="chatbubble-outline" size={16} color={currentTheme.primary} />
                   <Text style={[styles.japaneseText, { color: currentTheme.text }]}>{ex.japanese}</Text>
                </View>
                {ex.reading && (
                  <Text style={[styles.readingText, { color: currentTheme.text + '60' }]}>{ex.reading}</Text>
                )}
                <View style={[styles.divider, { backgroundColor: currentTheme.text + '08' }]} />
                <Text style={[styles.englishText, { color: currentTheme.text + '80' }]}>{ex.english}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 25,
    paddingBottom: 40,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 24,
    lineHeight: 40,
  },
  explanationCard: {
    borderRadius: 28,
    padding: 28,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  explanationText: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
  },
  examplesSection: {
    gap: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 5,
  },
  exampleCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  japaneseText: {
    fontSize: 20,
    fontWeight: '700',
  },
  readingText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginLeft: 26,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  englishText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 26,
  }
});
