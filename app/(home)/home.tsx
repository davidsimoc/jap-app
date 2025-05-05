import { View, Text, Button, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { lightTheme } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { darkTheme } from '@/styles/themes';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" hidden={true} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Welcome to Japanese Learning App!</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: darkTheme.background, },
  title: { fontSize: 24, marginBottom: 20, color: darkTheme.text },
  scrollContainer: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', paddingVertical:20,
    marginLeft: 20,
    marginRight: 20,
   },
});
