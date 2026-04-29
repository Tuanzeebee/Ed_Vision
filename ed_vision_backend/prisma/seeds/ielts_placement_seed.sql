-- ============================================================
-- SEED: Placement pool cho 3 skills còn thiếu
-- Listening: 6 câu (MCQ + sentence completion dựa trên script ngắn)
-- Writing:   6 câu proxy (grammar + cohesion + task response MCQ)
-- Speaking:  6 câu proxy (vocabulary range + collocation + register)
-- Tổng: 18 câu mới, is_placement = true, status = approved
-- irt_b trải đều từ -2.5 → +2.0 mỗi skill
-- ============================================================

-- ============================================================
-- LISTENING (6 câu)
-- Dựa trên script ngắn đính kèm trong question_text
-- Dạng MCQ — user đọc script rồi trả lời (TTS bổ sung sau)
-- ============================================================

INSERT INTO ielts_questions (
  skill, question_type, question_text,
  options, correct_answer, explanation,
  band_min, band_max, difficulty_weight, expected_time_sec,
  topic_tags, status,
  irt_a, irt_b, irt_c, is_placement
) VALUES

-- Band 3.5–4.5 | irt_b = -2.5
(
  'listening', 'mcq',
  '[SCRIPT] "Good morning. This is City Library. We are open Monday to Friday, 9am to 6pm, and Saturday 10am to 4pm. We are closed on Sundays."
  
  Question: What time does the library close on Saturday?',
  '["A. 4pm", "B. 6pm", "C. 9am", "D. 10am"]',
  'A',
  'Script nói rõ: Saturday 10am to 4pm → đóng cửa lúc 4pm.',
  3.5, 4.5, 1.0, 75,
  ARRAY['education','daily_life'], 'approved',
  1.0, -2.50, 0.25, true
),

-- Band 4.0–5.0 | irt_b = -1.9
(
  'listening', 'mcq',
  '[SCRIPT] "Welcome to Green Park Hotel. Check-in is from 2pm. Breakfast is served in the Garden Restaurant on the ground floor from 7 to 10am. Free parking is available at the rear of the building."

  Question: Where is breakfast served?',
  '["A. First floor restaurant", "B. Ground floor restaurant", "C. Rooftop café", "D. Room service only"]',
  'B',
  'Script nói: Garden Restaurant on the ground floor.',
  4.0, 5.0, 1.2, 75,
  ARRAY['travel','daily_life'], 'approved',
  1.2, -1.90, 0.25, true
),

-- Band 4.5–5.5 | irt_b = -1.3
(
  'listening', 'mcq',
  '[SCRIPT] "This is an announcement for passengers on Flight BA204 to London Heathrow. Due to a technical issue, departure has been delayed by approximately 90 minutes. We apologise for any inconvenience. Passengers should remain in the departure lounge."

  Question: Why is the flight delayed?',
  '["A. Bad weather", "B. A technical problem", "C. Staff shortage", "D. Airport congestion"]',
  'B',
  'Script nói: due to a technical issue.',
  4.5, 5.5, 1.3, 70,
  ARRAY['travel'], 'approved',
  1.3, -1.30, 0.25, true
),

-- Band 5.0–6.0 | irt_b = -0.7
(
  'listening', 'mcq',
  '[SCRIPT] "In today''s lecture, we will examine three main factors contributing to urban population growth: rural-urban migration driven by employment opportunities, natural population increase, and the expansion of city boundaries to incorporate surrounding areas. Each factor interacts with the others in complex ways."

  Question: According to the speaker, what is ONE cause of urban population growth?',
  '["A. Declining birth rates in cities", "B. People moving from rural areas for work", "C. Reduction in city boundaries", "D. Decrease in international migration"]',
  'B',
  'Script nói: rural-urban migration driven by employment opportunities.',
  5.0, 6.0, 1.5, 65,
  ARRAY['housing','education'], 'approved',
  1.5, -0.70, 0.25, true
),

