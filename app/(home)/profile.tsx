import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Button, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db, storage } from '../../firebaseConfig'; // Presupunând că ai exportat 'db' (instanța Firestore) din firebaseConfig
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { lightTheme } from '../../constants/Colors';
import { darkTheme } from '@/styles/themes';
import React, { useState, useEffect } from 'react'; // Importă useState și useEffect
import * as ImagePicker from 'expo-image-picker'; // For selecting images

const { width, height } = Dimensions.get('window'); // Obține lățimea și înălțimea ecranului

export default function ProfileScreen() {
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const pickImage = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      const selecteImageUri = result.assets[0].uri;
      await uploadImage(selecteImageUri); // Apelează funcția de încărcare a imaginii
    }
  }

  const uploadImage = async (uri: string) => {
    setUploading(true);
    const { uid } = auth.currentUser!;
    const storageRef = ref(storage, `profilePictures/${uid}`);
    const response = await fetch(uri);
    const blob = await response.blob();

    try {
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
          // Optionally update a progress bar state
        },
        (error) => {
          console.error("Error uploading image:", error);
          setUploading(false);
          // Handle upload error
        },
        async () => {
          // Upload completed successfully, now get the download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setProfilePictureUrl(downloadURL);
          await updateProfilePictureUrl(downloadURL);
          setUploading(false);
        }
      );
    } catch (error) {
      console.error("Error fetching or uploading image:", error);
      setUploading(false);
    }
  };

  const updateProfilePictureUrl = async (url: string) => {
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await updateDoc(userDocRef, {
          profilePicture: url,
        });
        console.log("Profile picture URL updated in Firestore.");
        // Optionally show a success message
      } catch (error) {
        console.error("Error updating profile picture URL:", error);
        // Handle Firestore update error
      }
    }
  };

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
          setProfilePictureUrl(data?.profilePicture || null); // Load existing profile picture
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
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/login.jpg')}
          resizeMode="cover"
          style={{ width: '100%', height: '100%', }}
        />
      </View>

      <View style={styles.content}>
        {/* <TouchableOpacity onPress={pickImage}>
          {profilePictureUrl ? (
            <Image
              source={{ uri: profilePictureUrl }}
              style={styles.profileImage}
            />
          ) : (
            <Image
              source={require('../../assets/images/login.jpg')} // Default placeholder
              style={styles.profileImage}
            />
          )}
        </TouchableOpacity> */}
        <Text style={styles.title}>Profile Page</Text>
        {username && <Text style={styles.info}>Username: {username}</Text>}
        {email && <Text style={styles.info}>Email: {email}</Text>}
      </View>

      <View style={styles.logoutButtonContainer}>
        <Button title="Logout" onPress={handleLogout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column', backgroundColor: darkTheme.background },
  title: { fontSize: 24, color: darkTheme.text, marginBottom: 20 },
  info: { fontSize: 18, color: darkTheme.text, marginBottom: 10 },
  imageContainer: {
    width: width,
    height: height * 0.2, // 30% din înălțimea ecranului
    overflow: 'hidden',
  },
  content: {
    flex: 1, // Ocupă spațiul rămas între imagine și butonul de logout
    justifyContent: 'center', // Centrează conținutul pe verticală
    alignItems: 'center', // Centrează conținutul pe orizontală
    padding: 20,
  },
  logoutButtonContainer: {
    paddingBottom: 0,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
});
