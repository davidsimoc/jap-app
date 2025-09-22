import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import RecognitionExercise from './components/RecognitionExercise';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import { markLessonAsCompleted } from '@/utils/lessonProgress';

interface LessonContent {
    type: string,
    sections?: Array<{
        title: string;
        content?: string[];
        characters?: Array<{
            char: string;
            pronunciation: string;
            helper: string;
        }>;
    }>;
    exercises?: Array<{
        exerciseType: string;
        question: string;
        correctAnswer: string;
        options: string[];
    }>;
}

interface LessonPageProps  {
    lessonContent: LessonContent[];
    lessonRoute: any;
    lessonId: string;
    backButtonText: string;
}

const LessonPage: React.FC<LessonPageProps> = ({ lessonContent, lessonRoute, lessonId, backButtonText }) =>  {
    const [currentStep, setCurrentStep] = useState(0);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [isLessonCompleted, setIsLessonCompleted] = useState(false);
    const { theme } = useTheme();
    const currentTheme = theme === 'light' ? lightTheme : darkTheme;
    const totalSteps = lessonContent.length;

    useFocusEffect(
        useCallback(() => {
            setCurrentStep(0);
            setCurrentExerciseIndex(0);
            setUserAnswers([]);
            setIsLessonCompleted(false);
            return () => {};
        }, [lessonContent])
    );

    useEffect(() => {
        const exerciseGroup = lessonContent.find(item => item.type === 'exerciseGroup');
        if (exerciseGroup && exerciseGroup.exercises) {
            if (userAnswers.length === exerciseGroup.exercises.length) {
                const allAnsweredCorrectly = userAnswers.every((answer, i) => answer === exerciseGroup.exercises![i].correctAnswer);
                if (allAnsweredCorrectly) {
                    setIsLessonCompleted(true);
                    markLessonAsCompleted(lessonId);
                }
            } else {
                setIsLessonCompleted(false);
            }
        }
    }, [userAnswers, lessonContent, lessonId]);

    const goToNextStep = (userAnswer?: string) => {
        const currentContent = lessonContent[currentStep];

        if (currentContent?.type === 'exerciseGroup' && userAnswer) {
            setUserAnswers([...userAnswers, userAnswer]);
        }

        if (currentContent?.type === 'exerciseGroup') {
            if (currentContent.exercises && currentContent.exercises.length - 1 > currentExerciseIndex) {
                setCurrentExerciseIndex(currentExerciseIndex + 1);
            } else if (currentStep < totalSteps - 1) {
                setCurrentStep(currentStep + 1);
                setCurrentExerciseIndex(0);
            }
        } else if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
            setCurrentExerciseIndex(0);
        }
    };

    const goToBackStep = () => {
        if (currentStep > 0) {
            const currentContent = lessonContent[currentStep];
            const prevContent = lessonContent[currentStep - 1];
            if (currentContent?.type === 'exerciseGroup' && currentExerciseIndex > 0) {
                setCurrentExerciseIndex(currentExerciseIndex - 1);
            } else {
                setCurrentStep(currentStep - 1);
                if (prevContent?.type === 'exerciseGroup' && prevContent.exercises) {
                    setCurrentExerciseIndex(prevContent.exercises.length - 1);
                    setUserAnswers(userAnswers.slice(0, -1));
                } else {
                    setCurrentExerciseIndex(0);
                    setUserAnswers([]);
                }
            }
        }
    };

    const currentContent = lessonContent[currentStep];
    const currentExercise = currentContent?.type === 'exerciseGroup' && currentContent.exercises
        ? currentContent.exercises[currentExerciseIndex]
        : null;

    return (
        <SafeAreaView style={{ ...styles.safeArea, backgroundColor: currentTheme.background }}>
            <View style={{ ...styles.mainContainer, backgroundColor: currentTheme.background }}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace(lessonRoute)}>
                    <Text style={{...styles.backButtonText, color: currentTheme.accent}}>{backButtonText}</Text>
                </TouchableOpacity>
                <ScrollView style={{ ...styles.scrollContainer, backgroundColor: currentTheme.background }} showsVerticalScrollIndicator={false}>
                    {currentContent && currentContent.type === 'info' && currentContent.sections && Array.isArray(currentContent.sections) && (
                        <View>
                            {currentContent.sections.map((section, index) => (
                                <View key={index} style={styles.infoSection}>
                                    {section.title && <Text style={{ ...styles.sectionTitle, color: currentTheme.accent }}>{section.title}</Text>}
                                    {section.content && Array.isArray(section.content) && (
                                        section.content.map((paragraph, paraIndex) => (
                                            <Text key={paraIndex} style={{ ...styles.paragraph, color: currentTheme.text }}>{paragraph}</Text>
                                        ))
                                    )}
                                    {section.characters && Array.isArray(section.characters) && (
                                        section.characters.map((item) => (
                                            <View key={item.char} style={styles.characterContainer}>
                                                <View style={styles.charPronunciationContainer}>
                                                    <Text style={{ ...styles.character, color: currentTheme.secondary }}>{item.char}</Text>
                                                    <Text style={{ ...styles.pronunciation, color: currentTheme.secondaryText }}>Pronunciation: {item.pronunciation}</Text>
                                                </View>
                                                {item.helper && (
                                                    <Text style={{ ...styles.helper, color: currentTheme.text }}>
                                                        How to remember:
                                                        <Text>{"\n"}</Text>
                                                        {item.helper}
                                                    </Text>
                                                )}
                                            </View>
                                        ))
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {currentContent?.type === 'exerciseGroup' && currentExercise?.exerciseType === 'recognition' && (
                        <RecognitionExercise
                            key={currentExerciseIndex}
                            question={currentExercise.question}
                            correctAnswer={currentExercise.correctAnswer}
                            options={currentExercise.options}
                            onNext={(isCorrect, selectedAnswer) => goToNextStep(isCorrect ? selectedAnswer : undefined)}
                        />
                    )}

                    {isLessonCompleted && (
                        <View style={styles.completionContainer}>
                            <Text style={{ ...styles.completionText, color: currentTheme.text }}>Lesson Complete!</Text>
                            <TouchableOpacity
                                style={styles.doneButton}
                                onPress={() => {
                                    router.replace(lessonRoute);
                                }}
                            >
                                <Text style={styles.doneButtonText}>Finish</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>

            {totalSteps > 1 && (
                <View style={styles.bottomNavigation}>
                    {currentStep > 0 && (
                        <TouchableOpacity style={[styles.bottomButton, styles.backButtonBottom]} onPress={goToBackStep}>
                            <Text style={styles.bottomButtonText}>Back</Text>
                        </TouchableOpacity>
                    )}
                    {currentStep < totalSteps - 1 && !isLessonCompleted && (
                        <TouchableOpacity style={[styles.bottomButton, styles.nextButtonBottom]} onPress={() => goToNextStep()}>
                            <Text style={styles.bottomButtonText}>Next</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};
export default LessonPage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkTheme.background,
        padding: 20,
    },
    mainContainer: {
        flex: 1,
        flexDirection: 'column',
        paddingBottom: 45,
        marginBottom: 10,
    },
    exerciseContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 20,
        paddingRight: 20,
    },
    infoSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: darkTheme.accent,
        marginTop: 16,
        marginBottom: 8,
    },
    characterContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    charPronunciationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
    },
    character: {
        fontSize: 32,
        color: darkTheme.secondary,
        marginRight: 16,
    },
    pronunciation: {
        fontSize: 18,
        color: darkTheme.secondaryText,
    },
    helper: {
        fontSize: 16,
        color: darkTheme.text,
        marginTop: 4,
    },
    bottomNavigation: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    bottomButton: {
        backgroundColor: darkTheme.primary,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    nextButtonBottom: {
        backgroundColor: darkTheme.secondary,
    },
    backButtonBottom: {
        backgroundColor: darkTheme.secondary,
    },
    bottomButtonText: {
        color: darkTheme.background,
        fontSize: 18,
        fontWeight: 'bold',
    },
    safeArea: {
        flex: 1,
        backgroundColor: darkTheme.background,
    },
    scrollContainer: {
        flex: 1,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 0,
    },
    backButton: {
        marginLeft: 20,
        marginBottom: 20,
        marginTop: 5,
    },
    backButtonText: {
        fontSize: 18,
        color: darkTheme.accent,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: darkTheme.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    paragraph: {
        fontSize: 16,
        color: darkTheme.text,
        marginBottom: 4,
    },
    nextButton: {
        backgroundColor: darkTheme.primary,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    nextButtonText: {
        color: darkTheme.background,
        fontSize: 18,
        fontWeight: 'bold',
    },
    completionContainer: {
        marginTop: 40,
        alignItems: 'center',
    },
    completionText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: darkTheme.text,
        marginBottom: 20,
    },
    doneButton: {
        width: '100%',
        backgroundColor: darkTheme.secondary,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    doneButtonText: {
        color: darkTheme.background,
        fontSize: 18,
        fontWeight: 'bold',
    },
});