-- Band 6.0–7.0 | irt_b = +0.5
(
  'listening', 'mcq',
  '[SCRIPT] "What''s interesting about the study is not simply that exercise improves mood — that much we already knew — but rather that the type of exercise matters considerably. Participants who engaged in social forms of exercise, such as team sports, reported significantly greater improvements in wellbeing than those who exercised alone, even when the intensity and duration were identical."

  Question: What does the speaker suggest is the KEY finding of the study?',
  '["A. Exercise generally improves mood", "B. Intensity of exercise is the most important factor", "C. Social exercise produces greater wellbeing than solo exercise", "D. Duration of exercise matters more than type"]',
  'C',
  '"Not simply that... but rather" → phủ nhận điều đã biết, nhấn mạnh điều mới: social exercise.',
  6.0, 7.0, 1.7, 60,
  ARRAY['health','sport'], 'approved',
  1.7, 0.50, 0.25, true
),

-- Band 7.0–8.0 | irt_b = +1.8
(
  'listening', 'mcq',
  '[SCRIPT] "The economist argued that the relationship between automation and unemployment is more nuanced than popular discourse suggests. While certain categories of routine, codifiable tasks have indeed been displaced, the evidence does not support the hypothesis of net job destruction. Rather, technological displacement tends to be sector-specific and temporally concentrated, with labour markets demonstrating considerable adaptive capacity over medium-term horizons."

  Question: What is the economist''s central claim?',
  '["A. Automation always causes long-term unemployment", "B. Technology destroys more jobs than it creates", "C. Labour markets can adapt to technological change over time", "D. Routine jobs are not affected by automation"]',
  'C',
  '"Labour markets demonstrating considerable adaptive capacity" → thị trường lao động có khả năng thích ứng.',
  7.0, 8.0, 2.0, 55,
  ARRAY['economy','ai_automation'], 'approved',
  2.0, 1.80, 0.25, true
),

-- ============================================================
-- WRITING PROXY (6 câu)
-- Đo gián tiếp: grammar range, cohesion, task response
-- Tương quan cao với Writing band thực tế
-- ============================================================

-- Band 3.5–4.5 | irt_b = -2.5
(
  'writing', 'mcq',
  'Choose the sentence that is grammatically correct:',
  '["A. She don''t like vegetables.", "B. She doesn''t likes vegetables.", "C. She doesn''t like vegetables.", "D. She not like vegetables."]',
  'C',
  'Ngôi 3 số ít: does + not + bare infinitive → doesn''t like.',
  3.5, 4.5, 1.0, 75,
  ARRAY['academic'], 'approved',
  1.0, -2.50, 0.25, true
),

-- Band 4.0–5.0 | irt_b = -1.8
(
  'writing', 'mcq',
  'Choose the best linking word: "The project was expensive. _____, the results were disappointing."',
  '["A. Therefore", "B. Furthermore", "C. Moreover", "D. Nevertheless"]',
  'D',
  '"Nevertheless" = mặc dù vậy — thể hiện tương phản giữa 2 mệnh đề. Các từ còn lại không phù hợp ngữ nghĩa.',
  4.0, 5.0, 1.2, 75,
  ARRAY['academic'], 'approved',
  1.2, -1.80, 0.25, true
),

-- Band 5.0–6.0 | irt_b = -0.8
(
  'writing', 'mcq',
  'Which sentence best introduces the main argument in a Task 2 essay on "whether governments should fund space exploration"?',
  '["A. Space is very interesting and governments like it.", "B. This essay will talk about space exploration and money.", "C. While space exploration offers scientific benefits, the allocation of public funds to this sector remains a contentious issue.", "D. I think governments should not fund space because there are many problems on Earth."]',
  'C',
  'Câu C có thesis rõ ràng, ngôn ngữ học thuật, cân bằng 2 phía — đúng chuẩn Task 2 band 6+.',
  5.0, 6.0, 1.5, 65,
  ARRAY['academic','science'], 'approved',
  1.5, -0.80, 0.25, true
),

