import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Clipboard,
    Dimensions,
    ScrollView,
    Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, SlideInRight, Layout } from 'react-native-reanimated';
import { lightTheme, darkTheme } from '@/constants/Colors';
import { useTheme } from '@/components/ThemeContext';
import { speakJapanese, stopSpeech } from '@/services/ttsService';
import ARTranslator from '@/components/ARTranslator';

const { width } = Dimensions.get('window');
//const TRANSLATE_ENDPOINT = "http://192.168.0.126:8000/chat";
//const TRANSLATE_ENDPOINT = `${process.env.EXPO_PUBLIC_API_URL}/chat`;
const TRANSLATE_ENDPOINT = `${process.env.EXPO_PUBLIC_API_URL}/translate-only`;

export default function TranslatorScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const currentTheme = theme === 'light' ? lightTheme : darkTheme;
    const isDark = theme === 'dark';

    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const [sourceLang, setSourceLang] = useState('English');
    const [targetLang, setTargetLang] = useState('Japanese');
    const [isARMode, setIsARMode] = useState(false);

    const inputRef = useRef<TextInput>(null);

    useFocusEffect(
        useCallback(() => {
            return () => {
                setSourceText('');
                setTranslatedText('');
                stopSpeech();
                setIsSpeaking(false);
                setIsARMode(false);
            };
        }, [])
    );

    const selectLanguage = (type: 'source' | 'target') => {
        const languages = ['English', 'Romanian', 'Japanese'];

        Alert.alert(
            "Select Language",
            "Choose a language for translation",
            languages.map(lang => ({
                text: lang,
                onPress: () => {
                    if (type === 'source') {
                        if (lang === targetLang) {
                            setTargetLang(sourceLang);
                        }
                        setSourceLang(lang);
                    } else {
                        if (lang === sourceLang) {
                            setSourceLang(targetLang);
                        }
                        setTargetLang(lang);
                    }
                }
            })),
            { cancelable: true }
        );
    };

    const handleTranslate = async () => {
        if (!sourceText.trim()) return;

        setLoading(true);
        setTranslatedText('');

        try {
            const response = await fetch(TRANSLATE_ENDPOINT!, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    text: sourceText,
                    source_lang: sourceLang, 
                    target_lang: targetLang
                }),
            });

            if (!response.ok) throw new Error('Server error');

            const data = await response.json();
            if (data.translated_text) {
                setTranslatedText(data.translated_text.trim());
            }
        } catch (error) {
            console.error('Translation error:', error);
            setTranslatedText('Error: Server connection failed.');
        } finally {
            setLoading(false);
        }
    };

    const handlePlayAudio = async () => {
        if (!translatedText) return;

        if (isSpeaking) {
            await stopSpeech();
            setIsSpeaking(false);
            return;
        }

        await speakJapanese(translatedText, {
            onStart: () => setIsSpeaking(true),
            onDone: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
        });
    };

    const copyToClipboard = () => {
        if (translatedText) {
            Clipboard.setString(translatedText);
        }
    };

    const toggleDirection = () => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setSourceText(translatedText);
        setTranslatedText('');
    };

    if (isARMode) {
        return <ARTranslator onClose={() => setIsARMode(false)} />;
    }

    return (
        <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
            {/* Background Blur similar to other premium pages */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: currentTheme.background }]}>
                <View style={[styles.glow, { backgroundColor: currentTheme.primary + '08', top: -100, right: -100 }]} />
                <View style={[styles.glow, { backgroundColor: currentTheme.primary + '05', bottom: -50, left: -50 }]} />
            </View>

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.push('/kanji/kana')}>
                    <Ionicons name="chevron-back" size={28} color={currentTheme.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerSubtitle, { color: currentTheme.text + '50' }]}>TRANSLATE NOW</Text>
                    <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Translator</Text>
                </View>
                <View style={{ flex: 1 }} />
                <TouchableOpacity 
                    style={[styles.arToggleButton, { backgroundColor: currentTheme.primary + '15' }]} 
                    onPress={() => setIsARMode(true)}
                >
                    <Ionicons name="scan-outline" size={24} color={currentTheme.primary} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Language Switcher */}
                    <View style={[styles.languageBar, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '08' }]}>
                        {/* Limba Sursă */}
                        <TouchableOpacity
                            style={styles.languageSelectBtn}
                            onPress={() => selectLanguage('source')}
                        >
                            <Text style={[styles.langText, { color: currentTheme.text }]}>
                                {sourceLang}
                            </Text>
                        </TouchableOpacity>

                        {/* Butonul de Swap */}
                        <TouchableOpacity
                            onPress={toggleDirection}
                            style={[styles.swapBtn, { backgroundColor: currentTheme.primary }]}
                        >
                            <Ionicons name="swap-horizontal" size={20} color="#fff" />
                        </TouchableOpacity>

                        {/* Limba Țintă */}
                        <TouchableOpacity
                            style={styles.languageSelectBtn}
                            onPress={() => selectLanguage('target')}
                        >
                            <Text style={[styles.langText, { color: currentTheme.text }]}>
                                {targetLang}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Input Area */}
                    <View style={[styles.card, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '08' }]}>
                        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                            <TextInput
                                ref={inputRef}
                                style={[styles.textInput, { color: currentTheme.text }]}
                                placeholder={sourceLang === 'Japanese' ? "翻訳したい文章を入力..." : "Enter text to translate..."}
                                placeholderTextColor={currentTheme.text + '20'}
                                multiline
                                value={sourceText}
                                onChangeText={setSourceText}
                                returnKeyType="done"
                                blurOnSubmit={true}
                                scrollEnabled={false}
                            />
                        </ScrollView>
                        {sourceText.length > 0 && (
                            <TouchableOpacity onPress={() => setSourceText('')} style={styles.clearBtn}>
                                <Ionicons name="close-circle" size={20} color={currentTheme.text + '15'} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Translate Button */}
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: currentTheme.primary }]}
                        onPress={handleTranslate}
                        disabled={loading || !sourceText.trim()}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Text style={styles.actionBtnText}>Translate</Text>
                                <Ionicons name="sparkles" size={16} color="#fff" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Result Area */}
                    <Animated.View layout={Layout.springify()}>
                        {(translatedText || loading) && (
                            <View style={[styles.resultCard, { backgroundColor: currentTheme.primary + '05', borderColor: currentTheme.primary + '15' }]}>
                                {loading ? (
                                    <View style={{ flex: 1, justifyContent: 'center' }}>
                                        <ActivityIndicator color={currentTheme.primary} size="small" />
                                    </View>
                                ) : (
                                    <>
                                        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                                            <Text style={[styles.resultText, { color: currentTheme.text }]}>
                                                {translatedText}
                                            </Text>
                                        </ScrollView>
                                        <View style={styles.resultActions}>
                                            <TouchableOpacity onPress={handlePlayAudio} style={[styles.actionIconBtn, { backgroundColor: isSpeaking ? currentTheme.primary + '20' : 'rgba(255,255,255,0.05)' }]}>
                                                <Ionicons
                                                    name={isSpeaking ? "stop-circle" : "volume-medium"}
                                                    size={22}
                                                    color={isSpeaking ? currentTheme.primary : currentTheme.text}
                                                />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn}>
                                                <Ionicons name="copy-outline" size={16} color={currentTheme.primary} />
                                                <Text style={[styles.copyText, { color: currentTheme.primary }]}>Copy Result</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        zIndex: 10,
    },
    backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerTitleContainer: { marginLeft: 10 },
    headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
    headerSubtitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
    scrollContent: { padding: 20, paddingTop: 10 },
    languageBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        paddingHorizontal: 8,
        borderRadius: 32,
        marginBottom: 25,
        borderWidth: 1,
        width: '100%',
    },
    languageSelectBtn: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    langText: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'capitalize'
    },
    swapBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    card: {
        borderRadius: 20,
        borderWidth: 1,
        height: 220,
        padding: 20,
        marginBottom: 20,
    },
    textInput: {
        fontSize: 16,
        lineHeight: 24,
        textAlignVertical: 'top',
        fontWeight: '600',
    },
    clearBtn: { position: 'absolute', right: 15, top: 15 },
    actionBtn: {
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    actionBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    resultCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        height: 220,
    },
    resultText: { fontSize: 18, fontWeight: '700', lineHeight: 28 },
    resultActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 15,
        gap: 12,
    },
    actionIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        gap: 8,
    },
    copyText: { fontSize: 13, fontWeight: '800' },
    glow: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.5 },
    arToggleButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});
