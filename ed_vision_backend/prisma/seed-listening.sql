-- ============================================================
-- SEED: LISTENING — 12 câu chuẩn IELTS format
-- Script đính kèm → generate TTS audio
-- Section 1 (4 câu) + Section 2 (4 câu) + Section 3-4 (4 câu)
-- Band: 4.0 → 7.5
-- ============================================================

-- XÓA CÂU LISTENING CŨ KHÔNG CHUẨN (có [SCRIPT] trong question_text)
DELETE FROM ielts_questions
WHERE skill = 'listening'
  AND is_placement = true
  AND question_text LIKE '%[SCRIPT]%';

-- ============================================================
-- INSERT LISTENING SCRIPTS VÀO ielts_passages
-- Mỗi script = 1 passage với audio_url (điền sau khi TTS xong)
-- ============================================================

INSERT INTO ielts_passages (
  skill, title, content, band_min, band_max,
  topic_tags, section_type,
  audio_url, audio_duration_sec, accent_type, tts_generated,
  is_ai_generated, status
) VALUES

-- Script 1: Section 1 — Band 4.0 (Conversation, daily life)
-- TTS: 2 giọng, British, 0.85x speed
(
  'listening',
  'Sports Centre Membership Enquiry',
  'RECEPTIONIST: Good morning, Riverside Sports Centre. How can I help you?

CALLER: Oh, hello. I''m calling to find out about joining as a member.

RECEPTIONIST: Of course. We have three types of membership. The first is our Standard membership, which is forty-five pounds per month. That gives you access to the gym and swimming pool during off-peak hours — so before five in the afternoon on weekdays.

CALLER: Right. And what are the other options?

RECEPTIONIST: The second option is Premium membership, which costs sixty-two pounds per month. That includes full access at all times, plus two free personal training sessions each month.

CALLER: That sounds good. And the third?

RECEPTIONIST: The third is our Family membership — that''s for up to two adults and two children. It''s ninety pounds per month, and the children can use all facilities except the gym, as they need to be sixteen or over for that.

CALLER: I see. Could I visit to have a look before I decide?

RECEPTIONIST: Absolutely. We''re open seven days a week. The best time for a tour would be Tuesday or Thursday mornings, between nine and eleven. Would either of those work for you?

CALLER: Thursday morning would be perfect. Should I book?

RECEPTIONIST: No booking needed — just ask for the membership team when you arrive. Could I take your name for our visitor log?

CALLER: Yes, it''s Patricia Holden. H-O-L-D-E-N.

RECEPTIONIST: Thank you, Ms Holden. We''ll look forward to seeing you on Thursday.',
  3.5, 4.5,
  ARRAY['sport','daily_life'], 1,
  NULL, 120, 'british', true,
  false, 'approved'
),

-- Script 2: Section 1 — Band 4.5 (Form completion)
(
  'listening',
  'Language School Enrolment',
  'ADVISOR: Welcome to the Global Language Academy. Take a seat. So, you''re interested in enrolling?

STUDENT: Yes, that''s right. I saw your advertisement online.

ADVISOR: Great. Let me take down some details. First, could I have your full name?

STUDENT: It''s Kenji Watanabe. K-E-N-J-I, Watanabe — W-A-T-A-N-A-B-E.

ADVISOR: Thank you. And your date of birth?

STUDENT: The fourteenth of March, nineteen ninety-six.

ADVISOR: Perfect. Which course are you interested in?

STUDENT: I''d like to improve my Business English. I''m particularly interested in presentation skills and writing formal emails.

ADVISOR: We have an excellent Business Communication course starting on the third of February. It runs on Monday and Wednesday evenings, from six-thirty to eight-thirty.

STUDENT: That works for me. How many students are in each class?

ADVISOR: We keep classes small — a maximum of twelve students. Your level is currently...?

STUDENT: I took a test last month. I''m B2, or IELTS 5.5, I think.

ADVISOR: Perfect for our upper-intermediate Business English group then. The course fee is three hundred and twenty pounds for the full twelve-week programme, or you can pay in two instalments of one hundred and sixty each.

STUDENT: I''d prefer to pay in instalments. Can I pay by card?

ADVISOR: Yes, we accept all major cards. Shall I enrol you now?

STUDENT: Please.',
  4.0, 5.0,
  ARRAY['education','work'], 1,
  NULL, 130, 'british', true,
  false, 'approved'
),