-- Band 5.5–6.5 | irt_b = -0.2
(
  'writing', 'mcq',
  'Read this paragraph: "Cities are growing rapidly. This causes problems. There are traffic jams. Air pollution is also bad. People are unhappy."
  
  What is the main weakness of this paragraph?',
  '["A. The ideas are irrelevant to the topic", "B. The sentences are not connected and lack cohesion", "C. The vocabulary is too academic", "D. The paragraph is too long"]',
  'B',
  'Các câu rời rạc, không có linking words, không có topic sentence rõ ràng → thiếu cohesion và coherence.',
  5.5, 6.5, 1.6, 65,
  ARRAY['academic','housing'], 'approved',
  1.6, -0.20, 0.25, true
),

-- Band 6.5–7.5 | irt_b = +0.9
(
  'writing', 'mcq',
  'Which revision BEST improves this sentence for academic writing?
  Original: "A lot of people think that social media is bad for kids."',
  '["A. Many people think social media is not good for children.", "B. Lots of individuals consider social media harmful to kids.", "C. A significant proportion of researchers contend that social media has detrimental effects on child development.", "D. Social media is thought to be really bad for young people by many."]',
  'C',
  'Câu C: "a significant proportion", "contend", "detrimental effects", "child development" — tất cả là academic register chuẩn.',
  6.5, 7.5, 1.8, 60,
  ARRAY['academic','media'], 'approved',
  1.8, 0.90, 0.25, true
),

-- Band 7.0–8.0 | irt_b = +1.7
(
  'writing', 'mcq',
  'A student wrote: "The graph shows that the number of people using public transport increased. This was because the government invested in infrastructure."
  
  Which feedback is MOST accurate?',
  '["A. The response is perfect — it describes and explains the trend correctly.", "B. The description is accurate but the causal claim is unsupported — the graph shows correlation, not cause.", "C. The vocabulary is too simple for Task 1.", "D. The sentence structure needs to be more complex."]',
  'B',
  'Task 1 yêu cầu mô tả data, không suy diễn nguyên nhân trừ khi data cho thấy rõ. Đây là lỗi Task Achievement phổ biến ở band 6.',
  7.0, 8.0, 2.0, 55,
  ARRAY['academic'], 'approved',
  2.0, 1.70, 0.25, true
),

-- ============================================================
-- SPEAKING PROXY (6 câu)
-- Đo gián tiếp: lexical resource, collocation, register, fluency awareness
-- Tương quan cao với Speaking band thực tế
-- ============================================================

-- Band 3.5–4.5 | irt_b = -2.5
(
  'speaking', 'mcq',
  'Which response sounds most natural when asked "How do you usually spend your weekends?"',
  '["A. I spend weekend by sleep and eat.", "B. In weekend I am doing relax activities.", "C. I usually hang out with friends or stay home and watch movies.", "D. My weekend is spent with doing various of things."]',
  'C',
  'Câu C tự nhiên, đúng ngữ pháp, dùng collocation tốt (hang out, stay home). Các câu còn lại có lỗi cấu trúc.',
  3.5, 4.5, 1.0, 75,
  ARRAY['daily_life'], 'approved',
  1.0, -2.50, 0.25, true
),

-- Band 4.0–5.0 | irt_b = -1.8
(
  'speaking', 'mcq',
  'Choose the most natural collocation to complete the sentence:
  "She _____ a lot of pressure at work recently."',
  '["A. has", "B. does", "C. makes", "D. has been under"]',
  'D',
  '"Be under pressure" là collocation chuẩn. "Has been under" diễn tả trạng thái kéo dài đến hiện tại.',
  4.0, 5.0, 1.2, 75,
  ARRAY['work'], 'approved',
  1.2, -1.80, 0.25, true
),

