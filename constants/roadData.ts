export type LessonStep =
    | { type: 'story'; text: string; image?: string }
    | { type: 'vocabulary'; items: { word: string; reading: string; romaji: string; meaning: string }[] }
    | { type: 'grammar'; title: string; explanation: string; examples?: { japanese: string; reading?: string; english: string }[] }
    | { type: 'quiz'; question: string; options: string[]; correctAnswer: string }
    | { type: 'match'; pairs: { left: string; right: string }[] }
    | { type: 'listening'; audioText: string; question: string; options: string[]; correctAnswer: string }
    | { type: 'arrange'; sentence: string; translation: string; jumbledWords: string[] };

export type RoadNode = {
    id: string;
    chapterId: string;
    title: string;
    type: 'story' | 'mission' | 'quiz' | 'boss';
    position: { x: number; y: number };
    status: 'locked' | 'unlocked' | 'completed';
    steps: LessonStep[];
    souvenir?: { id: string; name: string; icon?: string };
};

export type Chapter = {
    id: string;
    title: string;
    order: number;
};

export const CHAPTERS: Chapter[] = [
    { id: 'ch1', title: 'Chapter 1: THE ARRIVAL', order: 1 },
    { id: 'ch2', title: 'Chapter 2: TOKYO IMMERSION', order: 2 },
];

export const INITIAL_ROAD_DATA: RoadNode[] = [
    {
        id: '1',
        chapterId: 'ch1',
        title: 'Landing in Narita',
        type: 'story',
        position: { x: 50, y: 150 }, // Header will be at 30 (Perfectly visible at top)
        status: 'unlocked',
        steps: [
            {
                type: 'story',
                text: "Welcome to Japan! You've just arrived at Narita Airport. Yuki is here to help you start your journey. Let's learn some basic greetings."
            },
            {
                type: 'vocabulary',
                items: [
                    { word: "こんにちは", reading: "こんにちは", romaji: "konnichiwa", meaning: "hello" },
                    { word: "ありがとう", reading: "ありがとう", romaji: "arigatou", meaning: "thank you" }
                ]
            },
            {
                type: 'match',
                pairs: [
                    { left: "Konnichiwa", right: "Hello" },
                    { left: "Arigatou", right: "Thank you" }
                ]
            }
        ],
        souvenir: { id: "stamp1", name: "Entry Stamp", icon: "airplane-outline" }
    },
    {
        id: '1.2',
        chapterId: 'ch1',
        title: 'Politeness 101',
        type: 'story',
        position: { x: 80, y: 390 }, // Gap: 240
        status: 'locked',
        steps: [
            {
                type: 'grammar',
                title: "The Magic Particle: Wa",
                explanation: "In Japanese, we use particles to show what a word does. 'Wa' (written as は) marks the topic of your sentence. It's like saying 'As for...'",
                examples: [
                    { japanese: "私はユキです。", reading: "watashi wa yuki desu", english: "I am Yuki. (As for me, I am Yuki)" }
                ]
            },
            {
                type: 'vocabulary',
                items: [
                    { word: "私", reading: "わたし", romaji: "watashi", meaning: "I / Me" },
                    { word: "です", reading: "です", romaji: "desu", meaning: "am / is / are" }
                ]
            }
        ],
        souvenir: { id: "suica1", name: "Suica Card", icon: "card-outline" }
    },
    {
        id: '1.5',
        chapterId: 'ch1',
        title: 'Customs Advice',
        type: 'story',
        position: { x: 25, y: 630 },
        status: 'locked',
        steps: [
            {
                type: 'story',
                text: "Japanese people bow when they say hello. It's a sign of respect! If you're unsure, 'Sumimasen' is your best friend."
            },
            {
                type: 'vocabulary',
                items: [
                    { word: "すみません", reading: "すみません", romaji: "sumimasen", meaning: "excuse me" }
                ]
            }
        ],
        souvenir: { id: "passport1", name: "Passport Stamp", icon: "qr-code-outline" }
    },
    {
        id: '1.8',
        chapterId: 'ch1',
        title: 'Airport Quiz',
        type: 'quiz',
        position: { x: 70, y: 870 },
        status: 'locked',
        steps: [
            {
                type: 'quiz',
                question: "How do you attract someone's attention politely?",
                options: ["Konnichiwa", "Sumimasen", "Arigatou", "Sayounara"],
                correctAnswer: "Sumimasen"
            },
            {
                type: 'quiz',
                question: "What does 'Arigatou' mean?",
                options: ["Hello", "Excuse me", "Thank you", "Please"],
                correctAnswer: "Thank you"
            },
            {
                type: 'quiz',
                question: "Which particle marks the topic of a sentence?",
                options: ["Ka", "No", "Wa", "Ni"],
                correctAnswer: "Wa"
            }
        ]
    },
    {
        id: '2',
        chapterId: 'ch1',
        title: 'The Train Station',
        type: 'mission',
        position: { x: 35, y: 1110 },
        status: 'locked',
        steps: [
            {
                type: 'story',
                text: "To get to Tokyo, we need a ticket. Let's ask for one politely!"
            },
            {
                type: 'vocabulary',
                items: [
                    { word: "切符", reading: "きっぷ", romaji: "kippu", meaning: "ticket" },
                    { word: "お願いします", reading: "おねがいします", romaji: "onegaishimasu", meaning: "please" }
                ]
            },
            {
                type: 'arrange',
                sentence: "Kippu onegaishimasu",
                translation: "Ticket, please",
                jumbledWords: ["onegaishimasu", "Kippu"]
            }
        ]
    },
    {
        id: '3',
        chapterId: 'ch2',
        title: 'Tokyo Bound',
        type: 'mission',
        position: { x: 50, y: 1450 }, // Gap for Chapter 2
        status: 'locked',
        steps: [
            {
                type: 'story',
                text: "We are on the train! It's quiet and fast. Listen to the announcement for our destination."
            },
            {
                type: 'listening',
                audioText: "Tsugi wa Tokyo eki desu.",
                question: "Where is the train going?",
                options: ["Narita", "Tokyo", "Osaka", "Kyoto"],
                correctAnswer: "Tokyo"
            }
        ],
        souvenir: { id: "ticket1", name: "Tokyo Ticket", icon: "train-outline" }
    },
    {
        id: '4',
        chapterId: 'ch2',
        title: 'First Konbini',
        type: 'story',
        position: { x: 20, y: 1690 },
        status: 'locked',
        steps: [
            {
                type: 'story',
                text: "Tokyo! Finally. I'm hungry. Let's find a Konbini for a quick snack."
            },
            {
                type: 'vocabulary',
                items: [
                    { word: "おにぎり", reading: "おにぎり", romaji: "onigiri", meaning: "rice ball" },
                    { word: "お茶", reading: "おちゃ", romaji: "ocha", meaning: "tea" }
                ]
            }
        ],
        souvenir: { id: "onigiri1", name: "Onigiri Sticker", icon: "fast-food-outline" }
    }
];
