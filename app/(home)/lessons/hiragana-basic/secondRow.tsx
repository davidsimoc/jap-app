import LessonPage from '../LessonPage'; // Important: calea corectă!

const lessonContent = [
    {
        type: 'info',
        sections: [
            {
                title: 'The Hiragana Chart - Second Row (か-こ)',
                characters: [
                    { char: 'か', pronunciation: 'ka', helper: 'See how this kana looks like a musquito? What a convenient coincidence! Musquitos happen to be called か in Japanese.' },
                    { char: 'き', pronunciation: 'ki', helper: 'Notice how the shape of き resembles a key?\n\nNote: In some fonts, the bottom part is detached frommain part.' },
                    { char: 'く', pronunciation: 'ku', helper: 'To remember this, think of this kana being a mouth of a coo-coo / cuckoo bird popping out and saying "ku ku, ku ku!".' },
                    { char: 'け', pronunciation: 'ke', helper: 'See how this kana resembles some wiggly kelp?' },
                    { char: 'こ', pronunciation: 'ko', helper: 'こ is a couple of co-habitating worms. They\'re so happy together, co-habitating the same area!' },
                ],
            },
        ],
    },
    {
        type: 'exerciseGroup', // Nume nou pentru a indica un grup de exerciții
        exercises: [
            {
                exerciseType: 'recognition',
                question: 'Which character is "ki"?',
                correctAnswer: 'き',
                options: ['か', 'き', 'く', 'け'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "ka"?',
                correctAnswer: 'か',
                options: ['け', 'き', 'こ', 'か'],
            },
            {
                exerciseType: 'recognition',
                question: 'Which character is "ke"?',
                correctAnswer: 'け',
                options: ['く', 'か', 'け', 'こ'],
            },
        ],
    },

];



export default function HiraganaSecondRowPage() {
    return (
        <LessonPage 
            lessonContent={lessonContent} 
            lessonRoute="/(home)/lessons/hiragana-basic/page" 
            lessonId="hiragana-second-row" 
            backButtonText="Back to Hiragana Basics"

        />
    );
}