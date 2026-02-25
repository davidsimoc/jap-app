import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { GoogleGenAI } from "@google/genai";
import { useTheme } from "@/components/ThemeContext";
import { lightTheme, darkTheme } from "@/constants/Colors";
import Constants from "expo-constants";
import { updateCurrentUser } from "firebase/auth";
import { listenMessages, addMessage } from "@/services/firestoreChat";
import { arrayUnion, getFirestore, doc, updateDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp, Layout, FadeIn } from "react-native-reanimated";

const CHAT_LOCAL_ENDPOINT = "http://192.168.0.111:8000/chat";

const initialMessages: MessageType[] = [
  {
    id: "initial-1",
    text: "こんにちは！私はあなたの日本語の先生です。何を練習したいですか？ (Kon'nichiwa! I am your Japanese teacher. What do you want to practice?)",
    isUser: false,
  },
];

type ChatUIProps = {
  userId: string;
  conversationId: string | null;
  systemInstruction: string;
  userContext: string;
};

type MessageType = {
  id: string;
  text: string;
  isUser: boolean;
};

export default function ChatUI({
  userId,
  conversationId,
  systemInstruction,
  userContext,
}: ChatUIProps) {
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  const listRef = useRef<FlatList<any>>(null);
  const INPUT_BOTTOM_SPACE = 95;
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { theme } = useTheme();
  const currentTheme = theme === "light" ? lightTheme : darkTheme;

  const db = getFirestore();

  // Subscribe to Firestore messages for the selected conversation
  useEffect(() => {
    if (!conversationId) return;
    const unsub = listenMessages(conversationId, (items) => {
      const mapped = items.map((m: any) => ({
        id: m.id,
        text: m.text,
        isUser: m.role === "user",
      }));
      setMessages(mapped);
    });
    return unsub;
  }, [conversationId]);


  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;
    if (!conversationId) return;

    const userMessageText = inputText;
    const tempId = Date.now().toString();

    const newUserMessage = { id: tempId, text: userMessageText, isUser: true };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputText("");

    try {
      await addMessage(conversationId, "user", userMessageText);
      setIsTyping(true);

      const historyToSend = messages
        .map((m) => ({
          role: m.isUser ? "user" : "assistant",
          content: m.text,
        }))
        .slice(-10);

      const response = await fetch(CHAT_LOCAL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_prompt: userMessageText,
          system_instruction: systemInstruction,
          history: historyToSend,
          user_context: userContext,
        }),
      });

      const data = await response.json();
      if (data.new_fact) {
        const userRef = doc(db, "users", userId);
        try {
          await updateDoc(userRef, {
            aiMemory: arrayUnion(data.new_fact),
          });
        } catch (e) {
          console.error("Error updating user memory:", e);
        }
      }

      const aiResponse = data.ai_response || "すみません (Eroare server)";

      const newAiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
      };

      setMessages((prev) => [...prev, newAiMessage]);
      await addMessage(conversationId, "assistant", aiResponse);
      setIsTyping(false);
    } catch (error) {
      console.error("Eroare Chat Local:", error);
      setIsTyping(false);
      await addMessage(
        conversationId,
        "assistant",
        "Gomen nasai! Serverul nu răspunde.",
      );
    }
  }, [inputText, messages, conversationId, systemInstruction]);

  const renderMessage = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInUp.springify().mass(0.4).damping(18).delay(index < 10 ? index * 50 : 0)}
      layout={Layout.springify().damping(20)}
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <View
        style={[
          styles.bubble,
          item.isUser
            ? { backgroundColor: currentTheme.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: currentTheme.surface, borderBottomLeftRadius: 4, borderColor: currentTheme.text + '08', borderWidth: 1 }
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: item.isUser ? '#fff' : currentTheme.text },
          ]}
        >
          {item.text}
        </Text>
      </View>
      <Text style={[styles.timestamp, { color: currentTheme.text + '30' }]}>
        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: currentTheme.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS == "ios" ? 0 : 0}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Subtle Journal Background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: currentTheme.background, zIndex: -1 }]}>
        {theme === 'light' && (
          <View style={styles.gridContainer}>
            {Array.from({ length: 40 }).map((_, i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingTop: 10,
          paddingBottom: INPUT_BOTTOM_SPACE,
        }}
        showsVerticalScrollIndicator={true}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          if (messages.length > 0 || isTyping) {
            listRef.current?.scrollToEnd({ animated: true });
          }
        }}
        ListFooterComponent={
          isTyping ? (
            <Animated.View
              entering={FadeIn.duration(400)}
              style={[styles.messageContainer, styles.aiMessage, { marginLeft: 10 }]}
            >
              <View style={[styles.bubble, { backgroundColor: currentTheme.surface, paddingVertical: 8 }]}>
                <Text style={{ color: currentTheme.text + '40', fontStyle: 'italic', fontSize: 13 }}>
                  Yuki is typing...
                </Text>
              </View>
            </Animated.View>
          ) : <View style={{ height: 10 }} />
        }
      />

      <View style={[styles.inputWrapper, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.inputContainer, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + "10" }]}>
          <TextInput
            style={[
              styles.textInput,
              { color: currentTheme.text },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={currentTheme.text + "40"}
            multiline={true}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim()
                  ? currentTheme.primary
                  : currentTheme.text + "05",
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() ? "#fff" : currentTheme.text + "30"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 6,
    maxWidth: "85%",
  },
  userMessage: {
    alignSelf: "flex-end",
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignSelf: "flex-start",
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  inputWrapper: {
    paddingHorizontal: 15,
    paddingBottom: Platform.OS === 'ios' ? 90 : 85,
    paddingTop: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 30,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    bottom: 20
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    fontWeight: '600',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },
  gridLine: {
    height: 30,
    borderBottomWidth: 1,
    borderColor: '#000',
    width: '100%',
  }
});
