import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, SectionList, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
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
const CARD_SIZE = width / 5 - 10;
const CARD_SIZE_KANJI = width / 6 - 10;

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
    '日', '一', '国', '人', '年', '大', '十', '二', '本', '中', '長', '出', '三', '時', 
    '行', '見', '月', '分', '後', '前', '生', '五', '間', '上', '東', '四', '今', '金', 
    '九', '入', '学', '高', '安', '子', '外', '八', '六', '下', '来', '気', '小', '七', 
    '山', '話', '女', '北', '午', '百', '書', '先', '名', '川', '千', '水', '半', '男', 
    '西', '電', '校', '語', '土', '木', '聞', '食', '車', '何', '南', '万', '毎', '白', 
    '天', '母', '火', '右', '読', '友', '左', '休', '父', '雨', '買', '足', '飲', '駅'
];

// Funcția pentru a obține kanji N5 din API
const fetchN5Kanji = async (): Promise<string[]> => {
    try {
        // Încercăm să obținem lista de kanji N5 din KanjiAPI
        // Nota: KanjiAPI nu are endpoint direct pentru N5, deci folosim lista statică
        // În viitor poți încerca alte API-uri sau să construiești propria listă
        
        // Pentru demonstrație, simulez un API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulez delay
        
        // Returnez lista statică (în viitor poți înlocui cu API real)
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
        <View style={{ ...styles.container, backgroundColor: currentTheme.background }}>
            {/* Tabs */}
            <View style={{ ...styles.tabContainer, backgroundColor: currentTheme.background, borderColor: currentTheme.border }}>
                <TouchableOpacity
                    onPress={() => setSelectedTab('hiragana')}
                    style={[
                        styles.tab,
                        selectedTab === 'hiragana'
                            ? { backgroundColor: currentTheme.accent } // Culoare activă din tema curentă
                            : { backgroundColor: currentTheme.surface }, // Culoare inactivă din tema curentă (sau altă culoare)
                    ]}
                >
                    <Text
                        style={[
                            styles.tabText,
                            selectedTab === 'hiragana'
                                ? { color: currentTheme.background, fontWeight: 'bold' } // Culoare text activă din tema curentă
                                : { color: currentTheme.text }, // Culoare text inactivă din tema curentă
                        ]}
                    >
                        Hiragana
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setSelectedTab('katakana')}
                    style={[
                        styles.tab,
                        selectedTab === 'katakana'
                            ? { backgroundColor: currentTheme.accent } // Culoare activă din tema curentă
                            : { backgroundColor: currentTheme.surface }, // Culoare inactivă din tema curentă (sau altă culoare)
                    ]}
                >
                    <Text
                        style={[
                            styles.tabText,
                            selectedTab === 'katakana'
                                ? { color: currentTheme.background, fontWeight: 'bold' } // Culoare text activă din tema curentă
                                : { color: currentTheme.text }, // Culoare text inactivă din tema curentă
                        ]}
                    >
                        Katakana
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setSelectedTab('kanji')}
                    style={[
                        styles.tab,
                        selectedTab === 'kanji'
                            ? { backgroundColor: currentTheme.accent } // Culoare activă din tema curentă
                            : { backgroundColor: currentTheme.surface }, // Culoare inactivă din tema curentă (sau altă culoare)
                    ]}
                >
                    <Text
                        style={[
                            styles.tabText,
                            selectedTab === 'kanji'
                                ? { color: currentTheme.background, fontWeight: 'bold' } // Culoare text activă din tema curentă
                                : { color: currentTheme.text }, // Culoare text inactivă din tema curentă
                        ]}
                    >
                        Kanji
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{ ...styles.content, backgroundColor: currentTheme.background }}>
                {selectedTab === 'hiragana' && (
                    <ScrollView style={{ flex: 1 }}>
                        <Text style={{ ...styles.category, color: currentTheme.text }}>Hiragana</Text>
                        <Text style={{ ...styles.subtitle, color: currentTheme.secondaryText }}>The main Japanese writing system</Text>
                        <FlatList
                            data={basicData}
                            renderItem={(props) => renderItem(props, 'basic')}
                            keyExtractor={(item, index) => `basic-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                        <View style={{ ...styles.separator, borderBottomColor: currentTheme.border }} />

                        <Text style={{ ...styles.category, color: currentTheme.text }}>Dakuten</Text>
                        <Text style={{ ...styles.subtitle, color: currentTheme.secondaryText }}>A symbol changes the sound</Text>
                        <FlatList
                            data={dakutenData}
                            renderItem={(props) => renderItem(props, 'dakuten')}
                            keyExtractor={(item, index) => `dakuten-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                        <View style={{ ...styles.separator, borderBottomColor: currentTheme.border }} />


                        <Text style={{ ...styles.category, color: currentTheme.text }}>Yōon (Combinations)</Text>
                        <Text style={{ ...styles.subtitle, color: currentTheme.secondaryText }}>A small character to make new syllable</Text>
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
                    <ScrollView style={{ flex: 1 }}>
                        <Text style={{ ...styles.category, color: currentTheme.text }}>Katakana</Text>
                        <Text style={{ ...styles.subtitle, color: currentTheme.secondaryText }}>Characters used for loanwords</Text>
                        <FlatList
                            data={katakanaFlatData}
                            renderItem={(props) => renderItem(props, 'basic')}
                            keyExtractor={(item, index) => `basic-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                        <View style={{ ...styles.separator, borderBottomColor: currentTheme.border }} />

                        <Text style={{ ...styles.category, color: currentTheme.text }}>Dakuten</Text>
                        <Text style={{ ...styles.subtitle, color: currentTheme.secondaryText }}>A symbol changes the sound</Text>
                        <FlatList
                            data={katakanaDakutenFlatData}
                            renderItem={(props) => renderItem(props, 'dakuten')}
                            keyExtractor={(item, index) => `dakuten-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                        <View style={{ ...styles.separator, borderBottomColor: currentTheme.border }} />


                        <Text style={{ ...styles.category, color: currentTheme.text }}>Yōon (Combinations)</Text>
                        <Text style={{ ...styles.subtitle, color: currentTheme.secondaryText }}>A small character to make new syllable</Text>
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
                    <View style={{ flex: 1 }}>
                        <Text style={{ ...styles.category, color: currentTheme.text }}>Kanji (N5)</Text>
                        <FlatList
                            data={kanjiListN5}
                            renderItem={renderKanjiItem}
                            keyExtractor={(item) => item}
                            numColumns={6}
                            columnWrapperStyle={styles.rowKanji}
                            contentContainerStyle={styles.kanjiListContainer}
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: darkTheme.background,
        paddingTop: 40,
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 10,
        // backgroundColor: darkTheme.background,
        borderBottomWidth: 1,
        // borderBottomColor: darkTheme.border,
        width: '100%',
    },
    tab: {
        flex: 1,
        marginHorizontal: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: darkTheme.surface,
    },
    tabActive: {
        //  backgroundColor: darkTheme.accent,
    },
    tabText: {
        color: darkTheme.text,
        fontSize: 16,
    },
    tabTextActive: {
        // color: darkTheme.background,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: darkTheme.background,
        marginTop: 10,
    },
    separator: {
        borderBottomWidth: 2,
        // borderBottomColor: darkTheme.border,
        alignSelf: 'center', // Centrează linia orizontal
        marginVertical: 20, // Adaugă spațiu deasupra și dedesubtul liniei
        width: '100%', // Ajustează lățimea liniei după nevoie
    },
    card: {
        width: CARD_SIZE,
        height: CARD_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        margin: 4,
        // backgroundColor: darkTheme.surface,
        borderRadius: 10,
    },
    category: {
        fontSize: 30,
        // color: darkTheme.text,
        marginBottom: 5,
        fontWeight: 'bold',
        textAlign: 'left',
        marginLeft: 10,
        //marginTop: 10,
    },
    subtitle: {
        fontSize: 18,
        // color: darkTheme.secondaryText,
        marginLeft: 10,
        marginBottom: 15,
    },
    romaji: {
        fontSize: 18,
        // color: darkTheme.text,
    },
    kana: {
        fontSize: 24,
        // color: darkTheme.accent,
    },
    row: {
        justifyContent: 'space-between',
        //justifyContent: 'center',
    },
    rowKanji: {
        justifyContent: 'center',

    },
    yoonCard: {
        justifyContent: 'space-around',
        width: width / 3 - 10, // Adjust width for 3 items
    },
    kanjiCard: {
        width: CARD_SIZE_KANJI,
        height: CARD_SIZE_KANJI,
        justifyContent: 'center',
        alignItems: 'center',
        //backgroundColor: darkTheme.surface,
        borderRadius: 10,
        margin: 4,
    },
    kanjiText: {
        fontSize: 40,
        // color: darkTheme.accent,
    },
    kanjiListContainer: {
        paddingBottom: 20,
        paddingHorizontal: 10,
    },
});
