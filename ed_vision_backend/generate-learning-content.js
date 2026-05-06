// generate-learning-content.js - Tạo learning_content.json cho tất cả bands 1.0-9.0
const fs = require('fs');
const path = require('path');

// Band configurations với progressive difficulty
const bands = [
    { code: 'band10', level: 1.0, min: 100, max: 140, label: 'Band 1.0', difficulty: 'absolute beginner', words: 50, estimatedSec: { flashcard: 15, practice: 20, miniTest: 25 } },
    { code: 'band15', level: 1.5, min: 150, max: 190, label: 'Band 1.5', difficulty: 'beginner', words: 80, estimatedSec: { flashcard: 18, practice: 25, miniTest: 30 } },
    { code: 'band20', level: 2.0, min: 200, max: 240, label: 'Band 2.0', difficulty: 'elementary', words: 100, estimatedSec: { flashcard: 20, practice: 30, miniTest: 35 } },
    { code: 'band25', level: 2.5, min: 250, max: 290, label: 'Band 2.5', difficulty: 'pre-intermediate', words: 150, estimatedSec: { flashcard: 22, practice: 35, miniTest: 40 } },
    { code: 'band30', level: 3.0, min: 300, max: 340, label: 'Band 3.0', difficulty: 'lower intermediate', words: 180, estimatedSec: { flashcard: 25, practice: 40, miniTest: 45 } },
    { code: 'band35', level: 3.5, min: 350, max: 390, label: 'Band 3.5', difficulty: 'intermediate', words: 200, estimatedSec: { flashcard: 28, practice: 45, miniTest: 50 } },
    { code: 'band40', level: 4.0, min: 400, max: 440, label: 'Band 4.0', difficulty: 'intermediate', words: 220, estimatedSec: { flashcard: 30, practice: 45, miniTest: 55 } },
    { code: 'band45', level: 4.5, min: 450, max: 490, label: 'Band 4.5', difficulty: 'upper intermediate', words: 250, estimatedSec: { flashcard: 32, practice: 50, miniTest: 60 } },
    { code: 'band50', level: 5.0, min: 500, max: 540, label: 'Band 5.0', difficulty: 'upper intermediate', words: 280, estimatedSec: { flashcard: 35, practice: 55, miniTest: 65 } },
    { code: 'band55', level: 5.5, min: 550, max: 590, label: 'Band 5.5', difficulty: 'advanced intermediate', words: 320, estimatedSec: { flashcard: 38, practice: 60, miniTest: 70 } },
    { code: 'band60', level: 6.0, min: 600, max: 640, label: 'Band 6.0', difficulty: 'advanced', words: 350, estimatedSec: { flashcard: 40, practice: 65, miniTest: 75 } },
    { code: 'band65', level: 6.5, min: 650, max: 690, label: 'Band 6.5', difficulty: 'advanced', words: 400, estimatedSec: { flashcard: 45, practice: 70, miniTest: 80 } },
    { code: 'band70', level: 7.0, min: 700, max: 740, label: 'Band 7.0', difficulty: 'highly advanced', words: 450, estimatedSec: { flashcard: 50, practice: 75, miniTest: 90 } },
    { code: 'band75', level: 7.5, min: 750, max: 790, label: 'Band 7.5', difficulty: 'highly advanced', words: 500, estimatedSec: { flashcard: 55, practice: 80, miniTest: 100 } },
    { code: 'band80', level: 8.0, min: 800, max: 840, label: 'Band 8.0', difficulty: 'expert', words: 600, estimatedSec: { flashcard: 60, practice: 90, miniTest: 110 } },
    { code: 'band85', level: 8.5, min: 850, max: 890, label: 'Band 8.5', difficulty: 'expert', words: 700, estimatedSec: { flashcard: 65, practice: 100, miniTest: 120 } },
    { code: 'band90', level: 9.0, min: 900, max: 1000, label: 'Band 9.0', difficulty: 'native-like', words: 800, estimatedSec: { flashcard: 70, practice: 110, miniTest: 130 } },
];

// Sample content templates for each difficulty level
const contentTemplates = {
    reading: {
        'absolute beginner': 'Hello. My name is Tom. I am {age} years old. I live in {city}. I have a {pet}.',
        'beginner': 'My name is {name}. I am a student. I go to school every day. My school is {adj}. I have many friends.',
        'elementary': 'My Daily Routine. I wake up at {time} every morning. First, I brush my teeth. Then I have breakfast.',
        'pre-intermediate': 'Public Libraries. Public libraries are important places in every community. They provide free access to books and computers.',
        'lower intermediate': 'Public Transport. Public transport systems such as buses and trains help reduce traffic congestion in cities.',
        'intermediate': 'Environmental Benefits of Recycling. Recycling is the process of converting waste materials into new products. This helps reduce landfill waste.',
        'upper intermediate': 'The Impact of Social Media. Social media platforms have transformed how people communicate and share information globally.',
        'advanced intermediate': 'Climate Change and Renewable Energy. Scientists worldwide are researching sustainable energy solutions to combat climate change.',
        'advanced': 'Artificial Intelligence in Healthcare. AI systems are increasingly being used to assist doctors in diagnosing diseases and planning treatments.',
        'highly advanced': 'Quantum Computing Revolution. Quantum computers leverage quantum mechanical phenomena to perform calculations exponentially faster than classical computers.',
        'expert': 'Neuroplasticity and Cognitive Enhancement. Recent neuroscience research has demonstrated the brain\'s remarkable capacity for structural and functional reorganization throughout the lifespan.',
        'native-like': 'Epistemological Challenges in Post-Modern Philosophy. Contemporary philosophical discourse grapples with fundamental questions about the nature of knowledge, truth, and reality in an increasingly complex world.',
    },
};

