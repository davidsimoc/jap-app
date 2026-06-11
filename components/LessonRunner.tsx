import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import { RoadNode } from '@/constants/roadData';

import { speakJapanese, stopSpeech, prefetchAudio } from '@/services/ttsService';
import StoryStep from './lessons/StoryStep';
import VocabularyStep from './lessons/VocabularyStep';
import MatchStep from './lessons/MatchStep';
import ArrangeStep from './lessons/ArrangeStep';
import ListeningStep from './lessons/ListeningStep';
import GrammarStep from './lessons/GrammarStep';
import QuizStep from './lessons/QuizStep';
import KanjiHandwriting from './KanjiHandwriting';

type Props = {
  visible: boolean;
  node: RoadNode | null;
  onClose: () => void;
  onComplete: (nodeId: string) => void;
  starredWords: string[];
  onToggleStar: (word: string) => void;
};

export default function LessonRunner({ visible, node, onClose, onComplete, starredWords, onToggleStar }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [internalIndex, setInternalIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Pre-fetch all audio content when the lesson starts
  useEffect(() => {
    if (visible && node) {
      const textsToPrefetch: string[] = [];

      node.steps.forEach(step => {
        if (step.type === 'story') {
          textsToPrefetch.push(step.text);
        } else if (step.type === 'vocabulary') {
          step.items.forEach(item => textsToPrefetch.push(item.word));
        } else if (step.type === 'listening') {
          textsToPrefetch.push(step.audioText);
        }
      });

      if (textsToPrefetch.length > 0) {
        prefetchAudio(textsToPrefetch);
      }
    }
  }, [visible, node?.id]);

  // Reset indices and finished state when modal closes
  useEffect(() => {
    if (!visible) {
      setCurrentStepIndex(0);
      setInternalIndex(0);
      setIsFinished(false);
    }
  }, [visible]);

  if (!node) return null;

  const currentStep = node.steps[currentStepIndex];
  const totalSteps = node.steps.length;
  const progress = (currentStepIndex + 1) / totalSteps;

  const handleNextAction = () => {
    // Check if current step has internal steps (like vocabulary list)
    if (currentStep.type === 'vocabulary') {
      if (internalIndex < currentStep.items.length - 1) {
        setInternalIndex(internalIndex + 1);
        return;
      }
    }
    if (currentStepIndex < totalSteps - 1) {
      console.log(`[LessonRunner] Moving to step ${currentStepIndex + 2}`);
      setCurrentStepIndex(currentStepIndex + 1);
      setInternalIndex(0);
    } else {
      console.log("[LessonRunner] Lesson complete!");
      setIsFinished(true);
    }
  };

  const renderStepContent = () => {
    switch (currentStep.type) {
      case 'story':
        return <StoryStep key={`story-${currentStepIndex}`} text={currentStep.text} onComplete={handleNextAction} />;
      case 'vocabulary':
        return (
          <VocabularyStep
            key={`vocab-${currentStepIndex}-${internalIndex}`}
            item={currentStep.items[internalIndex]}
            isStarred={starredWords.includes(currentStep.items[internalIndex].word)}
            onToggleStar={() => onToggleStar(currentStep.items[internalIndex].word)}
          />
        );
      case 'grammar':
        return (
          <GrammarStep
            key={`grammar-${currentStepIndex}`}
            title={currentStep.title}
            explanation={currentStep.explanation}
            examples={currentStep.examples}
          />
        );
      case 'match':
        return <MatchStep key={`match-${currentStepIndex}`} pairs={currentStep.pairs} onComplete={handleNextAction} />;
      case 'arrange':
        return (
          <ArrangeStep
            key={`arrange-${currentStepIndex}`}
            sentence={currentStep.sentence}
            translation={currentStep.translation}
            jumbledWords={currentStep.jumbledWords}
            onComplete={handleNextAction}
          />
        );
      case 'listening':
        return (
          <ListeningStep
            key={`listening-${currentStepIndex}`}
            audioText={currentStep.audioText}
            question={currentStep.question}
            options={currentStep.options}
            correctAnswer={currentStep.correctAnswer}
            onComplete={handleNextAction}
          />
        );
      case 'quiz':
        return (
          <QuizStep
            key={`quiz-${currentStepIndex}`}
            question={currentStep.question}
            options={currentStep.options}
            correctAnswer={currentStep.correctAnswer}
            onComplete={handleNextAction}
          />
        );
      case 'handwriting':
        return (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <KanjiHandwriting
              key={`handwriting-${currentStepIndex}`}
              kanji={(currentStep as any).kanji}
              onComplete={handleNextAction}
            />
          </View>
        );
      default:
        return (
          <View style={styles.placeholder}>
            <Text style={{ color: currentTheme.text }}>
              Activity coming soon!
            </Text>
            <TouchableOpacity onPress={handleNextAction}>
              <Text style={{ color: currentTheme.primary }}>Next</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  if (isFinished) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" transparent={false}>
        <View style={[styles.container, { backgroundColor: currentTheme.background, paddingTop: insets.top + 20 }]}>
          <View style={styles.completedContainer}>
            <View style={[styles.completedIconContainer, { backgroundColor: currentTheme.primary + '15' }]}>
              <Ionicons name="trophy" size={80} color="#FFD700" />
            </View>
            <Text style={[styles.completedTitle, { color: currentTheme.text }]}>Lesson Complete!</Text>
            <Text style={[styles.completedSubtitle, { color: currentTheme.text + '70' }]}>
              Congratulations! You've successfully finished learning:
            </Text>
            <Text style={[styles.completedNodeTitle, { color: currentTheme.primary }]}>
              {node.title}
            </Text>
            
            <TouchableOpacity
              style={[styles.completedButton, { backgroundColor: currentTheme.primary }]}
              onPress={() => {
                onComplete(node.id);
                onClose();
              }}
            >
              <Text style={styles.completedButtonText}>Finish Lesson</Text>
              <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const showMainNextButton = currentStep.type === 'vocabulary' || currentStep.type === 'grammar';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" transparent={false}>
      <View style={[styles.container, { backgroundColor: currentTheme.background, paddingTop: insets.top }]}>

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={currentTheme.text} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: currentTheme.primary }]} />
          </View>
        </View>

        <View style={styles.content}>
          {renderStepContent()}
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.counterContainer}>
            <Text style={[styles.stepCounter, { color: currentTheme.text + '80' }]}>
              {currentStep.type === 'vocabulary'
                ? `WORD ${internalIndex + 1} OF ${currentStep.items.length}`
                : `STEP ${currentStepIndex + 1} OF ${totalSteps}`}
            </Text>
          </View>

          {showMainNextButton && (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: currentTheme.primary }]}
              onPress={handleNextAction}
            >
              <Text style={styles.nextText}>
                {currentStepIndex === totalSteps - 1 && (currentStep.type !== 'vocabulary' || internalIndex === currentStep.items.length - 1)
                  ? "Finish Journey"
                  : "Continue"}
              </Text>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
    gap: 15,
  },
  closeButton: {
    padding: 5,
  },
  progressContainer: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 25,
    paddingTop: 10,
    gap: 15,
    minHeight: 120,
  },
  counterContainer: {
    alignItems: 'center',
  },
  stepCounter: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  nextButton: {
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  nextText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  skipButton: {
    padding: 15,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  completedIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  completedTitle: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  completedSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  completedNodeTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 40,
  },
  completedButton: {
    height: 64,
    width: '100%',
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  completedButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
});