-- Script 3: Section 2 — Band 5.0 (Monologue, information)
(
  'listening',
  'City Museum Audio Guide Introduction',
  'Welcome to the Hartfield City Museum. My name is Sarah, and I''ll be your guide for today''s self-guided audio tour.

The museum was founded in eighteen eighty-two and has been at this location since nineteen twelve. We house over forty thousand artefacts spanning three thousand years of local and international history.

Before we begin, a few practical points. The museum has four floors. The ground floor, where you are now, contains our gift shop, café, and the main reception. Temporary exhibitions are held in the East Wing on this floor — our current exhibition on ancient trade routes runs until the end of next month.

Floors one and two contain our permanent collection. Floor one focuses on local history, from prehistoric times through to the industrial revolution. Floor two covers international collections, including our highly regarded Egyptian and Roman galleries.

Floor three is our research library, which is open to the public on weekdays by appointment only.

Photography is permitted throughout the museum, but we ask that you use silent mode and avoid flash photography in the galleries, as this can damage some of the older artefacts.

Guided tours depart from the main reception at ten-thirty and two-thirty daily. Each tour lasts approximately ninety minutes and is included in the admission price. The next tour begins in twenty minutes if any of you would like to join.

Audio guides, like this one, are available in twelve languages. If you need assistance, staff are stationed on each floor and are happy to help. Enjoy your visit.',
  4.5, 5.5,
  ARRAY['art_culture','education'], 2,
  NULL, 150, 'british', true,
  false, 'approved'
),

-- Script 4: Section 3 — Band 6.0 (Academic discussion)
(
  'listening',
  'Tutorial Discussion: Urban Farming',
  'TUTOR: So, Amara, Marcus — you''ve both been looking at urban farming for your assignment. How''s it going?

AMARA: It''s been really interesting, actually. I was quite surprised by the scale of some projects. There are rooftop farms in New York producing over fifty tons of vegetables a year.

MARCUS: I found that too. But I think the economic argument for urban farming is often overstated. When you factor in the cost of the land, the infrastructure, the lighting systems...

TUTOR: That''s a fair point. What did the research say about profitability?

MARCUS: Most small-scale urban farms aren''t profitable without subsidies. A study from the University of Wageningen found that only around a third of urban farms break even.

AMARA: But that''s partly because we''re measuring success too narrowly. Urban farms provide benefits that don''t show up in profit margins — reduced food miles, community engagement, mental health benefits for participants.

TUTOR: The idea of social return on investment.

AMARA: Exactly. And there''s the food security angle. If supply chains are disrupted — as we saw during the pandemic — having local food production becomes critically important.

MARCUS: I''d agree on the resilience point. Though I think the evidence for large-scale urban farming as a replacement for conventional agriculture is still quite weak. It''s more of a complement.

TUTOR: That''s a nuanced position. So for your assignment, are you arguing for or against expansion of urban farming?

AMARA: We''re arguing for targeted expansion — particularly in food deserts and in cities with high population density.

MARCUS: With the caveat that policy support and realistic profitability assessments need to be part of the conversation.',
  5.5, 6.5,
  ARRAY['environment','education','food'], 3,
  NULL, 180, 'british', true,
  false, 'approved'
);

-- ============================================================
-- LẤY ID PASSAGES VỪA INSERT
-- ============================================================

DO $$
DECLARE
  s1_id uuid;
  s2_id uuid;
  s3_id uuid;
  s4_id uuid;
BEGIN

SELECT id INTO s1_id FROM ielts_passages
WHERE title = 'Sports Centre Membership Enquiry' LIMIT 1;

SELECT id INTO s2_id FROM ielts_passages
WHERE title = 'Language School Enrolment' LIMIT 1;

SELECT id INTO s3_id FROM ielts_passages
WHERE title = 'City Museum Audio Guide Introduction' LIMIT 1;

SELECT id INTO s4_id FROM ielts_passages
WHERE title = 'Tutorial Discussion: Urban Farming' LIMIT 1;

-- ============================================================
-- SCRIPT 1 QUESTIONS — Band 4.0 (3 câu)
-- ============================================================

INSERT INTO ielts_questions (
  skill, sub_skill_code, question_type, question_text,
  options, correct_answer, explanation,
  passage_id, question_order, context_type,
  band_min, band_max, difficulty_weight, expected_time_sec,
  error_tag, topic_tags, status,
  irt_a, irt_b, irt_c, is_placement
) VALUES

