import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { lightTheme } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Welcome to Japanese Learning App!</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: lightTheme.background },
  title: { fontSize: 24, marginBottom: 20, color: lightTheme.text },
  scrollContainer: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', paddingVertical:20 },
});
