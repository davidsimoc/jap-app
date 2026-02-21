import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';

const { width } = Dimensions.get('window');

type Props = {
  text: string;
  onComplete?: () => void;
};

export default function StoryStep({ text, onComplete }: Props) {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const [displayedText, setDisplayedText] = useState('');
  const [isAudioReady, setIsAudioReady] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isMounted = useRef(true);

  // ... (logic remains same)
  useEffect(() => {
    isMounted.current = true;
    if (!isAudioReady) return;

    let index = 0;
    setDisplayedText('');
    
    const interval = setInterval(() => {
      if (!isMounted.current) {
        clearInterval(interval);
        return;
      }
      
      setDisplayedText(text.slice(0, index + 1));
      index++;
      
      if (index >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 70);

    return () => {
      clearInterval(interval);
    };
  }, [text, isAudioReady]);

  useEffect(() => {
    isMounted.current = true;
    let localSound: Audio.Sound | null = null;

    const speakText = async () => {
      try {
        const response = await fetch("http://192.168.0.112:8000/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_prompt: `Citește exact acest text: ${text}`,
            system_instruction: "Citește textul exact așa cum este trimis. Fără comentarii adiționale. Your name is Yuki.",
            history: []
          }),
        });
        const data = await response.json();
        
        if (!isMounted.current) return;

        if (data.audio_base64) {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: `data:audio/mp3;base64,${data.audio_base64}` },
            { shouldPlay: true }
          );
          
          if (!isMounted.current) {
            newSound.unloadAsync().catch(() => {});
            return;
          }

          localSound = newSound;
          soundRef.current = newSound;
          setIsAudioReady(true);
        } else {
          setIsAudioReady(true);
        }
      } catch (e) {
        console.error("StoryStep TTS Error:", e);
        if (isMounted.current) setIsAudioReady(true);
      }
    };

    speakText();

    return () => {
      isMounted.current = false;
      const cleanup = async () => {
        try {
          if (soundRef.current) {
            await soundRef.current.stopAsync().catch(() => {});
            await soundRef.current.unloadAsync().catch(() => {});
          }
          if (localSound) {
            await localSound.stopAsync().catch(() => {});
            await localSound.unloadAsync().catch(() => {});
          }
        } catch (e) {
          // Suppress errors
        }
      };
      cleanup();
    };
  }, [text]);

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '10' }]}>
        <Text style={[styles.text, { color: currentTheme.text }]}>{displayedText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  bubble: {
    padding: 28,
    borderRadius: 30,
    width: width * 0.88,
    minHeight: 180,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  text: {
    fontSize: 20,
    lineHeight: 32,
    fontWeight: '500',
    textAlign: 'center',
  }
});
