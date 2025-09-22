import LessonPage from '../LessonPage'; // Important: calea corectă!

const lessonContent = [
    {
        type: 'info',
        sections: [
            {
                title: 'The Katakana Chart - Forth Row (タ-ト)',
                characters: [
                    { char: 'タ', pronunciation: 'ta', helper: 'タ looks like a kite. Kites are called たこ(tako) in Japanese. This is actually a taco kite, too. It looks like a giant taco glying high in the sky. Tacos are all rage tese days!' },
                    { char: 'チ', pronunciation: 'chi', helper: 'Doesn\'t this look like a cheerleader doing a cheer? Hope they don\'t fall over.' },
                    { char: 'ツ', pronunciation: 'tsu', helper: 'While ソ(so) had one needle and thread, ツ has two needles and thread.\n\nRemember, needles are vertical, this will help you to differentiate this one from シ(shi), which has more horizontal lines.' },
                    { char: 'テ', pronunciation: 'te', helper: 'This kana looks like a telephone pole.' },
                    { char: 'ト', pronunciation: 'to', helper: 'It looks just like a totem pole.' },
                ],
            },
        ],
    },
    {
        type: 'exerciseGroup', // Nume nou pentru a indica un grup de exerciții
        exercises: [
            {
                exerciseType: 'recognition',
                question: 'Which character is "chi"?',
                correctAnswer: 'チ',
                options: ['ト', 'ツ', 'タ', 'チ'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "tsu"?',
                correctAnswer: 'ツ',
                options: ['チ', 'タ', 'ツ', 'テ'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "te"?',
                correctAnswer: 'テ',
                options: ['タ', 'テ', 'チ', 'ツ'],
            },
        ],
    },

];

export default function KatakanaForthRowPage() {
    return (
        <LessonPage 
            lessonContent={lessonContent} 
            lessonRoute="/(home)/lessons/katakana-basic/page" 
            lessonId="katakana-forth-row" 
            backButtonText="Back to Katakana Basics"

        />
    );
}