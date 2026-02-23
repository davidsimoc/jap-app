import React, { useState, useEffect } from "react";
import { View, Text, Modal, FlatList, Pressable, TouchableOpacity, Image, StyleSheet } from "react-native";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import VoiceChatUI from "@/components/VoiceChatUI";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import SettingsModal from "@/components/SettingsModal";

const TEXT_INSTRUCTION = `
### MANDATORY RULES ###
1. LANGUAGE: Respond ONLY in Japanese (primary) and English (secondary/explanations).
2. FORBIDDEN: Never use Russian, Romanian, or any other language. 
3. ROLE: You are Yuki, a friendly Japanese friend.
4. BEHAVIOR: Be very talkative, expressive, and natural. Do not limit your words. Write long stories if you want!
`;

const VOICE_INSTRUCTION = `
### MANDATORY RULES ###
1. LANGUAGE: Respond ONLY in Japanese (primary) and English (secondary/explanations).
2. FORBIDDEN: Never use Russian, Romanian, or any other language. 
3. ROLE: You are Yuki, a friendly Japanese friend.
4. BEHAVIOR: Keep responses VERY SHORT (max 10-15 words). This is for a voice call, so be concise!
`;

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
  const insets = useSafeAreaInsets();
  const currentTheme = theme === "light" ? lightTheme : darkTheme;
  const auth = getAuth();
  //const uid = getAuth().currentUser?.uid;
  const db = getFirestore();
  const [userMemory, setUserMemory] = useState<string>("");

  const [currentUid, setCurrentUid] = useState<string | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    level: "N5",
    personality: "Friendly",
    translations: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentUid) return;
      const userRef = doc(db, "users", currentUid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        if (data.aiSettings) {
          setAiSettings(data.aiSettings);
        }
      }
    };
    fetchSettings();
  }, [currentUid, isSettingsOpen]);

  const getDynamicInstructions = (mode: "text" | "voice") => {
    const base = `
      ### ROLE ###
      You are Yuki, a ${aiSettings.personality} Japanese friend. 
      ### CONSTRAINTS ###
      1. User level: ${aiSettings.level}. Use vocabulary/Kanji ONLY for ${aiSettings.level}.
      2. ${aiSettings.translations ? "Provide English translations in ()." : "No English translations."}
      3. Respond ONLY in Japanese/English.
          `;
    const voiceExtra = "\n4. VOICE CALL: Keep response max 15 words.";
    const textExtra = "\n4. CHAT: Be expressive and write as much as you want.";

    return mode === "voice" ? base + voiceExtra : base + textExtra;
  };

  useEffect(() => {
    const fetchMemory = async () => {
      if (!currentUid) return;
      try {
        const userRef = doc(db, "users", currentUid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          const memoryArray = data.aiMemory || [];
          setUserMemory(memoryArray.join(". "));
        }
      } catch (e) {
        console.error("Error loading memory:", e);
      }
    };
    fetchMemory();
  }, [currentUid]);

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
    if (!currentUid) return;
    const unsub = listConversations(currentUid, (items) => {
      setConversations(items);
      setIsLoadingConversations(false);
    });
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
        "assistant",
        "こんにちは！私はあなたの日本語の先生です。何を練習したいですか？ (Kon'nichiwa! I am your Japanese teacher. What do you want to practice?)",
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

  useEffect(() => {
    if (!currentUid || isLoadingConversations) return;
    if (conversationId) return;

    if (conversations.length > 0) {
      setConversationId(conversations[0].id);
    } else {
      // create first chat automatically
      (async () => {
        await handleNewChat();
      })();
    }
  }, [currentUid, conversations, conversationId, isLoadingConversations]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: currentTheme.background }}
      edges={["top", "left", "right"]}
    >
      <View
        style={[
          styles.header,
          { borderBottomColor: currentTheme.text + "05" }
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.avatarContainer, { borderColor: currentTheme.primary + "20" }]}>
            <Image 
              source={require('../../assets/images/yuki_avatar.png')} 
              style={styles.headerAvatar}
              defaultSource={require('../../assets/images/profileImg.avif')}
            />
            <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Talk to Yuki</Text>
            <Text style={[styles.headerSubtitle, { color: currentTheme.text + "60" }]}>Online Partner</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => setIsVoiceMode((prev) => !prev)}
            style={[styles.actionBtn, { backgroundColor: currentTheme.surface }]}
          >
            <Ionicons
              name={isVoiceMode ? "chatbox-outline" : "mic-outline"}
              size={20}
              color={currentTheme.text}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowHistory(true)}
            style={[styles.actionBtn, { backgroundColor: currentTheme.surface }]}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={currentTheme.text}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setIsSettingsOpen(true)}
            style={[styles.actionBtn, { backgroundColor: currentTheme.surface }]}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={currentTheme.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {isVoiceMode ? (
        <VoiceChatUI
          userId={currentUid ?? ""}
          conversationId={conversationId}
          systemInstruction={getDynamicInstructions("voice")}
          userContext={userMemory}
        />
      ) : (
        <ChatUI
          systemInstruction={getDynamicInstructions("text")}
          userId={currentUid ?? ""}
          conversationId={conversationId}
          userContext={userMemory}
        />
      )}

      <SettingsModal
        visible={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userId={currentUid ?? ""}
      />

      <Modal
        visible={showHistory}
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
        statusBarTranslucent={true}
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: currentTheme.background }}
          edges={["left", "right", "bottom"]}
        >
          <View
            style={{ 
              paddingHorizontal: 20, 
              paddingTop: Math.max(insets.top, 20), 
              paddingBottom: 12 
            }}
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

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    padding: 2,
    position: 'relative',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  }
});
