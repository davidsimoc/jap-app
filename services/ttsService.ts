// services/ttsService.ts
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

// Server configuration
const CHAT_URL = "http://192.168.0.111:8000/chat";
const TTS_URL = "http://192.168.0.111:8000/tts";

// In-memory reference for the current sound
let currentSound: Audio.Sound | null = null;
const CACHE_DIR = `${FileSystem.cacheDirectory}tts_cache/`;

// Track active fetches to avoid redundant/conflicting downloads
const activeFetches = new Map<string, Promise<void>>();

const ensureCacheDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
};

const getCachePath = async (text: string) => {
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
  return `${CACHE_DIR}${hash}.mp3`;
};

type SpeakOptions = {
  slow?: boolean;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: unknown) => void;
};

/**
 * Downloads audio if not already in cache or being fetched
 */
const downloadToCache = async (text: string, path: string) => {
  const fileInfo = await FileSystem.getInfoAsync(path);
  if (fileInfo.exists) return;

  // If already fetching this text, wait for it
  if (activeFetches.has(text)) {
    return activeFetches.get(text);
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TTS] Server error (${response.status}):`, errorText);
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data && data.audio_base64) {
        await FileSystem.writeAsStringAsync(path, data.audio_base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        console.error('[TTS] Server returned invalid data:', data);
        throw new Error("No audio_base64 in server response");
      }
    } finally {
      activeFetches.delete(text);
    }
  })();

  activeFetches.set(text, fetchPromise);
  return fetchPromise;
};

export const prefetchAudio = async (texts: string[]) => {
  try {
    await ensureCacheDir();
    await Promise.all(texts.map(async (text) => {
      if (!text || text.trim().length === 0) return;
      const path = await getCachePath(text);
      await downloadToCache(text, path);
    }));
  } catch (error) {
    console.error('[TTS] Prefetch error:', error);
  }
};

export const speakJapanese = async (text: string, options: SpeakOptions = {}) => {
  if (!text || text.trim().length === 0) return;

  await ensureCacheDir();
  const { slow, onStart, onDone, onError } = options;

  try {
    // Stop any current sound
    if (currentSound) {
      await currentSound.stopAsync().catch(() => { });
      await currentSound.unloadAsync().catch(() => { });
      currentSound = null;
    }

    const path = await getCachePath(text);

    // Ensure file is downloaded before proceed to onStart/playback
    await downloadToCache(text, path);

    // NOW call onStart - we are ready to play
    onStart?.();

    const { sound } = await Audio.Sound.createAsync(
      { uri: path },
      { shouldPlay: false }
    );

    currentSound = sound;

    if (slow) {
      await sound.setRateAsync(0.7, true);
    }

    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        onDone?.();
      }
    });
  } catch (error) {
    console.error('[TTS] Speak error:', error);
    onError?.(error);
  }
};

export const stopSpeech = async () => {
  if (currentSound) {
    await currentSound.stopAsync().catch(() => { });
    await currentSound.unloadAsync().catch(() => { });
    currentSound = null;
  }
};

export const clearSpeechCache = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      await ensureCacheDir();
      console.log('[TTS] Cache cleared successfully');
    }
  } catch (error) {
    console.error('[TTS] Clear cache error:', error);
  }
};

export const isSpeechActive = async () => {
  if (currentSound) {
    const status = await currentSound.getStatusAsync();
    return status.isLoaded && status.isPlaying;
  }
  return false;
};