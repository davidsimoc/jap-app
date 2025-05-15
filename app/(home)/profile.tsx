import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard, SafeAreaView, Image, TextInput, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db, storage } from '../../firebaseConfig';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext'; // Calea corectă!
import { lightTheme, darkTheme } from '@/constants/Colors'; // Asigură-te că ai importat corect temele

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [aboutMeText, setAboutMeText] = useState<string>('Îți place să înveți japoneză rapid și eficient? 🇯🇵');
  const [isEditingAboutMe, setIsEditingAboutMe] = useState<boolean>(false);
  const { theme, toggleTheme } = useTheme(); // Acum funcționează corect!
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  useFocusEffect(
    useCallback(() => {
      const fetchCompletedLessons = async () => {
        const data = await AsyncStorage.getItem('completedLessons');
        const lessons = data ? JSON.parse(data) : [];
        setCompletedLessons(lessons);
      };
      fetchCompletedLessons();
    }, [])
  );

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
          setAboutMeText(data?.aboutMe || 'Îți place să înveți japoneză rapid și eficient? 🇯🇵');
        } else {
          console.log("Nu s-au găsit datele de profil.");
        }
      } else {
        router.replace('/(auth)/login');
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    await auth.signOut();
    router.replace('/(auth)/login');
  };

  const handleSaveAboutMe = async () => {
    try {
      await AsyncStorage.setItem('aboutMe', aboutMeText);
      setIsEditingAboutMe(false);
    } catch (error) {
      console.error('Eroare la salvarea textului "Despre mine":', error);
    }

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
          setAboutMeText(data?.aboutMe || 'Îți place să înveți japoneză rapid și eficient? 🇯🇵');
        } else {
          console.log("Nu s-au găsit datele de profil.");
        }
      } else {
        router.replace('/(auth)/login');
      }
    };

    fetchProfile();
  }, [router]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={{ ...styles.container, backgroundColor: currentTheme.background }}>
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/profileImg.avif')}
            resizeMode="cover"
            style={{ width: '100%', height: '100%', paddingBottom: 20 }}
          />
        </View>

        <View style={{ ...styles.card, backgroundColor: currentTheme.surface }}>
          <Text style={{ ...styles.cardTitle, color: currentTheme.text }}>Your profile</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color={currentTheme.secondaryText} style={styles.icon} />
            <Text style={{ ...styles.infoText, color: currentTheme.text }}>{username}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color={currentTheme.secondaryText} style={styles.icon} />
            <Text style={{ ...styles.infoText, color: currentTheme.text }}>{email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="book" size={20} color={currentTheme.secondaryText} style={styles.icon} />
            <Text style={{ ...styles.infoText, color: currentTheme.text }}>Completed lessons: {completedLessons.length}</Text>
          </View>
        </View>
        <View style={{ ...styles.card, backgroundColor: currentTheme.surface }}>
          <Text style={{ ...styles.cardTitle, color: currentTheme.text }}>About you</Text>
          {isEditingAboutMe ? (
            <TextInput
              style={{ ...styles.aboutMeInput, backgroundColor: currentTheme.surface, color: currentTheme.text }}
              multiline
              value={aboutMeText}
              onChangeText={setAboutMeText}
            />
          ) : (
            <Text style={{ ...styles.info, color: currentTheme.text }}>{aboutMeText}</Text>
          )}
          <View style={styles.editSaveButtons}>
            <TouchableOpacity style={{ ...styles.editButton, backgroundColor: currentTheme.primary }} onPress={() => setIsEditingAboutMe(!isEditingAboutMe)}>
              <Text style={{ ...styles.editButtonText, color: currentTheme.background }}>{isEditingAboutMe ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
            {isEditingAboutMe && (
              <TouchableOpacity style={{ ...styles.saveButton, backgroundColor: 'green' }} onPress={handleSaveAboutMe}>
                <Text style={{ ...styles.saveButtonText, color: currentTheme.background }}>Save</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View>
          <TouchableOpacity style={{ ...styles.logoutButton, backgroundColor: currentTheme.primary, marginTop: 5 }} onPress={toggleTheme}>
            <MaterialIcons name="brightness-4" size={24} color={currentTheme.background} style={{ marginRight: 8 }} />
            <Text style={{ ...styles.logoutButtonText, color: currentTheme.background }}>Toggle Theme</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.logoutButtonContainer}>
          <TouchableOpacity style={{ ...styles.logoutButton, backgroundColor: currentTheme.primary }} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color={currentTheme.background} style={{ marginRight: 8 }} />
            <Text style={{ ...styles.logoutButtonText, color: currentTheme.background }}>Logout</Text>
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
    alignItems: 'center',
  },
  title: { fontSize: 24, marginBottom: 20 },
  info: { fontSize: 18, marginBottom: 10 },
  imageContainer: {
    width: width,
    height: height * 0.2,
    overflow: 'hidden',
  },
  card: {
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
    marginBottom: 10,
    fontWeight: '600',
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
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonText: {
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
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editSaveButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6
  },
  editButtonText: {
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: 'green',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 6
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});