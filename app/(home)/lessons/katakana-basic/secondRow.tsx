import LessonPage from '../LessonPage'; // Important: calea corectă!

const lessonContent = [
    {
        type: 'info',
        sections: [
            {
                title: 'The Hiragana Chart - Second Row (カ-コ)',
                characters: [
                    { char: 'カ', pronunciation: 'ka', helper: 'It looks just like hiragana か, though it\'s missing that little extra line. Close enough to make it easy to remember, though' },
                    { char: 'キ', pronunciation: 'ki', helper: 'It looks like the hiragana き (the top part at least) and also looks like part of a weird key.' },
                    { char: 'ク', pronunciation: 'ku', helper: 'This looks like a long cook\'s hat. What are they hiding under there?!' },
                    { char: 'ケ', pronunciation: 'ke', helper: 'It looks like the letter K!' },
                    { char: 'コ', pronunciation: 'ko', helper: 'See the two 90 degree corners? The two corners are what help you to remember this is "ko".' },
                ],
            },
        ],
    },
    {
        type: 'exerciseGroup', // Nume nou pentru a indica un grup de exerciții
        exercises: [
            {
                exerciseType: 'recognition',
                question: 'Which character is "ke"?',
                correctAnswer: 'ケ',
                options: ['ク', 'キ', 'ケ', 'コ'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "ko"?',
                correctAnswer: 'コ',
                options: ['コ', 'ケ', 'カ', 'キ'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "ku"?',
                correctAnswer: 'ク',
                options: ['ケ', 'コ', 'キ', 'ク'],
            },
        ],
    },

];


export default function KatakanaSecondRowPage() {
    return (
        <LessonPage 
            lessonContent={lessonContent} 
            lessonRoute="/(home)/lessons/katakana-basic/page" 
            lessonId="katakana-second-row" 
            backButtonText="Back to Katakana Basics"

        />
    );
}