import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HanziWriter, useHanziWriter } from '@jamsch/react-native-hanzi-writer';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

interface KanjiHandwritingProps {
    kanji: string;
    onComplete?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WRITER_SIZE = 300; // Enforce library's hardcoded size

export default function KanjiHandwriting({ kanji, onComplete }: KanjiHandwritingProps) {
    const { theme } = useTheme();
    const currentTheme = theme === 'light' ? lightTheme : darkTheme;
    const isDark = theme === 'dark';

    const [quizComplete, setQuizComplete] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isTestMode, setIsTestMode] = useState(false);
    const [score, setScore] = useState(100);
    const [totalMistakes, setTotalMistakes] = useState(0);

    const writer = useHanziWriter({
        character: kanji,
        loader: async (char) => {
            const encodedChar = encodeURIComponent(char);
            // Try Japanese data first (reliable GitHub-direct JSDelivr)
            try {
                const response = await fetch(`https://cdn.jsdelivr.net/gh/chanind/hanzi-writer-data-jp@master/data/${encodedChar}.json`);
                if (response.ok) return await response.json();
            } catch (e) {
                console.log(`[Handwriting] JP data failed for ${char}, trying CN fallback`);
            }

            // Fallback to Chinese data (Make me a Hanzi)
            const response = await fetch(`https://cdn.jsdelivr.net/gh/chanind/hanzi-writer-data@master/data/${encodedChar}.json`);
            if (!response.ok) throw new Error('Character not found in JP or CN datasets');
            return await response.json();
        },
    });

    const { quiz, animator, characterState } = writer;

    // Use library's state for UI to ensure synchronization
    const isActive = quiz.useStore(s => s.active);
    const quizIndex = quiz.useStore(s => s.index);
    const animState = animator.useStore(s => s.state);
    const libraryIsAnimating = animState === 'playing';

