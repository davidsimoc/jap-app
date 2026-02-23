
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Dimensions,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
// @ts-ignore
import { db, auth } from '@/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { COUNTRIES, Country } from '@/constants/countries';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [userStats, setUserStats] = useState({
    completedNodes: 0,
    souvenirs: 0,
    starred: 0
  });
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [tempAboutMe, setTempAboutMe] = useState('');

  const generatePassportNo = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'ID-' + result;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const firebaseAuth = auth as any;
      const user = firebaseAuth?.currentUser;
      if (!user) return;

      try {
        // 1. Fetch Basic Profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        // 2. Fetch Progress Stats
        const progRef = doc(db, 'userProgress', user.uid);
        const progSnap = await getDoc(progRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          let updatedData = { ...data };
          
          // Generate Passport No if missing
          if (!data.passportNo) {
            const newNo = generatePassportNo();
            await updateDoc(userRef, { passportNo: newNo });
            updatedData.passportNo = newNo;
          }

          setUserData(updatedData);
          setTempAboutMe(data.aboutMe || '');
        }

        if (progSnap.exists()) {
          const pData = progSnap.data();
          const completedCount = Object.values(pData.road || {}).filter(s => s === 'completed').length;
          setUserStats({
            completedNodes: completedCount,
            souvenirs: (pData.souvenirs || []).length,
            starred: (pData.starredWords || []).length
          });
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const StatCard = ({ icon, label, value, sublabel, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '05' }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: currentTheme.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: currentTheme.text + '80' }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.statSublabel, { color: color }]}>{sublabel}</Text>
      </View>
    </View>
  );

  const handleSaveAboutMe = async () => {
    const firebaseAuth = auth as any;
    const user = firebaseAuth?.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        aboutMe: tempAboutMe
      });
      setUserData({ ...userData, aboutMe: tempAboutMe });
      setIsEditModalVisible(false);
    } catch (error) {
      console.error('Error updating about me:', error);
    }
  };

  const handleSelectCountry = async (country: Country) => {
    const firebaseAuth = auth as any;
    const user = firebaseAuth?.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        citizenship: country.en,
        citizenshipJp: country.jp
      });
      setUserData({ ...userData, citizenship: country.en, citizenshipJp: country.jp });
      setIsCountryModalVisible(false);
    } catch (error) {
      console.error('Error updating citizenship:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header Background Pattern */}
        <View style={[styles.headerPattern, { backgroundColor: currentTheme.primary + '05' }]}>
           <Ionicons name="airplane" size={300} color={currentTheme.primary + '03'} style={styles.bgIcon} />
        </View>

        {/* Top Tools */}
        <View style={[styles.topRow, { paddingTop: insets.top + 10 }]}>
           <Text style={[styles.headerHeading, { color: currentTheme.text }]}>Profile</Text>
           <TouchableOpacity 
             style={[styles.settingsBtn, { backgroundColor: currentTheme.surface }]}
             onPress={() => router.push('/settings')}
           >
             <Ionicons name="settings-outline" size={22} color={currentTheme.text} />
           </TouchableOpacity>
        </View>

        {/* Passport Identity Card */}
        <View style={styles.passportWrapper}>
          <View style={[styles.passportCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '08' }]}>
            <View style={styles.passportTop}>
              <View style={styles.photoContainer}>
                <Image 
                  source={userData?.profilePicture ? { uri: userData.profilePicture } : require('../../assets/images/profileImg.avif')} 
                  style={styles.avatar}
                />
                <View style={[styles.verifiedBadge, { backgroundColor: currentTheme.primary }]}>
                   <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              </View>
              <View style={styles.idInfo}>
                <View>
                  <Text style={[styles.idLabel, { color: currentTheme.text + '70' }]}>TRAVELLER NAME</Text>
                  <Text style={[styles.idValue, { color: currentTheme.text }]}>{userData?.username || 'GUEST'}</Text>
                </View>
                <View style={{ marginTop: 15 }}>
                  <Text style={[styles.idLabel, { color: currentTheme.text + '70' }]}>CITIZENSHIP</Text>
                  <TouchableOpacity onPress={() => setIsCountryModalVisible(true)}>
                    <Text style={[styles.idValue, { color: currentTheme.text }]}>
                        {userData?.citizenship || 'EARTH'} / {userData?.citizenshipJp || 'アース'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={[styles.dottedDivider, { borderBottomColor: currentTheme.text + '10' }]} />
            
            <View style={styles.passportBottom}>
              <View style={styles.idSubDetail}>
                <Text style={[styles.idLabel, { color: currentTheme.text + '70' }]}>PASSPORT NO.</Text>
                <Text style={[styles.idValueSmall, { color: currentTheme.text + '80' }]}>
                  {userData?.passportNo || 'GENERATING...'}
                </Text>
              </View>
              <View style={styles.stampLogo}>
                 <Text style={[styles.logoText, { color: currentTheme.primary + '50' }]}>JAPAPP</Text>
                 <Ionicons name="qr-code-outline" size={32} color={currentTheme.text + '10'} />
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Journey Progress</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard 
            icon="trail-sign" 
            label="Journey" 
            value={userStats.completedNodes} 
            sublabel="Nodes Explored"
            color="#4CAF50"
          />
          <StatCard 
            icon="briefcase" 
            label="Gallery" 
            value={userStats.souvenirs} 
            sublabel="Stamps Earned"
            color="#FF9500"
          />
          <StatCard 
            icon="star" 
            label="Knowledge" 
            value={userStats.starred} 
            sublabel="SRS Cards"
            color="#007AFF"
          />
        </View>

        {/* About Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text, marginBottom: 10 }]}>Traveler’s Log</Text>
          <TouchableOpacity onPress={() => setIsEditModalVisible(true)}>
             <Text style={[styles.editLink, { color: currentTheme.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.aboutContainer}>
           <View style={[styles.aboutCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '05' }]}>
              <Ionicons name="chatbox-ellipses-outline" size={24} color={currentTheme.primary} style={styles.quoteIcon} />
              <Text style={[styles.aboutText, { color: currentTheme.text + '90' }]}>
                {userData?.aboutMe || "Every master was once a beginner. Start your journey today!"}
              </Text>
           </View>
        </View>

      </ScrollView>

      {/* Edit About Me Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Edit Bio</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.input, { backgroundColor: currentTheme.background, color: currentTheme.text }]}
              multiline
              placeholder="Tell us about yourself..."
              placeholderTextColor={currentTheme.text + '30'}
              value={tempAboutMe}
              onChangeText={setTempAboutMe}
              maxLength={200}
            />

            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: currentTheme.primary }]}
              onPress={handleSaveAboutMe}
            >
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Country Picker Modal */}
      <Modal
        visible={isCountryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCountryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: currentTheme.surface, 
              maxHeight: '90%',
              paddingTop: Math.max(insets.top, 20)
            }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Select Citizenship</Text>
              <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}>
                <Ionicons name="close" size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 10, paddingBottom: 40 }}
            >
                {COUNTRIES.map((country) => (
                    <TouchableOpacity 
                        key={country.code}
                        style={[styles.countryItem, { borderBottomColor: currentTheme.text + '05' }]}
                        onPress={() => handleSelectCountry(country)}
                    >
                        <Text style={[styles.countryText, { color: currentTheme.text }]}>{country.en}</Text>
                        <Text style={[styles.countryTextJp, { color: currentTheme.text + '40' }]}>{country.jp}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerPattern: {
    height: 300,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgIcon: { position: 'absolute', top: -50, right: -100, transform: [{ rotate: '-15deg' }] },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    zIndex: 10,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  passportWrapper: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  passportCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  passportTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  photoContainer: {
    width: 100,
    height: 120,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'visible',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idInfo: {
    flex: 1,
  },
  idLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  idValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  dottedDivider: {
    marginVertical: 20,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  passportBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  idValueSmall: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  idSubDetail: {
    alignItems: 'flex-start',
  },
  stampLogo: {
    alignItems: 'center',
    gap: 5,
  },
  logoText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sectionHeader: {
    paddingHorizontal: 25,
    marginTop: 40,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  statsGrid: {
    paddingHorizontal: 20,
    gap: 15,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  statIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    marginLeft: 18,
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginVertical: 2,
  },
  statSublabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  aboutContainer: {
    paddingHorizontal: 20,
  },
  aboutCard: {
    padding: 25,
    borderRadius: 24,
    borderWidth: 1,
  },
  quoteIcon: {
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  headerHeading: {
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 10,
  },
  editLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  input: {
    borderRadius: 20,
    padding: 20,
    fontSize: 16,
    fontWeight: '600',
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  saveBtn: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  countryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  countryTextJp: {
    fontSize: 14,
    fontWeight: '600',
  }
});