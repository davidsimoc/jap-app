// services/ttsService.ts
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

const JAPANESE_LANGUAGE_CODE = 'ja-JP';

// In-memory cache pentru voci și preferințe
let cachedVoices: Speech.Voice[] | null = null;
let preferredVoiceId: string | null = null;

// Heuristici pentru a alege o voce japoneză "bună"
const preferredJapaneseVoiceNames = [
  // iOS
  'Kyoko', 'Otoya',
  // Android/Web pot avea denumiri diferite, păstrăm fallback generice
  'ja-JP', 'Japanese'
];

type SpeakOptions = {
  slow?: boolean;
  rate?: number;
  pitch?: number;
  voiceId?: string;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: unknown) => void;
};

// Preîncarcă și cache-uiește lista de voci
export const preloadVoices = async () => {
  try {
    cachedVoices = await Speech.getAvailableVoicesAsync();
  } catch (error) {
    cachedVoices = null;
    console.error('[SpeechService] Failed to load voices', error);
  }
  return cachedVoices ?? [];
};

// Returnează lista de voci (din cache sau o încarcă la nevoie)
const getAllVoices = async (): Promise<Speech.Voice[]> => {
  if (cachedVoices) return cachedVoices;
  return await preloadVoices();
};

// Filtrează voci japoneze disponibile
export const getJapaneseVoices = async (): Promise<Speech.Voice[]> => {
  const availableVoices = await getAllVoices();
  return availableVoices.filter((voice) =>
    (voice as unknown as { language?: string }).language?.startsWith('ja')
  );
};

export const setPreferredVoiceId = (voiceId: string | null) => {
  preferredVoiceId = voiceId;
};

export const getPreferredVoiceId = () => preferredVoiceId;

// Alege cea mai potrivită voce japoneză în funcție de platformă și preferințe
export const selectBestJapaneseVoice = async (): Promise<string | null> => {
  const jpVoices = await getJapaneseVoices();
  if (jpVoices.length === 0) return null;

  // Respectă preferința utilizatorului dacă există și este validă
  if (preferredVoiceId && jpVoices.some((v) => v.identifier === preferredVoiceId)) {
    return preferredVoiceId;
  }

  // Heuristică după nume
  for (const name of preferredJapaneseVoiceNames) {
    const match = jpVoices.find((v) =>
      (v.name?.includes(name) || v.identifier?.includes(name))
    );
    if (match) return match.identifier;
  }

  // Fallback: prima voce japoneză disponibilă
  return jpVoices[0]?.identifier ?? null;
};

// Vorbește text japonez cu opțiuni și fallback-uri sănătoase
export const speakJapanese = async (text: string, options: SpeakOptions = {}) => {
  if (!text || text.trim().length === 0) return;

  // Evită suprapunerile: oprește orice vorbire în curs
  if (await Speech.isSpeakingAsync()) {
    await Speech.stop();
  }

  const {
    slow,
    rate,
    pitch,
    voiceId,
    onStart,
    onDone,
    onError,
  } = options;

  // Rate/pitch implicite: puțin mai lent pentru începători
  // Mai lent pentru slow ca diferența să fie evidentă
  const resolvedRate = typeof rate === 'number' ? rate : (slow ? 0.65 : 0.95);
  const resolvedPitch = typeof pitch === 'number' ? pitch : 1.0;

  // Alege vocea: preferată → cea mai bună jp → niciuna (doar limbă)
  let resolvedVoiceId = voiceId ?? preferredVoiceId ?? null;
  if (!resolvedVoiceId) {
    resolvedVoiceId = await selectBestJapaneseVoice();
  }

  try {
    Speech.speak(text, {
      language: JAPANESE_LANGUAGE_CODE,
      rate: resolvedRate,
      pitch: resolvedPitch,
      voice: resolvedVoiceId ?? undefined,
      onStart,
      onDone,
      onStopped: onDone,
      onError: (e: unknown) => {
        console.error('[SpeechService] Error speaking:', e);
        if (onError) onError(e);
      },
    });
    // Memorizează vocea aleasă pentru sesiunea curentă
    if (resolvedVoiceId) preferredVoiceId = resolvedVoiceId;
    // Log simplu
    // eslint-disable-next-line no-console
    console.log(`[SpeechService] Speaking (rate=${resolvedRate}, pitch=${resolvedPitch}, voice=${resolvedVoiceId ?? 'auto'})`);
  } catch (error) {
    console.error('[SpeechService] Error invoking speak:', error);
    if (onError) onError(error);
  }
};

// Oprește orice vorbire curentă
export const stopSpeech = async () => {
  if (await Speech.isSpeakingAsync()) {
    await Speech.stop();
    // eslint-disable-next-line no-console
    console.log('[SpeechService] Speech stopped.');
  }
};

// Verifică dacă se vorbește în prezent
export const isSpeechActive = async () => {
  return await Speech.isSpeakingAsync();
};