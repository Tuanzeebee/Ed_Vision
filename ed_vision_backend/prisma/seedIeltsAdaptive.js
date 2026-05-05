// seedIeltsAdaptive.js – IELTS Adaptive seed (MODIFIED)
// ⚠️  HARDCODED CONTENT FUNCTIONS DISABLED
// Learning content now imported from learning_content.json via seedLearningContent.js
// This file now only:
//   1. Creates test users and accounts
//   2. Seeds band test questions
//   3. Creates student roadmaps
// 
// For learning content (flashcards, practice, mini-test):
//   → Run: node prisma/seedLearningContent.js
//
// Skills: reading, listening, writing, speaking
'use strict';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const prisma = new PrismaClient();

async function getStudentRoleId() {
    const role = await prisma.role.findUnique({ where: { code: 'student' } });
    if (!role) throw new Error('Role "student" not found. Run base seed first.');
    return role.id;
}

async function upsertTestAccountAndStudent() {
    const roleId = await getStudentRoleId();
    const email = 'student.ielts@test.com';
    const passwordHash = await bcrypt.hash('student123', 10);
    const account = await prisma.account.upsert({
        where: { email },
        update: { status: 'active', role_id: roleId },
        create: { email, password_hash: passwordHash, status: 'active', role_id: roleId },
    });
    let student = await prisma.student.findUnique({ where: { account_id: account.account_id } });
    if (!student) {
        student = await prisma.student.create({
            data: { account_id: account.account_id, student_code: 'IELTS_TEST_001', status: 'active' },
        });
    }
    return { account, student };
}

async function upsertEnrollment(studentId) {
    let enrollment = await prisma.certificateEnrollment.findFirst({
        where: { student_id: studentId, cert_type: 'ielts', status: 'active' },
        orderBy: { id: 'desc' },
    });
    if (!enrollment) {
        enrollment = await prisma.certificateEnrollment.create({
            data: {
                student_id: studentId, cert_type: 'ielts', status: 'active',
                learning_status: 'in_progress', progress_percent: 0,
                current_score: 400, target_score: 450, reserve_points: 0,
                toeic_plan_state: { type: 'ielts', currentBand: 4.0, targetBand: 4.5 },
            },
        });
    }
    return enrollment;
}

async function upsertRepo({ title, slug, contentType, skill, topicGroup,
    estimatedMinutes, passScore, scoreMin, scoreMax, metadata }) {
    const bandTag = `band-${scoreMin / 100}-${scoreMax / 100}`;
    return prisma.learningRepository.upsert({
        where: { slug },
        update: {
            title, content_type: contentType, skill_area: skill, topic_group: topicGroup,
            difficulty_level: 'intermediate', target_score_min: scoreMin,
            target_score_max: scoreMax, estimated_minutes: estimatedMinutes,
            pass_score: passScore, metadata, is_published: true,
        },
        create: {
            cert_type: 'ielts', title, slug,
            description: `${title} – IELTS adaptive`,
            content_type: contentType, skill_area: skill, topic_group: topicGroup,
            difficulty_level: 'intermediate', target_score_min: scoreMin,
            target_score_max: scoreMax, estimated_minutes: estimatedMinutes,
            pass_score: passScore, tags: ['ielts', skill, contentType, bandTag],
            metadata, is_published: true,
        },
    });
}

async function upsertItem(repositoryId, itemOrder, {
    itemType, stem, readingPassage, mediaAudioUrl, hint, explanation,
    estimatedSeconds, scoreWeight, errorType, metadata: extraMeta,
}) {
    return prisma.learningRepositoryItem.upsert({
        where: { repository_id_item_order: { repository_id: repositoryId, item_order: itemOrder } },
        update: {
            item_type: itemType, stem, reading_passage: readingPassage ?? null,
            media_audio_url: mediaAudioUrl ?? null, hint: hint ?? null,
            explanation: explanation ?? null,
            difficulty_level: 'intermediate', score_weight: scoreWeight ?? 1,
            estimated_seconds: estimatedSeconds ?? 60,
            metadata: { errorType: errorType ?? 'general', severity: 2, ...(extraMeta ?? {}) },
        },
        create: {
            repository_id: repositoryId, item_order: itemOrder,
            item_type: itemType, stem, reading_passage: readingPassage ?? null,
            media_audio_url: mediaAudioUrl ?? null, hint: hint ?? null,
            explanation: explanation ?? null,
            difficulty_level: 'intermediate', score_weight: scoreWeight ?? 1,
            estimated_seconds: estimatedSeconds ?? 60,
            metadata: { errorType: errorType ?? 'general', severity: 2, ...(extraMeta ?? {}) },
        },
    });
}

async function upsertOptions(itemId, options) {
    for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        await prisma.learningRepositoryOption.upsert({
            where: { item_id_option_key: { item_id: itemId, option_key: opt.key } },
            update: { option_text: opt.text, is_correct: opt.correct, rationale: opt.rationale ?? null, sort_order: i + 1 },
            create: { item_id: itemId, option_key: opt.key, option_text: opt.text, is_correct: opt.correct, rationale: opt.rationale ?? null, sort_order: i + 1 },
        });
    }
}

async function addMCQ(repoId, order, { stem, optA, optB, optC, optD, correct, explanation, readingPassage, estimatedSeconds, errorType }) {
    const item = await upsertItem(repoId, order, {
        itemType: 'single_choice', stem, readingPassage, explanation,
        estimatedSeconds: estimatedSeconds ?? 60, errorType,
    });
    await upsertOptions(item.id, [
        { key: 'A', text: optA, correct: correct === 'A', rationale: correct === 'A' ? 'Correct.' : 'Incorrect.' },
        { key: 'B', text: optB, correct: correct === 'B', rationale: correct === 'B' ? 'Correct.' : 'Incorrect.' },
        { key: 'C', text: optC, correct: correct === 'C', rationale: correct === 'C' ? 'Correct.' : 'Incorrect.' },
        { key: 'D', text: optD, correct: correct === 'D', rationale: correct === 'D' ? 'Correct.' : 'Incorrect.' },
    ]);
    return item;
}

async function addTFNG(repoId, order, { stem, correct, explanation, readingPassage }) {
    const item = await upsertItem(repoId, order, {
        itemType: 'true_false_ng', stem, readingPassage, explanation,
        estimatedSeconds: 45, errorType: 'true_false_ng',
    });
    await upsertOptions(item.id, [
        { key: 'TRUE', text: 'True', correct: correct === 'TRUE' },
        { key: 'FALSE', text: 'False', correct: correct === 'FALSE' },
        { key: 'NOT_GIVEN', text: 'Not Given', correct: correct === 'NOT_GIVEN' },
    ]);
    return item;
}

