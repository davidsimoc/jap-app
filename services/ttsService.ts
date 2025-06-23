// services/speechService.js
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

const JAPANESE_LANGUAGE_CODE = 'ja-JP';

// Funcție pentru a obține vocile japoneze disponibile
export const getJapaneseVoices = async () => {
  const availableVoices = await Speech.getAvailableVoicesAsync();
  // Filtrează vocile pentru a le returna doar pe cele japoneze
  return availableVoices.filter(voice => voice.language.startsWith('ja'));
};

// Funcție principală pentru a rosti un text
export const speakJapanese = async (text: string, options = {}) => {
  if (await Speech.isSpeakingAsync()) { 
    await Speech.stop();
  }

  const defaultOptions = {
    language: JAPANESE_LANGUAGE_CODE,
    ...options, 
  };

  try {
    await Speech.speak(text, defaultOptions);
    console.log(`[SpeechService] Started speaking: "${text}"`);
  } catch (error) {
    console.error("[SpeechService] Error speaking:", error);
  }
};

// Funcție pentru a opri orice vorbire curentă
export const stopSpeech = async () => {
  if (await Speech.isSpeakingAsync()) { 
    await Speech.stop();
    console.log("[SpeechService] Speech stopped.");
  }
};

// Funcție pentru a verifica dacă se vorbește în prezent
export const isSpeechActive = async () => {
  return await Speech.isSpeakingAsync(); 
};