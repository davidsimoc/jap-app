import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import RecognitionExercise from './components/RecognitionExercise'; // Assuming you'll adapt this
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { markLessonAsCompleted } from '@/utils/lessonProgress';
import { useTheme } from '@/components/ThemeContext'; // Calea corectă!
import { lightTheme, darkTheme } from '@/constants/Colors'; // Asigură-te că ai importat corect temele
const lessonContent = [
    {
        type: 'info',
        sections: [
            {
                title: 'The Hiragana Chart - Forth Row (た-と)',
                characters: [
                    { char: 'た', pronunciation: 'ta', helper: 'Use your imagination and see this kana as a fork, taco, and like garnish for your taco.' },
                    { char: 'ち', pronunciation: 'chi', helper: 'You know when somebody tells you to say "cheese" when taking a picture of you? This kana looks like a forced smile you have to make every time you\'re in a group photo.\n\nThis is the second "exception" hiragana. Instead of a "ti" sound, it\'s a "chi" sound.' },
                    { char: 'つ', pronunciation: 'tsu', helper: 'Look at the swoosh of this hiragana. Doesn\'t it look like a big wave, or tsunami?\n\nThis is another "exception" hiragana. Instead of saying "tu", you say "tsu".' },
                    { char: 'て', pronunciation: 'te', helper: 'Can you see a good ol\' telescope? It\'s a hand-held one! In Japanese, "hand" is て(te).' },
                    { char: 'と', pronunciation: 'to', helper: 'This kana looks just like someone\'s toe with a little nail or splinter in it. Imagine how much this would hurt if it was your toe.' },
                ],
            },
        ],
    },
    {
        type: 'exerciseGroup', // Nume nou pentru a indica un grup de exerciții
        exercises: [
            {
                exerciseType: 'recognition',
                question: 'Which character is "ta"?',
                correctAnswer: 'た',
                options: ['て', 'と', 'ち', 'た'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "tsu"?',
                correctAnswer: 'つ',
                options: ['と', 'つ', 'た', 'ち'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "te"?',
                correctAnswer: 'て',
                options: ['つ', 'ち', 'て', 'と'],
            },
        ],
    },

];


export default function HiraganaForthRowPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0); // Urmărește exercițiul curent din grup
    const [lessonCompleted, setLessonCompleted] = useState(false);
    const totalSteps = lessonContent.length;
    const navigation = useNavigation(); // Get the navigation object
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [isLessonCompleted, setIsLessonCompleted] = useState(false);
    const [questions, setQuestions] = useState<typeof lessonContent[1]['exercises']>([]);
    const { theme, toggleTheme } = useTheme(); // Acum funcționează corect!
    const currentTheme = theme === 'light' ? lightTheme : darkTheme;

    useFocusEffect(
        useCallback(() => {
            setCurrentStep(0); // Reset state when the screen is focused
            setCurrentExerciseIndex(0); // Resetează indexul exercițiului la începutul lecției
            setUserAnswers([]);
            const exerciseGroup = lessonContent.find(item => item.type === 'exerciseGroup');
            if (exerciseGroup && exerciseGroup.exercises) {
                setQuestions(exerciseGroup.exercises);
            } else {
                setQuestions([]);
            }
            return () => {
                // Optional: Cleanup function if needed (e.g., pause audio)
            };
        }, [])
    );

    useEffect(() => {
        if (questions && questions.length > 0) {
            const allAnsweredCorrectly =
                userAnswers.length === questions.length &&
                questions.every((q, i) => userAnswers[i] === q.correctAnswer);

            setIsLessonCompleted(allAnsweredCorrectly);
        }
    }, [userAnswers, questions]);

    const goToNextStep = (userAnswer?: string) => {
        const currentContent = lessonContent[currentStep];

        if (currentContent?.type === 'exerciseGroup' && userAnswer) {
            setUserAnswers([...userAnswers, userAnswer]);
            console.log('User answers:', [...userAnswers, userAnswer]);
        }

        if (currentContent?.type === 'exerciseGroup') {
            if (currentContent.exercises && currentContent.exercises.length - 1 > currentExerciseIndex) {
                setCurrentExerciseIndex(currentExerciseIndex + 1);
            } else if (currentStep < lessonContent.length - 1) {
                setCurrentStep(currentStep + 1);
                setCurrentExerciseIndex(0);
            }
        } else if (currentStep < lessonContent.length - 1) {
            setCurrentStep(currentStep + 1);
            setCurrentExerciseIndex(0);
        }

        // Verificăm dacă lecția este completă
        const exerciseGroup = lessonContent.find(item => item.type === 'exerciseGroup');
        if (exerciseGroup && exerciseGroup.exercises) {
            const allAnsweredCorrectly =
                userAnswers.length + 1 === exerciseGroup.exercises.length &&
                exerciseGroup.exercises.every((q, i) => userAnswers[i] === q.correctAnswer);
            setIsLessonCompleted(allAnsweredCorrectly);
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
                    // Remove the last answer when going back to a previous exercise within the same group
                    setUserAnswers(userAnswers.slice(0, -1));
                } else {
                    setCurrentExerciseIndex(0);
                    // Reset user answers when going back to a new section
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
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.mainContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(home)/lessons/hiragana-basic/page')}>
                    <Text style={styles.backButtonText}>Back to Hiragana Basics</Text>
                </TouchableOpacity>
                <ScrollView style={styles.scrollContainer}>

                    {currentContent && currentContent.type === 'info' && currentContent.sections && Array.isArray(currentContent.sections) && (
                        <View>
                            {currentContent.sections.map((section, index) => (
                                <View key={index} style={styles.infoSection}>
                                    {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
                                    {section.characters && Array.isArray(section.characters) && (
                                        section.characters.map((item) => (
                                            <View key={item.char} style={styles.characterContainer}>
                                                <View style={styles.charPronunciationContainer}>
                                                    <Text style={styles.character}>{item.char}</Text>
                                                    <Text style={styles.pronunciation}>Pronunciation: {item.pronunciation}</Text>
                                                </View>
                                                {item.helper && (
                                                    <Text style={styles.helper}>
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
                            onNext={(isCorrect) => goToNextStep(isCorrect ? currentExercise.correctAnswer : '')}
                        />
                    )}
                    {isLessonCompleted && (
                        <View style={styles.completionContainer}>
                            <Text style={styles.completionText}>Lesson Complete!</Text>
                            <TouchableOpacity
                                style={styles.doneButton}
                                onPress={() => {
                                    setLessonCompleted(true);
                                    markLessonAsCompleted('hiragana-forth-row');
                                    router.replace('/(home)/home'); // Navigate after marking as complete
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
                    {currentStep < totalSteps - 1 && (
                        <TouchableOpacity style={[styles.bottomButton, styles.nextButtonBottom]} onPress={() => goToNextStep()}>
                            <Text style={styles.bottomButtonText}>Next</Text>
                        </TouchableOpacity>
                    )}


                </View>
            )}
        </SafeAreaView>
    );
}

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
        justifyContent: 'space-between', // Distribute space between buttons
        zIndex: 10,
    },
    bottomButton: {
        backgroundColor: darkTheme.primary,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1, // Allow buttons to take equal width
        marginHorizontal: 5, // Add some spacing between buttons
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
    // ... other styles
});