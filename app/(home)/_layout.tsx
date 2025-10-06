import { Tabs, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/components/ThemeContext'; // Calea corectă!
import { lightTheme, darkTheme } from '@/constants/Colors'; // Asigură-te că ai importat corect temele
import { Host } from '@expo/ui/swift-ui';

export default function HomeLayout() {
    const navigation = useNavigation();
    const { theme, toggleTheme } = useTheme(); // Acum funcționează corect!
    const currentTheme = theme === 'light' ? lightTheme : darkTheme;
    return (
        <Host>
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: currentTheme.navbar,
                    borderTopWidth: 0,
                    height: 75,
                    paddingBottom: 20,
                },
                tabBarActiveTintColor: currentTheme.accent,
                tabBarInactiveTintColor: currentTheme.text,
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
                name="kanji/kana" // Ruta pentru ecranul Hiragana (app/(home)/hiragana.tsx)
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
            <Tabs.Screen
                name="lessons/hiragana-basic/firstRow" // Ruta pentru ecranul Hiragana Basic (app/(home)/lessons/hiragana-basic/page.tsx)
                options={{
                    href: null, // Important: Setează href la null pentru a nu fi un tab direct accesibil
                    title: undefined, // Nu afișa titlul în tab bar
                    tabBarIcon: () => null, // Nu afișa iconița în tab bar
                    tabBarStyle: { display: 'none' }, // Ascunde stilul tab-ului
                    headerShown: false, // Afișează header-ul pe pagina [kanji]
                }}
            />
            <Tabs.Screen
                name="lessons/hiragana-basic/secondRow" // Ruta pentru ecranul Hiragana Basic (app/(home)/lessons/hiragana-basic/page.tsx)
                options={{
                    href: null, // Important: Setează href la null pentru a nu fi un tab direct accesibil
                    title: undefined, // Nu afișa titlul în tab bar
                    tabBarIcon: () => null, // Nu afișa iconița în tab bar
                    tabBarStyle: { display: 'none' }, // Ascunde stilul tab-ului
                    headerShown: false, // Afișează header-ul pe pagina [kanji]
                }}
            />
            <Tabs.Screen
                name="lessons/hiragana-basic/thirdRow" // Ruta pentru ecranul Hiragana Basic (app/(home)/lessons/hiragana-basic/page.tsx)
                options={{
                    href: null, // Important: Setează href la null pentru a nu fi un tab direct accesibil
                    title: undefined, // Nu afișa titlul în tab bar
                    tabBarIcon: () => null, // Nu afișa iconița în tab bar
                    tabBarStyle: { display: 'none' }, // Ascunde stilul tab-ului
                    headerShown: false, // Afișează header-ul pe pagina [kanji]
                }}
            />
            <Tabs.Screen
                name="lessons/hiragana-basic/forthRow" // Ruta pentru ecranul Hiragana Basic (app/(home)/lessons/hiragana-basic/page.tsx)
                options={{
                    href: null, // Important: Setează href la null pentru a nu fi un tab direct accesibil
                    title: undefined, // Nu afișa titlul în tab bar
                    tabBarIcon: () => null, // Nu afișa iconița în tab bar
                    tabBarStyle: { display: 'none' }, // Ascunde stilul tab-ului
                    headerShown: false, // Afișează header-ul pe pagina [kanji]
                }}
            />
            <Tabs.Screen
                name="lessons/katakana-basic/page" // Ruta pentru ecranul Hiragana Basic (app/(home)/lessons/hiragana-basic/page.tsx)
                options={{
                    href: null, // Important: Setează href la null pentru a nu fi un tab direct accesibil
                    title: undefined, // Nu afișa titlul în tab bar
                    tabBarIcon: () => null, // Nu afișa iconița în tab bar
                    tabBarStyle: { display: 'none' }, // Ascunde stilul tab-ului
                    headerShown: false, // Afișează header-ul pe pagina [kanji]
                }}
            />
            <Tabs.Screen
                name="lessons/katakana-basic/firstRow" // Ruta pentru ecranul Hiragana Basic (app/(home)/lessons/hiragana-basic/page.tsx)
                options={{
                    href: null, // Important: Setează href la null pentru a nu fi un tab direct accesibil
                    title: undefined, // Nu afișa titlul în tab bar
                    tabBarIcon: () => null, // Nu afișa iconița în tab bar
                    tabBarStyle: { display: 'none' }, // Ascunde stilul tab-ului
                    headerShown: false, // Afișează header-ul pe pagina [kanji]
                }}
            />
            <Tabs.Screen
                name="lessons/katakana-basic/secondRow" // Ruta pentru ecranul Hiragana Basic (app/(home)/lessons/hiragana-basic/page.tsx)
                options={{
                    href: null, // Important: Setează href la null pentru a nu fi un tab direct accesibil
                    title: undefined, // Nu afișa titlul în tab bar
                    tabBarIcon: () => null, // Nu afișa iconița în tab bar
                    tabBarStyle: { display: 'none' }, // Ascunde stilul tab-ului
                    headerShown: false, // Afișează header-ul pe pagina [kanji]
                }}
            />
            <Tabs.Screen
                name="lessons/katakana-basic/thirdRow" // Ruta pentru ecranul Hiragana Basic (app/(home)/lessons/hiragana-basic/page.tsx)
                options={{
                    href: null, // Important: Setează href la null pentru a nu fi un tab direct accesibil
                    title: undefined, // Nu afișa titlul în tab bar
                    tabBarIcon: () => null, // Nu afișa iconița în tab bar
                    tabBarStyle: { display: 'none' }, // Ascunde stilul tab-ului
                    headerShown: false, // Afișează header-ul pe pagina [kanji]
                }}
            />

            <Tabs.Screen
                name="lessons/katakana-basic/forthRow" // Ruta pentru ecranul Hiragana Basic (app/(home)/lessons/hiragana-basic/page.tsx)
                options={{
                    href: null, // Important: Setează href la null pentru a nu fi un tab direct accesibil
                    title: undefined, // Nu afișa titlul în tab bar
                    tabBarIcon: () => null, // Nu afișa iconița în tab bar
                    tabBarStyle: { display: 'none' }, // Ascunde stilul tab-ului
                    headerShown: false, // Afișează header-ul pe pagina [kanji]
                }}
            />
           <Tabs.Screen
                name="lessons/LessonPage" // Ruta pentru ecranul Hiragana Basic (app/(home)/lessons/hiragana-basic/page.tsx)
                options={{
                    href: null, // Important: Setează href la null pentru a nu fi un tab direct accesibil
                    title: undefined, // Nu afișa titlul în tab bar
                    tabBarIcon: () => null, // Nu afișa iconița în tab bar
                    tabBarStyle: { display: 'none' }, // Ascunde stilul tab-ului
                    headerShown: false, // Afișează header-ul pe pagina [kanji]
                }}
            />
             <Tabs.Screen
                name="lessons/components/RecognitionExercise" // Ruta pentru ecranul Hiragana Basic (app/(home)/lessons/hiragana-basic/page.tsx)
                options={{
                    href: null, // Important: Setează href la null pentru a nu fi un tab direct accesibil
                    title: undefined, // Nu afișa titlul în tab bar
                    tabBarIcon: () => null, // Nu afișa iconița în tab bar
                    tabBarStyle: { display: 'none' }, // Ascunde stilul tab-ului
                    headerShown: false, // Afișează header-ul pe pagina [kanji]
                }}
            />
        </Tabs>
        </Host>
    );
}

const styles = StyleSheet.create({});