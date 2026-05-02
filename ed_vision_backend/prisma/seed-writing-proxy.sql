-- ============================================================
-- SEED: WRITING PROXY — 12 câu grammar in context
-- Format: gap-fill trong đoạn văn IELTS-like
-- Test: grammar range + cohesion + task achievement awareness
-- Band: 4.0 → 7.5
-- ============================================================

-- Xóa dữ liệu liên quan để tránh lỗi Foreign Key
DELETE FROM ielts_placement_answers WHERE question_id IN (
    SELECT id FROM ielts_questions WHERE skill = 'writing' AND is_placement = true
);

-- Xóa câu writing proxy cũ
DELETE FROM ielts_questions
WHERE skill = 'writing' AND is_placement = true;

INSERT INTO ielts_questions (
  skill, sub_skill_code, question_type, question_text,
  options, correct_answer, explanation,
  band_min, band_max, difficulty_weight, expected_time_sec,
  error_tag, topic_tags, status,
  irt_a, irt_b, irt_c, is_placement
) VALUES

-- ── GRAMMAR IN CONTEXT (Band 4.0) ────────────────────────────

-- W1: Subject-verb agreement (band 3.5–4.5)
(
  'writing', 'grammar_range', 'mcq',
  'Choose the correct option to complete this sentence from an IELTS Task 2 essay:

"The number of people who _____ in cities has increased dramatically over the past decade."',
  '["A. live", "B. lives", "C. living", "D. are live"]',
  'A',
  '"The number of people who live..." — relative clause subject is "people" (plural) → plural verb "live". "The number of" takes singular but the verb in the relative clause agrees with "people".',
  3.5, 4.5, 1.0, 70,
  'grammar_range', ARRAY['housing','academic'], 'approved',
  1.0, -2.50, 0.25, true
),

-- W2: Article use (band 4.0–5.0)
(
  'writing', 'grammar_range', 'mcq',
  'Choose the correct option to complete this IELTS Task 1 sentence:

"_____ graph below shows the percentage of households with internet access in four countries between 2000 and 2020."',
  '["A. A", "B. An", "C. The", "D. No article needed"]',
  'C',
  '"The graph" — specific reference to a particular graph shown in the task. Definite article "the" is required for specific, identifiable nouns.',
  4.0, 5.0, 1.1, 65,
  'grammar_range', ARRAY['technology','academic'], 'approved',
  1.1, -1.91, 0.25, true
),

-- W3: Passive voice (band 4.5–5.5)
(
  'writing', 'grammar_range', 'mcq',
  'Choose the correct passive form to complete this IELTS Task 1 process description:

"First, the raw materials _____ to the factory, where they _____ into smaller components."',
  '["A. are transported / are cut", "B. transport / cut", "C. are transporting / cutting", "D. transported / were cut"]',
  'A',
  'Process descriptions in Task 1 require passive voice (subject receives action). Present simple passive: "are transported / are cut" — describes a general, ongoing process.',
  4.5, 5.5, 1.3, 65,
  'grammar_range', ARRAY['academic'], 'approved',
  1.3, -1.36, 0.25, true
),

-- ── COHESION (Band 5.0) ──────────────────────────────────────

-- W4: Linking word — contrast (band 5.0–6.0)
(
  'writing', 'cohesion', 'mcq',
  'Choose the linking word that best completes this IELTS Task 2 sentence:

"Governments have invested heavily in public transport infrastructure. _____, private car ownership continues to rise in most urban centres."',
  '["A. Therefore", "B. Furthermore", "C. Nevertheless", "D. As a result"]',
  'C',
  '"Nevertheless" expresses contrast/concession — investment has happened, BUT car ownership still rises. "Therefore" and "As a result" express consequence. "Furthermore" adds information.',
  5.0, 6.0, 1.4, 65,
  'cohesion', ARRAY['transport','academic'], 'approved',
  1.4, -0.82, 0.25, true
),

-- W5: Referencing (band 5.0–6.0)
(
  'writing', 'cohesion', 'mcq',
  'Read this extract from an IELTS Task 2 essay and choose the best option:

"Many young people choose to study abroad. _____ allows them to experience different cultures and develop greater independence."',
  '["A. It", "B. This", "C. That", "D. Which"]',
  'B',
  '"This" refers back to the entire idea of studying abroad (not just one noun). "This" as a cohesive device referencing a whole clause is a marker of higher writing quality.',
  5.0, 6.0, 1.4, 60,
  'cohesion', ARRAY['education','academic'], 'approved',
  1.4, -0.82, 0.25, true
),

-- W6: Hedging language (band 5.5–6.5)
(
  'writing', 'lexical_resource', 'mcq',
  'Choose the option that uses the most appropriate academic hedging for an IELTS Task 2 essay:

"Technology _____ the way people communicate, though its effects on personal relationships remain debated."',
  '["A. definitely changed", "B. has totally changed", "C. has fundamentally altered", "D. really changed"]',
  'C',
  '"Has fundamentally altered" — academic register, present perfect (ongoing relevance), precise adverb "fundamentally". Avoids informal intensifiers "totally/really" and overconfident "definitely".',
  5.5, 6.5, 1.6, 60,
  'lexical_resource', ARRAY['technology','academic'], 'approved',
  1.6, -0.27, 0.25, true
),

-- ── TASK ACHIEVEMENT AWARENESS (Band 6.0+) ──────────────────

