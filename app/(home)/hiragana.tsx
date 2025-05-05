
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import { lightTheme } from '../../constants/Colors';
import { darkTheme } from '@/constants/Colors';
import { useState } from 'react';

export default function HiraganaScreen() {
    const [selectedTab, setSelectedTab] = useState<'hiragana' | 'katakana'>('hiragana');
    

    return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'hiragana' && styles.tabActive,
          ]}
          onPress={() => setSelectedTab('hiragana')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'hiragana' && styles.tabTextActive,
            ]}
          >
            Hiragana
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'katakana' && styles.tabActive,
          ]}
          onPress={() => setSelectedTab('katakana')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'katakana' && styles.tabTextActive,
            ]}
          >
            Katakana
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.text}>
          {selectedTab === 'hiragana' ? 'Hiragana Content' : 'Katakana Content'}
        </Text>
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
    },
    text: {
      fontSize: 24,
      color: darkTheme.text,
    },
  });