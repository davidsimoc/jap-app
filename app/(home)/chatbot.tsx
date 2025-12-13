import React, { useState, useEffect } from "react";
import { View, Text, Modal, FlatList, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  GiftedChat,
  IMessage,
  InputToolbar,
  InputToolbarProps,
} from "react-native-gifted-chat";
import { GoogleGenAI } from "@google/genai";
import { useTheme } from "@/components/ThemeContext";
import { lightTheme, darkTheme } from "@/constants/Colors";
import Constants from "expo-constants"; // Pentru a accesa variabila de mediu
import ChatUI from "@/components/ChatUI";
import { getAuth } from "firebase/auth";
import {
  listConversations,
  createConversation,
  addMessage,
  deleteConversation,
} from "@/services/firestoreChat";
import { SafeAreaView } from "react-native-safe-area-context";
import VoiceChatUI from "@/components/VoiceChatUI";

const systemInstruction =
  "You are an engaging and fluent native Japanese speaker acting as a casual N5/N4 conversation partner. Your primary goal is to **ACKNOWLEDGE AND RESPOND IMMEDIATELY** to the user's last statement, maintaining a natural Japanese dialogue. NEVER explain the user's input or teach grammar unless they EXPLICITLY ask: 'What does X mean?' or 'Translate this'. Proactively suggest new topics. Respond ONLY in Japanese. Keep responses concise (under 60 tokens).";
  
const initialMessages: IMessage[] = [
  {
    _id: 1,
    text: "こんにちは！私はあなたの日本語の先生です。何を練習したいですか？ (Kon'nichiwa! I am your Japanese teacher. What do you want to practice?)",
    createdAt: new Date(),
    user: {
      _id: 2, // ID-ul AI-ului (Sensei-ului)
      name: "Sensei AI",
      // Poți adăuga un avatar dacă vrei
    },
  },
];

export default function ChatbotScreen() {
  const { theme } = useTheme();
  const currentTheme = theme === "light" ? lightTheme : darkTheme;
  const auth = getAuth();
  //const uid = getAuth().currentUser?.uid;

  const [currentUid, setCurrentUid] = useState<string | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [isVoiceMode, setIsVoiceMode] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUid(user.uid); 
      } else {
        setCurrentUid(null); 
      }
    });

    return unsubscribe; 
  }, []);

  useEffect(() => {
    if (!currentUid) {
      console.warn("User not authenticated - cannot load conversations");
      return;
    }
    const unsub = listConversations(currentUid, setConversations);
    return unsub;
  }, [currentUid]);

  const handleNewChat = async () => {
    if (!currentUid) {
      console.warn("Cannot create conversation - user not authenticated");
      return;
    }
    const id = await createConversation(currentUid, "New chat");
    setConversationId(id);
    setShowHistory(false);
    // Seed with greeting so the chat isn't empty
    try {
      await addMessage(
        id,
        "model",
        "こんにちは！私はあなたの日本語の先生です。何を練習したいですか？ (Kon'nichiwa! I am your Japanese teacher. What do you want to practice?)"
      );
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConversation(id);
      if (conversationId === id) {
        setConversationId(null);
      }
    } catch (e) {
      // no-op
    }
  };

  // Auto-select latest conversation or create one on first open
  useEffect(() => {
    if (!currentUid) return;
    if (conversationId) return;
    if (conversations.length > 0) {
      setConversationId(conversations[0].id);
    } else {
      // create first chat automatically
      (async () => {
        await handleNewChat();
      })();
    }
  }, [currentUid, conversations, conversationId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          padding: 12,
        }}
      >
        <Text
          style={{ fontSize: 18, fontWeight: "600", color: currentTheme.text }}
        >
          AI Language Partner
        </Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Pressable onPress={() => setIsVoiceMode((prev) => !prev)}>
            <Ionicons
              name={isVoiceMode ? "chatbox-outline" : "mic-outline"}
              size={24}
              color={currentTheme.text}
            />
          </Pressable>

          <Pressable onPress={() => setShowHistory(true)}>
            <Text style={{ fontSize: 16, color: currentTheme.text }}>
              History
            </Text>
          </Pressable>
        </View>
      </View>

      {isVoiceMode ? (
        <VoiceChatUI
          userId={currentUid ?? ""}
          conversationId={conversationId}
          systemInstruction={systemInstruction}
        />
      ) : (
        <ChatUI userId={currentUid ?? ""} conversationId={conversationId} />
      )}

      <Modal
        visible={showHistory}
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: currentTheme.background }}
        >
          <View
            style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: currentTheme.text,
                }}
              >
                Conversations
              </Text>
              <Pressable
                onPress={() => setShowHistory(false)}
                style={{ paddingHorizontal: 8, paddingVertical: 4 }}
              >
                <Text style={{ fontSize: 16, color: currentTheme.text }}>
                  Close
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleNewChat}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderWidth: 1,
                borderRadius: 10,
                marginBottom: 16,
                borderColor: currentTheme.text + "40",
                backgroundColor:
                  currentTheme.surface || currentTheme.background,
              }}
            >
              <Text style={{ color: currentTheme.text, fontSize: 16 }}>
                + New chat
              </Text>
            </Pressable>
          </View>

          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 16,
                  paddingHorizontal: 4,
                  borderBottomWidth: 0.5,
                  borderBottomColor: currentTheme.text + "20",
                }}
              >
                <Pressable
                  onPress={() => {
                    setConversationId(item.id);
                    setShowHistory(false);
                  }}
                  style={{ flex: 1, paddingRight: 12 }}
                >
                  <Text
                    style={{
                      fontWeight: "600",
                      color: currentTheme.text,
                      fontSize: 16,
                    }}
                  >
                    {item.title || "Untitled chat"}
                  </Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={currentTheme.text}
                  />
                </Pressable>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
