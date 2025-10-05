import LessonPage from '../LessonPage'; // Important: calea corectă!

const lessonContent = [
    {
        type: 'info',
        sections: [
            {
                title: 'Hiragana Basics: Introduction',
                content: [
                    'Hiragana is a fundamental Japanese script',
                    'Each character represents a syllable and there are 46 basic Hiragana characters',
                    '',
                    'In this section, we will cover the first row of Hiragana characters',
                ],
            },
            {
                title: 'The Hiragana Chart - First Row (あ-お)',
                characters: [
                    { char: 'あ', pronunciation: 'a', helper: 'Look closley, and find the letter A inside of it.' },
                    { char: 'い', pronunciation: 'i', helper: 'To remember this kana, just think of a couple of eels hanging out.\n\nThey\'re upright because they\'re trying to mimic the letter i' },
                    { char: 'う', pronunciation: 'u', helper: 'To remember this kana, notice the U shape in it!\n\nThere\'s another similar hiragana つ, but that one isn\'t wearing a hat like U(you) are.' },
                    { char: 'え', pronunciation: 'e', helper: 'Look at this kana and find the exotic bird laying exotic eggs inside of it.' },
                    { char: 'お', pronunciation: 'o', helper: 'Can you see the letter o in there, two times? This one looks similar to あ except for one key difference: there are two letter o symbols visible in there.' },
                ],
            },
        ],
    },
    {
        type: 'exerciseGroup', // Nume nou pentru a indica un grup de exerciții
        exercises: [
            {
                exerciseType: 'recognition',
                question: 'Which character is "a"?',
                correctAnswer: 'あ',
                options: ['い', 'あ', 'う', 'え'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "i"?',
                correctAnswer: 'い',
                options: ['あ', 'い', 'え', 'お'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "e"?',
                correctAnswer: 'え',
                options: ['い', 'お', 'え', 'う'],
            },
        ],
    },

];

export default function HiraganaFirstRowPage() {
    return (
        <LessonPage 
            lessonContent={lessonContent} 
            lessonRoute="/(home)/lessons/hiragana-basic/page" 
            lessonId="hiragana-first-row" 
            backButtonText="Back to Hiragana Basics"
        />
    );
}