async function addFlashcard(repoId, order, { front, back, hint }) {
    return upsertItem(repoId, order, {
        itemType: 'flashcard', stem: front, hint: back,
        explanation: hint ?? null, estimatedSeconds: 30, errorType: 'vocabulary',
    });
}

async function addGapFill(repoId, order, { stem, correctAnswer, explanation, estimatedSeconds }) {
    return upsertItem(repoId, order, {
        itemType: 'gap_fill', stem, explanation,
        estimatedSeconds: estimatedSeconds ?? 60, errorType: 'gap_fill',
        metadata: { correctAnswer, acceptedAnswers: [correctAnswer] },
    });
}

// ── Reading ───────────────────────────────────────────────────────────────────

const READING_PASSAGE_4 = `Urban farming is the practice of cultivating, processing, and distributing food in or around urban areas. Over the past decade, many cities have adopted urban farming as a way to reduce food miles, improve access to fresh produce, and create green spaces. Community gardens, rooftop farms, and vertical growing systems are among the most common forms of urban agriculture. Critics, however, argue that urban farms produce far less food per square metre than conventional farms and that the high start-up costs make them economically unviable without subsidies.`;

async function seedReadingBand(scoreMin, scoreMax, bandTag) {
    const fc = await upsertRepo({
        title: 'Reading – Urban Farming Flashcards', slug: `ielts-reading-flashcard-urban-farming-${bandTag}`,
        contentType: 'flashcard', skill: 'reading', topicGroup: 'urban_farming',
        estimatedMinutes: 10, passScore: 60, scoreMin, scoreMax,
        metadata: { bandMin: scoreMin / 100, bandMax: scoreMax / 100, lessonTemplate: 'flashcard', content: {} },
    });
    await addFlashcard(fc.id, 1, { front: 'Skimming', back: 'Reading quickly to grasp the main idea without reading every word.' });
    await addFlashcard(fc.id, 2, { front: 'Scanning', back: 'Reading quickly to locate specific information such as names, dates, or figures.' });
    await addFlashcard(fc.id, 3, { front: 'Topic sentence', back: 'The sentence that states the main idea of a paragraph, usually at the beginning.' });
    await addFlashcard(fc.id, 4, { front: 'Paraphrase', back: 'Expressing the same information using different words – essential for IELTS answers.' });
    await prisma.learningRepository.update({ where: { id: fc.id }, data: { total_items: 4 } });

    const ps = await upsertRepo({
        title: 'Reading – Urban Farming Practice Set', slug: `ielts-reading-practice-set-urban-farming-${bandTag}`,
        contentType: 'practice_set', skill: 'reading', topicGroup: 'urban_farming',
        estimatedMinutes: 15, passScore: 60, scoreMin, scoreMax,
        metadata: { bandMin: scoreMin / 100, bandMax: scoreMax / 100, lessonTemplate: 'reading_mcq', content: { passage: READING_PASSAGE_4 } },
    });
    await addMCQ(ps.id, 1, {
        stem: 'What is the main purpose of urban farming according to the passage?',
        optA: 'To compete with rural agriculture economically.',
        optB: 'To reduce food miles and improve access to fresh produce.',
        optC: 'To replace all conventional farming within a decade.',
        optD: 'To generate profit for city governments.',
        correct: 'B', explanation: 'The passage states cities adopted urban farming to reduce food miles and improve access to fresh produce.',
        readingPassage: READING_PASSAGE_4, errorType: 'skimming',
    });
    await addMCQ(ps.id, 2, {
        stem: 'Which of the following is listed as a common form of urban agriculture?',
        optA: 'Underground hydroponic tunnels.', optB: 'Floating river gardens.',
        optC: 'Rooftop farms.', optD: 'Greenhouse mega-complexes.',
        correct: 'C', explanation: 'The passage explicitly mentions rooftop farms.',
        readingPassage: READING_PASSAGE_4, errorType: 'scanning',
    });
    await addMCQ(ps.id, 3, {
        stem: 'What concern do critics raise about urban farms?',
        optA: 'They attract too many tourists.', optB: 'They pollute city water supplies.',
        optC: 'They are economically unviable without subsidies.', optD: 'They use excessive water.',
        correct: 'C', explanation: 'Critics argue high start-up costs make urban farms economically unviable without subsidies.',
        readingPassage: READING_PASSAGE_4, errorType: 'detail',
    });
    await addTFNG(ps.id, 4, {
        stem: 'Urban farming has been adopted by cities to create green spaces.',
        correct: 'TRUE', explanation: 'The passage explicitly states "create green spaces".',
        readingPassage: READING_PASSAGE_4,
    });
    await addTFNG(ps.id, 5, {
        stem: 'Urban farms produce more food per square metre than conventional farms.',
        correct: 'FALSE', explanation: 'Critics argue urban farms produce far LESS food per square metre.',
        readingPassage: READING_PASSAGE_4,
    });
    await prisma.learningRepository.update({ where: { id: ps.id }, data: { total_items: 5 } });

    const mt = await upsertRepo({
        title: 'Reading – Urban Farming Mini Test', slug: `ielts-reading-mini-test-urban-farming-${bandTag}`,
        contentType: 'mini_test', skill: 'reading', topicGroup: 'urban_farming',
        estimatedMinutes: 20, passScore: 60, scoreMin, scoreMax,
        metadata: { bandMin: scoreMin / 100, bandMax: scoreMax / 100, lessonTemplate: 'reading_mcq', content: { passage: READING_PASSAGE_4 } },
    });
    await addMCQ(mt.id, 1, {
        stem: 'The word "cultivating" in the passage is closest in meaning to:',
        optA: 'harvesting', optB: 'growing', optC: 'selling', optD: 'distributing',
        correct: 'B', explanation: 'Cultivating means growing or raising crops.',
        readingPassage: READING_PASSAGE_4, errorType: 'vocabulary',
    });
    await addMCQ(mt.id, 2, {
        stem: 'Over what time period have cities adopted urban farming?',
        optA: 'The last five years.', optB: 'The last twenty years.',
        optC: 'The last decade.', optD: 'Since the 1980s.',
        correct: 'C', explanation: '"Over the past decade" confirms ten years.',
        readingPassage: READING_PASSAGE_4, errorType: 'scanning',
    });
    await addTFNG(mt.id, 3, {
        stem: 'Vertical growing systems are mentioned as a form of urban agriculture.',
        correct: 'TRUE', explanation: 'The passage lists vertical growing systems explicitly.',
        readingPassage: READING_PASSAGE_4,
    });
    await addTFNG(mt.id, 4, {
        stem: 'Governments provide subsidies to all urban farms by law.',
        correct: 'NOT_GIVEN', explanation: 'No law is mentioned in the passage.',
        readingPassage: READING_PASSAGE_4,
    });
    await addMCQ(mt.id, 5, {
        stem: 'What does "food miles" most likely refer to?',
        optA: 'Nutritional value lost during transportation.',
        optB: 'The distance food travels from farm to consumer.',
        optC: 'The amount of food wasted during distribution.',
        optD: 'The cost of transporting food internationally.',
        correct: 'B', explanation: 'Food miles refers to the distance food travels from farm to consumer.',
        readingPassage: READING_PASSAGE_4, errorType: 'inference',
    });
    await prisma.learningRepository.update({ where: { id: mt.id }, data: { total_items: 5 } });

    return { flashcardRepoId: fc.id, practiceRepoId: ps.id, miniTestRepoId: mt.id };
}

