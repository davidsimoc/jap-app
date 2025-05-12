// utils/lessonProgress.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const markLessonAsCompleted = async (lessonId: string) => {
  try {
    const data = await AsyncStorage.getItem('completedLessons');
    const completed = data ? JSON.parse(data) : [];
    if (!completed.includes(lessonId)) {
      completed.push(lessonId);
      await AsyncStorage.setItem('completedLessons', JSON.stringify(completed));
    }
  } catch (error) {
    console.error('Error saving lesson completion', error);
  }
};

export const getCompletedLessons = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem('completedLessons');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading completed lessons', error);
    return [];
  }
};


export const resetCompletedLessons = async () => {
  await AsyncStorage.removeItem('completedLessons');
};