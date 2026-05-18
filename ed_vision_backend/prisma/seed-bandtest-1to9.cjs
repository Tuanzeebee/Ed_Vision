'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const QUESTIONS_PER_BAND_SKILL = 8;
const AUDIO_PLACEHOLDER_URL = 'https://example.com/audio/ielts-listening-placeholder.mp3';

const SKILLS = ['reading', 'listening', 'writing', 'speaking'];

const PLACES = ['library', 'museum', 'station', 'clinic', 'campus', 'market', 'gallery', 'community center'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMES = ['7:30 am', '8:00 am', '9:00 am', '10:30 am', '2:00 pm', '4:30 pm'];
const FEES = ['$5', '$8', '$10', '$12', '$15', '$20'];
const TOPICS = ['education', 'health', 'travel', 'technology', 'environment', 'work', 'culture', 'sports'];

const WRITING_TOPICS = ['public transport', 'online learning', 'city parks', 'healthy diets', 'remote work', 'tourism'];
const SPEAKING_TOPICS = ['a favorite place', 'a recent trip', 'a useful app', 'a local event', 'a hobby'];

function bandSteps() {
  const steps = [];
  for (let b = 1.0; b <= 9.0 + 0.001; b += 0.5) {
    steps.push(Number(b.toFixed(1)));
  }
  return steps;
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

function bandRange(band) {
  const max = Math.min(9.0, Number((band + 0.5).toFixed(1)));
  return { bandMin: band, bandMax: max };
}

function bandTag(band) {
  return `band_${band.toFixed(1).replace('.', '_')}`;
}

function difficultyWeight(band) {
  if (band < 4.0) return 0.8;
  if (band < 6.0) return 1.0;
  if (band < 7.5) return 1.2;
  return 1.4;
}

function expectedTimeSec(skill, band) {
  const base = {
    reading: 70,
    listening: 55,
    writing: 900,
    speaking: 120,
  };
  const factor = 1 + (band - 5) * 0.04;
  const raw = Math.max(30, Math.round(base[skill] * factor));
  return raw;
}

function bandMid(bandMin, bandMax) {
  return Number(((bandMin + bandMax) / 2).toFixed(2));
}

function bandToIrtB(mid) {
  const denom = 5.5 / 6;
  return Number(((mid - 6.25) / denom).toFixed(2));
}

function buildMcqOptions(correctText, distractors, seed) {
  const cleanDistractors = distractors.filter((d) => d !== correctText);
  const picks = [];
  for (let i = 0; i < cleanDistractors.length && picks.length < 3; i++) {
    const d = cleanDistractors[(seed + i) % cleanDistractors.length];
    if (!picks.includes(d)) picks.push(d);
  }
  while (picks.length < 3) {
    picks.push(`Other option ${picks.length + 1}`);
  }
  const correctIndex = seed % 4;
  const labels = ['A', 'B', 'C', 'D'];
  const values = [];
  let dIndex = 0;
  for (let i = 0; i < 4; i++) {
    if (i === correctIndex) {
      values.push(correctText);
    } else {
      values.push(picks[dIndex]);
      dIndex += 1;
    }
  }
  const options = values.map((text, i) => ({
    key: labels[i],
    text,
    isCorrect: i === correctIndex,
  }));
  return { options, correctAnswer: labels[correctIndex] };
}

function buildTfngOptions(correctKey) {
  const keys = ['TRUE', 'FALSE', 'NOT_GIVEN'];
  return {
    options: keys.map((k) => ({ key: k, text: k, isCorrect: k === correctKey })),
    correctAnswer: correctKey,
  };
}

function buildReadingQuestion(band, idx) {
  const place = pick(PLACES, idx + 1);
  const day = pick(DAYS, idx + 2);
  const time = pick(TIMES, idx + 3);
  const fee = pick(FEES, idx + 4);
  const topic = pick(TOPICS, idx + 5);
  const passage = `The ${place} offers ${topic} activities for local residents. It opens at ${time} on ${day}. Entry costs ${fee}. Short tours are available for visitors.`;

  const mode = idx % 4;
  if (mode === 0) {
    const questionText = `Band ${band.toFixed(1)} Reading\n[PASSAGE] "${passage}"\nQuestion: When does the ${place} open on ${day}?`;
    const mcq = buildMcqOptions(time, TIMES, idx + 10);
    return {
      questionType: 'single_choice',
      subSkillCode: 'detail',
      questionText,
      options: mcq.options,
      correctAnswer: mcq.correctAnswer,
      explanation: 'The passage states the opening time directly.',
      errorTag: 'detail',
      topicTag: topic,
    };
  }

  if (mode === 1) {
    const questionText = `Band ${band.toFixed(1)} Reading\n[PASSAGE] "${passage}"\nQuestion: How much is the entry fee?`;
    const mcq = buildMcqOptions(fee, FEES, idx + 11);
    return {
      questionType: 'single_choice',
      subSkillCode: 'detail',
      questionText,
      options: mcq.options,
      correctAnswer: mcq.correctAnswer,
      explanation: 'The fee is stated in the passage.',
      errorTag: 'detail',
      topicTag: topic,
    };
  }

  if (mode === 2) {
    const tfMode = ['TRUE', 'FALSE', 'NOT_GIVEN'][idx % 3];
    const statement =
      tfMode === 'TRUE'
        ? `Statement: The ${place} opens at ${time} on ${day}.`
        : tfMode === 'FALSE'
          ? `Statement: The ${place} opens at ${pick(TIMES, idx + 20)} on ${day}.`
          : `Statement: The ${place} provides free parking for visitors.`;
    const questionText = `Band ${band.toFixed(1)} Reading\n[PASSAGE] "${passage}"\n${statement}`;
    const tfng = buildTfngOptions(tfMode);
    return {
      questionType: 'true_false_ng',
      subSkillCode: 'detail',
      questionText,
      options: tfng.options,
      correctAnswer: tfng.correctAnswer,
      explanation: 'Check the statement against the passage.',
      errorTag: 'detail',
      topicTag: topic,
    };
  }

  const questionText = `Band ${band.toFixed(1)} Reading\n[PASSAGE] "${passage}"\nQuestion: What is the main idea of the passage?`;
  const correctText = `Basic information about the ${place} schedule and services.`;
  const mcq = buildMcqOptions(correctText, [
    'A detailed history of the place and its founders.',
    'A report on national travel statistics.',
    'A critique of local government policy.',
  ], idx + 12);
  return {
    questionType: 'single_choice',
    subSkillCode: 'main_idea',
    questionText,
    options: mcq.options,
    correctAnswer: mcq.correctAnswer,
    explanation: 'The passage focuses on basic schedule and services.',
    errorTag: 'main_idea',
    topicTag: topic,
  };
}

function buildListeningQuestion(band, idx) {
  const place = pick(PLACES, idx + 30);
  const day = pick(DAYS, idx + 31);
  const time = pick(TIMES, idx + 32);
  const fee = pick(FEES, idx + 33);
  const topic = pick(TOPICS, idx + 34);
  const transcript = `A staff member announces that the ${place} opens at ${time} on ${day}. The ticket costs ${fee}. Visitors can join a short ${topic} tour.`;

  const passageTitle = `Listening Band ${band.toFixed(1)} Q${String(idx + 1).padStart(2, '0')}`;

  const mode = idx % 3;
  if (mode === 0) {
    const questionText = `Band ${band.toFixed(1)} Listening\n[TRANSCRIPT] "${transcript}"\nQuestion: When does the ${place} open on ${day}?`;
    const mcq = buildMcqOptions(time, TIMES, idx + 40);
    return {
      passageTitle,
      passageContent: transcript,
      questionType: 'single_choice',
      subSkillCode: 'detail',
      questionText,
      options: mcq.options,
      correctAnswer: mcq.correctAnswer,
      explanation: 'The announcement states the opening time.',
      errorTag: 'detail',
      topicTag: topic,
    };
  }

  if (mode === 1) {
    const questionText = `Band ${band.toFixed(1)} Listening\n[TRANSCRIPT] "${transcript}"\nQuestion: How much is the ticket?`;
    const mcq = buildMcqOptions(fee, FEES, idx + 41);
    return {
      passageTitle,
      passageContent: transcript,
      questionType: 'single_choice',
      subSkillCode: 'detail',
      questionText,
      options: mcq.options,
      correctAnswer: mcq.correctAnswer,
      explanation: 'The ticket price is given in the transcript.',
      errorTag: 'detail',
      topicTag: topic,
    };
  }

  const questionText = `Band ${band.toFixed(1)} Listening\n[TRANSCRIPT] "${transcript}"\nComplete the sentence: The ticket costs ____.`;
  return {
    passageTitle,
    passageContent: transcript,
    questionType: 'gap_fill',
    subSkillCode: 'detail',
    questionText,
    options: [],
    correctAnswer: fee,
    explanation: 'Use the stated price from the transcript.',
    errorTag: 'detail',
    topicTag: topic,
  };
}

function buildWritingQuestion(band, idx) {
  const topic = pick(WRITING_TOPICS, idx + 50);
  const taskType = idx % 2 === 0 ? 'Task 1' : 'Task 2';
  const prompt =
    taskType === 'Task 1'
      ? `Describe the main features of a chart about ${topic}.`
      : `Discuss the advantages and disadvantages of ${topic}.`;
  const questionText = `Band ${band.toFixed(1)} Writing ${taskType}: ${prompt}`;
  return {
    questionType: 'gap_fill',
    subSkillCode: taskType === 'Task 1' ? 'task_achievement' : 'task_response',
    questionText,
    options: [],
    correctAnswer: 'WRITING_TASK',
    explanation: 'Provide a structured response that addresses the prompt.',
    errorTag: 'task_response',
    topicTag: topic,
  };
}

function buildSpeakingQuestion(band, idx) {
  const topic = pick(SPEAKING_TOPICS, idx + 70);
  const part = idx % 3 === 0 ? 'Part 1' : idx % 3 === 1 ? 'Part 2' : 'Part 3';
  const prompt =
    part === 'Part 1'
      ? `Tell me about ${topic}.`
      : part === 'Part 2'
        ? `Describe ${topic} and explain why it is important to you.`
        : `Do you think ${topic} will change in the future? Why?`;
  const questionText = `Band ${band.toFixed(1)} Speaking ${part}: ${prompt}`;
  return {
    questionType: 'gap_fill',
    subSkillCode: 'fluency',
    questionText,
    options: [],
    correctAnswer: 'SPEAKING_TASK',
    explanation: 'Respond naturally and give relevant details.',
    errorTag: 'fluency',
    topicTag: topic,
  };
}

async function upsertPassage({ title, content, bandMin, bandMax, topicTag }) {
  const existing = await prisma.ieltsPassage.findFirst({
    where: { title, skill: 'listening' },
    select: { id: true },
  });

  const data = {
    skill: 'listening',
    title,
    content,
    band_min: bandMin,
    band_max: bandMax,
    topic_tags: [topicTag, 'seed_bandtest_1to9'],
    audio_url: AUDIO_PLACEHOLDER_URL,
    status: 'active',
  };

  if (existing) {
    const updated = await prisma.ieltsPassage.update({
      where: { id: existing.id },
      data,
      select: { id: true },
    });
    return updated.id;
  }

  const created = await prisma.ieltsPassage.create({
    data,
    select: { id: true },
  });
  return created.id;
}

async function upsertQuestion(data) {
  const existing = await prisma.ieltsQuestion.findFirst({
    where: {
      questionText: data.questionText,
      skill: data.skill,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.ieltsQuestion.update({
      where: { id: existing.id },
      data,
    });
    return 'updated';
  }

  await prisma.ieltsQuestion.create({ data });
  return 'created';
}

async function main() {
  console.log('Seeding band test question pool (1.0-9.0)...');

  let created = 0;
  let updated = 0;
  let passages = 0;

  for (const band of bandSteps()) {
    const { bandMin, bandMax } = bandRange(band);
    const mid = bandMid(bandMin, bandMax);
    const irtB = bandToIrtB(mid);
    const bandTagValue = bandTag(band);

    for (const skill of SKILLS) {
      for (let i = 0; i < QUESTIONS_PER_BAND_SKILL; i++) {
        const seedKey = `BT1T9-${skill}-${bandTagValue}-${String(i + 1).padStart(2, '0')}`;
        let q;
        let passageId;

        if (skill === 'reading') {
          q = buildReadingQuestion(band, i);
        } else if (skill === 'listening') {
          q = buildListeningQuestion(band, i);
          passageId = await upsertPassage({
            title: q.passageTitle,
            content: q.passageContent,
            bandMin,
            bandMax,
            topicTag: q.topicTag,
          });
          passages += 1;
        } else if (skill === 'writing') {
          q = buildWritingQuestion(band, i);
        } else if (skill === 'speaking') {
          q = buildSpeakingQuestion(band, i);
        } else {
          continue;
        }

        const questionType = q.questionType;
        const irtC = questionType === 'true_false_ng' ? 0.33 : questionType === 'gap_fill' ? 0.0 : 0.25;
        const timeSec = expectedTimeSec(skill, band);

        const result = await upsertQuestion({
          skill,
          subSkillCode: q.subSkillCode,
          questionType,
          questionText: `${seedKey}: ${q.questionText}`,
          options: q.options && q.options.length > 0 ? q.options : undefined,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          bandMin,
          bandMax,
          difficultyWeight: difficultyWeight(band),
          expectedTimeSec: timeSec,
          errorTag: q.errorTag,
          topicTags: [q.topicTag, bandTagValue, 'seed_bandtest_1to9'],
          status: 'active',
          irtA: 1.0,
          irtB,
          irtC,
          isPlacement: false,
          contextType: skill === 'listening' ? 'audio' : 'standalone',
          passage: passageId ? { connect: { id: passageId } } : undefined,
        });

        if (result === 'created') created += 1;
        if (result === 'updated') updated += 1;
      }
    }
  }

  console.log('Done.');
  console.log(`Questions created: ${created}`);
  console.log(`Questions updated: ${updated}`);
  console.log(`Listening passages upserted: ${passages}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