// ── Listening ─────────────────────────────────────────────────────────────────

const AUDIO_SCRIPT = `[Part 1 – Phone call: student Sarah Johnson enquires about a room]
Agent: Good morning, City Housing Office, how can I help you?
Student: Hi, I'm looking for a room to rent near the university.
Agent: Of course. Could I take your name?
Student: Sarah Johnson.
Agent: Are you looking for a single room or a shared flat?
Student: A shared flat, if possible. My budget is around 450 pounds per month.
Agent: We have a three-bedroom flat on Maple Street. The monthly rent is 420 pounds per person.
Student: That sounds great. Is it furnished?
Agent: Yes, fully furnished. It also includes a washing machine.
Student: When would it be available?
Agent: From the first of September.
Student: I'd like to arrange a viewing. Is next Tuesday at 2 pm possible?
Agent: Yes, that works. I'll send you a confirmation email.`;

async function seedListeningBand(scoreMin, scoreMax, bandTag) {
    const fc = await upsertRepo({
        title: 'Listening – Everyday Conversations Flashcards', slug: `ielts-listening-flashcard-everyday-${bandTag}`,
        contentType: 'flashcard', skill: 'listening', topicGroup: 'everyday_conversations',
        estimatedMinutes: 8, passScore: 60, scoreMin, scoreMax,
        metadata: { bandMin: scoreMin / 100, bandMax: scoreMax / 100, lessonTemplate: 'flashcard', content: {} },
    });
    await addFlashcard(fc.id, 1, { front: 'Gist', back: 'The overall meaning or main point of what you hear – listen for the big picture first.' });
    await addFlashcard(fc.id, 2, { front: 'Signal words', back: 'Words indicating a topic change: "however", "in addition", "on the other hand".' });
    await addFlashcard(fc.id, 3, { front: 'Paraphrase trap', back: 'In IELTS Listening, the correct answer is often paraphrased – match meaning, not exact words.' });
    await addFlashcard(fc.id, 4, { front: 'Note completion', back: 'Fill gaps in notes – check word limits carefully (e.g., "NO MORE THAN TWO WORDS").' });
    await prisma.learningRepository.update({ where: { id: fc.id }, data: { total_items: 4 } });

    const ps = await upsertRepo({
        title: 'Listening – Housing Enquiry Practice Set', slug: `ielts-listening-practice-set-housing-${bandTag}`,
        contentType: 'practice_set', skill: 'listening', topicGroup: 'everyday_conversations',
        estimatedMinutes: 15, passScore: 60, scoreMin, scoreMax,
        metadata: { bandMin: scoreMin / 100, bandMax: scoreMax / 100, lessonTemplate: 'listening_mcq', content: { audio: { script: AUDIO_SCRIPT, url: null } } },
    });
    await addMCQ(ps.id, 1, {
        stem: "What type of accommodation is Sarah looking for?",
        optA: 'A single room.', optB: 'A shared flat.', optC: 'A studio apartment.', optD: 'A family house.',
        correct: 'B', explanation: 'Sarah says "A shared flat, if possible."', errorType: 'gist',
    });
    await addMCQ(ps.id, 2, {
        stem: "What is Sarah's monthly budget?",
        optA: '£400', optB: '£420', optC: '£450', optD: '£500',
        correct: 'C', explanation: 'Sarah states "My budget is around 450 pounds per month."', errorType: 'detail',
    });
    await addGapFill(ps.id, 3, {
        stem: 'The flat is located on ___ Street.',
        correctAnswer: 'Maple', explanation: 'The agent says "a three-bedroom flat on Maple Street".',
        estimatedSeconds: 45,
    });
    await addMCQ(ps.id, 4, {
        stem: 'Which appliance is included in the flat?',
        optA: 'Dishwasher.', optB: 'Tumble dryer.', optC: 'Microwave oven.', optD: 'Washing machine.',
        correct: 'D', explanation: 'The agent confirms "It also includes a washing machine."', errorType: 'detail',
    });
    await addGapFill(ps.id, 5, {
        stem: 'The flat is available from the first of ___.',
        correctAnswer: 'September', explanation: 'The agent states it is available from 1 September.',
        estimatedSeconds: 45,
    });
    await prisma.learningRepository.update({ where: { id: ps.id }, data: { total_items: 5 } });

    const mt = await upsertRepo({
        title: 'Listening – Housing Enquiry Mini Test', slug: `ielts-listening-mini-test-housing-${bandTag}`,
        contentType: 'mini_test', skill: 'listening', topicGroup: 'everyday_conversations',
        estimatedMinutes: 20, passScore: 60, scoreMin, scoreMax,
        metadata: { bandMin: scoreMin / 100, bandMax: scoreMax / 100, lessonTemplate: 'listening_mcq', content: { audio: { script: AUDIO_SCRIPT, url: null } } },
    });
    await addMCQ(mt.id, 1, {
        stem: 'What is the monthly rent for the flat?',
        optA: '£420', optB: '£440', optC: '£450', optD: '£460',
        correct: 'A', explanation: 'The agent says the monthly rent is 420 pounds per person.', errorType: 'detail',
    });
    await addMCQ(mt.id, 2, {
        stem: 'How many bedrooms does the flat have?',
        optA: 'One', optB: 'Two', optC: 'Three', optD: 'Four',
        correct: 'C', explanation: 'The agent mentions "a three-bedroom flat".', errorType: 'detail',
    });
    await addMCQ(mt.id, 3, {
        stem: 'When does Sarah want to arrange a viewing?',
        optA: 'Monday morning', optB: 'Tuesday afternoon', optC: 'Wednesday evening', optD: 'Thursday morning',
        correct: 'B', explanation: 'Sarah asks "Is next Tuesday at 2 pm possible?"', errorType: 'inference',
    });
    await addGapFill(mt.id, 4, {
        stem: 'The agent will send Sarah a confirmation ___.',
        correctAnswer: 'email', explanation: "The agent says 'I\\'ll send you a confirmation email.'",
        estimatedSeconds: 45,
    });
    await addMCQ(mt.id, 5, {
        stem: 'Is the flat furnished?',
        optA: 'Partially furnished.', optB: 'Unfurnished.', optC: 'Fully furnished.', optD: 'Not mentioned.',
        correct: 'C', explanation: 'The agent confirms "Yes, fully furnished."', errorType: 'detail',
    });
    await prisma.learningRepository.update({ where: { id: mt.id }, data: { total_items: 5 } });

    return { flashcardRepoId: fc.id, practiceRepoId: ps.id, miniTestRepoId: mt.id };
}

