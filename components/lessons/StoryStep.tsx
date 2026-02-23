import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import { speakJapanese, stopSpeech } from '@/services/ttsService';

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
  const [isAudioFinished, setIsAudioFinished] = useState(false);
  const [isTextFinished, setIsTextFinished] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [minTimeReached, setMinTimeReached] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const isMounted = useRef(true);
  // Ensure at least some time passes before completion is possible
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMounted.current) setMinTimeReached(true);
    }, 2000); 
    return () => clearTimeout(timer);
  }, []);

  // ... (logic remains same)
  useEffect(() => {
    isMounted.current = true;
    if (!isAudioReady || !hasStarted) return;

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
        setIsTextFinished(true);
      }
    }, 85);

    return () => {
      clearInterval(interval);
    };
  }, [text, isAudioReady]);

  useEffect(() => {
    isMounted.current = true;
    
    const startAudio = async () => {
      setHasStarted(true);
      console.log(`[StoryStep] SPEAKING: "${text.slice(0, 30)}..."`);
      await speakJapanese(text, {
        onStart: () => {
          if (isMounted.current) setIsAudioReady(true);
        },
        onDone: () => {
          if (isMounted.current) setIsAudioFinished(true);
        },
        onError: () => {
          if (isMounted.current) {
            setIsAudioReady(true);
            setIsAudioFinished(true);
          }
        }
      });
    };

    startAudio();

    return () => {
      isMounted.current = false;
      stopSpeech();
    };
  }, [text]);

  useEffect(() => {
    if (hasStarted && isTextFinished && isAudioFinished && minTimeReached && !hasCompleted) {
      setHasCompleted(true);
      onComplete?.();
    }
  }, [isTextFinished, isAudioFinished, minTimeReached, hasStarted, hasCompleted]);

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
