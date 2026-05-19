/**
 * seed-placement-extra.cjs
 * ────────────────────────────────────────────────────────────
 * +90 câu bổ sung cho Placement Test (Vocabulary 30 + Listening 30 + Writing 30)
 * Phân bố irt_b đều từ -3.20 → +2.00 để tránh lỗi
 *   "Pool placement không đủ câu cho theta=X, skills=..."
 *
 * Chạy:  node prisma/seed-placement-extra.cjs
 * ────────────────────────────────────────────────────────────
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const QUESTIONS = [
  // ═══════════════════════════════════════════════════════════
  // ██  VOCABULARY  (30 câu)
  // ═══════════════════════════════════════════════════════════

  // ── Band 3.0–4.0  (irt_b: -3.20 → -2.50) ─────────────────
  { skill: 'vocabulary', sub_skill_code: 'synonym', question_type: 'mcq',
    question_text: 'Choose the word closest in meaning to "big":',
    options: JSON.stringify(['A. large', 'B. small', 'C. thin', 'D. fast']),
    correct_answer: 'A', explanation: '"Large" is a synonym of "big".',
    band_min: 3.0, band_max: 4.0, expected_time_sec: 40,
    error_tag: 'synonym', topic_tags: ['daily_life'],
    irt_a: 0.9, irt_b: -3.20, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'meaning', question_type: 'mcq',
    question_text: 'What does the word "happy" mean?',
    options: JSON.stringify(['A. feeling sad', 'B. feeling pleased', 'C. feeling angry', 'D. feeling tired']),
    correct_answer: 'B', explanation: '"Happy" means feeling pleased or content.',
    band_min: 3.0, band_max: 4.0, expected_time_sec: 40,
    error_tag: 'meaning', topic_tags: ['daily_life'],
    irt_a: 0.9, irt_b: -3.10, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'synonym', question_type: 'mcq',
    question_text: 'Choose the word closest in meaning to "quick":',
    options: JSON.stringify(['A. slow', 'B. fast', 'C. heavy', 'D. long']),
    correct_answer: 'B', explanation: '"Fast" is a synonym of "quick".',
    band_min: 3.0, band_max: 4.0, expected_time_sec: 40,
    error_tag: 'synonym', topic_tags: ['daily_life'],
    irt_a: 0.9, irt_b: -3.00, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'meaning', question_type: 'mcq',
    question_text: 'What does "buy" mean?',
    options: JSON.stringify(['A. to sell something', 'B. to get something by paying money', 'C. to give something away', 'D. to throw something']),
    correct_answer: 'B', explanation: '"Buy" means to get something by paying money for it.',
    band_min: 3.0, band_max: 4.0, expected_time_sec: 45,
    error_tag: 'meaning', topic_tags: ['daily_life'],
    irt_a: 0.9, irt_b: -2.90, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'synonym', question_type: 'mcq',
    question_text: 'Which word means the same as "old"?',
    options: JSON.stringify(['A. new', 'B. young', 'C. ancient', 'D. bright']),
    correct_answer: 'C', explanation: '"Ancient" means very old.',
    band_min: 3.5, band_max: 4.5, expected_time_sec: 45,
    error_tag: 'synonym', topic_tags: ['daily_life'],
    irt_a: 1.0, irt_b: -2.70, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'meaning', question_type: 'true_false_ng',
    question_text: 'Statement: The word "difficult" means the same as "easy".',
    options: JSON.stringify(['True', 'False', 'Not Given']),
    correct_answer: 'False', explanation: '"Difficult" means hard or not easy. They are antonyms.',
    band_min: 3.5, band_max: 4.5, expected_time_sec: 40,
    error_tag: 'meaning', topic_tags: ['education'],
    irt_a: 1.0, irt_b: -2.55, irt_c: 0.33 },

  // ── Band 4.0–5.0  (irt_b: -2.40 → -1.50) ─────────────────
  { skill: 'vocabulary', sub_skill_code: 'collocation', question_type: 'mcq',
    question_text: 'Which verb goes with the word "a mistake"?',
    options: JSON.stringify(['A. do', 'B. make', 'C. have', 'D. take']),
    correct_answer: 'B', explanation: '"Make a mistake" is the correct collocation.',
    band_min: 4.0, band_max: 5.0, expected_time_sec: 50,
    error_tag: 'collocation', topic_tags: ['education'],
    irt_a: 1.1, irt_b: -2.30, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'synonym', question_type: 'mcq',
    question_text: 'Choose the word closest in meaning to "reduce":',
    options: JSON.stringify(['A. increase', 'B. decrease', 'C. produce', 'D. release']),
    correct_answer: 'B', explanation: '"Decrease" is a synonym of "reduce".',
    band_min: 4.0, band_max: 5.0, expected_time_sec: 50,
    error_tag: 'synonym', topic_tags: ['academic'],
    irt_a: 1.1, irt_b: -2.10, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'collocation', question_type: 'mcq',
    question_text: 'Complete the phrase: "pay _____" (meaning to give attention)',
    options: JSON.stringify(['A. mind', 'B. attention', 'C. focus', 'D. care']),
    correct_answer: 'B', explanation: '"Pay attention" is a fixed collocation.',
    band_min: 4.0, band_max: 5.0, expected_time_sec: 50,
    error_tag: 'collocation', topic_tags: ['education'],
    irt_a: 1.1, irt_b: -1.90, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'meaning', question_type: 'mcq',
    question_text: 'The word "annual" means:',
    options: JSON.stringify(['A. happening every month', 'B. happening every year', 'C. happening every week', 'D. happening every day']),
    correct_answer: 'B', explanation: '"Annual" means occurring once every year.',
    band_min: 4.5, band_max: 5.5, expected_time_sec: 50,
    error_tag: 'meaning', topic_tags: ['academic'],
    irt_a: 1.2, irt_b: -1.70, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'context', question_type: 'mcq',
    question_text: 'The teacher asked the students to _____ their homework by Friday.',
    options: JSON.stringify(['A. submit', 'B. subscribe', 'C. subtract', 'D. substitute']),
    correct_answer: 'A', explanation: '"Submit" means to hand in or give for consideration.',
    band_min: 4.5, band_max: 5.5, expected_time_sec: 55,
    error_tag: 'context', topic_tags: ['education'],
    irt_a: 1.2, irt_b: -1.55, irt_c: 0.25 },

  // ── Band 5.0–6.0  (irt_b: -1.40 → -0.50) ─────────────────
  { skill: 'vocabulary', sub_skill_code: 'synonym', question_type: 'mcq',
    question_text: 'Which word is closest in meaning to "significant"?',
    options: JSON.stringify(['A. unimportant', 'B. considerable', 'C. minor', 'D. invisible']),
    correct_answer: 'B', explanation: '"Considerable" means large or important enough to be worth attention — synonym of "significant".',
    band_min: 5.0, band_max: 6.0, expected_time_sec: 55,
    error_tag: 'synonym', topic_tags: ['academic'],
    irt_a: 1.3, irt_b: -1.30, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'context', question_type: 'mcq',
    question_text: 'The researchers _____ the data over a five-year period before publishing their results.',
    options: JSON.stringify(['A. collected', 'B. rejected', 'C. destroyed', 'D. ignored']),
    correct_answer: 'A', explanation: '"Collected" fits the academic context of gathering data for research.',
    band_min: 5.0, band_max: 6.0, expected_time_sec: 55,
    error_tag: 'context', topic_tags: ['science', 'academic'],
    irt_a: 1.3, irt_b: -1.10, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'collocation', question_type: 'mcq',
    question_text: 'Complete the collocation: "conduct an _____"',
    options: JSON.stringify(['A. experiment', 'B. opinion', 'C. thought', 'D. feeling']),
    correct_answer: 'A', explanation: '"Conduct an experiment" is a standard academic collocation.',
    band_min: 5.0, band_max: 6.0, expected_time_sec: 50,
    error_tag: 'collocation', topic_tags: ['science', 'academic'],
    irt_a: 1.3, irt_b: -0.90, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'meaning', question_type: 'mcq',
    question_text: 'The word "diverse" most nearly means:',
    options: JSON.stringify(['A. similar', 'B. identical', 'C. varied', 'D. limited']),
    correct_answer: 'C', explanation: '"Diverse" means showing variety or having many different forms.',
    band_min: 5.0, band_max: 6.0, expected_time_sec: 50,
    error_tag: 'meaning', topic_tags: ['academic'],
    irt_a: 1.4, irt_b: -0.70, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'synonym', question_type: 'mcq',
    question_text: 'Which word is closest in meaning to "approximately"?',
    options: JSON.stringify(['A. exactly', 'B. roughly', 'C. never', 'D. always']),
    correct_answer: 'B', explanation: '"Roughly" means approximately or about.',
    band_min: 5.5, band_max: 6.5, expected_time_sec: 50,
    error_tag: 'synonym', topic_tags: ['academic'],
    irt_a: 1.4, irt_b: -0.55, irt_c: 0.25 },

  // ── Band 6.0–7.0  (irt_b: -0.40 → +0.80) ─────────────────
  { skill: 'vocabulary', sub_skill_code: 'context', question_type: 'mcq',
    question_text: 'The government\'s new policy was designed to _____ economic growth in rural areas.',
    options: JSON.stringify(['A. stimulate', 'B. eliminate', 'C. discourage', 'D. interrupt']),
    correct_answer: 'A', explanation: '"Stimulate" means to encourage or promote growth or activity.',
    band_min: 6.0, band_max: 7.0, expected_time_sec: 55,
    error_tag: 'context', topic_tags: ['economy', 'academic'],
    irt_a: 1.5, irt_b: -0.20, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'meaning', question_type: 'mcq',
    question_text: 'The word "prevalent" most nearly means:',
    options: JSON.stringify(['A. rare', 'B. widespread', 'C. hidden', 'D. ancient']),
    correct_answer: 'B', explanation: '"Prevalent" means widespread or commonly occurring.',
    band_min: 6.0, band_max: 7.0, expected_time_sec: 50,
    error_tag: 'meaning', topic_tags: ['academic'],
    irt_a: 1.6, irt_b: 0.10, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'context', question_type: 'mcq',
    question_text: 'The report revealed a strong _____ between exercise frequency and mental health outcomes.',
    options: JSON.stringify(['A. correlation', 'B. contradiction', 'C. confusion', 'D. competition']),
    correct_answer: 'A', explanation: '"Correlation" means a mutual relationship or connection between two variables.',
    band_min: 6.0, band_max: 7.0, expected_time_sec: 55,
    error_tag: 'context', topic_tags: ['health', 'academic'],
    irt_a: 1.6, irt_b: 0.30, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'synonym', question_type: 'mcq',
    question_text: 'Which word is closest in meaning to "mitigate"?',
    options: JSON.stringify(['A. worsen', 'B. lessen', 'C. eliminate', 'D. create']),
    correct_answer: 'B', explanation: '"Mitigate" means to make less severe, serious, or painful — to lessen.',
    band_min: 6.5, band_max: 7.5, expected_time_sec: 50,
    error_tag: 'synonym', topic_tags: ['academic'],
    irt_a: 1.7, irt_b: 0.60, irt_c: 0.25 },

  // ── Band 7.0–8.0  (irt_b: +0.90 → +2.00) ─────────────────
  { skill: 'vocabulary', sub_skill_code: 'context', question_type: 'mcq',
    question_text: 'The politician\'s speech was criticised for being _____, as it appealed to emotions rather than presenting evidence.',
    options: JSON.stringify(['A. empirical', 'B. demagogic', 'C. pragmatic', 'D. objective']),
    correct_answer: 'B', explanation: '"Demagogic" describes rhetoric that appeals to emotions and prejudices rather than rational argument.',
    band_min: 7.0, band_max: 8.0, expected_time_sec: 55,
    error_tag: 'context', topic_tags: ['academic', 'media'],
    irt_a: 1.8, irt_b: 1.00, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'meaning', question_type: 'mcq',
    question_text: 'The term "paradigm" most nearly means:',
    options: JSON.stringify(['A. a typical example or pattern', 'B. a type of paradox', 'C. a mathematical formula', 'D. a physical structure']),
    correct_answer: 'A', explanation: '"Paradigm" means a typical example, model, or pattern of something.',
    band_min: 7.0, band_max: 8.0, expected_time_sec: 50,
    error_tag: 'meaning', topic_tags: ['academic', 'science'],
    irt_a: 1.8, irt_b: 1.30, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'context', question_type: 'mcq',
    question_text: 'The author\'s argument was undermined by its reliance on _____ evidence — individual stories rather than systematic data.',
    options: JSON.stringify(['A. empirical', 'B. anecdotal', 'C. statistical', 'D. longitudinal']),
    correct_answer: 'B', explanation: '"Anecdotal" evidence is based on personal accounts rather than systematic research.',
    band_min: 7.5, band_max: 8.5, expected_time_sec: 55,
    error_tag: 'context', topic_tags: ['academic', 'science'],
    irt_a: 1.9, irt_b: 1.60, irt_c: 0.25 },

  { skill: 'vocabulary', sub_skill_code: 'meaning', question_type: 'mcq',
    question_text: 'The word "perfunctory" most nearly means:',
    options: JSON.stringify(['A. carried out with care and thoroughness', 'B. carried out without real interest or effort', 'C. performed with great enthusiasm', 'D. completed ahead of schedule']),
    correct_answer: 'B', explanation: '"Perfunctory" means carried out as a duty without real interest, feeling, or effort.',
    band_min: 7.5, band_max: 9.0, expected_time_sec: 55,
    error_tag: 'meaning', topic_tags: ['academic'],
    irt_a: 2.0, irt_b: 1.90, irt_c: 0.25 },

  // ═══════════════════════════════════════════════════════════
  // ██  LISTENING  (30 câu)
  // ═══════════════════════════════════════════════════════════

  // ── Band 3.0–4.0  (irt_b: -3.20 → -2.50) ─────────────────
  { skill: 'listening', sub_skill_code: 'detail', question_type: 'mcq',
    question_text: 'Audio context: A woman says "The train to Manchester leaves at half past nine from platform three." What platform does the train leave from?',
    options: JSON.stringify(['A. Platform 1', 'B. Platform 2', 'C. Platform 3', 'D. Platform 4']),
    correct_answer: 'C', explanation: 'Speaker clearly states "platform three".',
    band_min: 3.0, band_max: 4.0, expected_time_sec: 50,
    error_tag: 'detail', topic_tags: ['travel'],
    irt_a: 0.9, irt_b: -3.20, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'detail', question_type: 'mcq',
    question_text: 'Audio context: "Good morning. Today\'s weather will be sunny with a high of 25 degrees." What is the expected temperature?',
    options: JSON.stringify(['A. 15 degrees', 'B. 20 degrees', 'C. 25 degrees', 'D. 30 degrees']),
    correct_answer: 'C', explanation: 'Speaker says "a high of 25 degrees".',
    band_min: 3.0, band_max: 4.0, expected_time_sec: 45,
    error_tag: 'detail', topic_tags: ['daily_life'],
    irt_a: 0.9, irt_b: -3.10, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'detail', question_type: 'true_false_ng',
    question_text: 'Listening transcript: "The shop opens at 9am and closes at 5pm Monday to Saturday." Statement: The shop is open on Sundays.',
    options: JSON.stringify(['True', 'False', 'Not Given']),
    correct_answer: 'Not Given', explanation: 'The transcript only mentions Monday to Saturday. Sunday is not mentioned.',
    band_min: 3.0, band_max: 4.0, expected_time_sec: 50,
    error_tag: 'detail', topic_tags: ['daily_life'],
    irt_a: 0.9, irt_b: -3.00, irt_c: 0.33 },

  { skill: 'listening', sub_skill_code: 'detail', question_type: 'mcq',
    question_text: 'Audio context: A receptionist says "Your appointment is on Wednesday the 14th at 2:30 in the afternoon." What time is the appointment?',
    options: JSON.stringify(['A. 2:00 pm', 'B. 2:30 pm', 'C. 3:00 pm', 'D. 3:30 pm']),
    correct_answer: 'B', explanation: 'Speaker clearly says "2:30 in the afternoon".',
    band_min: 3.0, band_max: 4.0, expected_time_sec: 45,
    error_tag: 'detail', topic_tags: ['health'],
    irt_a: 0.9, irt_b: -2.85, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'detail', question_type: 'mcq',
    question_text: 'Audio context: "I\'d like a cup of tea with milk but no sugar, please." What does the speaker want in their tea?',
    options: JSON.stringify(['A. Sugar only', 'B. Milk only', 'C. Milk and sugar', 'D. Neither milk nor sugar']),
    correct_answer: 'B', explanation: 'Speaker says "with milk but no sugar" — milk only.',
    band_min: 3.5, band_max: 4.5, expected_time_sec: 45,
    error_tag: 'detail', topic_tags: ['daily_life'],
    irt_a: 1.0, irt_b: -2.70, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'detail', question_type: 'true_false_ng',
    question_text: 'Listening transcript: "The swimming pool is free for children under six. Adults pay £4.50." Statement: Children under six must pay to use the swimming pool.',
    options: JSON.stringify(['True', 'False', 'Not Given']),
    correct_answer: 'False', explanation: 'The pool is "free for children under six" — they do not pay.',
    band_min: 3.5, band_max: 4.5, expected_time_sec: 50,
    error_tag: 'detail', topic_tags: ['health', 'daily_life'],
    irt_a: 1.0, irt_b: -2.55, irt_c: 0.33 },

  // ── Band 4.0–5.0  (irt_b: -2.40 → -1.50) ─────────────────
  { skill: 'listening', sub_skill_code: 'detail', question_type: 'mcq',
    question_text: 'Audio context: A teacher says "Remember, the deadline for your essays is next Monday. Late submissions will lose ten percent of the total mark." What is the penalty for late work?',
    options: JSON.stringify(['A. The essay will not be marked', 'B. 5% deduction', 'C. 10% deduction', 'D. 20% deduction']),
    correct_answer: 'C', explanation: 'Speaker says "lose ten percent of the total mark".',
    band_min: 4.0, band_max: 5.0, expected_time_sec: 55,
    error_tag: 'detail', topic_tags: ['education'],
    irt_a: 1.1, irt_b: -2.30, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'main_idea', question_type: 'mcq',
    question_text: 'Audio context: "The new park has a children\'s playground, a café, walking paths, and a small lake. It is designed to be a space where families can relax and enjoy nature." What is the main purpose of the park?',
    options: JSON.stringify(['A. To provide office space for businesses', 'B. To offer a relaxing space for families', 'C. To host sporting competitions', 'D. To grow food for the community']),
    correct_answer: 'B', explanation: '"Designed to be a space where families can relax and enjoy nature."',
    band_min: 4.0, band_max: 5.0, expected_time_sec: 60,
    error_tag: 'main_idea', topic_tags: ['environment', 'daily_life'],
    irt_a: 1.1, irt_b: -2.10, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'detail', question_type: 'true_false_ng',
    question_text: 'Listening transcript: "The museum tour starts at 10am and lasts approximately ninety minutes. Photography is not permitted inside the galleries." Statement: Visitors can take photos during the museum tour.',
    options: JSON.stringify(['True', 'False', 'Not Given']),
    correct_answer: 'False', explanation: '"Photography is not permitted inside the galleries" → cannot take photos.',
    band_min: 4.0, band_max: 5.0, expected_time_sec: 55,
    error_tag: 'detail', topic_tags: ['education'],
    irt_a: 1.1, irt_b: -1.90, irt_c: 0.33 },

  { skill: 'listening', sub_skill_code: 'detail', question_type: 'mcq',
    question_text: 'Audio context: A doctor says "You should take this medicine twice a day, once in the morning and once before bed, for seven days." How long should the patient take the medicine?',
    options: JSON.stringify(['A. 3 days', 'B. 5 days', 'C. 7 days', 'D. 14 days']),
    correct_answer: 'C', explanation: 'Doctor clearly states "for seven days".',
    band_min: 4.0, band_max: 5.0, expected_time_sec: 50,
    error_tag: 'detail', topic_tags: ['health'],
    irt_a: 1.1, irt_b: -1.75, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'main_idea', question_type: 'mcq',
    question_text: 'Audio context: "Our company was founded in 1995. We started with just five employees and now have over two thousand staff worldwide. Our mission has always been to make technology accessible to everyone." What is the main topic of this talk?',
    options: JSON.stringify(['A. A job interview', 'B. A company introduction', 'C. A product review', 'D. A news report']),
    correct_answer: 'B', explanation: 'Speaker describes the company\'s founding, growth, and mission — a company introduction.',
    band_min: 4.5, band_max: 5.5, expected_time_sec: 60,
    error_tag: 'main_idea', topic_tags: ['work', 'technology'],
    irt_a: 1.2, irt_b: -1.55, irt_c: 0.25 },

  // ── Band 5.0–6.0  (irt_b: -1.40 → -0.50) ─────────────────
  { skill: 'listening', sub_skill_code: 'inference', question_type: 'mcq',
    question_text: 'Audio context: A student says "I was planning to take the advanced course, but after looking at the workload, I think I\'ll stick with the intermediate one for now." What can be inferred?',
    options: JSON.stringify(['A. The student will take the advanced course.', 'B. The student was put off by the workload of the advanced course.', 'C. The student has already completed the advanced course.', 'D. The student thinks the intermediate course is too easy.']),
    correct_answer: 'B', explanation: '"After looking at the workload, I think I\'ll stick with the intermediate one" implies the workload discouraged them.',
    band_min: 5.0, band_max: 6.0, expected_time_sec: 60,
    error_tag: 'inference', topic_tags: ['education'],
    irt_a: 1.3, irt_b: -1.30, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'detail', question_type: 'mcq',
    question_text: 'Audio context: Tour guide says "The castle was built in 1285 and was home to three generations of the Blackwood family. It was damaged during the civil war but restored in the 1800s." When was the castle restored?',
    options: JSON.stringify(['A. In 1285', 'B. During the civil war', 'C. In the 1800s', 'D. In the 1900s']),
    correct_answer: 'C', explanation: 'Guide says "restored in the 1800s".',
    band_min: 5.0, band_max: 6.0, expected_time_sec: 55,
    error_tag: 'detail', topic_tags: ['education', 'travel'],
    irt_a: 1.3, irt_b: -1.10, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'inference', question_type: 'mcq',
    question_text: 'Audio context: A manager says "I appreciate your enthusiasm, but perhaps we should wait until we have the quarterly figures before making any major decisions." What is the manager suggesting?',
    options: JSON.stringify(['A. Decisions should be made immediately.', 'B. Decisions should be based on data, not just enthusiasm.', 'C. The quarterly figures are unimportant.', 'D. The team lacks enthusiasm.']),
    correct_answer: 'B', explanation: '"Wait until we have the quarterly figures" suggests decisions should be data-driven.',
    band_min: 5.0, band_max: 6.0, expected_time_sec: 60,
    error_tag: 'inference', topic_tags: ['work'],
    irt_a: 1.4, irt_b: -0.85, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'attitude', question_type: 'mcq',
    question_text: 'Audio context: Speaker says "I must admit, the new restaurant exceeded my expectations. The food was superb and the service was impeccable." What is the speaker\'s attitude?',
    options: JSON.stringify(['A. Disappointed', 'B. Indifferent', 'C. Pleasantly surprised and impressed', 'D. Angry']),
    correct_answer: 'C', explanation: '"Exceeded my expectations", "superb", "impeccable" all indicate very positive surprise.',
    band_min: 5.5, band_max: 6.5, expected_time_sec: 55,
    error_tag: 'attitude', topic_tags: ['daily_life'],
    irt_a: 1.4, irt_b: -0.65, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'detail', question_type: 'true_false_ng',
    question_text: 'Listening transcript: "The survey found that 68% of respondents preferred working from home at least two days per week. Only 12% wanted to return to the office full-time." Statement: The majority of respondents wanted to work entirely from home.',
    options: JSON.stringify(['True', 'False', 'Not Given']),
    correct_answer: 'False', explanation: '68% preferred "at least two days per week" from home — not entirely from home.',
    band_min: 5.5, band_max: 6.5, expected_time_sec: 60,
    error_tag: 'detail', topic_tags: ['work'],
    irt_a: 1.4, irt_b: -0.50, irt_c: 0.33 },

  // ── Band 6.0–7.0  (irt_b: -0.40 → +0.80) ─────────────────
  { skill: 'listening', sub_skill_code: 'attitude', question_type: 'mcq',
    question_text: 'Audio context: Lecturer says "While the findings are certainly promising, I would caution against drawing definitive conclusions at this stage. The sample size, frankly, leaves something to be desired." What is the lecturer\'s stance?',
    options: JSON.stringify(['A. Fully supportive of the conclusions', 'B. Cautiously sceptical about the strength of the evidence', 'C. Completely dismissive of the research', 'D. Unaware of the methodology used']),
    correct_answer: 'B', explanation: '"Caution against definitive conclusions" + "leaves something to be desired" = cautiously sceptical.',
    band_min: 6.0, band_max: 7.0, expected_time_sec: 60,
    error_tag: 'attitude', topic_tags: ['academic', 'science'],
    irt_a: 1.6, irt_b: -0.15, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'inference', question_type: 'mcq',
    question_text: 'Audio context: Two students discuss: Student A: "The professor said we need both primary and secondary sources." Student B: "I\'ve only used textbooks so far." Student A: "Those are secondary. You\'ll need to do some original research too — interviews or surveys." What does Student A imply about Student B\'s work?',
    options: JSON.stringify(['A. It is already complete and well-researched.', 'B. It lacks primary sources and needs original data collection.', 'C. It uses too many primary sources.', 'D. It is based on unreliable textbooks.']),
    correct_answer: 'B', explanation: 'Student A points out that textbooks are secondary and primary research (interviews/surveys) is still needed.',
    band_min: 6.0, band_max: 7.0, expected_time_sec: 65,
    error_tag: 'inference', topic_tags: ['education', 'academic'],
    irt_a: 1.6, irt_b: 0.15, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'attitude', question_type: 'mcq',
    question_text: 'Audio context: Speaker says "The proposed regulations are, to put it mildly, inadequate. They fail to address the root causes of the problem and merely tinker with symptoms." How does the speaker feel about the regulations?',
    options: JSON.stringify(['A. Supportive', 'B. Neutral', 'C. Strongly critical', 'D. Mildly positive']),
    correct_answer: 'C', explanation: '"To put it mildly, inadequate", "fail to address root causes", "merely tinker" all indicate strong criticism.',
    band_min: 6.5, band_max: 7.5, expected_time_sec: 60,
    error_tag: 'attitude', topic_tags: ['environment', 'academic'],
    irt_a: 1.7, irt_b: 0.50, irt_c: 0.25 },

  // ── Band 7.0–8.0  (irt_b: +0.90 → +2.00) ─────────────────
  { skill: 'listening', sub_skill_code: 'inference', question_type: 'mcq',
    question_text: 'Audio context: Professor says "The conventional wisdom holds that economic development necessarily entails environmental degradation. However, emerging research on the Environmental Kuznets Curve suggests a more nuanced relationship — that pollution may initially increase with development but eventually decline as societies invest in cleaner technologies." What does the professor imply?',
    options: JSON.stringify(['A. Economic development always harms the environment.', 'B. The relationship between development and pollution is more complex than commonly assumed.', 'C. Pollution will decline automatically without any intervention.', 'D. The Environmental Kuznets Curve has been definitively proven.']),
    correct_answer: 'B', explanation: '"More nuanced relationship" challenges the simple assumption, suggesting complexity.',
    band_min: 7.0, band_max: 8.0, expected_time_sec: 65,
    error_tag: 'inference', topic_tags: ['environment', 'economy', 'academic'],
    irt_a: 1.8, irt_b: 1.00, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'attitude', question_type: 'mcq',
    question_text: 'Audio context: Researcher says "While the correlation between social media usage and declining attention spans has been widely reported in the popular press, peer-reviewed studies paint a considerably more ambiguous picture. The methodological limitations of much of this research — small sample sizes, self-reported data, cross-sectional rather than longitudinal designs — should give us pause before accepting such claims uncritically." What is the researcher\'s main argument?',
    options: JSON.stringify(['A. Social media definitely reduces attention spans.', 'B. Popular claims about social media and attention are not well supported by rigorous evidence.', 'C. All research on social media is flawed and should be ignored.', 'D. Longitudinal studies have confirmed the link between social media and attention.']),
    correct_answer: 'B', explanation: 'The researcher highlights methodological limitations and warns against uncritical acceptance.',
    band_min: 7.0, band_max: 8.5, expected_time_sec: 70,
    error_tag: 'attitude', topic_tags: ['technology', 'academic', 'science'],
    irt_a: 1.9, irt_b: 1.40, irt_c: 0.25 },

  { skill: 'listening', sub_skill_code: 'inference', question_type: 'mcq',
    question_text: 'Audio context: Academic says "The notion that bilingual education impedes cognitive development has been thoroughly debunked. On the contrary, a substantial body of evidence indicates that bilingualism confers cognitive advantages, particularly in executive function — the ability to switch between tasks, inhibit irrelevant information, and maintain focus." What can be inferred?',
    options: JSON.stringify(['A. Bilingual education harms cognitive development.', 'B. Research now supports that bilingualism has cognitive benefits, not drawbacks.', 'C. Executive function is unrelated to bilingualism.', 'D. The evidence on bilingualism remains inconclusive.']),
    correct_answer: 'B', explanation: '"Thoroughly debunked" + "substantial body of evidence indicates cognitive advantages" = bilingualism is beneficial.',
    band_min: 7.5, band_max: 9.0, expected_time_sec: 70,
    error_tag: 'inference', topic_tags: ['education', 'academic', 'science'],
    irt_a: 2.0, irt_b: 1.80, irt_c: 0.25 },

  // ═══════════════════════════════════════════════════════════
  // ██  WRITING  (30 câu)
  // ═══════════════════════════════════════════════════════════

  // ── Band 3.0–4.0  (irt_b: -3.20 → -2.50) ─────────────────
  { skill: 'writing', sub_skill_code: 'grammar_range', question_type: 'mcq',
    question_text: 'Choose the correct word to complete the sentence:\n\n"She _____ to school every day."',
    options: JSON.stringify(['A. go', 'B. goes', 'C. going', 'D. gone']),
    correct_answer: 'B', explanation: 'Third person singular (she) + present simple = "goes".',
    band_min: 3.0, band_max: 4.0, expected_time_sec: 45,
    error_tag: 'grammar_range', topic_tags: ['education'],
    irt_a: 0.9, irt_b: -3.20, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'grammar_range', question_type: 'mcq',
    question_text: 'Choose the correct sentence:',
    options: JSON.stringify(['A. He don\'t like coffee.', 'B. He doesn\'t like coffee.', 'C. He not like coffee.', 'D. He doesn\'t likes coffee.']),
    correct_answer: 'B', explanation: 'Third person singular negative: "doesn\'t + base form" = "doesn\'t like".',
    band_min: 3.0, band_max: 4.0, expected_time_sec: 45,
    error_tag: 'grammar_range', topic_tags: ['daily_life'],
    irt_a: 0.9, irt_b: -3.10, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'grammar_range', question_type: 'mcq',
    question_text: 'Choose the correct word:\n\n"There are _____ apples on the table."',
    options: JSON.stringify(['A. a', 'B. an', 'C. some', 'D. much']),
    correct_answer: 'C', explanation: '"Some" is used with countable plural nouns: "some apples". "Much" is for uncountable nouns.',
    band_min: 3.0, band_max: 4.0, expected_time_sec: 45,
    error_tag: 'grammar_range', topic_tags: ['daily_life'],
    irt_a: 0.9, irt_b: -3.00, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'grammar_range', question_type: 'mcq',
    question_text: 'Choose the correct past tense form:\n\n"Yesterday, I _____ to the market."',
    options: JSON.stringify(['A. go', 'B. goes', 'C. went', 'D. going']),
    correct_answer: 'C', explanation: '"Went" is the past tense of "go". "Yesterday" signals past tense.',
    band_min: 3.0, band_max: 4.0, expected_time_sec: 45,
    error_tag: 'grammar_range', topic_tags: ['daily_life'],
    irt_a: 0.9, irt_b: -2.85, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'grammar_range', question_type: 'mcq',
    question_text: 'Which sentence uses the correct preposition?\n\n"The meeting is _____ Monday."',
    options: JSON.stringify(['A. in', 'B. on', 'C. at', 'D. by']),
    correct_answer: 'B', explanation: '"On" is used with days of the week: "on Monday".',
    band_min: 3.5, band_max: 4.5, expected_time_sec: 45,
    error_tag: 'grammar_range', topic_tags: ['work'],
    irt_a: 1.0, irt_b: -2.65, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'grammar_range', question_type: 'true_false_ng',
    question_text: 'Statement: "The sentence \'I have went to Paris\' is grammatically correct."',
    options: JSON.stringify(['True', 'False', 'Not Given']),
    correct_answer: 'False', explanation: 'The correct form is "I have gone to Paris" — past participle "gone", not "went".',
    band_min: 3.5, band_max: 4.5, expected_time_sec: 50,
    error_tag: 'grammar_range', topic_tags: ['education'],
    irt_a: 1.0, irt_b: -2.50, irt_c: 0.33 },

  // ── Band 4.0–5.0  (irt_b: -2.40 → -1.50) ─────────────────
  { skill: 'writing', sub_skill_code: 'grammar_range', question_type: 'mcq',
    question_text: 'Choose the correct form:\n\n"If it _____ tomorrow, we will cancel the picnic."',
    options: JSON.stringify(['A. rain', 'B. rains', 'C. will rain', 'D. rained']),
    correct_answer: 'B', explanation: 'First conditional: If + present simple, will + base form. "If it rains, we will cancel."',
    band_min: 4.0, band_max: 5.0, expected_time_sec: 55,
    error_tag: 'grammar_range', topic_tags: ['daily_life'],
    irt_a: 1.1, irt_b: -2.30, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'cohesion', question_type: 'mcq',
    question_text: 'Which word best connects these two sentences?\n\n"She studied very hard. _____, she passed the exam."',
    options: JSON.stringify(['A. However', 'B. Therefore', 'C. Although', 'D. But']),
    correct_answer: 'B', explanation: '"Therefore" shows cause and effect: studying hard → passing the exam.',
    band_min: 4.0, band_max: 5.0, expected_time_sec: 55,
    error_tag: 'cohesion', topic_tags: ['education'],
    irt_a: 1.1, irt_b: -2.10, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'grammar_range', question_type: 'mcq',
    question_text: 'Choose the correct comparative form:\n\n"This book is _____ than the last one I read."',
    options: JSON.stringify(['A. more interesting', 'B. most interesting', 'C. interestinger', 'D. more interestinger']),
    correct_answer: 'A', explanation: 'Two-syllable+ adjectives use "more" for comparative: "more interesting than".',
    band_min: 4.0, band_max: 5.0, expected_time_sec: 50,
    error_tag: 'grammar_range', topic_tags: ['education'],
    irt_a: 1.1, irt_b: -1.90, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'cohesion', question_type: 'mcq',
    question_text: 'Which linking word shows contrast?\n\n"The weather was cold. _____, many people came to the outdoor event."',
    options: JSON.stringify(['A. Furthermore', 'B. As a result', 'C. Nevertheless', 'D. In addition']),
    correct_answer: 'C', explanation: '"Nevertheless" shows contrast: cold weather BUT people still came.',
    band_min: 4.5, band_max: 5.5, expected_time_sec: 55,
    error_tag: 'cohesion', topic_tags: ['daily_life'],
    irt_a: 1.2, irt_b: -1.70, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'grammar_range', question_type: 'mcq',
    question_text: 'Choose the correct relative pronoun:\n\n"The woman _____ lives next door is a doctor."',
    options: JSON.stringify(['A. which', 'B. who', 'C. what', 'D. where']),
    correct_answer: 'B', explanation: '"Who" is used for people: "The woman who lives next door".',
    band_min: 4.5, band_max: 5.5, expected_time_sec: 50,
    error_tag: 'grammar_range', topic_tags: ['daily_life'],
    irt_a: 1.2, irt_b: -1.55, irt_c: 0.25 },

  // ── Band 5.0–6.0  (irt_b: -1.40 → -0.50) ─────────────────
  { skill: 'writing', sub_skill_code: 'grammar_range', question_type: 'mcq',
    question_text: 'Choose the correct form for an IELTS Task 2 essay:\n\n"By the time the new policy _____ implemented, many communities had already found their own solutions."',
    options: JSON.stringify(['A. was', 'B. were', 'C. is', 'D. has been']),
    correct_answer: 'A', explanation: 'Past perfect context ("had already found") requires past simple in the time clause: "was implemented".',
    band_min: 5.0, band_max: 6.0, expected_time_sec: 60,
    error_tag: 'grammar_range', topic_tags: ['academic'],
    irt_a: 1.3, irt_b: -1.30, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'lexical_resource', question_type: 'mcq',
    question_text: 'Which phrase is the most formal and academic way to begin an IELTS Task 2 body paragraph?',
    options: JSON.stringify(['A. I think that...', 'B. One key argument in favour of this view is that...', 'C. Lots of people say that...', 'D. It\'s obvious that...']),
    correct_answer: 'B', explanation: '"One key argument in favour of this view is that" uses formal academic register without personal pronouns.',
    band_min: 5.0, band_max: 6.0, expected_time_sec: 55,
    error_tag: 'lexical_resource', topic_tags: ['academic'],
    irt_a: 1.3, irt_b: -1.10, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'cohesion', question_type: 'mcq',
    question_text: 'Choose the best word to complete this Task 1 description:\n\n"The figure for exports rose sharply between 2010 and 2015. _____, imports remained relatively stable during the same period."',
    options: JSON.stringify(['A. Similarly', 'B. In contrast', 'C. As a result', 'D. Furthermore']),
    correct_answer: 'B', explanation: 'Exports rose but imports were stable — opposite trends need a contrast linker: "In contrast".',
    band_min: 5.0, band_max: 6.0, expected_time_sec: 55,
    error_tag: 'cohesion', topic_tags: ['academic'],
    irt_a: 1.4, irt_b: -0.85, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'task1_describe', question_type: 'mcq',
    question_text: 'Which sentence best describes a downward trend in an IELTS Task 1 line graph?',
    options: JSON.stringify(['A. The number went down a lot.', 'B. There was a significant decline in the number of participants over the period.', 'C. Participants got less.', 'D. The number decreased by many.']),
    correct_answer: 'B', explanation: '"Significant decline in the number of participants over the period" uses precise academic language suitable for Task 1.',
    band_min: 5.0, band_max: 6.0, expected_time_sec: 55,
    error_tag: 'task1_describe', topic_tags: ['academic'],
    irt_a: 1.4, irt_b: -0.65, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'grammar_range', question_type: 'mcq',
    question_text: 'Choose the sentence that correctly uses the passive voice for an IELTS Task 1 process:\n\n"After the beans are harvested, they _____."',
    options: JSON.stringify(['A. dry in the sun', 'B. are dried in the sun', 'C. have drying in the sun', 'D. is dried in the sun']),
    correct_answer: 'B', explanation: 'Task 1 process descriptions use passive voice: "they are dried" (plural subject + passive).',
    band_min: 5.5, band_max: 6.5, expected_time_sec: 55,
    error_tag: 'grammar_range', topic_tags: ['academic'],
    irt_a: 1.4, irt_b: -0.50, irt_c: 0.25 },

  // ── Band 6.0–7.0  (irt_b: -0.40 → +0.80) ─────────────────
  { skill: 'writing', sub_skill_code: 'lexical_resource', question_type: 'mcq',
    question_text: 'Which paraphrase of "The number of students increased" is the most sophisticated for Task 1?',
    options: JSON.stringify(['A. Student numbers went up.', 'B. There was a marked increase in the student population.', 'C. More students came.', 'D. Students increased.']),
    correct_answer: 'B', explanation: '"Marked increase", "student population" demonstrate lexical range and precision.',
    band_min: 6.0, band_max: 7.0, expected_time_sec: 55,
    error_tag: 'lexical_resource', topic_tags: ['academic'],
    irt_a: 1.5, irt_b: -0.20, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'task2_body', question_type: 'mcq',
    question_text: 'A body paragraph in Task 2 should contain which elements in order?',
    options: JSON.stringify(['A. Example → Topic sentence → Explanation → Conclusion', 'B. Topic sentence → Explanation → Example → Concluding link', 'C. Introduction → Three examples → Conclusion', 'D. Opinion → Fact → Opinion → Fact']),
    correct_answer: 'B', explanation: 'Standard PEEL/TEEL structure: Topic sentence → Explanation → Example → Link back.',
    band_min: 6.0, band_max: 7.0, expected_time_sec: 55,
    error_tag: 'task2_body', topic_tags: ['academic'],
    irt_a: 1.6, irt_b: 0.10, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'cohesion', question_type: 'mcq',
    question_text: 'Choose the most effective concluding sentence for a Task 2 body paragraph about the benefits of public transport:\n\n"Public transport reduces traffic congestion and lowers carbon emissions. Many cities have invested in expanding their bus and rail networks."',
    options: JSON.stringify(['A. That is why public transport is good.', 'B. Consequently, investment in public transport infrastructure represents a practical step towards both environmental sustainability and improved urban mobility.', 'C. In conclusion, public transport is very important.', 'D. This means buses are better than cars.']),
    correct_answer: 'B', explanation: 'B synthesises the points made and uses sophisticated academic vocabulary.',
    band_min: 6.0, band_max: 7.0, expected_time_sec: 60,
    error_tag: 'cohesion', topic_tags: ['environment', 'academic'],
    irt_a: 1.6, irt_b: 0.35, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'grammar_range', question_type: 'mcq',
    question_text: 'Which sentence demonstrates the best use of a conditional structure for Band 7?',
    options: JSON.stringify(['A. If we protect the environment, it would be good.', 'B. Were governments to invest more in renewable energy, the long-term economic benefits could be substantial.', 'C. If governments invest, things will change.', 'D. Governments should invest because it is important.']),
    correct_answer: 'B', explanation: 'Inverted conditional ("Were governments to...") is a Band 7+ structure showing grammatical range.',
    band_min: 6.5, band_max: 7.5, expected_time_sec: 55,
    error_tag: 'grammar_range', topic_tags: ['environment', 'academic'],
    irt_a: 1.7, irt_b: 0.60, irt_c: 0.25 },

  // ── Band 7.0–8.0  (irt_b: +0.90 → +2.00) ─────────────────
  { skill: 'writing', sub_skill_code: 'lexical_resource', question_type: 'mcq',
    question_text: 'Which sentence best demonstrates Band 8 lexical resource in a Task 2 essay about urbanisation?',
    options: JSON.stringify(['A. Cities are getting bigger and bigger and this causes many problems.', 'B. The unprecedented pace of urbanisation has given rise to a constellation of interconnected challenges, from inadequate housing provision to the degradation of urban ecosystems.', 'C. More people move to cities every year, which creates problems.', 'D. Urbanisation is a big issue in the modern world today.']),
    correct_answer: 'B', explanation: '"Unprecedented pace", "constellation of interconnected challenges", "inadequate housing provision", "degradation of urban ecosystems" all demonstrate Band 8 lexical sophistication.',
    band_min: 7.0, band_max: 8.0, expected_time_sec: 60,
    error_tag: 'lexical_resource', topic_tags: ['housing', 'academic'],
    irt_a: 1.8, irt_b: 1.00, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'task2_body', question_type: 'mcq',
    question_text: 'Read this Task 2 paragraph extract and identify the most significant weakness:\n\n"Education is important because it helps people get jobs. For example, many graduates earn more money. Furthermore, education teaches people to think critically. Moreover, educated people are healthier. Additionally, education reduces crime."',
    options: JSON.stringify(['A. There are not enough linking words.', 'B. The paragraph lacks depth — multiple underdeveloped points rather than one well-supported argument.', 'C. The grammar is incorrect throughout.', 'D. The paragraph is too long.']),
    correct_answer: 'B', explanation: 'The paragraph lists five separate points without developing any of them. Band 7+ requires depth over breadth — one point well explained with examples.',
    band_min: 7.0, band_max: 8.0, expected_time_sec: 60,
    error_tag: 'task2_body', topic_tags: ['education', 'academic'],
    irt_a: 1.8, irt_b: 1.30, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'grammar_range', question_type: 'mcq',
    question_text: 'Which sentence demonstrates the most sophisticated grammatical range for IELTS Band 8+?',
    options: JSON.stringify(['A. People should protect the environment because it is important for the future.', 'B. Not only is environmental protection a moral imperative, but the economic case for sustainable development has, in recent years, become increasingly compelling.', 'C. The environment is very important and we must protect it from damage.', 'D. Protecting the environment is something that everyone should care about a lot.']),
    correct_answer: 'B', explanation: 'Fronted "Not only" with inversion, parenthetical clause, passive construction, and complex noun phrase all demonstrate Band 8+ grammatical range.',
    band_min: 7.5, band_max: 9.0, expected_time_sec: 60,
    error_tag: 'grammar_range', topic_tags: ['environment', 'academic'],
    irt_a: 1.9, irt_b: 1.65, irt_c: 0.25 },

  { skill: 'writing', sub_skill_code: 'lexical_resource', question_type: 'mcq',
    question_text: 'In academic writing, which phrase is the best replacement for "lots of people think"?',
    options: JSON.stringify(['A. Many people believe', 'B. It is widely contended that', 'C. Everyone knows that', 'D. People always say']),
    correct_answer: 'B', explanation: '"It is widely contended that" uses impersonal construction + formal academic vocabulary (Band 8+). "Many people believe" is acceptable but less sophisticated.',
    band_min: 7.5, band_max: 9.0, expected_time_sec: 55,
    error_tag: 'lexical_resource', topic_tags: ['academic'],
    irt_a: 2.0, irt_b: 1.90, irt_c: 0.25 },

  // ═══════════════════════════════════════════════════════════
  // ██  SPEAKING  (12 câu — Part 1 × 4, Part 2 × 4, Part 3 × 4)
  // ═══════════════════════════════════════════════════════════

  // ── Part 1 · Band 3.0–5.0 ─────────────────────────────────
  { skill: 'speaking', sub_skill_code: 'part1_personal', question_type: 'part1',
    question_text: 'Tell me about your hometown. What do you like most about it?',
    options: null, correct_answer: null, explanation: 'Part 1 personal topic — band 3-4 level. Evaluates basic fluency and simple description.',
    band_min: 3.0, band_max: 4.5, expected_time_sec: 60,
    error_tag: 'fluency', topic_tags: ['hometown', 'daily_life'],
    irt_a: 0.9, irt_b: -2.80, irt_c: 0.0 },

  { skill: 'speaking', sub_skill_code: 'part1_personal', question_type: 'part1',
    question_text: 'Do you enjoy cooking? What kinds of food can you make?',
    options: null, correct_answer: null, explanation: 'Part 1 everyday topic — band 3.5-5 level. Evaluates vocabulary range and simple explanations.',
    band_min: 3.5, band_max: 5.0, expected_time_sec: 60,
    error_tag: 'vocabulary', topic_tags: ['food', 'daily_life'],
    irt_a: 1.0, irt_b: -2.40, irt_c: 0.0 },

  { skill: 'speaking', sub_skill_code: 'part1_personal', question_type: 'part1',
    question_text: 'How do you usually spend your weekends? Has this changed compared to when you were younger?',
    options: null, correct_answer: null, explanation: 'Part 1 comparison — band 4-5 level. Tests ability to compare time periods using appropriate tenses.',
    band_min: 4.0, band_max: 5.5, expected_time_sec: 60,
    error_tag: 'tense_range', topic_tags: ['leisure', 'daily_life'],
    irt_a: 1.0, irt_b: -1.90, irt_c: 0.0 },

  { skill: 'speaking', sub_skill_code: 'part1_personal', question_type: 'part1',
    question_text: 'Do you prefer reading physical books or e-books? Why?',
    options: null, correct_answer: null, explanation: 'Part 1 preference — band 4.5-5.5 level. Tests opinion expression and basic justification.',
    band_min: 4.5, band_max: 5.5, expected_time_sec: 60,
    error_tag: 'coherence', topic_tags: ['technology', 'education'],
    irt_a: 1.1, irt_b: -1.50, irt_c: 0.0 },

  // ── Part 2 · Band 4.5–7.0 ─────────────────────────────────
  { skill: 'speaking', sub_skill_code: 'part2_cue_card', question_type: 'part2',
    question_text: 'Describe a place you visited that made a strong impression on you.\nYou should say:\n- where the place was\n- when you visited\n- what you did there\nand explain why it made such a strong impression on you.',
    options: null, correct_answer: null, explanation: 'Part 2 cue card — band 5-6 level. Tests extended speaking, coherence, and narrative skills.',
    band_min: 4.5, band_max: 6.0, expected_time_sec: 120,
    error_tag: 'coherence', topic_tags: ['travel', 'experience'],
    irt_a: 1.1, irt_b: -1.10, irt_c: 0.0 },

  { skill: 'speaking', sub_skill_code: 'part2_cue_card', question_type: 'part2',
    question_text: 'Describe a skill you have learned that you consider useful.\nYou should say:\n- what the skill is\n- how and when you learned it\n- how often you use it\nand explain why this skill is important to you.',
    options: null, correct_answer: null, explanation: 'Part 2 cue card — band 5.5-6.5 level. Tests ability to structure a 2-minute response with details.',
    band_min: 5.0, band_max: 6.5, expected_time_sec: 120,
    error_tag: 'lexical_resource', topic_tags: ['education', 'skills'],
    irt_a: 1.2, irt_b: -0.60, irt_c: 0.0 },

  { skill: 'speaking', sub_skill_code: 'part2_cue_card', question_type: 'part2',
    question_text: 'Describe an important decision you made in your life.\nYou should say:\n- what the decision was\n- how long it took you to make the decision\n- what the result was\nand explain whether you think it was a good decision.',
    options: null, correct_answer: null, explanation: 'Part 2 cue card — band 6-7 level. Tests nuanced language, complex clauses, and extended reasoning.',
    band_min: 5.5, band_max: 7.0, expected_time_sec: 120,
    error_tag: 'grammatical_range', topic_tags: ['personal', 'experience'],
    irt_a: 1.3, irt_b: 0.00, irt_c: 0.0 },

  { skill: 'speaking', sub_skill_code: 'part2_cue_card', question_type: 'part2',
    question_text: 'Describe a time when you had to work as part of a team to achieve a goal.\nYou should say:\n- what the goal was\n- who was in the team\n- what your role was\nand explain what made the teamwork successful or challenging.',
    options: null, correct_answer: null, explanation: 'Part 2 cue card — band 6.5-7.5 level. Tests sophisticated narrative, cause-effect language.',
    band_min: 6.0, band_max: 7.5, expected_time_sec: 120,
    error_tag: 'coherence', topic_tags: ['work', 'teamwork'],
    irt_a: 1.4, irt_b: 0.50, irt_c: 0.0 },

  // ── Part 3 · Band 6.0–9.0 ─────────────────────────────────
  { skill: 'speaking', sub_skill_code: 'part3_discussion', question_type: 'part3',
    question_text: 'Some people think social media has a mostly negative effect on society. To what extent do you agree, and what changes would you like to see?',
    options: null, correct_answer: null, explanation: 'Part 3 abstract discussion — band 6-7 level. Tests abstract thinking, expressing complex opinions.',
    band_min: 5.5, band_max: 7.0, expected_time_sec: 90,
    error_tag: 'coherence', topic_tags: ['technology', 'society'],
    irt_a: 1.3, irt_b: 0.20, irt_c: 0.0 },

  { skill: 'speaking', sub_skill_code: 'part3_discussion', question_type: 'part3',
    question_text: 'How do you think the role of universities will change in the next 20 years, given the rise of online learning?',
    options: null, correct_answer: null, explanation: 'Part 3 speculative — band 6.5-7.5 level. Tests hypothetical language, hedging, and complex ideas.',
    band_min: 6.0, band_max: 7.5, expected_time_sec: 90,
    error_tag: 'grammatical_range', topic_tags: ['education', 'technology'],
    irt_a: 1.5, irt_b: 0.70, irt_c: 0.0 },

  { skill: 'speaking', sub_skill_code: 'part3_discussion', question_type: 'part3',
    question_text: 'To what extent should governments prioritise economic growth over environmental sustainability? Justify your view with examples.',
    options: null, correct_answer: null, explanation: 'Part 3 evaluative — band 7-8 level. Tests high-level reasoning, complex syntactic structures, precise vocabulary.',
    band_min: 6.5, band_max: 8.0, expected_time_sec: 90,
    error_tag: 'lexical_resource', topic_tags: ['environment', 'economy'],
    irt_a: 1.6, irt_b: 1.10, irt_c: 0.0 },

  { skill: 'speaking', sub_skill_code: 'part3_discussion', question_type: 'part3',
    question_text: 'How far do you think artificial intelligence will transform the nature of human work, and what societal challenges might this create?',
    options: null, correct_answer: null, explanation: 'Part 3 abstract/speculative — band 7.5-9 level. Tests sophisticated hedging, nuanced argument construction, complex vocabulary.',
    band_min: 7.0, band_max: 9.0, expected_time_sec: 90,
    error_tag: 'coherence', topic_tags: ['technology', 'work'],
    irt_a: 1.7, irt_b: 1.50, irt_c: 0.0 },
];

// ── Runner ────────────────────────────────────────────────────
async function main() {
  console.log('=== Seeding PLACEMENT EXTRA — 102 questions (Vocab 30 + Listening 30 + Writing 30 + Speaking 12) ===\n');

  let inserted = 0;
  let skipped = 0;

  for (const q of QUESTIONS) {
    const existing = await prisma.$queryRawUnsafe(
      'SELECT id FROM ielts_questions WHERE question_text = $1 LIMIT 1',
      q.question_text,
    );
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO ielts_questions (
        skill, sub_skill_code, question_type, question_text,
        options, correct_answer, explanation,
        band_min, band_max, difficulty_weight, expected_time_sec,
        error_tag, topic_tags,
        irt_a, irt_b, irt_c,
        is_placement, status, is_ai_generated
      ) VALUES (
        $1, $2, $3, $4,
        $5::jsonb, $6, $7,
        $8, $9, 1.0, $10,
        $11, $12::text[],
        $13, $14, $15,
        true, 'approved', false
      )
      `,
      q.skill, q.sub_skill_code, q.question_type, q.question_text,
      q.options !== null && q.options !== undefined ? q.options : JSON.stringify([]),
      q.correct_answer !== null && q.correct_answer !== undefined ? q.correct_answer : '',
      q.explanation,
      q.band_min, q.band_max, q.expected_time_sec,
      q.error_tag,
      `{${q.topic_tags.map((t) => `"${t}"`).join(',')}}`,
      q.irt_a, q.irt_b, q.irt_c,
    );
    console.log(
      `  [${q.skill}] band ${q.band_min}-${q.band_max} | irt_b=${q.irt_b.toFixed(2)} | ${q.question_type}`,
    );
    inserted++;
  }

  console.log(`\nInserted: ${inserted} | Skipped (existed): ${skipped}\n`);

  // Summary by skill and irt_b range
  const pool = await prisma.$queryRawUnsafe(`
    SELECT
      skill,
      COUNT(*) FILTER (WHERE irt_b <= -2.0)::int  AS "very_low (<=−2)",
      COUNT(*) FILTER (WHERE irt_b > -2.0 AND irt_b <= -1.0)::int AS "low (−2..−1)",
      COUNT(*) FILTER (WHERE irt_b > -1.0 AND irt_b <=  0.0)::int AS "mid_low (−1..0)",
      COUNT(*) FILTER (WHERE irt_b >  0.0 AND irt_b <=  1.0)::int AS "mid_high (0..1)",
      COUNT(*) FILTER (WHERE irt_b >  1.0)::int                   AS "high (>1)",
      COUNT(*)::int                                              AS total
    FROM ielts_questions
    WHERE is_placement = true
      AND status = 'approved'
      AND irt_b IS NOT NULL
    GROUP BY skill
    ORDER BY skill
  `);
  console.log('=== Placement pool by skill & irt_b range ===');
  console.table(pool);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