// ── Writing ───────────────────────────────────────────────────────────────────

const WRITING_PROMPT = `The graph below shows the percentage of households in four European countries that had internet access between 2005 and 2015. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.`;

async function seedWritingBand(scoreMin, scoreMax, bandTag) {
    const fc = await upsertRepo({
        title: 'Writing – Task 1 Graph Language Flashcards', slug: `ielts-writing-flashcard-graph-language-${bandTag}`,
        contentType: 'flashcard', skill: 'writing', topicGroup: 'task1_graph',
        estimatedMinutes: 10, passScore: 60, scoreMin, scoreMax,
        metadata: { bandMin: scoreMin / 100, bandMax: scoreMax / 100, lessonTemplate: 'flashcard', content: {} },
    });
    await addFlashcard(fc.id, 1, { front: 'Overview sentence', back: 'A sentence summarising the most significant overall trend(s) – always include one in Task 1.' });
    await addFlashcard(fc.id, 2, { front: 'Peak', back: '"reached a peak of", "peaked at" – use when describing the highest point on a graph.' });
    await addFlashcard(fc.id, 3, { front: 'Dramatic rise', back: '"rose sharply", "surged", "skyrocketed" – use for steep upward trends.' });
    await addFlashcard(fc.id, 4, { front: 'Steady decline', back: '"fell gradually", "dropped steadily", "decreased slightly" – use for gentle downward trends.' });
    await addFlashcard(fc.id, 5, { front: 'Fluctuation', back: '"fluctuated", "varied considerably", "showed no clear trend" – use for irregular movement.' });
    await prisma.learningRepository.update({ where: { id: fc.id }, data: { total_items: 5 } });

    const ps = await upsertRepo({
        title: 'Writing – Task 1 Graph Language Practice Set', slug: `ielts-writing-practice-set-graph-language-${bandTag}`,
        contentType: 'practice_set', skill: 'writing', topicGroup: 'task1_graph',
        estimatedMinutes: 15, passScore: 60, scoreMin, scoreMax,
        metadata: { bandMin: scoreMin / 100, bandMax: scoreMax / 100, lessonTemplate: 'writing_mcq', content: { writingPrompt: WRITING_PROMPT } },
    });
    await addMCQ(ps.id, 1, {
        stem: 'Which sentence best describes a general upward trend in a line graph?',
        optA: 'The proportion fluctuated throughout the period.',
        optB: 'The figure rose consistently over the ten-year period.',
        optC: 'There was a dramatic fall in the number of users.',
        optD: 'The data remained unchanged between 2005 and 2015.',
        correct: 'B', explanation: '"Rose consistently" correctly describes a sustained upward trend.', errorType: 'language',
    });
    await addMCQ(ps.id, 2, {
        stem: 'Which phrase is appropriate for describing a sharp decrease?',
        optA: 'increased marginally', optB: 'remained stable', optC: 'plummeted dramatically', optD: 'grew steadily',
        correct: 'C', explanation: '"Plummeted dramatically" correctly describes a rapid fall.', errorType: 'vocabulary',
    });
    await addMCQ(ps.id, 3, {
        stem: 'In IELTS Writing Task 1, the overview paragraph should:',
        optA: 'List every data point from the chart.',
        optB: 'Give your personal opinion on the data.',
        optC: 'Summarise the most significant overall trend(s) without specific figures.',
        optD: 'Repeat the question prompt word for word.',
        correct: 'C', explanation: 'The overview identifies major trends without specific figures.', errorType: 'task_achievement',
    });
    await addMCQ(ps.id, 4, {
        stem: 'Which is the correct paraphrase of "the percentage of households with internet access"?',
        optA: 'the proportion of homes that could connect to the internet',
        optB: 'the number of computers in each home',
        optC: 'the speed of internet connections across households',
        optD: 'the cost of internet access for average families',
        correct: 'A', explanation: '"The proportion of homes that could connect to the internet" paraphrases correctly.', errorType: 'paraphrase',
    });
    await addMCQ(ps.id, 5, {
        stem: 'What is the minimum word count for IELTS Writing Task 1?',
        optA: '100 words', optB: '120 words', optC: '150 words', optD: '200 words',
        correct: 'C', explanation: 'IELTS Task 1 requires at least 150 words.', errorType: 'task_achievement',
    });
    await prisma.learningRepository.update({ where: { id: ps.id }, data: { total_items: 5 } });

    const mt = await upsertRepo({
        title: 'Writing – Task 1 Graph Language Mini Test', slug: `ielts-writing-mini-test-graph-language-${bandTag}`,
        contentType: 'mini_test', skill: 'writing', topicGroup: 'task1_graph',
        estimatedMinutes: 20, passScore: 60, scoreMin, scoreMax,
        metadata: { bandMin: scoreMin / 100, bandMax: scoreMax / 100, lessonTemplate: 'writing_mcq', content: { writingPrompt: WRITING_PROMPT } },
    });
    await addMCQ(mt.id, 1, {
        stem: 'A sentence with specific figures (e.g. "rose from 30% to 75% between 2005 and 2010") is an example of:',
        optA: 'An overview sentence.', optB: 'A detailed data sentence.', optC: 'A conclusion.', optD: 'An introduction.',
        correct: 'B', explanation: 'A sentence including specific figures is a detailed data sentence, not an overview.', errorType: 'task_achievement',
    });
    await addMCQ(mt.id, 2, {
        stem: 'Which transition phrase best introduces a comparison between two countries?',
        optA: 'As a result,', optB: 'By contrast,', optC: 'Therefore,', optD: 'For instance,',
        correct: 'B', explanation: '"By contrast" signals a contrasting relationship.', errorType: 'cohesion',
    });
    await addMCQ(mt.id, 3, {
        stem: 'Which is NOT a feature of a good Task 1 response?',
        optA: 'An accurate description of the data.',
        optB: 'A clear overview of main trends.',
        optC: 'A personal opinion about the data.',
        optD: 'Paraphrasing of the task prompt.',
        correct: 'C', explanation: 'IELTS Task 1 is descriptive – personal opinions are not appropriate.', errorType: 'task_achievement',
    });
    await addTFNG(mt.id, 4, {
        stem: '"Rose steadily" and "increased gradually" are synonymous and interchangeable in Task 1.',
        correct: 'TRUE', explanation: 'Both phrases describe a slow, consistent increase and can be used interchangeably.',
    });
    await addMCQ(mt.id, 5, {
        stem: 'What does "Coherence and Cohesion" assess in the IELTS Writing band descriptors?',
        optA: 'Vocabulary range and accuracy.',
        optB: 'The logical organisation of ideas and use of linking devices.',
        optC: 'Grammar accuracy and sentence complexity.',
        optD: 'The number of words in the response.',
        correct: 'B', explanation: 'Coherence and Cohesion assesses how logically information is organised and connected.', errorType: 'meta_knowledge',
    });
    await prisma.learningRepository.update({ where: { id: mt.id }, data: { total_items: 5 } });

    return { flashcardRepoId: fc.id, practiceRepoId: ps.id, miniTestRepoId: mt.id };
}

