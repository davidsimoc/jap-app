import LessonPage from '../LessonPage'; // Important: calea corectă!

const lessonContent = [
    {
        type: 'info',
        sections: [
            {
                title: 'The Hiragana Chart - Third Row (さ-そ)',
                characters: [
                    { char: 'さ', pronunciation: 'sa', helper: 'Notice how this kana looks like two hands stiring a bowl of salsa.' },
                    { char: 'し', pronunciation: 'shi', helper: 'This kana looks like a giant shelpherd\'s crook used to herd sheep.\n\nTake note that this is the first "exception" kana that doesn\'t follow the patterns that show up everywhere else. Instead of being si, it\'s shi.' },
                    { char: 'す', pronunciation: 'su', helper: 'See the swing doing a loop-dee-loop and throwing that poor kid off of it?\n\nImagine him screeming "I\'M GONNA SUE SOMEBODY FOR THIIIiisss" as he flies off into the distance.' },
                    { char: 'せ', pronunciation: 'se', helper: 'This kana looks like a mouth with a big vampire fang in it. Someone\'s trying to sell you a set of vampire teeth.' },
                    { char: 'そ', pronunciation: 'so', helper: 'See how this kana looks like a mouth slurping soda?' },
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
                correctAnswer: 'す',
                options: ['す', 'さ', 'し', 'せ'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "sa"?',
                correctAnswer: 'さ',
                options: ['そ', 'し', 'さ', 'す'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "se"?',
                correctAnswer: 'せ',
                options: ['し', 'せ', 'さ', 'す'],
            },
        ],
    },

];


export default function HiraganaThirdRowPage() {
    return (
        <LessonPage 
            lessonContent={lessonContent} 
            lessonRoute="/(home)/lessons/hiragana-basic/page" 
            lessonId="hiragana-third-row" 
            backButtonText="Back to Hiragana Basics"

        />
    );
}