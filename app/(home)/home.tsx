import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { lightTheme } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { darkTheme } from '@/constants/Colors';
import lessonsData from '@/assets/data/lessonsData.json';

export default function HomeScreen() {
  const router = useRouter();

  const handleLessonPress = (route: string) => {
    router.push(route);
  };

  const renderLessonItem = ({ item }: { item: (typeof lessonsData)[number] }) => (
    <TouchableOpacity
      style={styles.lessonCard}
      onPress={() => handleLessonPress(item.route)}
    >
      {/* Optional: You could have an image associated with each lesson */}
      {/* {item.image && <Image source={{ uri: item.image }} style={styles.lessonImage} />} */}
      <Text style={styles.lessonTitle}>{item.title}</Text>
      <Text style={styles.lessonDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View>
        {/* Other components on your home screen */}
        <Text style={styles.sectionTitle}>Lessons</Text>
        <FlatList
          data={lessonsData}
          renderItem={renderLessonItem}
          keyExtractor={(item) => item.id}
          //horizontal={true} // Display cards horizontally, adjust as needed
          showsHorizontalScrollIndicator={false} // Hide horizontal scroll indicator (optional)
          contentContainerStyle={styles.lessonsContainer} // Style the container of the cards
        />
        {/* More components on your home screen */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: darkTheme.text,
    marginBottom: 10,
  },
  lessonsContainer: {
    paddingVertical: 10,
    paddingBottom:20,

  },
  lessonCard: {
    backgroundColor: darkTheme.secondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    marginRight: 10,
    width: '100%', // Adjust card width as needed
    height:100,
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