// ── Speaking ──────────────────────────────────────────────────────────────────

const SPEAKING_PROMPT = `IELTS Speaking Part 1 – Hobbies: Do you have any hobbies? What do you enjoy doing in your free time? How long have you had this hobby? Have your hobbies changed since you were a child?`;

async function seedSpeakingBand(scoreMin, scoreMax, bandTag) {
    const fc = await upsertRepo({
        title: 'Speaking – Part 1 Fluency Flashcards', slug: `ielts-speaking-flashcard-part1-fluency-${bandTag}`,
        contentType: 'flashcard', skill: 'speaking', topicGroup: 'part1_fluency',
        estimatedMinutes: 10, passScore: 60, scoreMin, scoreMax,
        metadata: { bandMin: scoreMin / 100, bandMax: scoreMax / 100, lessonTemplate: 'flashcard', content: {} },
    });
    await addFlashcard(fc.id, 1, {
        front: 'Filler phrases', back: '"Well, that\'s a good question..." – buy thinking time without losing fluency.'
    });
    await addFlashcard(fc.id, 2, { front: 'Extend your answer', back: 'Always add a reason or example: "I enjoy cooking because it is very relaxing."' });
    await addFlashcard(fc.id, 3, { front: '"Used to" for past habits', back: '"I used to play football" = I did it regularly in the past but no longer do.' });
    await addFlashcard(fc.id, 4, { front: 'Word stress', back: 'Stress the most important word: "I LOVE cooking" vs "I love COOKING."' });
    await prisma.learningRepository.update({ where: { id: fc.id }, data: { total_items: 4 } });

    const ps = await upsertRepo({
        title: 'Speaking – Part 1 Hobbies Practice Set', slug: `ielts-speaking-practice-set-hobbies-${bandTag}`,
        contentType: 'practice_set', skill: 'speaking', topicGroup: 'part1_fluency',
        estimatedMinutes: 15, passScore: 60, scoreMin, scoreMax,
        metadata: { bandMin: scoreMin / 100, bandMax: scoreMax / 100, lessonTemplate: 'speaking_mcq', content: { speakingPrompt: SPEAKING_PROMPT } },
    });
    await addMCQ(ps.id, 1, {
        stem: 'Which phrase best extends the answer to "Do you enjoy cooking?"',
        optA: 'Yes, I do.', optB: 'No, not really.',
        optC: 'Yes, I do. I find it very relaxing after a long day.', optD: 'Cooking is okay.',
        correct: 'C', explanation: 'Option C adds a reason, making the answer much more developed.', errorType: 'fluency',
    });
    await addMCQ(ps.id, 2, {
        stem: 'What is the main purpose of filler phrases in Speaking Part 1?',
        optA: 'To impress the examiner with advanced vocabulary.',
        optB: 'To fill silence while organising your thoughts.',
        optC: 'To avoid answering questions you find difficult.',
        optD: 'To demonstrate your knowledge of idioms.',
        correct: 'B', explanation: 'Fillers maintain fluency by giving you a moment to think.', errorType: 'strategy',
    });
    await addMCQ(ps.id, 3, {
        stem: 'Which sentence demonstrates the correct use of "used to"?',
        optA: 'I am used to playing tennis every day.',
        optB: 'I used to playing tennis as a child.',
        optC: 'I used to play tennis when I was younger.',
        optD: 'I use to play tennis on weekends.',
        correct: 'C', explanation: '"Used to" + base verb correctly describes a past habit.', errorType: 'grammar',
    });
    await addMCQ(ps.id, 4, {
        stem: 'For IELTS Speaking Part 1, answers should typically be:',
        optA: '1-2 sentences with a reason or example.',
        optB: 'A single yes/no answer.',
        optC: 'At least 5 minutes long.',
        optD: 'Memorised responses from a script.',
        correct: 'A', explanation: 'Part 1 answers should be 2–3 sentences: direct answer + reason/example.', errorType: 'strategy',
    });
    await addMCQ(ps.id, 5, {
        stem: 'Which IELTS Speaking criterion assesses vocabulary range and accuracy?',
        optA: 'Fluency and Coherence.', optB: 'Grammatical Range and Accuracy.',
        optC: 'Lexical Resource.', optD: 'Pronunciation.',
        correct: 'C', explanation: 'Lexical Resource assesses vocabulary range, accuracy, and appropriacy.', errorType: 'meta_knowledge',
    });
    await prisma.learningRepository.update({ where: { id: ps.id }, data: { total_items: 5 } });

    const mt = await upsertRepo({
        title: 'Speaking – Part 1 Hobbies Mini Test', slug: `ielts-speaking-mini-test-hobbies-${bandTag}`,
        contentType: 'mini_test', skill: 'speaking', topicGroup: 'part1_fluency',
        estimatedMinutes: 20, passScore: 60, scoreMin, scoreMax,
        metadata: { bandMin: scoreMin / 100, bandMax: scoreMax / 100, lessonTemplate: 'speaking_mcq', content: { speakingPrompt: SPEAKING_PROMPT } },
    });
    await addMCQ(mt.id, 1, {
        stem: 'What technique improves delivery and avoids monotone speech?',
        optA: 'Speaking as quickly as possible.',
        optB: 'Varying pitch, stress, and speed to emphasise key points.',
        optC: 'Using the same sentence structure for every answer.',
        optD: 'Avoiding pauses entirely.',
        correct: 'B', explanation: 'Varying pitch and stress improves pronunciation scores.', errorType: 'pronunciation',
    });
    await addMCQ(mt.id, 2, {
        stem: 'Which connector introduces a contrasting idea in a speaking answer?',
        optA: 'Furthermore', optB: 'In addition', optC: 'However', optD: 'Therefore',
        correct: 'C', explanation: '"However" introduces a contrasting or qualifying idea.', errorType: 'cohesion',
    });
    await addMCQ(mt.id, 3, {
        stem: 'In the context of IELTS Speaking, "lexical flexibility" means:',
        optA: 'Speaking very fast without making mistakes.',
        optB: 'Being able to communicate around unknown words without losing meaning.',
        optC: 'Memorising long lists of vocabulary.',
        optD: 'Using only formal academic vocabulary.',
        correct: 'B', explanation: 'Lexical flexibility means being able to paraphrase even when a word is unknown.', errorType: 'vocabulary',
    });
    await addMCQ(mt.id, 4, {
        stem: 'The four IELTS Speaking criteria are equally weighted at 25% each.',
        optA: 'True', optB: 'False', optC: 'Not Given', optD: 'Partially true',
        correct: 'A', explanation: 'Each of the four criteria (Fluency, Lexical, Grammar, Pronunciation) counts 25%.', errorType: 'meta_knowledge',
    });
    await addMCQ(mt.id, 5, {
        stem: 'Which structure is correct for describing a past hobby you no longer do?',
        optA: 'I am used to play tennis.',
        optB: 'I used to play tennis when I was younger.',
        optC: 'I used to playing tennis every weekend.',
        optD: 'I use to play tennis now.',
        correct: 'B', explanation: '"Used to" + base verb (infinitive without to) is the correct structure.', errorType: 'grammar',
    });
    await prisma.learningRepository.update({ where: { id: mt.id }, data: { total_items: 5 } });

    return { flashcardRepoId: fc.id, practiceRepoId: ps.id, miniTestRepoId: mt.id };
}

