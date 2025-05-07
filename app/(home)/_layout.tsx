import { Tabs, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { darkTheme } from '@/constants/Colors';
import { useNavigation } from '@react-navigation/native';

export default function HomeLayout() {
    const navigation = useNavigation();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: darkTheme.navbar,
                    borderTopWidth: 0,
                    height: 75,
                    paddingBottom: 20,
                },
                tabBarActiveTintColor: darkTheme.accent,
                tabBarInactiveTintColor: darkTheme.border,
                tabBarLabelStyle: {
                    fontSize: 12,
                    paddingBottom: 5,
                },
                tabBarIconStyle: {
                    marginTop: 5,
                },
            }}
        >
            <Tabs.Screen
                name="home" // Ruta pentru ecranul Home (app/(home)/index.tsx)
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="kanji/hiragana" // Ruta pentru ecranul Hiragana (app/(home)/hiragana.tsx)
                options={{
                    title: 'Kana',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="book-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile" // Ruta pentru ecranul Profile (app/(home)/profile.tsx)
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="kanji/[kanji]"
                options={{
                    href: null, // Important: Setează href la null pentru a nu fi un tab direct accesibil
                    title: undefined, // Nu afișa titlul în tab bar
                    tabBarIcon: () => null, // Nu afișa iconița în tab bar
                    tabBarStyle: { display: 'none' }, // Ascunde stilul tab-ului
                    headerShown: false, // Afișează header-ul pe pagina [kanji]
                }}
            />
            <Tabs.Screen
                name="lessons/hiragana-basic/page" // Ruta pentru ecranul Hiragana Basic (app/(home)/lessons/hiragana-basic/page.tsx)
                options={{
                    href: null, // Important: Setează href la null pentru a nu fi un tab direct accesibil
                    title: undefined, // Nu afișa titlul în tab bar
                    tabBarIcon: () => null, // Nu afișa iconița în tab bar
                    tabBarStyle: { display: 'none' }, // Ascunde stilul tab-ului
                    headerShown: false, // Afișează header-ul pe pagina [kanji]
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({});