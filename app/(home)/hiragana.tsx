import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { lightTheme } from '../../constants/Colors';
import { darkTheme } from '@/constants/Colors';
import { useEffect, useState } from 'react';
import hiraganaData from '@/assets/data/hiragana.json';
import katakanaData from '@/assets/data/katakana.json';

const { width } = Dimensions.get('window');
const CARD_SIZE = width / 5 -10;

export default function HiraganaScreen() {
  const [selectedTab, setSelectedTab] = useState<'hiragana' | 'katakana'>('hiragana');
  const [data, setData] = useState<any[]>([]);  // Make sure data is typed as an array of any type

  useEffect(() => {
    const flattenedHiraganaData = hiraganaData.flatMap((section) => section.rows);
    const flattenedKatakanaData = katakanaData.flatMap((section) => section.rows);
    
    setData(selectedTab === 'hiragana' ? flattenedHiraganaData : flattenedKatakanaData);
  }, [selectedTab]);

  // Render each row of kana
  const renderItem = ({ item }: { item: { romaji: string; kana: string } }) => (
    <View style={styles.card}>
      <Text style={styles.romaji}>{item.romaji}</Text>
      <Text style={styles.kana}>{item.kana}</Text>
    </View>
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

      {/* Content */}
      <View style={styles.content}>
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={5}
          columnWrapperStyle={styles.row}
        />
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
    marginTop:10,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    margin:4,
    backgroundColor: darkTheme.surface,
    borderRadius: 10,
    
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