-- L1.1: Form completion — price (band 3.5–4.5)
(
  'listening', 'form_completion', 'mcq',
  '[AUDIO: Sports Centre Membership Enquiry]

Listen and answer: How much does the Standard membership cost per month?',
  '["A. £45", "B. £62", "C. £90", "D. £32"]',
  'A',
  'The receptionist states: "The first is our Standard membership, which is forty-five pounds per month."',
  s1_id, 1, 'audio',
  3.5, 4.5, 1.0, 75,
  'form_completion', ARRAY['sport','daily_life'], 'approved',
  1.0, -2.50, 0.25, true
),

-- L1.2: MCQ — specific detail (band 4.0–5.0)
(
  'listening', 'mcq', 'mcq',
  '[AUDIO: Sports Centre Membership Enquiry]

Listen and answer: What restriction applies to children under the Family membership?',
  '["A. They cannot use the swimming pool", "B. They cannot use the gym", "C. They can only visit at weekends", "D. They need a parent present at all times"]',
  'B',
  'The receptionist says: "the children can use all facilities except the gym, as they need to be sixteen or over for that."',
  s1_id, 2, 'audio',
  4.0, 5.0, 1.2, 70,
  'mcq', ARRAY['sport'], 'approved',
  1.2, -1.91, 0.25, true
),

-- L1.3: Form completion — name spelling (band 3.5–4.0)
(
  'listening', 'form_completion', 'mcq',
  '[AUDIO: Sports Centre Membership Enquiry]

Listen and answer: What is the caller''s surname?',
  '["A. Holden", "B. Horden", "C. Holton", "D. Halden"]',
  'A',
  'The caller spells her name: "Patricia Holden. H-O-L-D-E-N." → Holden.',
  s1_id, 3, 'audio',
  3.5, 4.0, 1.0, 65,
  'form_completion', ARRAY['daily_life'], 'approved',
  1.0, -2.73, 0.25, true
),

-- ============================================================
-- SCRIPT 2 QUESTIONS — Band 4.5 (3 câu)
-- ============================================================

-- L2.1: Form completion — schedule (band 4.0–5.0)
(
  'listening', 'form_completion', 'mcq',
  '[AUDIO: Language School Enrolment]

Listen and answer: On which evenings does the Business Communication course run?',
  '["A. Tuesday and Thursday", "B. Monday and Wednesday", "C. Monday and Friday", "D. Wednesday and Friday"]',
  'B',
  'The advisor states: "It runs on Monday and Wednesday evenings, from six-thirty to eight-thirty."',
  s2_id, 1, 'audio',
  4.0, 5.0, 1.2, 70,
  'form_completion', ARRAY['education','work'], 'approved',
  1.2, -1.91, 0.25, true
),

-- L2.2: MCQ — number detail (band 4.5–5.5)
(
  'listening', 'mcq', 'mcq',
  '[AUDIO: Language School Enrolment]

Listen and answer: What is the maximum number of students in each Business English class?',
  '["A. 8", "B. 10", "C. 12", "D. 15"]',
  'C',
  'The advisor says: "We keep classes small — a maximum of twelve students."',
  s2_id, 2, 'audio',
  4.5, 5.5, 1.3, 65,
  'mcq', ARRAY['education'], 'approved',
  1.3, -1.36, 0.25, true
),

-- L2.3: MCQ — payment preference (band 4.5–5.0)
(
  'listening', 'mcq', 'mcq',
  '[AUDIO: Language School Enrolment]

Listen and answer: How does the student prefer to pay for the course?',
  '["A. Full payment upfront", "B. In two equal instalments", "C. Monthly direct debit", "D. Cash on arrival"]',
  'B',
  'Student says: "I''d prefer to pay in instalments." The advisor confirms two instalments of £160 each.',
  s2_id, 3, 'audio',
  4.0, 4.5, 1.1, 65,
  'form_completion', ARRAY['education'], 'approved',
  1.1, -2.18, 0.25, true
),

-- ============================================================
-- SCRIPT 3 QUESTIONS — Band 5.0 (3 câu)
-- ============================================================

-- L3.1: Note completion — location (band 4.5–5.5)
(
  'listening', 'note_completion', 'mcq',
  '[AUDIO: City Museum Audio Guide Introduction]

Listen and answer: Where are temporary exhibitions held in the museum?',
  '["A. On the first floor", "B. In the West Wing on the ground floor", "C. In the East Wing on the ground floor", "D. On the second floor"]',
  'C',
  'The guide states: "Temporary exhibitions are held in the East Wing on this floor [ground floor]."',
  s3_id, 1, 'audio',
  4.5, 5.5, 1.3, 65,
  'note_completion', ARRAY['art_culture'], 'approved',
  1.3, -1.36, 0.25, true
),

