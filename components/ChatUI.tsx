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

const CHAT_LOCAL_ENDPOINT = "http://192.168.0.109:8000/chat";

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
  userContext
}: ChatUIProps) {
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  const listRef = useRef<FlatList<any>>(null);
  const INPUT_BOTTOM_SPACE = 96; // keep last message fully visible above input
  const [inputText, setInputText] = useState("");
  const { theme } = useTheme();
  const currentTheme = theme === "light" ? lightTheme : darkTheme;

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

  // Ensure we snap to bottom whenever messages change
  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages]);

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
      // Pregătim istoricul pentru serverul tău
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
          system_instruction: systemInstruction, // Trimitem instrucțiunea definită în componentă
          history: historyToSend,
          user_context: userContext
        }),
      });

      const data = await response.json();
      const aiResponse = data.ai_response || "すみません (Eroare server)";

      const newAiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
      };
      setMessages((prev) => [...prev, newAiMessage]);

      // Salvează răspunsul AI în Firestore
      await addMessage(conversationId, "assistant", aiResponse);
    } catch (error) {
      console.error("Eroare Chat Local:", error);
      await addMessage(
        conversationId,
        "assistant",
        "Gomen nasai! Serverul nu răspunde.",
      );
    }
  }, [inputText, messages, conversationId, systemInstruction]);

  const renderMessage = ({ item }: { item: any }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.aiMessage,
        {
          backgroundColor: item.isUser
            ? currentTheme.secondary
            : currentTheme.surface,
        },
      ]}
    >
      <Text
        style={[
          styles.messageText,
          { color: item.isUser ? currentTheme.text : currentTheme.text },
        ]}
      >
        {item.text}
      </Text>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: currentTheme.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS == "ios" ? 90 : 0}
      >
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />

        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          style={{ flex: 1, paddingLeft: 10, paddingRight: 10 }}
          contentContainerStyle={{
            paddingTop: 10,
            paddingBottom: INPUT_BOTTOM_SPACE,
          }}
          showsVerticalScrollIndicator
          onContentSizeChange={() => {
            if (messages.length > 0) {
              listRef.current?.scrollToEnd({ animated: true });
            }
          }}
          //onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={<View style={{ height: 4 }} />}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.textInput,
              {
                color: currentTheme.text,
                backgroundColor: currentTheme.background,
                borderColor: currentTheme.text + "30",
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={currentTheme.text + "60"}
            multiline={true}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim()
                  ? currentTheme.accent
                  : currentTheme.surface,
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text
              style={[
                styles.sendButtonText,
                {
                  color: inputText.trim()
                    ? darkTheme.text
                    : currentTheme.secondaryText,
                },
              ]}
            >
              Send
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  messageContainer: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 10,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E5EA",
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
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
    fontWeight: "bold",
  },
});
