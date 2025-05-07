import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { darkTheme } from '@/constants/Colors';
import { router } from 'expo-router'; // Asigură-te că ai importat routerul corect

export default function HiraganaBasicPage() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={{ marginLeft: 15, marginBottom: 20, marginTop: 5 }} onPress={() => router.replace('/(home)/home')}>
        <Text style={{ fontSize: 18, color: darkTheme.accent }}>Înapoi la Kana</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Hiragana Basics Lesson</Text>
      {/* Adaugă conținutul lecției de Hiragana aici */}
      <Text style={styles.content}>Acesta este conținutul pentru lecția de Hiragana de bază...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: darkTheme.text,
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    color: darkTheme.text,
    textAlign: 'center',
  },
});