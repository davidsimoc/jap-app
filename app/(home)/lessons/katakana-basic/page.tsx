import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import katakanaLessonsData from '@/assets/data/katakanaLessonData.json';
import { Ionicons } from '@expo/vector-icons'; // sau alt icon
import { useCallback, useEffect, useState } from 'react';
import { getCompletedLessons } from '@/utils/lessonProgress'; // Asigură-te că ai această funcție implementată
import { useTheme } from '@/components/ThemeContext'; // Calea corectă!
import { lightTheme, darkTheme } from '@/constants/Colors'; // Asigură-te că ai importat corect temele

export default function KatakanaLessonsScreen() {
  const router = useRouter();
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const { theme, toggleTheme } = useTheme(); // Acum funcționează corect!
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  useFocusEffect(
    useCallback(() => {
      const loadProgress = async () => {
        const completed = await getCompletedLessons();
        setCompletedLessons(completed);
      };
      loadProgress();

      return () => { };
    }, [])
  );
  const handleLessonPress = (route: any) => {
    router.push(route);
  };

  const renderLessonItem = ({ item }: { item: (typeof katakanaLessonsData)[number] }) => (
    <TouchableOpacity
      style={{...styles.lessonCard, backgroundColor: currentTheme.secondary}}
      onPress={() => handleLessonPress(item.route)}
    >
      <View style={styles.lessonTitleContainer}>
        <Text style={styles.lessonTitle}>
          {item.title}
        </Text>
        {completedLessons.includes(item.id) && (
          <Ionicons name="checkmark-circle" size={24} color="#121212" />
        )}
      </View>
      <Text style={styles.lessonDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{...styles.container, backgroundColor: currentTheme.background }}>
      <View>
        {/* Other components on your home screen */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(home)/home')}>
          <Text style={styles.backButtonText}>Back to lessons</Text>
        </TouchableOpacity>
        <Text style={{...styles.sectionTitle, color: currentTheme.text}}>Katakana Lessons</Text>
        <FlatList
          data={katakanaLessonsData}
          renderItem={renderLessonItem}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.lessonsContainer}
        />
        {/* More components on your home screen */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
   // backgroundColor: darkTheme.background,
    padding: 20,
  },
  lessonTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    marginBottom: 20,
    marginTop: 5,
  },
  backButtonText: {
    fontSize: 18,
    color: darkTheme.accent,
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: darkTheme.text,
    marginBottom: 10,
  },
  lessonsContainer: {
    paddingVertical: 10,
    paddingBottom: 20,

  },
  lessonCard: {
   // backgroundColor: darkTheme.secondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    marginRight: 10,
    width: '100%', // Adjust card width as needed
    height: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonImage: {
    width: '100%',
    height: 100,
    borderRadius: 6,
    marginBottom: 8,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: darkTheme.background,
    marginBottom: 4,
  },
  lessonDescription: {
    fontSize: 16,
    color: darkTheme.surface,
  },
  // ... other styles for your home screen
});
