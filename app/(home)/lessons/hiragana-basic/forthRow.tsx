import LessonPage from '../LessonPage'; // Important: calea corectă!

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
        type: 'exerciseGroup', // Nume nou pentru a indica un grup de exerciții
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
    return (
        <LessonPage 
            lessonContent={lessonContent} 
            lessonRoute="/(home)/lessons/hiragana-basic/page" 
            lessonId="hiragana-forth-row" 
            backButtonText="Back to Hiragana Basics"

        />
    );
}