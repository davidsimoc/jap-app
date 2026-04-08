import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useTextRecognition } from 'react-native-vision-camera-text-recognition';
import { useRunOnJS } from 'react-native-worklets-core';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { darkTheme } from '../constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ARTranslatorProps {
  onClose: () => void;
}

export default function ARTranslator({ onClose }: ARTranslatorProps) {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const insets = useSafeAreaInsets();

  const [blocks, setBlocks] = useState<any[]>([]);
  const [cameraSize, setCameraSize] = useState({ width: 1080, height: 1920 });
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentText, setCurrentText] = useState<string>('');
  
  const lastUpdateRef = useRef(0);
  const debounceRef = useRef<NodeJS.Timeout | number | null>(null);
  
  const plugin = useTextRecognition({ language: 'japanese' });

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  // Pass data from Worklet (native thread) to JS thread
  const updateBlocksInJS = useRunOnJS((data: any, errMsg?: string, frameW?: number, frameH?: number) => {
    const now = Date.now();
    if (frameW && frameH) {
      // Vision Camera returns physical buffer dimensions 
      setCameraSize({ width: frameW, height: frameH });
    }
    
    if (now - lastUpdateRef.current > 200) { // Throttle to 5 FPS to reduce jitter
      const blocksArray = data?.blocks || [];
      setBlocks(blocksArray);
      lastUpdateRef.current = now;
    }
  }, []);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    try {
      const data = plugin.scanText(frame);
      updateBlocksInJS(data, undefined, frame.width, frame.height);
    } catch (e: any) {
      updateBlocksInJS([], e.message || 'Unknown worklet error');
    }
  }, []);

  // Update current target text only when it changes
  useEffect(() => {
    // Filter out visual hallucinations (icons detected as 1 random Katakana)
    const japaneseBlocks = blocks.filter(b => {
      if (!b?.blockText) return false;
      const text = b.blockText.trim();
      
      const japChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || [];
      const density = japChars.length / text.length;
      
      // Require at least 25% Japanese characters in the string
      if (density < 0.25) return false;
      
      // If it's a single character, it MUST be a Kanji to be meaningful
      if (text.length === 1 && !/[\u4E00-\u9FAF]/.test(text)) return false;

      return true;
    });

    if (japaneseBlocks.length === 0) {
      if (currentText) {
        setCurrentText('');
        setTranslatedText('');
        setIsTranslating(false);
      }
      return;
    }

    // Sort by length, take unique strings, limit to top 3, format as bullet points
    const allLines = japaneseBlocks.flatMap(b => b.blockText.split('\n')).map(s => s.trim()).filter(Boolean);
    const sortedTexts = allLines.sort((a,b) => b.length - a.length);
    const uniqueTexts = Array.from(new Set(sortedTexts)).slice(0, 3);
    const targetText = uniqueTexts.map(t => `- ${t}`).join('\n');
    
    // Only update if it's materially different, so we don't starve the timer
    if (targetText && targetText !== currentText) {
      setCurrentText(targetText);
    }
  }, [blocks, currentText]);

  // Debounced Translation executing only on text change
  useEffect(() => {
    if (!currentText) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsTranslating(true);
      try {
        const url = `${process.env.EXPO_PUBLIC_API_URL}/translate-only`;
          
        const response = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            text: currentText,
            source_lang: 'Japanese',
            target_lang: 'English'
          }),
        });
        
        if (!response.ok) {
           setTranslatedText(`API HTTP ${response.status}`);
           return;
        }

        const json = await response.json();
        if (json.translated_text && json.translated_text !== currentText) {
          setTranslatedText(json.translated_text);
        } else if (json.translated_text === currentText) {
          setTranslatedText(`Echo: ${json.translated_text}`);
        } else {
          setTranslatedText(`Error: ${JSON.stringify(json).substring(0,20)}`);
        }
      } catch (err: any) {
        setTranslatedText(`Network Error: ${err.message}`);
      } finally {
        setIsTranslating(false);
      }
    }, 600) as unknown as NodeJS.Timeout;

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [currentText]);

  if (!hasPermission || device == null) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        enableFpsGraph={false}
        pixelFormat="yuv"
      />

      {/* AR HUD OVERLAYS */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {blocks.map((b, i) => {
          const frame = b?.blockFrame;
          const text = b?.blockText;

          if (!frame || !text) return null;

          const rawText = text.trim();
          const japChars = rawText.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || [];
          const density = japChars.length / rawText.length;
          
          if (density < 0.25) return null;
          if (rawText.length === 1 && !/[\u4E00-\u9FAF]/.test(rawText)) return null;

          // Camera feed from iOS is Landscape, so buffer is rotated 90deg CW
          // This means real width=1080 and real height=1920 (when portrait mapping).
          // Wait: cameraSize is 1080x1920 on JS side
          const bufferW = 1080; 
          const bufferH = 1920; 

          // CALCULATE 'COVER' RESIZE MODE OFFSETS (based on Portrait scale mapping)
          const scale = Math.max(SCREEN_WIDTH / bufferW, SCREEN_HEIGHT / bufferH);
          const scaledW = bufferW * scale; 
          const scaledH = bufferH * scale;

          const offsetX = (scaledW - SCREEN_WIDTH) / 2;
          const offsetY = (scaledH - SCREEN_HEIGHT) / 2;

          const corners = b?.blockCornerPoints;
          if (!corners || corners.length !== 4) return null;

          // iOS Raw Buffer is Landscape!
          // We MUST manually rotate it mathematically.
          // Origin: Top Left Landscape -> Top Right Portrait.
          // Landscape Y (1080) maps to Portrait X. Landscape X (1920) maps to Portrait Y.
          const screenPoints = corners.map((p: any) => {
            // p.y is the 1080-axis, p.x is the 1920-axis
            const rotatedX = (1080 - p.y);
            const rotatedY = p.x;
            return {
              x: (rotatedX * scale) - offsetX,
              y: (rotatedY * scale) - offsetY
            };
          });

          const xs = screenPoints.map((p: any) => p.x);
          const ys = screenPoints.map((p: any) => p.y);

          const boxLeft = Math.min(...xs);
          const boxTop = Math.min(...ys);
          const boxWidth = Math.max(...xs) - boxLeft;
          const boxHeight = Math.max(...ys) - boxTop;

          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: boxLeft,
                top: boxTop,
                width: boxWidth,
                height: boxHeight,
                borderWidth: 2,
                borderColor: '#FF0055',
                backgroundColor: 'rgba(255, 0, 85, 0.1)',
                borderRadius: 4,
              }}
            />
          );
        })}
      </View>

      {/* AR HUD */}
      <View style={{
        position: 'absolute',
        top: 65,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
      }}>
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute',
            left: 20,
            top: 0,
            width: 44,
            height: 44,
            borderRadius: 22,
            overflow: 'hidden',
          }}
        >
          <BlurView intensity={70} tint="dark" style={styles.blurWrap}>
            <Ionicons name="close" size={24} color="#FFF" />
          </BlurView>
        </TouchableOpacity>

        {translatedText ? (
          <View style={{ width: '85%', alignItems: 'center' }}>
            <View style={{ paddingVertical: 14, paddingHorizontal: 32, borderRadius: 28, overflow: 'hidden', alignItems: 'center' }}>
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, zIndex: 2 }}>
                <Text style={{ color: '#00FFAA', fontSize: 12, fontWeight: 'bold', marginRight: isTranslating ? 6 : 0, textTransform: 'uppercase', letterSpacing: 1 }}>Translation</Text>
                {isTranslating && <ActivityIndicator size="small" color="#00FFAA" />}
              </View>
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700', textAlign: 'center', lineHeight: 24, zIndex: 2 }}>{translatedText}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.hudBadge}>
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[styles.blurWrap, { paddingHorizontal: 20 }]}>
              {isTranslating ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="scan-outline" size={18} color="#FFF" />}
              <Text style={styles.hudText}>{isTranslating ? 'Translating...' : 'AR Mode Active'}</Text>
            </View>
          </View>
        )}
      </View>


      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <BlurView intensity={80} tint="dark" style={styles.footerPanel}>
          <Ionicons name="information-circle" size={24} color="#FFF" />
          <Text style={styles.footerText}>Point camera at Japanese text to translate instantly.</Text>
        </BlurView>
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: darkTheme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  blurWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  hudBadge: {
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 140,
  },
  hudText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  footerPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  footerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