// ── Band test questions (seed từ JSON file) ────────────────────────────────

function stripComments(str) {
    return str.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

async function seedBandTestQuestionsFromJSON() {
    console.log('  Seeding band test questions from JSON...');

    const jsonPath = path.join(__dirname, 'questions', 'band_test_questions.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ Không tìm thấy file:', jsonPath);
        return;
    }

    const raw = fs.readFileSync(jsonPath, 'utf-8');
    let parsed;
    try {
        parsed = JSON.parse(stripComments(raw));
    } catch (e) {
        console.error('❌ JSON parse error:', e.message);
        return;
    }

    const questions = parsed.questions;
    console.log(`  📦 Đọc ${questions.length} câu hỏi từ JSON...`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const q of questions) {
        if (!q.id || !q.skill || !q.type || !q.stem) {
            console.warn(`  ⚠️  Bỏ qua câu thiếu field bắt buộc: ${JSON.stringify(q).slice(0, 80)}`);
            skipped++;
            continue;
        }

        // Map type → itemType enum
        const typeMap = {
            single_choice: 'single_choice',
            true_false_ng: 'true_false_ng',
            gap_fill: 'gap_fill',
        };
        const questionType = typeMap[q.type] ?? 'single_choice';

        // Chuẩn bị options JSON
        const optionsJson = q.options
            ? q.options.map((o) => ({
                key: o.key,
                text: o.text,
                isCorrect: o.isCorrect,
            }))
            : null;

        // estimatedSeconds theo difficulty
        const defaultSeconds = {
            easy: { reading: 50, listening: 35, grammar: 30, vocabulary: 25, writing: 600, speaking: 60 },
            medium: { reading: 70, listening: 50, grammar: 45, vocabulary: 40, writing: 900, speaking: 120 },
            hard: { reading: 90, listening: 65, grammar: 60, vocabulary: 55, writing: 1200, speaking: 120 },
        };
        const estimatedSeconds =
            q.estimatedSeconds ??
            (defaultSeconds[q.difficulty ?? 'medium']?.[q.skill] ?? 60);

        try {
            const existing = await prisma.ieltsQuestion.findFirst({
                where: {
                    questionText: q.stem,
                    skill: q.skill,
                },
            });

            // difficultyWeight: easy=0.8, medium=1.0, hard=1.3
            const difficultyWeightMap = { easy: 0.8, medium: 1.0, hard: 1.3 };
            const diffWeight = difficultyWeightMap[q.difficulty ?? 'medium'] ?? 1.0;

            const correctAnswer =
                q.correctAnswer ??
                (optionsJson?.find((o) => o.isCorrect)?.key ?? 'WRITING_TASK');

            const data = {
                questionType,
                skill: q.skill,
                questionText: q.stem,
                options: optionsJson ?? undefined,
                correctAnswer,
                explanation: q.explanation ?? null,
                difficultyWeight: diffWeight,
                bandMin: q.bandMin ?? 4.0,
                bandMax: q.bandMax ?? 7.5,
                expectedTimeSec: estimatedSeconds,
                errorTag: q.errorType ?? null,
                status: 'active',
            };

            if (existing) {
                await prisma.ieltsQuestion.update({
                    where: { id: existing.id },
                    data,
                });
                updated++;
            } else {
                await prisma.ieltsQuestion.create({ data });
                created++;
            }
        } catch (err) {
            console.error(`  ❌ Lỗi câu ${q.id}:`, err.message);
            skipped++;
        }
    }

    console.log(`  ✅ Hoàn tất:`);
    console.log(`     ➕ Tạo mới : ${created}`);
    console.log(`     🔄 Cập nhật: ${updated}`);
    console.log(`     ⚠️  Bỏ qua  : ${skipped}`);
}

