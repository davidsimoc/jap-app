import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar, TextInput, TouchableOpacity, ScrollView, FlatList, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { GoogleGenAI } from '@google/genai';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import Constants from 'expo-constants';
import { updateCurrentUser } from 'firebase/auth';
import { listenMessages, addMessage } from '@/services/firestoreChat';

// 1. Configurare API
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// 2. Inițializează clientul AI (cu verificare)
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const model = "gemini-2.5-flash-lite";

const systemInstruction = `You are a 'Virtual Sensei' specialized in N5 and N4 Japanese conversation practice.
  
  RULES:
  1. CONVERSATION: Respond primarily in **natural Japanese** to encourage practice.
  2. LANGUAGE SWITCH: **Switch to English (or Romanian)** ONLY when the user explicitly asks for a translation, grammar explanation, or correction (e.g., if they say 'Explain this', 'What does X mean?', or 'Vorbeste in Engleza/Romana').
  3. TONE: Keep the tone friendly, encouraging, and educational.
  4. LENGTH: Keep responses concise, focusing on the current topic.`
const initialMessages = [
    {
        id: 1,
        text: "こんにちは！私はあなたの日本語の先生です。何を練習したいですか？ (Kon'nichiwa! I am your Japanese teacher. What do you want to practice?)",
        isUser: false,
    },
];

type ChatUIProps = { userId: string; conversationId: string | null };

export default function ChatUI({ userId, conversationId }: ChatUIProps) {
    const [messages, setMessages] = useState(initialMessages);
    const listRef = useRef<FlatList<any>>(null);
    const INPUT_BOTTOM_SPACE = 96; // keep last message fully visible above input
    const [inputText, setInputText] = useState('');
    const { theme } = useTheme();
    const currentTheme = theme === 'light' ? lightTheme : darkTheme;

    // Subscribe to Firestore messages for the selected conversation
    useEffect(() => {
        if (!conversationId) return;
        const unsub = listenMessages(conversationId, (items) => {
            const mapped = items.map((m: any) => ({
                id: m.id,
                text: m.text,
                isUser: m.role === 'user',
            }));
            setMessages(mapped);
        });
        return unsub;
    }, [conversationId]);

    // Ensure we snap to bottom whenever messages change
    useEffect(() => {
        requestAnimationFrame(() => {
            listRef.current?.scrollToEnd({ animated: true });
        });
    }, [messages]);

    const handleSend = useCallback(async () => {
        if (!inputText.trim() || !ai) {
            console.log('Missing input or AI client:', { inputText: inputText.trim(), ai: !!ai });
            return;
        }
        if (!conversationId) {
            console.warn('No conversation selected');
            return;
        }

        const userMessage = { id: Date.now(), text: inputText, isUser: true };
        setInputText('');

        // Persist user message
        await addMessage(conversationId, 'user', userMessage.text);

        try {
            // Use direct API call instead of SDK
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

            // Build conversation history (use latest state + current user message)
            const conversationHistory = [...messages, userMessage].map(m => ({
                role: m.isUser ? "user" : "model",
                parts: [{ text: m.text }]
            })).slice(-10); // Keep last 10 messages

            const requestBody = {
                contents: conversationHistory,
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            };

            console.log('Sending direct API request:', requestBody);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            console.log('Direct API response:', data);

            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log('AI Response text:', aiResponse);

            const finalText = aiResponse || "Sumimasen! Couldn't process an answer. Try again.";
            // Persist model message
            await addMessage(conversationId, 'model', finalText);

        } catch (error) {
            console.error("Error when calling Gemini API:", error);
            await addMessage(conversationId, 'model', 'Gomen nasai! A communication error occured.');
        }
    }, [inputText, messages, ai, conversationId]);

    const renderMessage = ({ item }: { item: any }) => (
        <View style={[
            styles.messageContainer,
            item.isUser ? styles.userMessage : styles.aiMessage,
            {
                backgroundColor: item.isUser ? currentTheme.secondary : currentTheme.surface
            }
        ]}>
            <Text style={[
                styles.messageText,
                { color: item.isUser ? currentTheme.text : currentTheme.text }
            ]}>
                {item.text}
            </Text>
        </View>
    );

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView
                style={{ flex: 1, backgroundColor: currentTheme.background }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

                <FlatList
                    ref={listRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id.toString()}
                    style={{ flex: 1, padding: 10 }}
                    contentContainerStyle={{ paddingTop: 10, paddingBottom: INPUT_BOTTOM_SPACE }}
                    showsVerticalScrollIndicator
                    onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
                    ListFooterComponent={<View style={{ height: 4 }} />}
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={[
                            styles.textInput,
                            {
                                color: currentTheme.text,
                                backgroundColor: currentTheme.background,
                                borderColor: currentTheme.text + '30',
                            }
                        ]}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor={currentTheme.text + '60'}
                        multiline={true}
                        returnKeyType="send"
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            { backgroundColor: inputText.trim() ? currentTheme.accent : currentTheme.surface }
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Text style={[
                            styles.sendButtonText,
                            { color: inputText.trim() ? darkTheme.text : currentTheme.secondaryText}
                        ]}>Send</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    messageContainer: {
        marginVertical: 10,
        padding: 10,
        borderRadius: 10,
        maxWidth: '80%',
    },
    userMessage: {
        alignSelf: 'flex-end',
    },
    aiMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#E5E5EA',
    },
    messageText: {
        fontSize: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        fontSize: 16,
    },
    sendButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    sendButtonText: {
        fontWeight: 'bold',
    },
});