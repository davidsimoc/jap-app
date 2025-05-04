import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../firebaseConfig';
import { lightTheme } from '../../constants/Colors';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile Page</Text>
      <Button title="Logout" onPress={handleLogout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: lightTheme.background },
  title: { fontSize: 24 },
});
