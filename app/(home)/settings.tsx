
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
// @ts-ignore
import { auth } from '@/firebaseConfig';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, toggleTheme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const handleLogout = async () => {
    try {
      await (auth as any).signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const SettingItem = ({ icon, label, children, onPress, color }: any) => (
    <TouchableOpacity 
      style={[styles.item, { borderBottomColor: currentTheme.text + '08' }]} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: (color || currentTheme.primary) + '10' }]}>
          <Ionicons name={icon} size={20} color={color || currentTheme.primary} />
        </View>
        <Text style={[styles.itemLabel, { color: currentTheme.text }]}>{label}</Text>
      </View>
      {children || <Ionicons name="chevron-forward" size={18} color={currentTheme.text + '20'} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/profile')}>
          <Ionicons name="chevron-back" size={28} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text + '70' }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: currentTheme.surface }]}>
            <SettingItem icon="moon" label="Dark Mode">
              <Switch 
                value={theme === 'dark'} 
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: currentTheme.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : (theme === 'dark' ? '#fff' : '#f4f3f4')}
              />
            </SettingItem>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text + '70' }]}>ACCOUNT</Text>
          <View style={[styles.card, { backgroundColor: currentTheme.surface }]}>
            {/* <SettingItem 
              icon="person-outline" 
              label="Edit Profile" 
              onPress={() => router.push('/profile')}
            /> */}
            <SettingItem icon="notifications-outline" label="Notifications" />
            <SettingItem icon="lock-closed-outline" label="Privacy & Security" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text + '70' }]}>SYSTEM</Text>
          <View style={[styles.card, { backgroundColor: currentTheme.surface }]}>
            <SettingItem 
              icon="log-out-outline" 
              label="Log Out" 
              color="#FF3B30" 
              onPress={handleLogout}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: currentTheme.text + '20' }]}>
            Nihongo Master V1.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 10,
  },
  scrollContent: { padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 5,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
