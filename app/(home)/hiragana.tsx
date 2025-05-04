
import {View, Text, StyleSheet} from 'react-native';
import { lightTheme } from '../../constants/Colors';

export default function HiraganaScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Hiragana</Text>
        </View>
    )
}

export const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: lightTheme.background },
    text: {
        fontSize: 24,
    },
});