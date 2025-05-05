import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, SectionList, ScrollView } from 'react-native';
import { lightTheme } from '../../constants/Colors';
import { darkTheme } from '@/constants/Colors';
import { useEffect, useState } from 'react';
import hiraganaData from '@/assets/data/hiragana.json';
import dakutenHiraganaData from '@/assets/data/hiraganaDakuten.json';
import yoonHiraganaData from '@/assets/data/hiraganaYōon.json';
import katakanaData from '@/assets/data/katakana.json';

const { width } = Dimensions.get('window');
const CARD_SIZE = width / 5 - 10;

export default function HiraganaScreen() {
    const [selectedTab, setSelectedTab] = useState<'hiragana' | 'katakana'>('hiragana');
    const [basicData, setBasicData] = useState<any[]>([]);
    const [dakutenData, setDakutenData] = useState<any[]>([]);
    const [yoonData, setYoonData] = useState<any[]>([]);
    const [katakanaFlatData, setKatakanaFlatData] = useState<any[]>([]);


    useEffect(() => {
        if (selectedTab === 'hiragana') {
            setBasicData(hiraganaData.flatMap((section) => section.rows));
            setDakutenData(dakutenHiraganaData.flatMap((section) => section.rows));
            setYoonData(yoonHiraganaData.flatMap((section) => section.rows));
        } else {
            setKatakanaFlatData(katakanaData.flatMap((section) => section.rows));
        }
    }, [selectedTab]);

    // useEffect(() => {
    //     const flattenedHiraganaData = hiraganaData.flatMap((section) => section.rows);
    //     const flattenedKatakanaData = katakanaData.flatMap((section) => section.rows);

    //     setData(selectedTab === 'hiragana' ? flattenedHiraganaData : flattenedKatakanaData);
    // }, [selectedTab]);


    const renderItem = ({ item }: { item: { romaji: string; kana: string } }) => (
        <View style={styles.card}>
            <Text style={styles.kana}>{item.kana}</Text>
            <Text style={styles.romaji}>{item.romaji}</Text>
        </View>
    );

    const renderSectionHeader = ({ section }: { section: any }) => (
        <Text style={styles.category}>{section.title}</Text>
    );


    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'hiragana' && styles.tabActive]}
                    onPress={() => setSelectedTab('hiragana')}
                >
                    <Text style={[styles.tabText, selectedTab === 'hiragana' && styles.tabTextActive]}>
                        Hiragana
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'katakana' && styles.tabActive]}
                    onPress={() => setSelectedTab('katakana')}
                >
                    <Text style={[styles.tabText, selectedTab === 'katakana' && styles.tabTextActive]}>
                        Katakana
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {selectedTab === 'hiragana' && (
                    <ScrollView style={{ flex: 1 }}>
                        <Text style={styles.category}>Basic</Text>
                        <Text style={styles.subtitle}>The main Japanese writing system</Text>
                        <FlatList
                            data={basicData}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => `basic-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                        <View style={styles.separator} />

                        <Text style={styles.category}>Dakuten</Text>
                        <FlatList
                            data={dakutenData}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => `dakuten-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                        <View style={styles.separator} />


                        <Text style={styles.category}>Yōon (Combinations)</Text>
                        <FlatList
                            data={yoonData}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => `yoon-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                    </ScrollView>
                )}

                {selectedTab === 'katakana' && (
                    <FlatList
                        data={katakanaFlatData}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => `katakana-${index}`}
                        numColumns={5}
                        columnWrapperStyle={styles.row}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkTheme.background,
        paddingTop: 40,
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: darkTheme.background,
        borderBottomWidth: 1,
        borderBottomColor: darkTheme.border,
    },
    tab: {
        marginHorizontal: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: darkTheme.surface,
    },
    tabActive: {
        backgroundColor: darkTheme.accent,
    },
    tabText: {
        color: darkTheme.text,
        fontSize: 16,
    },
    tabTextActive: {
        color: darkTheme.background,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: darkTheme.background,
        marginTop: 10,
    },
    separator: {
        borderBottomWidth: 2,
        borderBottomColor: darkTheme.border,
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
        backgroundColor: darkTheme.surface,
        borderRadius: 10,
    },
    category: {
        fontSize: 30,
        color: darkTheme.text,
        marginBottom: 5,
        fontWeight: 'bold',
        textAlign: 'left',
        marginLeft: 10,
        //marginTop: 10,
    },
    subtitle: {
        fontSize: 18,
        color: darkTheme.secondaryText,
        marginLeft: 10,
        marginBottom: 15,
    },
    romaji: {
        fontSize: 18,
        color: darkTheme.text,
    },
    kana: {
        fontSize: 24,
        color: darkTheme.accent,
    },
    row: {
        justifyContent: 'space-between',
    },
});
