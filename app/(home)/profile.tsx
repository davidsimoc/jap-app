import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Button, Image, Dimensions, TouchableOpacity, TextInput, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db, storage } from '../../firebaseConfig'; // Presupunând că ai exportat 'db' (instanța Firestore) din firebaseConfig
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { darkTheme } from '@/constants/Colors';
import React, { useState, useEffect } from 'react'; // Importă useState și useEffect
import * as ImagePicker from 'expo-image-picker'; // For selecting images
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetCompletedLessons } from '@/utils/lessonProgress';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window'); // Obține lățimea și înălțimea ecranului

export default function ProfileScreen() {
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [aboutMeText, setAboutMeText] = useState<string>('Îți place să înveți japoneză rapid și eficient? 🇯🇵'); // Starea pentru textul "Despre tine"
  const [isEditingAboutMe, setIsEditingAboutMe] = useState<boolean>(false); // Stare pentru a controla modul de editare

  useFocusEffect(
    useCallback(() => {
      const fetchCompletedLessons = async () => {
        const data = await AsyncStorage.getItem('completedLessons');
        const lessons = data ? JSON.parse(data) : [];
        setCompletedLessons(lessons); // aici setezi lista, nu length-ul
      };

      fetchCompletedLessons();
    }, [])
  );

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

  const handleSaveAboutMe = async () => {
    // Aici poți salva aboutMeText unde ai nevoie (e.g., AsyncStorage, Firestore)
    console.log('Saving about me text:', aboutMeText);
    // Exemplu de salvare în AsyncStorage:
    try {
      await AsyncStorage.setItem('aboutMe', aboutMeText);
      setIsEditingAboutMe(false); // Ieși din modul de editare după salvare
    } catch (error) {
      console.error('Eroare la salvarea textului "Despre mine":', error);
    }
    // Dacă vrei să salvezi în Firestore (presupunând că ai o colecție 'users' cu documente pentru fiecare utilizator):
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await updateDoc(userDocRef, {
          aboutMe: aboutMeText,
        });
        console.log("Textul 'Despre mine' a fost actualizat în Firestore.");
        setIsEditingAboutMe(false);
      } catch (error) {
        console.error("Eroare la actualizarea textului 'Despre mine' în Firestore:", error);
      }
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const userDocRef = doc(collection(db, 'users'), uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data?.username);
          setEmail(data?.email);
          setProfilePictureUrl(data?.profilePicture || null);
          setAboutMeText(data?.aboutMe || 'Îți place să înveți japoneză rapid și eficient? 🇯🇵'); // Încarcă textul "Despre mine" din Firestore sau valoarea implicită
        } else {
          console.log("Nu s-au găsit datele de profil.");
        }
      } else {
        router.replace('/(auth)/login');
      }
    };

    const loadAboutMe = async () => {
      try {
        const savedAboutMe = await AsyncStorage.getItem('aboutMe');
        if (savedAboutMe) {
          setAboutMeText(savedAboutMe);
        }
      } catch (error) {
        console.error('Eroare la încărcarea textului "Despre mine" din AsyncStorage:', error);
      }
    };

    fetchProfile();
    // Dacă folosești AsyncStorage pentru a persista local textul:
    // loadAboutMe();
  }, [router]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/profileImg.avif')}
            resizeMode="cover"
            style={{ width: '100%', height: '100%', paddingBottom: 20 }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your profile</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color="#ccc" style={styles.icon} />
            <Text style={styles.infoText}>{username}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="#ccc" style={styles.icon} />
            <Text style={styles.infoText}>{email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="book" size={20} color="#ccc" style={styles.icon} />
            <Text style={styles.infoText}>Completed lessons: {completedLessons.length}</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About you</Text>
          {isEditingAboutMe ? (
            <TextInput
              style={styles.aboutMeInput}
              multiline
              value={aboutMeText}
              onChangeText={setAboutMeText}
            />
          ) : (
            <Text style={styles.info}>{aboutMeText}</Text>
          )}
          <View style={styles.editSaveButtons}>
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditingAboutMe(!isEditingAboutMe)}>
              <Text style={styles.editButtonText}>{isEditingAboutMe ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
            {isEditingAboutMe && (
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveAboutMe}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>


        <View style={styles.logoutButtonContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: darkTheme.background,
    alignItems: 'center',
  }, title: { fontSize: 24, color: darkTheme.text, marginBottom: 20 },
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
  profileImage: {
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  cardTitle: {
    fontSize: 24,
    color: darkTheme.text,
    marginBottom: 10,
    fontWeight: '600',
  },
  buttonsContainer: {
    gap: 10,
    marginTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 18,
    color: darkTheme.text,
  },
  logoutButton: {
    backgroundColor: darkTheme.primary, 
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: darkTheme.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  aboutMeInput: {
    backgroundColor: darkTheme.surface,
    color: darkTheme.text,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    minHeight: 80, // Oferă o înălțime minimă pentru a putea scrie mai mult text
    textAlignVertical: 'top', // Aliniază textul la început pentru multiline
  },
  editSaveButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: darkTheme.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6
  },
  editButtonText: {
    color: darkTheme.text,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: 'green',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight:4,
    marginBottom: 6
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
