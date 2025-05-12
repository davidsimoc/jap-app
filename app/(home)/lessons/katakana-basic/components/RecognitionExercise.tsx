import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { darkTheme } from '@/constants/Colors'; // Ensure you have the theme defined

interface Props {
    question: string;
    correctAnswer: string;
    options: string[];
    onNext: (isCorrect: boolean, selectedAnswer: string) => void;
}

const RecognitionExercise: React.FC<Props> = ({ question, correctAnswer, options, onNext }) => {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleAnswer = (answer: string) => {
        setSelectedAnswer(answer);
        if (answer === correctAnswer) {
            setFeedback('Correct!');
            setTimeout(() => onNext(true, answer), 1500); // <-- include selectedAnswer
        } else {
            setFeedback(`Incorrect. The correct answer was ${correctAnswer}.`);
            setTimeout(() => onNext(false, answer), 2000); // <-- include selectedAnswer
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.questionText}>Recognize this character:</Text>
            <Text style={styles.characterToRecognize}>{question}</Text>

            <View style={styles.choicesContainer}>
                {options.map((choice) => (
                    <TouchableOpacity
                        key={choice}
                        style={[
                            styles.choiceButton,
                            selectedAnswer === choice && (choice === correctAnswer ? styles.correctAnswer : styles.incorrectAnswer),
                        ]}
                        onPress={() => !feedback && handleAnswer(choice)}
                        disabled={feedback !== null}
                    >
                        <Text style={styles.choiceText}>{choice}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {feedback && <Text style={styles.feedbackText}>{feedback}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: darkTheme.surface,
        borderRadius: 8,
    },
    questionText: {
        fontSize: 18,
        color: darkTheme.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    characterToRecognize: {
        fontSize: 40,
        color: darkTheme.accent,
        marginBottom: 24,
        textAlign: 'center',
    },
    choicesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    choiceButton: {
        backgroundColor: darkTheme.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginVertical: 8,
        minWidth: '40%',
        alignItems: 'center',
    },
    choiceText: {
        fontSize: 24,
        color: darkTheme.background,
    },
    feedbackText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        color: darkTheme.text,
    },
    correctAnswer: {
        backgroundColor: 'green',
    },
    incorrectAnswer: {
        backgroundColor: 'red',
    },
});

export default RecognitionExercise;