import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { GiftedChat, IMessage, InputToolbar, InputToolbarProps } from 'react-native-gifted-chat';
import { GoogleGenAI } from '@google/genai';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import Constants from 'expo-constants'; // Pentru a accesa variabila de mediu
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatUI from '@/components/ChatUI'; 

const GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY ||
    process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const model = "gemini-2.5-flash";

const systemInstruction = "You are a 'Virtual Sensei' specialized in Japanese conversation practice, using N5 and N4 vocabulary. Respond only in Japanese, but if the user asks, you can provide the translation or explanations in English. Keep the conversation short, friendly, and focused on learning."

const initialMessages: IMessage[] = [
    {
        _id: 1,
        text: "こんにちは！私はあなたの日本語の先生です。何を練習したいですか？ (Kon'nichiwa! I am your Japanese teacher. What do you want to practice?)",
        createdAt: new Date(),
        user: {
            _id: 2, // ID-ul AI-ului (Sensei-ului)
            name: 'Sensei AI',
            // Poți adăuga un avatar dacă vrei
        },
    },
];

export default function ChatbotScreen() {
    const { theme } = useTheme();
    const currentTheme = theme === 'light' ? lightTheme : darkTheme;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }}>
            <ChatUI /> 
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
});