// Generate flashcard for a skill and band
function generateFlashcard(skill, band, index) {
    const terms = {
        reading: ['passage', 'paragraph', 'main idea', 'detail', 'inference', 'context', 'summarize', 'analyze'],
        listening: ['audio', 'speaker', 'conversation', 'announcement', 'accent', 'pronunciation', 'intonation', 'dialogue'],
        grammar: ['tense', 'verb', 'noun', 'adjective', 'clause', 'sentence', 'subject', 'predicate', 'modal', 'passive'],
        vocabulary: ['synonym', 'antonym', 'collocation', 'idiom', 'phrase', 'expression', 'academic', 'formal'],
    };

    const term = terms[skill][index % terms[skill].length];
    return {
        term,
        definition: `Definition for ${term} at ${band.label} level`,
        hint: `Example usage of ${term}`,
    };
}

// Generate practice question
function generatePractice(skill, band, index) {
    return {
        type: index % 3 === 0 ? 'true_false_ng' : 'single_choice',
        stem: `Question ${index + 1} for ${skill} at ${band.label}: Sample question stem?`,
        options: index % 3 === 0 ? [
            { key: 'True', text: 'True', isCorrect: true },
            { key: 'False', text: 'False', isCorrect: false },
            { key: 'NG', text: 'Not Given', isCorrect: false },
        ] : [
            { key: 'A', text: 'Option A', isCorrect: true },
            { key: 'B', text: 'Option B', isCorrect: false },
            { key: 'C', text: 'Option C', isCorrect: false },
            { key: 'D', text: 'Option D', isCorrect: false },
        ],
        explanation: `Explanation for ${skill} question at ${band.label}`,
        estimatedSeconds: band.estimatedSec.practice,
        errorType: skill === 'reading' ? 'Đọc hiểu chi tiết' : skill === 'listening' ? 'Nghe chi tiết' : skill === 'grammar' ? 'Ngữ pháp' : 'Từ vựng',
    };
}

// Generate complete content for all bands
function generateAllContent() {
    const content = {};

    for (const band of bands) {
        content[band.code] = {
            reading: {
                passage: contentTemplates.reading[band.difficulty] || `Sample reading passage for ${band.label} with approximately ${band.words} words.`,
                flashcards: [0, 1, 2].map(i => generateFlashcard('reading', band, i)),
                practice: [0, 1].map(i => generatePractice('reading', band, i)),
                miniTest: [generatePractice('reading', band, 0)],
            },
            listening: {
                audioScript: `[${band.label} Listening]\nSample audio script for ${band.difficulty} level.`,
                mediaAudioUrl: `https://cdn.example.com/ielts/${band.code}-listening.mp3`,
                flashcards: [0, 1, 2].map(i => generateFlashcard('listening', band, i)),
                practice: [0, 1].map(i => ({ ...generatePractice('listening', band, i), mediaAudioUrl: `https://cdn.example.com/ielts/${band.code}-listening.mp3` })),
                miniTest: [{ ...generatePractice('listening', band, 0), mediaAudioUrl: `https://cdn.example.com/ielts/${band.code}-listening.mp3` }],
            },
            grammar: {
                flashcards: [0, 1, 2].map(i => generateFlashcard('grammar', band, i)),
                practice: [0, 1].map(i => generatePractice('grammar', band, i)),
                miniTest: [generatePractice('grammar', band, 0)],
            },
            vocabulary: {
                flashcards: [0, 1, 2].map(i => generateFlashcard('vocabulary', band, i)),
                practice: [0, 1].map(i => generatePractice('vocabulary', band, i)),
                miniTest: [generatePractice('vocabulary', band, 0)],
            },
        };
    }

    return content;
}

// Main execution
const output = {
    _instructions: 'Learning content cho IELTS từ Band 1.0 đến 9.0. Mỗi band có 4 skills (reading, listening, grammar, vocabulary) với flashcards, practice, miniTest. ĐỘ KHÓ TĂNG DẦN theo band.',
    _totalBands: bands.length,
    _bandRanges: bands.map(b => `${b.code}: ${b.min}-${b.max} (${b.label})`),
    content: generateAllContent(),
};

const outputPath = path.join(__dirname, 'prisma', 'learning_content', 'learning_content.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

console.log(`\n✅ Generated learning_content.json with ${bands.length} band levels!`);
console.log(`📊 File location: ${outputPath}`);
console.log(`📝 Total bands: ${Object.keys(output.content).length}`);
console.log(`\n🎯 Band levels generated:`);
bands.forEach(b => {
    console.log(`   ${b.code} (${b.label}): Score ${b.min}-${b.max}, ${b.difficulty}`);
});
console.log(`\n💡 Next steps:`);
console.log(`   1. Review and customize content for each band`);
console.log(`   2. Run: node prisma/seedLearningContent.js`);
console.log(`   3. Verify: node check-content-diversity.js\n`);
