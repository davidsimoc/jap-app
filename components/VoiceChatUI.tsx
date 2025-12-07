import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/components/ThemeContext";
import { speakJapanese, stopSpeech } from "@/services/ttsService"; // NOU: Importăm serviciul tău TTS
import { addMessage } from "@/services/firestoreChat";
import { lightTheme, darkTheme } from "@/constants/Colors";
import Voice, { SpeechResultsEvent } from "@react-native-voice/voice";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

type VoiceChatProps = {
  userId: string;
  conversationId: string | null;
  systemInstruction: string;
};

export default function VoiceChatUI({
  userId,
  conversationId,
  systemInstruction,
}: VoiceChatProps) {
  const { theme } = useTheme();
  const currentTheme = theme === "light" ? lightTheme : darkTheme;

  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [statusText, setStatusText] = useState("Tap to Speak");

  const [lastUserText, setLastUserText] = useState("");
  const [aiResponseText, setAiResponseText] = useState("");
  const [partialTranscribedText, setPartialTranscribedText] = useState("");

  const playAiResponse = useCallback((text: string) => {
    speakJapanese(text, {
      slow: false,
      onStart: () => setStatusText("Sensei is speaking..."),
      onDone: () => setStatusText("Tap to Speak"),
    });
  }, []);

  const startRecording = async () => {
    if (!conversationId || isThinking || isRecording) return;

    setLastUserText("");
    setAiResponseText("");
    setPartialTranscribedText("");

    try {
      await Voice.start("ja-JP");
      setIsRecording(true);
      setStatusText("Listening in Japanese...");
    } catch (error) {
      console.error("STT Start Error:", error);
      setStatusText("Error starting mic.");
      setIsRecording(false);
    }
  };

  const stopRecording = async (finalTranscript: string | null = null) => {
    if (!isRecording) return;

    try {
      await Voice.stop();
      setIsRecording(false);
      setPartialTranscribedText("");

      if (finalTranscript) {
        await handleAiInteraction(finalTranscript);
      } else {
        setStatusText("No speech detected. Tap to Speak.");
      }
    } catch (error) {
      console.error("STT Stop Error:", error);
      setStatusText("Error stopping mic.");
    }
  };

  const handleAiInteraction = async (userText: string) => {
    if (!userText || !conversationId) return;

    setIsThinking(true);
    setStatusText("Sensei is thinking...");
    setLastUserText(userText);

    await stopSpeech();

    await addMessage(conversationId, "user", userText);

    try {
      const conversationHistory = [
        { role: "user", parts: [{ text: userText }] },
      ];

      const requestBody = {
        contents: conversationHistory,
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        genetationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      const aiResponse =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "すみません、エラーが発生しました。";

      setAiResponseText(aiResponse);
      playAiResponse(aiResponse);

      await addMessage(conversationId, "model", aiResponse);
    } catch (error) {
      console.error("Error when calling Gemini API:", error);
      setAiResponseText("Gomen nasai! A communication error occured.");
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const results = e.value;
      if (results && results.length > 0) {
        const finalTranscript = results[0];
        stopRecording(finalTranscript);
      }
    };

    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        setPartialTranscribedText(e.value[0]);
      }
    };

    Voice.onSpeechError = (e: any) => {
      console.error("Speech Error:", e.error);
      setIsRecording(false);
      setStatusText("STT Error. Tap to Speak.");
    };

    Voice.onSpeechEnd = () => {
      if (isRecording) {
        stopRecording(null);
      }
    };

    return () => {
      stopSpeech();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [isRecording]);

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <Text style={[styles.statusText, { color: currentTheme.text }]}>
        {statusText}
      </Text>

      <View style={styles.messageDisplay}>
        {lastUserText ? (
          <Text
            style={[
              styles.message,
              styles.userMessage,
              {
                backgroundColor: currentTheme.secondary,
                color: currentTheme.text,
              },
            ]}
          >
            You: {lastUserText}
          </Text>
        ) : null}
        {aiResponseText ? (
          <Text
            style={[
              styles.message,
              styles.aiMessage,
              {
                backgroundColor: currentTheme.surface,
                color: currentTheme.text,
              },
            ]}
          >
            {aiResponseText}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={[
          styles.micButton,
          {
            backgroundColor:
              isRecording || isThinking
                ? currentTheme.accent
                : currentTheme.primary,
            borderColor: isRecording ? currentTheme.secondary : "transparent",
          },
        ]}
        onPressIn={startRecording}
        onPressOut={() => stopRecording()}
        disabled={isThinking}
        activeOpacity={0.7}
      >
        {isThinking ? (
          <ActivityIndicator size="large" color={currentTheme.background} />
        ) : (
          <Ionicons
            name={isRecording ? "mic" : "mic-outline"}
            size={64}
            color={currentTheme.background}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 20,
    height: 30,
  },
  messageDisplay: {
    fontSize: 20,
    padding: 15,
    borderRadius: 20,
    marginVertical: 10,
    maxWidth: "90%",
    textAlign: "center",
  },
  message: {
    fontSize: 20,
    padding: 15,
    borderRadius: 20,
    marginVertical: 10,
    maxWidth: "90%",
    textAlign: "center",
  },
  userMessage: {
    alignSelf: "center",
  },
  aiMessage: {
    alignSelf: "center",
  },
  micButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 50,
    borderWidth: 5,
  },
});
