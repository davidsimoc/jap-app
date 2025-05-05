import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig'; // Presupunând că ai exportat 'db' (instanța Firestore) din firebaseConfig
import { collection, doc, getDoc } from 'firebase/firestore';
import { lightTheme } from '../../constants/Colors';
import { darkTheme } from '@/styles/themes';
import React, { useState, useEffect } from 'react'; // Importă useState și useEffect

export default function ProfileScreen() {
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid; // Obține uid-ul aici
        const userDocRef = doc(collection(db, 'users'), uid); // Creează referința documentului
        const userDoc = await getDoc(userDocRef); // Obține documentul
        // const userDoc = await db.collection('users').doc(uid).get(); // Folosește instanța 'db'

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data?.username);
          setEmail(data?.email);
        } else {
          console.log("Nu s-au găsit datele de profil.");
        }
      } else {
        router.replace('/(auth)/login'); // Redirecționează dacă nu e autentificat
      }
    };

    fetchProfile();
  }, [router]);


  const handleLogout = async () => {
    await auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile Page</Text>
      {username && <Text style={styles.info}>Username: {username}</Text>}
      {email && <Text style={styles.info}>Email: {email}</Text>}
      <Button title="Logout" onPress={handleLogout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: darkTheme.background },
  title: { fontSize: 24, color: darkTheme.text, marginBottom: 20 },
  info: { fontSize: 18, color: darkTheme.text, marginBottom: 10 },
});