-- L3.2: MCQ — specific rule (band 5.0–6.0)
(
  'listening', 'mcq', 'mcq',
  '[AUDIO: City Museum Audio Guide Introduction]

Listen and answer: What photography rule applies inside the museum galleries?',
  '["A. Photography is not permitted anywhere in the museum", "B. Photography is allowed but without flash", "C. Photography is only permitted on the ground floor", "D. Visitors must obtain a photography permit"]',
  'B',
  'The guide says: "Photography is permitted throughout the museum, but we ask that you use silent mode and avoid flash photography in the galleries."',
  s3_id, 2, 'audio',
  5.0, 6.0, 1.4, 65,
  'mcq', ARRAY['art_culture'], 'approved',
  1.4, -0.82, 0.25, true
),

-- L3.3: MCQ — inference from context (band 5.5–6.5)
(
  'listening', 'mcq', 'mcq',
  '[AUDIO: City Museum Audio Guide Introduction]

Listen and answer: When is the research library on floor three available to members of the public?',
  '["A. Every day during opening hours", "B. On weekends only", "C. On weekdays, but only if arranged in advance", "D. It is not open to the public"]',
  'C',
  '"Floor three is our research library, which is open to the public on weekdays by appointment only." → weekdays + must book in advance.',
  s3_id, 3, 'audio',
  5.5, 6.5, 1.5, 60,
  'mcq', ARRAY['education'], 'approved',
  1.5, -0.55, 0.25, true
),

-- ============================================================
-- SCRIPT 4 QUESTIONS — Band 6.0 (3 câu)
-- ============================================================

-- L4.1: MCQ — specific data (band 5.5–6.5)
(
  'listening', 'mcq', 'mcq',
  '[AUDIO: Tutorial Discussion: Urban Farming]

Listen and answer: According to Marcus, what proportion of urban farms break even, based on the Wageningen study?',
  '["A. Less than a quarter", "B. About a third", "C. Just over half", "D. Almost two thirds"]',
  'B',
  'Marcus states: "A study from the University of Wageningen found that only around a third of urban farms break even."',
  s4_id, 1, 'audio',
  5.5, 6.5, 1.6, 60,
  'mcq', ARRAY['environment','education'], 'approved',
  1.6, -0.27, 0.25, true
),

-- L4.2: MCQ — speaker attitude (band 6.0–7.0)
(
  'listening', 'attitude_detection', 'mcq',
  '[AUDIO: Tutorial Discussion: Urban Farming]

Listen and answer: What is Marcus''s overall attitude towards urban farming as a replacement for conventional agriculture?',
  '["A. Strongly supportive — he believes it should replace conventional farming", "B. Sceptical — he thinks the evidence for large-scale replacement is weak", "C. Neutral — he has no clear opinion", "D. Opposed — he thinks urban farming has no value"]',
  'B',
  'Marcus says: "the evidence for large-scale urban farming as a replacement for conventional agriculture is still quite weak." He supports it as a complement, not replacement.',
  s4_id, 2, 'audio',
  6.0, 7.0, 1.7, 55,
  'attitude_detection', ARRAY['environment'], 'approved',
  1.7, 0.27, 0.25, true
),

-- L4.3: MCQ — inference from discussion (band 6.5–7.5)
(
  'listening', 'attitude_detection', 'mcq',
  '[AUDIO: Tutorial Discussion: Urban Farming]

Listen and answer: Amara and Marcus ultimately agree on which of the following points?',
  '["A. Urban farming is economically viable without government subsidies", "B. Urban farming should completely replace conventional agriculture", "C. Local food production can improve resilience against supply chain disruptions", "D. The social benefits of urban farming are more important than its economic viability"]',
  'C',
  'Amara raises the food security/resilience argument and Marcus responds: "I''d agree on the resilience point." This is the one point of explicit agreement.',
  s4_id, 3, 'audio',
  6.5, 7.5, 1.9, 55,
  'attitude_detection', ARRAY['environment','education'], 'approved',
  1.9, 0.82, 0.25, true
);

END $$;

-- ============================================================
-- FINAL VERIFY — Toàn bộ pool placement
-- ============================================================

SELECT
  skill,
  count(*) as total_questions,
  round(min(irt_b)::numeric, 2) as irt_b_min,
  round(max(irt_b)::numeric, 2) as irt_b_max,
  round(avg(irt_b)::numeric, 2) as irt_b_avg
FROM ielts_questions
WHERE is_placement = true AND status = 'approved'
GROUP BY skill
ORDER BY skill;