// ── Test users with roadmaps ───────────────────────────────────────────────────

/**
 * 5 test accounts, each at a different starting band, targeting a different
 * destination band, with a different completion deadline.
 *
 * email / password: ielts.band<X>@test.com / ielts123
 *
 * Band profile:
 *  1. band40 – current 4.0 → target 5.0  | 3 months  (beginner sprint)
 *  2. band45 – current 4.5 → target 5.5  | 4 months  (intermediate step)
 *  3. band50 – current 5.0 → target 6.0  | 6 months  (steady climb)
 *  4. band55 – current 5.5 → target 6.5  | 5 months  (upper-intermediate)
 *  5. band60 – current 6.0 → target 7.0  | 8 months  (advanced push)
 */
const TEST_USERS = [
    {
        email: 'ielts.band40@test.com',
        studentCode: 'IELTS_B40_001',
        currentBand: 4.0, targetBand: 5.0,
        currentScore: 400, targetScore: 500,
        monthsToComplete: 3,
        difficultyLevel: 'beginner',
        label: 'Band 4.0 → 5.0 (3 months)',
    },
    {
        email: 'ielts.band45@test.com',
        studentCode: 'IELTS_B45_001',
        currentBand: 4.5, targetBand: 5.5,
        currentScore: 450, targetScore: 550,
        monthsToComplete: 4,
        difficultyLevel: 'beginner',
        label: 'Band 4.5 → 5.5 (4 months)',
    },
    {
        email: 'ielts.band50@test.com',
        studentCode: 'IELTS_B50_001',
        currentBand: 5.0, targetBand: 6.0,
        currentScore: 500, targetScore: 600,
        monthsToComplete: 6,
        difficultyLevel: 'intermediate',
        label: 'Band 5.0 → 6.0 (6 months)',
    },
    {
        email: 'ielts.band55@test.com',
        studentCode: 'IELTS_B55_001',
        currentBand: 5.5, targetBand: 6.5,
        currentScore: 550, targetScore: 650,
        monthsToComplete: 5,
        difficultyLevel: 'intermediate',
        label: 'Band 5.5 → 6.5 (5 months)',
    },
    {
        email: 'ielts.band60@test.com',
        studentCode: 'IELTS_B60_001',
        currentBand: 6.0, targetBand: 7.0,
        currentScore: 600, targetScore: 700,
        monthsToComplete: 8,
        difficultyLevel: 'advanced',
        label: 'Band 6.0 → 7.0 (8 months)',
    },
];

/** Find repos for a given band range. Returns null if not seeded yet. */
async function findReposForBand(scoreMin, scoreMax) {
    const bandTag = `band-${scoreMin / 100}-${scoreMax / 100}`;
    const skills = ['reading', 'listening', 'writing', 'speaking'];
    const result = {};
    for (const skill of skills) {
        const fc = await prisma.learningRepository.findUnique({ where: { slug: `ielts-${skill}-flashcard-${skill === 'reading' ? 'urban-farming' : skill === 'listening' ? 'everyday' : skill === 'writing' ? 'graph-language' : 'part1-fluency'}-${bandTag}` } });
        const ps = await prisma.learningRepository.findUnique({ where: { slug: `ielts-${skill}-practice-set-${skill === 'reading' ? 'urban-farming' : skill === 'listening' ? 'housing' : skill === 'writing' ? 'graph-language' : 'hobbies'}-${bandTag}` } });
        const mt = await prisma.learningRepository.findUnique({ where: { slug: `ielts-${skill}-mini-test-${skill === 'reading' ? 'urban-farming' : skill === 'listening' ? 'housing' : skill === 'writing' ? 'graph-language' : 'hobbies'}-${bandTag}` } });
        result[skill] = { fc, ps, mt };
    }
    return result;
}

/**
 * Build the ordered lesson list for a roadmap that spans multiple band ranges.
 * Each band range contributes 4 skills × 3 content types = 12 lessons.
 * Lessons are interleaved by skill so the learner rotates across all 4 skills.
 */
async function buildLessonSequence(bandRanges) {
    const skills = ['reading', 'listening', 'writing', 'speaking'];
    const skillLabels = {
        reading: 'Reading', listening: 'Listening',
        writing: 'Writing', speaking: 'Speaking',
    };
    const lessons = [];

    for (const [scoreMin, scoreMax] of bandRanges) {
        const repos = await findReposForBand(scoreMin, scoreMax);
        const bandLabel = `Band ${scoreMin / 100}→${scoreMax / 100}`;

        // interleave: R-fc, L-fc, W-fc, S-fc, R-ps, L-ps, W-ps, S-ps, R-mt, L-mt, W-mt, S-mt
        for (const phase of ['fc', 'ps', 'mt']) {
            const phaseLabel = phase === 'fc' ? 'Flashcards' : phase === 'ps' ? 'Practice' : 'Mini Test';
            for (const skill of skills) {
                const repo = repos[skill]?.[phase];
                if (!repo) continue;
                lessons.push({
                    skill_area: skill,
                    lesson_title: `${skillLabels[skill]} – ${phaseLabel} (${bandLabel})`,
                    band_level: scoreMin / 100,
                    flashcard_repo_id: phase === 'fc' ? repo.id : null,
                    practice_repo_id: phase === 'ps' ? repo.id : null,
                    mini_test_repo_id: phase === 'mt' ? repo.id : null,
                    estimated_minutes: phase === 'fc' ? 10 : phase === 'ps' ? 15 : 20,
                });
            }
        }
    }
    return lessons;
}

/** Map currentBand → which band ranges to include in the roadmap */
function bandRangesForUser(currentBand, targetBand) {
    const ALL_RANGES = [[400, 450], [450, 500], [500, 550]];
    // Only include ranges that start at or above currentBand (×100) and end at or below targetBand (×100)
    return ALL_RANGES.filter(([min, max]) => min >= currentBand * 100 && max <= targetBand * 100);
}