-- W7: Task 1 overview identification (band 6.0–7.0)
(
  'writing', 'task1_overview', 'mcq',
  'A student wrote this overview for an IELTS Task 1 bar chart showing employment rates across five industries in 2020:

"The bar chart illustrates employment data for five sectors."

What is the PRIMARY weakness of this overview?',
  '["A. It is too long", "B. It uses incorrect grammar", "C. It describes what the chart shows rather than summarising the main trend or key feature", "D. It does not mention the year"]',
  'C',
  'An overview must identify the most significant trend/feature, not re-describe the task. Saying "illustrates employment data" simply paraphrases the task instruction — no key finding is given.',
  6.0, 7.0, 1.7, 55,
  'task1_overview', ARRAY['academic'], 'approved',
  1.7, 0.27, 0.25, true
),

-- W8: Coherence — paragraph structure (band 6.0–7.0)
(
  'writing', 'cohesion', 'mcq',
  'Which sentence would BEST serve as a topic sentence for a body paragraph in a Task 2 essay arguing that governments should fund public libraries?

Topic: Should governments continue to fund public libraries in the digital age?',
  '["A. Libraries have books and computers.", "B. Many people use libraries every day in cities around the world.", "C. One significant argument in favour of government funding is that libraries provide equal access to information for all members of society, regardless of income.", "D. In conclusion, libraries are important and should be funded."]',
  'C',
  'C contains a clear position ("One significant argument"), specifies the argument (equal access), and sets up the paragraph''s development. A and B are factual statements without argument. D is a conclusion phrase.',
  6.0, 7.0, 1.7, 55,
  'cohesion', ARRAY['education','academic'], 'approved',
  1.7, 0.27, 0.25, true
),

-- W9: Lexical resource — precision (band 6.5–7.5)
(
  'writing', 'lexical_resource', 'mcq',
  'A student wrote: "The problem of pollution is very big in modern cities and it causes many bad things for people and the environment."

Which rewritten version demonstrates the BEST improvement in Lexical Resource for IELTS Task 2?',
  '["A. The problem of pollution is really big in modern cities.", "B. Urban pollution has reached critical levels in many cities, posing serious threats to public health and ecological systems.", "C. Pollution in modern cities is getting bigger and causing more problems.", "D. There is a lot of pollution in cities which is bad for people."]',
  'B',
  '"Urban pollution" (precise collocation), "reached critical levels" (gradable adjective + collocation), "posing serious threats" (formal register), "public health and ecological systems" (specific, academic vocabulary). All markers of LR band 7.',
  6.5, 7.5, 1.9, 55,
  'lexical_resource', ARRAY['environment','academic'], 'approved',
  1.9, 0.82, 0.25, true
),

-- W10: Task 2 — Argument evaluation (band 6.5–7.0)
(
  'writing', 'task2_body', 'mcq',
  'Read this body paragraph from a Task 2 essay and identify its main structural weakness:

"Some people think that children should learn a second language at school. This is because it is good for them. Languages help people get jobs. In conclusion, learning languages is beneficial."',
  '["A. The paragraph is too short", "B. The ideas are not supported with explanation or examples, and the paragraph ends with a conclusion phrase", "C. The grammar contains too many errors", "D. The vocabulary is too academic"]',
  'B',
  'The paragraph lacks developed support: "it is good for them" and "help people get jobs" are assertions without explanation. "In conclusion" is inappropriate mid-essay. This demonstrates underdeveloped Task Achievement.',
  6.5, 7.0, 1.8, 55,
  'task2_body', ARRAY['education','academic'], 'approved',
  1.8, 0.55, 0.25, true
),

-- W11: Grammar range — complex structures (band 7.0–7.5)
(
  'writing', 'grammar_range', 'mcq',
  'Choose the option that demonstrates the BEST grammatical range and accuracy for IELTS Task 2:

Topic sentence about the benefits of international travel for young people.',
  '["A. Young people who travel internationally get many benefits.", "B. Travelling to other countries is good for young people because they learn things.", "C. International travel, when undertaken during formative years, can cultivate cultural awareness and foster the kind of adaptability that proves invaluable in an increasingly interconnected world.", "D. Young people should travel because it is beneficial and educational."]',
  'C',
  'C demonstrates: non-finite clause ("when undertaken"), fronted adverbial, sophisticated vocabulary ("cultivate", "foster", "invaluable", "interconnected"), complex sentence structure. GRA band 8.',
  7.0, 7.5, 2.0, 50,
  'grammar_range', ARRAY['travel','academic'], 'approved',
  2.0, 1.36, 0.25, true
),

-- W12: Task 1 data language (band 5.5–6.5)
(
  'writing', 'task1_describe', 'mcq',
  'A line graph shows internet usage rising from 20% in 2000 to 85% in 2020. Which sentence BEST describes this trend for IELTS Task 1?',
  '["A. Internet usage went up a lot.", "B. The proportion of internet users increased significantly, rising from 20% in 2000 to 85% in 2020.", "C. More and more people used the internet in 2000 to 2020.", "D. Internet usage: 20% (2000) → 85% (2020)."]',
  'B',
  'B uses: "proportion" (precise noun), "increased significantly" (accurate verb + adverb), specific data cited correctly, formal register. Demonstrates Task 1 LR band 6–7.',
  5.5, 6.5, 1.6, 60,
  'task1_describe', ARRAY['technology','academic'], 'approved',
  1.6, -0.27, 0.25, true
);

-- Verify Writing
SELECT skill, count(*) as total,
       round(min(irt_b)::numeric, 2) as min_b,
       round(max(irt_b)::numeric, 2) as max_b
FROM ielts_questions
WHERE skill = 'writing'
  AND is_placement = true AND status = 'approved'
GROUP BY skill;
