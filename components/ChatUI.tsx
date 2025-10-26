import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar, TextInput, TouchableOpacity, ScrollView, FlatList, KeyboardAvoidingView } from 'react-native';
import { GoogleGenAI } from '@google/genai';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import Constants from 'expo-constants'; 

// 1. Configurare API
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY; 

// 2. Inițializează clientul AI (cu verificare)
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const model = "gemini-1.5-flash"; 

// 3. Instrucțiunile Sensei (Persona)
// În components/ChatUI.tsx

const systemInstruction = `You are a 'Virtual Sensei' specialized in N5 and N4 Japanese conversation practice.
  
  RULES:
  1. CONVERSATION: Respond primarily in **natural Japanese** to encourage practice.
  2. LANGUAGE SWITCH: **Switch to English (or Romanian)** ONLY when the user explicitly asks for a translation, grammar explanation, or correction (e.g., if they say 'Explain this', 'What does X mean?', or 'Vorbeste in Engleza/Romana').
  3. TONE: Keep the tone friendly, encouraging, and educational.
  4. LENGTH: Keep responses concise, focusing on the current topic.`
// 4. Mesajul inițial de întâmpinare
const initialMessages = [
    {
        id: 1,
        text: "こんにちは！私はあなたの日本語の先生です。何を練習したいですか？ (Kon'nichiwa! I am your Japanese teacher. What do you want to practice?)",
        isUser: false,
    },
];

export default function ChatUI() {
    const [messages, setMessages] = useState(initialMessages);
    const [inputText, setInputText] = useState('');
    const { theme } = useTheme();
    const currentTheme = theme === 'light' ? lightTheme : darkTheme;

    const handleSend = useCallback(async () => {
        if (!inputText.trim() || !ai) {
            console.log('Missing input or AI client:', { inputText: inputText.trim(), ai: !!ai });
            return;
        }

        const userMessage = {
            id: Date.now(),
            text: inputText,
            isUser: true,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');

        try {
            // Use direct API call instead of SDK
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
            
            // Build conversation history
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

            const newAiMessage = {
                id: Date.now() + 1,
                text: aiResponse || "Sumimasen! Couldn't process an answer. Try again.",
                isUser: false,
            };
            setMessages(prev => [...prev, newAiMessage]);

        } catch (error) {
            console.error("Error when calling Gemini API:", error);
            const errorMessage = {
                id: Date.now() + 1,
                text: "Gomen nasai! A communication error occured.",
                isUser: false,
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    }, [inputText, messages, ai]); 
    
    const renderMessage = ({ item }: { item: any }) => (
        <View style={[
            styles.messageContainer,
            item.isUser ? styles.userMessage : styles.aiMessage
        ]}>
            <Text style={[
                styles.messageText,
                { color: currentTheme.text }
            ]}>
                {item.text}
            </Text>
        </View>
    );

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1, backgroundColor: currentTheme.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
            <Text style={{ ...styles.title, color: currentTheme.text, alignSelf: 'center', marginTop: 10 }}>
                AI Language Partner
            </Text>
            
            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id.toString()}
                style={{ flex: 1, padding: 10 }}
                contentContainerStyle={{ paddingBottom: 10 }}
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
                    multiline={false}
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        { backgroundColor: inputText.trim() ? '#007AFF' : '#ccc' }
                    ]}
                    onPress={handleSend}
                    disabled={!inputText.trim()}
                >
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    messageContainer: {
        marginVertical: 5,
        padding: 10,
        borderRadius: 10,
        maxWidth: '80%',
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
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
        color: 'white',
        fontWeight: 'bold',
    },
});