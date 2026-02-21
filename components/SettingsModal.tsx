import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { lightTheme, darkTheme } from "@/constants/Colors";
import { useTheme } from "@/components/ThemeContext";

type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
  userId: string;
};

export default function SettingsModal({
  visible,
  onClose,
  userId,
}: SettingsModalProps) {
  const { theme } = useTheme();
  const currentTheme = theme === "light" ? lightTheme : darkTheme;
  const db = getFirestore();

  const [level, setLevel] = useState("N5");
  const [personality, setPersonality] = useState("Friendly");
  const [showTranslations, setShowTranslations] = useState(true);

  useEffect(() => {
    if (visible && userId) {
      const fetchSettings = async () => {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().aiSettings) {
          const settings = snap.data().aiSettings;
          setLevel(settings.level || "N5");
          setPersonality(settings.personality || "Friendly");
          setShowTranslations(settings.translations ?? true);
        }
      };
      fetchSettings();
    }
  }, [visible]);

  const saveSettings = async () => {
    const userRef = doc(db, "users", userId);
    try {
      await setDoc(
        userRef,
        {
          aiSettings: {
            level: level, // ex: "N5"
            personality: personality, // ex: "Friendly"
            translations: showTranslations, // boolean
          },
        },
        { merge: true },
      );
      onClose();
    } catch (error) {
      console.error("Eroare la salvarea setărilor:", error);
    }
  };

  const LevelButton = ({ title }: { title: string }) => (
    <TouchableOpacity
      style={[
        styles.optionBtn,
        level === title && { backgroundColor: currentTheme.accent },
      ]}
      onPress={() => setLevel(title)}
    >
      <Text style={{ color: level === title ? "#fff" : currentTheme.text }}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: currentTheme.surface },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: currentTheme.text }]}>
              AI Customization
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={currentTheme.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            Japanese Level
          </Text>
          <View style={styles.row}>
            {["N5", "N4", "N3", "N2", "N1"].map((l) => (
              <LevelButton key={l} title={l} />
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            Yuki's Personality
          </Text>
          <View style={styles.row}>
            {["Friendly", "Strict", "Shy"].map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.optionBtn,
                  personality === p && { backgroundColor: currentTheme.accent },
                ]}
                onPress={() => setPersonality(p)}
              >
                <Text
                  style={{
                    color: personality === p ? "#fff" : currentTheme.text,
                  }}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.row, styles.switchRow]}>
            <Text style={{ color: currentTheme.text, fontSize: 16 }}>
              Show Translations
            </Text>
            <Switch
              value={showTranslations}
              onValueChange={setShowTranslations}
              trackColor={{ false: "#767577", true: currentTheme.accent }}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: currentTheme.primary }]}
            onPress={saveSettings}
          >
            <Text style={styles.saveBtnText}>Save & Update Yuki</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { width: "90%", borderRadius: 20, padding: 20, elevation: 5 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: "bold" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 10,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  optionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  switchRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  saveBtn: {
    marginTop: 30,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