-- Band 5.0–6.0 | irt_b = -0.7
(
  'speaking', 'mcq',
  'In IELTS Speaking Part 2, a candidate said:
  "I want to talk about a place I like. It is the beach. The beach is nice. I like it because it is relaxing. I go there sometimes."
  
  What is the main issue with this response?',
  '["A. The topic is not relevant to the question", "B. The response is too long", "C. The vocabulary is repetitive and lacks range", "D. The grammar contains too many errors"]',
  'C',
  '"Nice", "like", "relaxing" — từ vựng đơn giản, lặp lại. Thiếu descriptive language và collocation đa dạng → Lexical Resource thấp.',
  5.0, 6.0, 1.5, 65,
  ARRAY['daily_life','travel'], 'approved',
  1.5, -0.70, 0.25, true
),

-- Band 5.5–6.5 | irt_b = -0.1
(
  'speaking', 'mcq',
  'Which response uses the MOST appropriate language for IELTS Speaking Part 3 when asked "Do you think technology has changed the way people communicate?"',
  '["A. Yeah totally, like everyone uses phones now and stuff.", "B. Yes, I think technology changed communication a lot for people.", "C. Undoubtedly, digital technology has fundamentally transformed interpersonal communication, enabling instantaneous global connectivity.", "D. Technology has significantly changed how people communicate, making it faster and more accessible, though some argue this comes at the cost of deeper human connection."]',
  'D',
  'Câu D: academic nhưng tự nhiên, có nuance (though some argue), không quá formal như C. Phù hợp nhất với Part 3.',
  5.5, 6.5, 1.6, 65,
  ARRAY['technology','daily_life'], 'approved',
  1.6, -0.10, 0.25, true
),

-- Band 6.5–7.5 | irt_b = +1.0
(
  'speaking', 'mcq',
  'Choose the phrase that BEST extends this speaking response naturally:
  "I think remote work has many benefits... ___"',
  '["A. ...because it is good.", "B. ...for example, employees can save commuting time, which they can reinvest in personal development or family time.", "C. ...it is nice and people like it.", "D. ...remote work benefits are numerous as I said."]',
  'B',
  'Câu B mở rộng bằng ví dụ cụ thể, dùng "reinvest" — từ vựng range tốt, cấu trúc rõ ràng. Đây là cách native-like speakers extend answers.',
  6.5, 7.5, 1.8, 60,
  ARRAY['work','technology'], 'approved',
  1.8, 1.00, 0.25, true
),

-- Band 7.0–8.0 | irt_b = +1.9
(
  'speaking', 'mcq',
  'A candidate answered a Part 3 question about environmental responsibility with:
  "Well, it''s a thorny issue, really. On one hand, individuals can make incremental changes — reducing consumption, choosing sustainable products — but the structural barriers are considerable. I mean, without systemic policy changes, individual action alone is somewhat... tokenistic, if you will."
  
  Which criterion does this response demonstrate MOST strongly?',
  '["A. Pronunciation", "B. Fluency and Coherence only", "C. Lexical Resource — sophisticated and precise vocabulary use", "D. Grammatical Range — complex sentence structures"]',
  'C',
  '"Thorny issue", "incremental", "structural barriers", "systemic", "tokenistic" — tất cả là từ vựng chính xác, tinh tế. Đây là Lexical Resource band 8.',
  7.0, 8.0, 2.0, 55,
  ARRAY['environment','academic'], 'approved',
  2.0, 1.90, 0.25, true
);

-- ============================================================
-- VERIFY: Kiểm tra sau khi seed
-- ============================================================

SELECT skill, count(*) as total,
       min(irt_b) as irt_b_min,
       max(irt_b) as irt_b_max
FROM ielts_questions
WHERE is_placement = true AND status = 'approved'
GROUP BY skill
ORDER BY skill;

-- Expected:
-- listening | 6 | -2.50 | 1.80
-- reading   | 14| ...   | ...
-- speaking  | 6 | -2.50 | 1.90
-- vocabulary| 14| ...   | ...
-- writing   | 6 | -2.50 | 1.70