    useEffect(() => {
        if (characterState.status === 'resolved' && !isActive && !quizComplete && !isAnimating) {
            quiz.start({
                leniency: 2.5,
                showHintAfterMisses: 2,
                onMistake: () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    setTotalMistakes(prev => prev + 1);
                    setScore(prev => Math.max(0, prev - 5));
                },
                onCorrectStroke: () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                },
                onComplete: () => {
                    setQuizComplete(true);
                    onComplete?.();
                }
            });
        }
    }, [characterState.status, isActive, quizComplete, isAnimating]);

    const handleReset = () => {
        setQuizComplete(false);
        setIsAnimating(false);
        setScore(100);
        setTotalMistakes(0);
        animator.cancelAnimation();
        quiz.start({
            leniency: 2.5,
            showHintAfterMisses: 2,
            onMistake: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setTotalMistakes(prev => prev + 1);
                setScore(prev => Math.max(0, prev - 5));
            },
            onCorrectStroke: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
            onComplete: () => {
                setQuizComplete(true);
                onComplete?.();
            }
        });
    };

    const handleHint = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Spoof mistakes to trigger the QuizMistakeHighlighter
        const { index, mistakes } = quiz.store.getState();
        quiz.store.setState({
            mistakes: { ...mistakes, [index]: (mistakes[index] || 0) + 3 }
        });
        setScore(prev => Math.max(0, prev - 10)); // Heavier penalty for hint
    };

    const getGrade = (s: number) => {
        if (s >= 95) return 'S';
        if (s >= 85) return 'A';
        if (s >= 70) return 'B';
        return 'C';
    };

    const getGradeColor = (g: string) => {
        switch (g) {
            case 'S': return '#FFD700'; // Gold
            case 'A': return '#4CAF50'; // Green
            case 'B': return '#2196F3'; // Blue
            default: return '#757575'; // Gray
        }
    };

    const handleShowMe = () => {
        if (isAnimating || libraryIsAnimating) return;
        setIsAnimating(true);
        quiz.stop();
        animator.animateCharacter({
            strokeDuration: 500,
            delayBetweenStrokes: 300,
            onComplete: () => {
                setIsAnimating(false);
                // Quiz will restart via the useEffect
            }
        });
    };

    if (characterState.status === 'pending') {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={currentTheme.primary} />
                <Text style={[styles.loadingText, { color: currentTheme.text }]}>Loading stroke data...</Text>
            </View>
        );
    }

    if (characterState.status === 'rejected') {
        return (
            <View style={[styles.center, { backgroundColor: currentTheme.surface, borderRadius: 25, margin: 20 }]}>
                <Ionicons name="alert-circle-outline" size={50} color={currentTheme.text + '40'} />
                <Text style={[styles.errorTitle, { color: currentTheme.text }]}>Data Missing</Text>
                <Text style={[styles.errorSubtitle, { color: currentTheme.text + '80' }]}>
                    No stroke data found for "{kanji}".{'\n'}This character might not be in our database yet.
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                    <TouchableOpacity
                        style={[styles.errorBtn, { backgroundColor: currentTheme.primary + '20' }]}
                        onPress={() => writer.refetch()}
                    >
                        <Text style={{ color: currentTheme.primary, fontWeight: '700' }}>Retry</Text>
                    </TouchableOpacity>
                    {onComplete && (
                        <TouchableOpacity
                            style={[styles.errorBtn, { backgroundColor: currentTheme.text + '10' }]}
                            onPress={onComplete}
                        >
                            <Text style={{ color: currentTheme.text, fontWeight: '700' }}>Skip</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={[styles.writerContainer, {
                    backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9',
                    borderColor: currentTheme.text + '20',
                    width: WRITER_SIZE,
                    height: WRITER_SIZE
                }]}>
                    <HanziWriter
                        writer={writer}
                        style={{ width: WRITER_SIZE, height: WRITER_SIZE }}
                        userStrokeProps={{
                            strokeWidth: 10,
                            stroke: currentTheme.accent,
                        }}
                    >
                        <HanziWriter.GridLines color={isDark ? '#333' : '#eee'} />
                        <HanziWriter.Svg>
                            {!isTestMode && <HanziWriter.Outline color={isDark ? '#444' : '#ddd'} />}
                            <HanziWriter.Character color={currentTheme.primary} />
                            <HanziWriter.QuizStrokes color={currentTheme.primary} />
                            <HanziWriter.QuizMistakeHighlighter color={currentTheme.primary} />
                        </HanziWriter.Svg>
                    </HanziWriter>

                    {quizComplete && (
                        <View style={[styles.successOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)' }]}>
                            <View style={styles.resultsCard}>
                                <Text style={[styles.gradeText, { color: getGradeColor(getGrade(score)) }]}>
                                    {getGrade(score)}
                                </Text>
                                <Text style={[styles.successText, { color: currentTheme.text }]}>Practice Complete!</Text>
                                <View style={styles.scoreRow}>
                                    <View style={styles.scoreStat}>
                                        <Text style={[styles.statValue, { color: currentTheme.text }]}>{score}%</Text>
                                        <Text style={[styles.statLabel, { color: currentTheme.text + '80' }]}>Accuracy</Text>
                                    </View>
                                    <View style={styles.scoreStat}>
                                        <Text style={[styles.statValue, { color: currentTheme.text }]}>{totalMistakes}</Text>
                                        <Text style={[styles.statLabel, { color: currentTheme.text + '80' }]}>Mistakes</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={[styles.doneBtn, { backgroundColor: currentTheme.primary }]} onPress={handleReset}>
                                    <Text style={styles.doneBtnText}>Practice Again</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.controlBtn, {
                            backgroundColor: isTestMode ? currentTheme.primary + '15' : currentTheme.surface,
                            borderColor: isTestMode ? currentTheme.primary : currentTheme.text + '10',
                            borderWidth: 1.5,
                        }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setIsTestMode(!isTestMode);
                            handleReset();
                        }}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: isTestMode ? currentTheme.primary : currentTheme.text + '05' }]}>
                            <Ionicons name={isTestMode ? "eye-off" : "eye-outline"} size={20} color={isTestMode ? '#fff' : currentTheme.text} />
                        </View>
                        <Text style={[styles.btnText, { color: isTestMode ? currentTheme.primary : currentTheme.text }]}>Memory</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlBtn, {
                            backgroundColor: currentTheme.surface,
                            borderColor: currentTheme.text + '10',
                            borderWidth: 1.5,
                        }]}
                        onPress={handleShowMe}
                        disabled={isAnimating || libraryIsAnimating || quizComplete}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: currentTheme.primary + '10' }]}>
                            <Ionicons name="play" size={20} color={isAnimating || libraryIsAnimating || quizComplete ? '#ccc' : currentTheme.primary} />
                        </View>
                        <Text style={[styles.btnText, { color: isAnimating || libraryIsAnimating || quizComplete ? '#ccc' : currentTheme.primary }]}>Show Me</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlBtn, {
                            backgroundColor: currentTheme.surface,
                            borderColor: currentTheme.text + '10',
                            borderWidth: 1.5,
                        }]}
                        onPress={handleHint}
                        disabled={isAnimating || libraryIsAnimating || quizComplete}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#FFA50020' }]}>
                            <Ionicons name="bulb" size={20} color={isAnimating || libraryIsAnimating || quizComplete ? '#ccc' : '#FFA500'} />
                        </View>
                        <Text style={[styles.btnText, { color: isAnimating || libraryIsAnimating || quizComplete ? '#ccc' : '#FFA500' }]}>Hint</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.resetIconButton, { marginTop: 20 }]}
                    onPress={handleReset}
                >
                    <Ionicons name="refresh" size={20} color={currentTheme.text + '60'} />
                    <Text style={{ color: currentTheme.text + '60', fontWeight: '600' }}>Reset Practice</Text>
                </TouchableOpacity>

                <Text style={[styles.instruction, { color: currentTheme.text + '80' }]}>
                    Follow the stroke order to trace the character
                </Text>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 20,
    },
    center: {
        padding: 50,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
    },
    writerContainer: {
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    controls: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 25,
        width: '100%',
        paddingHorizontal: 10,
    },
    controlBtn: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 22,
        gap: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    iconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginTop: 15,
    },
    errorSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    errorBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    instruction: {
        marginTop: 30,
        fontSize: 13,
        textAlign: 'center',
        opacity: 0.5,
        fontWeight: '500',
    },
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    resultsCard: {
        width: '85%',
        padding: 30,
        borderRadius: 25,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    gradeText: {
        fontSize: 100,
        fontWeight: '900',
        lineHeight: 110,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    successText: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 20,
        letterSpacing: -0.5,
    },
    scoreRow: {
        flexDirection: 'row',
        gap: 30,
        marginBottom: 30,
    },
    scoreStat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    doneBtn: {
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 18,
        width: '100%',
        alignItems: 'center',
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    resetIconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    }
});
