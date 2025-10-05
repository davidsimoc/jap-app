import LessonPage from '../LessonPage'; // Important: calea corectă!

const lessonContent = [
    {
        type: 'info',
        sections: [
            {
                title: 'Katakana Basics: Introduction',
                content: [
                    'Katakana are a type of Japanese character. Just like hiragana, each katakana character is used to represent a sound.In fact, they represent the exact same sounds as hiragana.\n\nSo how are they different, you ask?\nThe difference is in when you use them.',
                    '\nKatakana are used for various purposes, but they\'re mostly used to transcribe foreign words (often English). Sometimes, katakana are used for stylistic purposes as well.'
                ],
            },
            {
                title: 'The Katakana Chart - First Row (ア-オ)',
                characters: [
                    { char: 'ア', pronunciation: 'a', helper: 'ア has a deformed capital letter A in it. You have to turn your head to the side and connect some lines, but it\'s there.' },
                    { char: 'イ', pronunciation: 'i', helper: 'イ looks like an eagle standing on the ground, or on a branch, or wherever. See its legs and its back, curved down like an eagle\'s?' },
                    { char: 'ウ', pronunciation: 'u', helper: 'This katakana character looks a lot like its hiragana counterpart: う.\n\nIt should be similar enough to remember what it is.' },
                    { char: 'エ', pronunciation: 'e', helper: 'Imagine this is a girder an engineer would use to build a building. This character is in the shape of the end of a girder, and it\'s made up of them too.\n\nOr you can think of it like an elevator with its doors closed.' },
                    { char: 'オ', pronunciation: 'o', helper: 'This kana looks like an opera singer. His mouth is shaped like an o and he\'s singing "Ohhhh!".' },
                ],
            },
        ],
    },
    {
        type: 'exerciseGroup', // Nume nou pentru a indica un grup de exerciții
        exercises: [
            {
                exerciseType: 'recognition',
                question: 'Which character is "a"?',
                correctAnswer: 'ア',
                options: ['オ', 'ア', 'エ', 'イ'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "o"?',
                correctAnswer: 'オ',
                options: ['ウ', 'エ', 'オ', 'ア'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "e"?',
                correctAnswer: 'エ',
                options: ['エ', 'イ', 'オ', 'ウ'],
            },
        ],
    },

];

export default function KatakanaFirstRowPage() {
    return (
        <LessonPage 
            lessonContent={lessonContent} 
            lessonRoute="/(home)/lessons/katakana-basic/page" 
            lessonId="katakana-first-row" 
            backButtonText="Back to Katakana Basics"
        />
    );
}