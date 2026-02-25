import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, ScrollView, ActivityIndicator, LayoutAnimation, Platform } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import hiraganaData from '@/assets/data/hiragana.json';
import dakutenHiraganaData from '@/assets/data/hiraganaDakuten.json';
import yoonHiraganaData from '@/assets/data/hiraganaYōon.json';
import katakanaData from '@/assets/data/katakana.json';
import dukatenKatakanaData from '@/assets/data/katakanaDakuten.json';
import yoonKatakanaData from '@/assets/data/katakanaYoon.json';
import kanjiDataN5 from '@/assets/data/kanjiData_N5.json'; // Backup pentru fallback
import { router } from 'expo-router';
import { useTheme } from '@/components/ThemeContext'; // Calea corectă!
import { lightTheme, darkTheme } from '@/constants/Colors'; // Asigură-te că ai importat corect temele

const { width } = Dimensions.get('window');
const SIDE_PADDING = 20;
const CARD_MARGIN = 5;
const CONTENT_PADDING = SIDE_PADDING * 2;
const AVAILABLE_WIDTH = width - CONTENT_PADDING;
const CARD_SIZE = (AVAILABLE_WIDTH - (CARD_MARGIN * 2 * 5)) / 5;
const CARD_SIZE_KANJI = CARD_SIZE;

interface KanjiInfo { // Aici definim tipul datelor din kanjiDataN5
    onyomi: string[];
    kunyomi: string[];
    meaning: string;
    onyomiWords: { word: string; reading: string; meaning: string }[];
    kunyomiWords: { word: string; reading: string; meaning: string }[];
    examples: { sentence: string; reading: string; meaning: string }[];
}

// Lista statică de kanji N5 ca fallback
const N5_KANJI_FALLBACK = [
    '日', '一', '国', '人', '年', '大', '十', '二', '本', '中',
    '長', '出', '三', '時', '行', '見', '月', '分', '後', '前',
    '生', '五', '間', '上', '東', '四', '今', '金', '九', '入',
    '学', '高', '円', '子', '外', '八', '六', '下', '来', '気',
    '小', '七', '山', '話', '女', '北', '午', '百', '書', '先',
    '名', '川', '千', '水', '半', '男', '西', '電', '校', '語',
    '土', '木', '聞', '食', '車', '何', '南', '万', '毎', '白',
    '天', '母', '火', '右', '読', '友', '左', '休', '父', '雨'
];

const fetchN5Kanji = async (): Promise<string[]> => {
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        return N5_KANJI_FALLBACK;

    } catch (error) {
        console.error('Eroare la încărcarea kanji N5:', error);
        // Fallback la JSON local
        return Object.keys(kanjiDataN5 as Record<string, KanjiInfo>);
    }
};

