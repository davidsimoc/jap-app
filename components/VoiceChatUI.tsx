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
import { addMessage, getMessages } from "@/services/firestoreChat";
import { lightTheme, darkTheme } from "@/constants/Colors";
//import Voice, { SpeechResultsEvent } from "@react-native-voice/voice";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
//const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;

const WHISPER_LOCAL_ENDPOINT = "http://192.168.0.126:8000/transcribe";

const CHAT_LOCAL_ENDPOINT = "http://192.168.0.126:8000/chat";

const sttApiCall = async (audioUri: string): Promise<string> => {
  const audioFileBase64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const requestBody = {
    audio_base64: audioFileBase64,
    language_code: "ja",
  };

  try {
    const response = await fetch(WHISPER_LOCAL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Whisper API HTTP Error:", response.status, errorText);
      throw new Error(`Whisper service failed with status ${response.status}`);
    }

    const data = await response.json();

    const transcription = data.transcript;

    if (transcription) {
      return transcription;
    } else {
      console.warn("STT API Warning: No transcription found.", data);
      return "すみません、音声が聞き取れませんでした。"; // Răspuns de eșec
    }
  } catch (error) {
    console.error("STT API Error:", error);
    return "STT API failed to connect.";
  }
};

type VoiceChatProps = {
  userId: string;
  conversationId: string | null;
  systemInstruction: string;
};

Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
});

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
  const recordingRef = useRef<Audio.Recording | null>(null); 
  const soundObjectRef = useRef<Audio.Sound | null>(null);

  const stopPollyAudio = async () => {
    if(soundObjectRef.current) {
        try {
            await soundObjectRef.current?.stopAsync();
            await soundObjectRef.current?.unloadAsync();
            soundObjectRef.current = null;
        } catch (error) {

        }
    }
    await stopSpeech();
  }

  const playAiResponse = useCallback(
    async (text: string, audioBase64: string | null) => {
      if (!audioBase64) {
        setStatusText("Polly failed. Using native TTS...");
        speakJapanese(text);
        return;
      }

      await stopPollyAudio();

      setStatusText("Sensei is speaking...");
      const soundObject = new Audio.Sound();
      soundObjectRef.current = soundObject;

      try {
        const fileName =
          FileSystem.cacheDirectory +
          "polly_audio_" +
          new Date().getTime() +
          ".mp3";
        await FileSystem.writeAsStringAsync(fileName, audioBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await soundObject.loadAsync({ uri: fileName });
        await soundObject.playAsync();

        soundObject.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setStatusText("Tap to Speak");
            soundObject.unloadAsync();
            FileSystem.deleteAsync(fileName, { idempotent: true });
            soundObjectRef.current = null;
          }
        });
      } catch (error) {
        console.error("Error playing Polly audio:", error);
        setStatusText("Error playing audio. (Fallback to native TTS)");
        speakJapanese(text);
      }
    },
    []
  );

  const startRecording = async () => {
    if (!conversationId || isThinking || isRecording) return;

    setLastUserText("");
    setAiResponseText("");

    await stopPollyAudio();

    try {
      await Audio.requestPermissionsAsync();
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await newRecording.startAsync();

      recordingRef.current = newRecording;
      setIsRecording(true);
      setStatusText("Listening in Japanese...");
    } catch (error) {
      console.error("STT Start Error:", error);
      setStatusText("Error starting mic.");
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    setIsRecording(false);
    setStatusText("Processing audio...");

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (uri) {
        const finalTranscript = await sttApiCall(uri);

        await handleAiInteraction(finalTranscript);
      }
    } catch (error) {
      console.error("Failed to stop recording or process audio", error);
      setStatusText("Error processing audio.");
    } finally {
      recordingRef.current = null;
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
      const historyData = await getMessages(conversationId, 8);

      const historyToSend = historyData.slice(0,-1).map(msg => ({
        role: msg.role,
        content: msg.text,
      }));

      const requestBody = {
        user_prompt: userText,
        system_instruction: systemInstruction,
        history: historyToSend,
      };

      const response = await fetch(CHAT_LOCAL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("LLM Chat API HTTP Error:", response.status, errorText);
        throw new Error(
          `LLM Chat service failed with status ${response.status}`
        );
      }

      const data = await response.json();
      const aiResponse =
        data.ai_response || "すみません、エラーが発生しました。(LLM Fail)";

      const audioBase64 = data.audio_base64;

      setAiResponseText(aiResponse);
      playAiResponse(aiResponse, audioBase64);

      await addMessage(conversationId, "model", aiResponse);
    } catch (error) {
      console.error("Error when calling Gemini API:", error);
      setAiResponseText("Gomen nasai! A communication error occured.");
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    return () => {
      stopSpeech();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

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