async function seedTestUsers() {
    const roleId = await getStudentRoleId();
    const passwordHash = await bcrypt.hash('ielts123', 10);

    for (const u of TEST_USERS) {
        console.log(`  Seeding test user: ${u.label}`);

        // 1. Account
        const account = await prisma.account.upsert({
            where: { email: u.email },
            update: { status: 'active', role_id: roleId },
            create: { email: u.email, password_hash: passwordHash, status: 'active', role_id: roleId },
        });

        // 2. Profile
        await prisma.profile.upsert({
            where: { account_id: account.account_id },
            update: {},
            create: {
                account_id: account.account_id,
                full_name: `Test Student (${u.label})`,
                gender: 'other',
            },
        });

        // 3. Student
        let student = await prisma.student.findUnique({ where: { account_id: account.account_id } });
        if (!student) {
            student = await prisma.student.create({
                data: { account_id: account.account_id, student_code: u.studentCode, status: 'active' },
            });
        }

        // 4. Enrollment
        let enrollment = await prisma.certificateEnrollment.findFirst({
            where: { student_id: student.student_id, cert_type: 'ielts', status: 'active' },
        });
        const completionDate = new Date();
        completionDate.setMonth(completionDate.getMonth() + u.monthsToComplete);

        if (!enrollment) {
            enrollment = await prisma.certificateEnrollment.create({
                data: {
                    student_id: student.student_id,
                    cert_type: 'ielts',
                    status: 'active',
                    learning_status: 'in_progress',
                    progress_percent: 0,
                    current_score: u.currentScore,
                    target_score: u.targetScore,
                    reserve_points: 0,
                    toeic_plan_state: {
                        type: 'ielts',
                        currentBand: u.currentBand,
                        targetBand: u.targetBand,
                        completionDate: completionDate.toISOString(),
                    },
                },
            });
        }

        // 5. Roadmap (skip if already exists)
        const existingRoadmap = await prisma.ieltsAdaptiveRoadmap.findUnique({
            where: { enrollment_id: enrollment.id },
        });
        if (existingRoadmap) {
            console.log(`    Roadmap already exists for ${u.email}, skipping.`);
            continue;
        }

        // 6. Build lesson definitions
        const ranges = bandRangesForUser(u.currentBand, u.targetBand);
        if (ranges.length === 0) {
            console.log(`    No seeded band ranges overlap for ${u.label}, skipping roadmap.`);
            continue;
        }
        const lessonDefs = await buildLessonSequence(ranges);
        if (lessonDefs.length === 0) {
            console.log(`    No lessons found for ${u.label}, skipping roadmap.`);
            continue;
        }

        // 7. Create roadmap with lessons
        const roadmap = await prisma.ieltsAdaptiveRoadmap.create({
            data: {
                enrollment_id: enrollment.id,
                current_band: u.currentBand,
                target_band: u.targetBand,
                target_completion_date: completionDate,
                roadmap_version: 1,
                difficulty_level: u.difficultyLevel,
                lesson_sequence: [],   // filled after lessons are created
                current_lesson_index: 0,
                status: 'active',
            },
        });

        // 8. Create lessons and spread scheduled_date evenly across timeline
        const totalDays = u.monthsToComplete * 30;
        const daysPerLesson = Math.max(1, Math.floor(totalDays / lessonDefs.length));
        const lessonIds = [];

        for (let i = 0; i < lessonDefs.length; i++) {
            const def = lessonDefs[i];
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + i * daysPerLesson);

            const lesson = await prisma.ieltsLesson.create({
                data: {
                    roadmap_id: roadmap.id,
                    skill_area: def.skill_area,
                    lesson_title: def.lesson_title,
                    lesson_order: i + 1,
                    band_level: def.band_level,
                    flashcard_repo_id: def.flashcard_repo_id,
                    practice_repo_id: def.practice_repo_id,
                    mini_test_repo_id: def.mini_test_repo_id,
                    estimated_minutes: def.estimated_minutes,
                    status: i === 0 ? 'unlocked' : 'locked',
                    scheduled_date: scheduledDate,
                },
            });
            lessonIds.push(lesson.id);
        }

        // 9. Patch lesson_sequence
        await prisma.ieltsAdaptiveRoadmap.update({
            where: { id: roadmap.id },
            data: { lesson_sequence: lessonIds },
        });

        console.log(`    Created roadmap #${roadmap.id} with ${lessonIds.length} lessons for ${u.email}`);
    }
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log('Seeding IELTS Adaptive data...');
    console.log('');
    console.log('⚠️  NOTE: Hardcoded content seeding has been DISABLED.');
    console.log('   Learning content now comes from learning_content.json');
    console.log('   Run: node prisma/seedLearningContent.js to seed content');
    console.log('');

    const { account, student } = await upsertTestAccountAndStudent();
    const enrollment = await upsertEnrollment(student.student_id);

    // ❌ DISABLED: Hardcoded content seeding
    // These functions create duplicate content with same passages for all bands
    // Instead, use seedLearningContent.js which imports from learning_content.json
    /*
    console.log('  Seeding Band 4.0→4.5 repos...');
    await Promise.all([
        seedReadingBand(400, 450, 'band-4.0-4.5'),
        seedListeningBand(400, 450, 'band-4.0-4.5'),
        seedWritingBand(400, 450, 'band-4.0-4.5'),
        seedSpeakingBand(400, 450, 'band-4.0-4.5'),
    ]);

    console.log('  Seeding Band 4.5→5.0 repos...');
    await Promise.all([
        seedReadingBand(450, 500, 'band-4.5-5.0'),
        seedListeningBand(450, 500, 'band-4.5-5.0'),
        seedWritingBand(450, 500, 'band-4.5-5.0'),
        seedSpeakingBand(450, 500, 'band-4.5-5.0'),
    ]);

    console.log('  Seeding Band 5.0→5.5 repos...');
    await Promise.all([
        seedReadingBand(500, 550, 'band-5.0-5.5'),
        seedListeningBand(500, 550, 'band-5.0-5.5'),
        seedWritingBand(500, 550, 'band-5.0-5.5'),
        seedSpeakingBand(500, 550, 'band-5.0-5.5'),
    ]);
    */

    // ❌ DISABLED: Band test questions are now seeded from JSON file
    console.log('  Seeding band test questions from JSON file...');
    await seedBandTestQuestionsFromJSON();

    console.log('  Seeding 5 test users with roadmaps...');
    await seedTestUsers();

    console.log('');
    console.log('✅ Done!');
    console.log(`   Account: ${account.email}`);
    console.log(`   Student ID: ${student.student_id}`);
    console.log(`   Enrollment ID: ${enrollment.id}`);
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Run: node prisma/seedLearningContent.js (for learning content)');
    console.log('   2. Run: node check-content-diversity.js (verify no duplicates)');
    console.log('');
}

main()
    .catch((e) => { console.error('IELTS seed failed:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