export default function HiraganaScreen() {
    const [selectedTab, setSelectedTab] = useState<'hiragana' | 'katakana' | 'kanji'>('hiragana');
    const [basicData, setBasicData] = useState<any[]>([]);
    const [dakutenData, setDakutenData] = useState<any[]>([]);
    const [yoonData, setYoonData] = useState<any[]>([]);
    const [katakanaFlatData, setKatakanaFlatData] = useState<any[]>([]);
    const [katakanaDakutenFlatData, setKatakanaDakutenFlatData] = useState<any[]>([]);
    const [katakanaYoonFlatData, setKatakanaYoonFlatData] = useState<any[]>([]);

    // State pentru kanji cu API
    const [kanjiListN5, setKanjiListN5] = useState<string[]>([]);
    const [kanjiLoading, setKanjiLoading] = useState<boolean>(false);

    const { theme, toggleTheme } = useTheme(); // Acum funcționează corect!
    const currentTheme = theme === 'light' ? lightTheme : darkTheme;

    useEffect(() => {
        if (selectedTab === 'hiragana') {
            setBasicData(hiraganaData.flatMap((section) => section.rows));
            setDakutenData(dakutenHiraganaData.flatMap((section) => section.rows));
            setYoonData(yoonHiraganaData.flatMap((section) => section.rows));
        } else if (selectedTab === 'katakana') {
            setKatakanaFlatData(katakanaData.flatMap((section) => section.rows));
            setKatakanaDakutenFlatData(dukatenKatakanaData.flatMap((section) => section.rows));
            setKatakanaYoonFlatData(yoonKatakanaData.flatMap((section) => section.rows));
        } else if (selectedTab === 'kanji') {
            // Încarcă kanji doar dacă nu sunt deja încărcate
            if (kanjiListN5.length === 0 && !kanjiLoading) {
                loadKanjiN5();
            }
        }
    }, [selectedTab]);

    // Funcția pentru a încărca kanji N5
    const loadKanjiN5 = async () => {
        setKanjiLoading(true);
        try {
            const kanjiList = await fetchN5Kanji();
            setKanjiListN5(kanjiList);
        } catch (error) {
            console.error('Eroare la încărcarea kanji:', error);
            // Fallback la JSON local
            setKanjiListN5(Object.keys(kanjiDataN5 as Record<string, KanjiInfo>));
        } finally {
            setKanjiLoading(false);
        }
    };


    const renderItem = ({ item }: { item: { romaji: string; kana: string } }, listType: 'basic' | 'dakuten' | 'yoon' | 'katakana') => (
        <View style={[styles.card, listType === 'yoon' && styles.yoonCard, { backgroundColor: currentTheme.surface }]}>
            <Text style={{ ...styles.kana, color: currentTheme.accent }}>{item.kana}</Text>
            <Text style={{ ...styles.romaji, color: currentTheme.text }}>{item.romaji}</Text>
        </View>
    );
    const renderKanjiItem = ({ item }: { item: string }) => {
        return (
            <TouchableOpacity style={{ ...styles.kanjiCard, backgroundColor: currentTheme.surface }} onPress={() => router.push(`./${item}`)}>
                <Text style={{ ...styles.kanjiText, color: currentTheme.accent }}>{item}</Text>
            </TouchableOpacity>
        );
    };
    const renderSectionHeader = ({ section }: { section: any }) => (
        <Text style={{ ...styles.category, color: currentTheme.text }}>{section.title}</Text>
    );



    return (
        <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
            {/* Premium Header */}
            <View style={[styles.header, { paddingTop: 60 }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Learning Kana</Text>
                    <Text style={[styles.headerSubtitle, { color: currentTheme.text + '60' }]}>MASTER THE BASICS</Text>
                </View>
            </View>

            {/* Premium Segmented Control */}
            <View style={styles.segmentedWrapper}>
                <View style={[styles.tabContainer, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '05' }]}>
                    <TouchableOpacity
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setSelectedTab('hiragana');
                        }}
                        style={[
                            styles.tab,
                            selectedTab === 'hiragana' && { backgroundColor: currentTheme.primary }
                        ]}
                    >
                        <Text style={[styles.tabText, { color: selectedTab === 'hiragana' ? '#fff' : currentTheme.text + '60' }]}>
                            Hiragana
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setSelectedTab('katakana');
                        }}
                        style={[
                            styles.tab,
                            selectedTab === 'katakana' && { backgroundColor: currentTheme.primary }
                        ]}
                    >
                        <Text style={[styles.tabText, { color: selectedTab === 'katakana' ? '#fff' : currentTheme.text + '60' }]}>
                            Katakana
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setSelectedTab('kanji');
                        }}
                        style={[
                            styles.tab,
                            selectedTab === 'kanji' && { backgroundColor: currentTheme.primary }
                        ]}
                    >
                        <Text style={[styles.tabText, { color: selectedTab === 'kanji' ? '#fff' : currentTheme.text + '60' }]}>
                            Kanji
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.content, { backgroundColor: currentTheme.background }]}>
                {selectedTab === 'hiragana' && (
                    <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <Text style={[styles.category, { color: currentTheme.text }]}>Hiragana</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>The main Japanese writing system</Text>
                        <FlatList
                            data={basicData}
                            renderItem={(props) => renderItem(props, 'basic')}
                            keyExtractor={(item, index) => `basic-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                        <View style={[styles.separator, { borderBottomColor: currentTheme.border }]} />

                        <Text style={[styles.category, { color: currentTheme.text }]}>Dakuten</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>A symbol changes the sound</Text>
                        <FlatList
                            data={dakutenData}
                            renderItem={(props) => renderItem(props, 'dakuten')}
                            keyExtractor={(item, index) => `dakuten-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                        <View style={[styles.separator, { borderBottomColor: currentTheme.border }]} />

                        <Text style={[styles.category, { color: currentTheme.text }]}>Yōon (Combinations)</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>A small character to make new syllable</Text>
                        <FlatList
                            data={yoonData}
                            renderItem={(props) => renderItem(props, 'yoon')}
                            keyExtractor={(item, index) => `yoon-${index}`}
                            numColumns={3}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                    </ScrollView>
                )}

                {selectedTab === 'katakana' && (
                    <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <Text style={[styles.category, { color: currentTheme.text }]}>Katakana</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>Characters used for loanwords</Text>
                        <FlatList
                            data={katakanaFlatData}
                            renderItem={(props) => renderItem(props, 'basic')}
                            keyExtractor={(item, index) => `basic-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                        <View style={[styles.separator, { borderBottomColor: currentTheme.border }]} />

                        <Text style={[styles.category, { color: currentTheme.text }]}>Dakuten</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>A symbol changes the sound</Text>
                        <FlatList
                            data={katakanaDakutenFlatData}
                            renderItem={(props) => renderItem(props, 'dakuten')}
                            keyExtractor={(item, index) => `dakuten-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                        <View style={[styles.separator, { borderBottomColor: currentTheme.border }]} />

                        <Text style={[styles.category, { color: currentTheme.text }]}>Yōon (Combinations)</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>A small character to make new syllable</Text>
                        <FlatList
                            data={katakanaYoonFlatData}
                            renderItem={(props) => renderItem(props, 'yoon')}
                            keyExtractor={(item, index) => `yoon-${index}`}
                            numColumns={3}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                    </ScrollView>
                )}

                {selectedTab === 'kanji' && (
                    <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <Text style={[styles.category, { color: currentTheme.text }]}>Kanji (N5)</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>Essential characters for daily life</Text>
                        <FlatList
                            data={kanjiListN5}
                            renderItem={renderKanjiItem}
                            keyExtractor={(item) => item}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                    </ScrollView>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginTop: 4,
    },
    themeToggle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    segmentedWrapper: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    tab: {
        flex: 1,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    separator: {
        height: 1,
        width: '90%',
        alignSelf: 'center',
        marginVertical: 30,
        opacity: 0.1,
        borderBottomWidth: 1,
    },
    card: {
        width: CARD_SIZE,
        height: CARD_SIZE + 10,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: { elevation: 2 },
        }),
    },
    category: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 4,
        marginTop: 10,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 20,
        opacity: 0.5,
    },
    kana: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 2,
    },
    romaji: {
        fontSize: 12,
        fontWeight: '800',
        opacity: 0.4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        justifyContent: 'center',
    },
    rowKanji: {
        justifyContent: 'center',
    },
    yoonCard: {
        width: (width - 60) / 3,
        height: CARD_SIZE + 15,
    },
    kanjiCard: {
        width: CARD_SIZE_KANJI,
        height: CARD_SIZE_KANJI,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
        margin: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    kanjiText: {
        fontSize: 24,
        fontWeight: '700',
    },
    kanjiListContainer: {
        paddingBottom: 120,
    },
});
