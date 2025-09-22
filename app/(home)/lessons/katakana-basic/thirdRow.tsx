import LessonPage from '../LessonPage'; // Important: calea corectă!

const lessonContent = [
    {
        type: 'info',
        sections: [
            {
                title: 'The Katakana Chart - Third Row (サ-ソ)',
                characters: [
                    { char: 'サ', pronunciation: 'sa', helper: 'Look at these two fish that are hanging on a skewer. The small one is a sardine and the bigger one is a salmon.\n\nYou can also remember this is "sa" because fish are called さかな(sakana) in Japanese.' },
                    { char: 'シ', pronunciation: 'shi', helper: 'This kana looks like a smiley face, but something is wrong with it. Both eyes are sideways and stacked on top of each other like some deep sea fish. She has a very weird face.' },
                    { char: 'ス', pronunciation: 'su', helper: 'What\'s up there? It\'s Superman walking in the sky!\n\nWait - upon closer inspection, it\'s just his disembodied supersuit.' },
                    { char: 'セ', pronunciation: 'se', helper: 'It looks really similar to the hiragana せ, so you should be able to use that to remember this kana.' },
                    { char: 'ソ', pronunciation: 'so', helper: 'It is one needle and a long thread, which you use to sew. Remember, needles are always vertical like this needle, because you need to stab it through something, straight down. This will help you to differentiate this one and the very similar ン, the katakana for "n".' },
                ],
            },
        ],
    },
    {
        type: 'exerciseGroup', // Nume nou pentru a indica un grup de exerciții
        exercises: [
            {
                exerciseType: 'recognition',
                question: 'Which character is "su"?',
                correctAnswer: 'ス',
                options: ['シ', 'ス', 'サ', 'セ'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "so"?',
                correctAnswer: 'ソ',
                options: ['サ', 'シ', 'ソ', 'ス'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "sa"?',
                correctAnswer: 'サ',
                options: ['ス', 'サ', 'セ', 'ソ'],
            },
        ],
    },

];

export default function KatakanaThirdRowPage() {
    return (
        <LessonPage 
            lessonContent={lessonContent} 
            lessonRoute="/(home)/lessons/katakana-basic/page" 
            lessonId="katakana-third-row" 
            backButtonText="Back to Katakana Basics"

        />
    );
}