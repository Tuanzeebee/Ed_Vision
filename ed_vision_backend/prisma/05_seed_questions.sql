-- ============================================================
-- SEED: Bộ câu hỏi mẫu cho Placement Test (đủ 5 kỹ năng)
-- Đủ để chạy adaptive test đầu vào chung toàn bộ kỹ năng
-- Sau này thay bằng câu hỏi thật từ content team
-- ============================================================

INSERT INTO ielts_questions (
  skill, question_type, question_text,
  options, correct_answer, explanation,
  band_min, band_max, difficulty_weight, expected_time_sec,
  topic_tags, status
) VALUES

-- ── BAND 3.5 – 4.0 (câu dễ) ─────────────────────────────────

(
  'vocabulary', 'mcq',
  'Choose the correct word: "She _____ to school every day."',
  '["A. go", "B. goes", "C. going", "D. gone"]',
  'B',
  '"She" là ngôi 3 số ít → động từ thêm -s: goes.',
  3.5, 4.5, 1.0, 90,
  ARRAY['daily_life'], 'approved'
),
(
  'vocabulary', 'mcq',
  'What does "happy" mean?',
  '["A. Sad", "B. Angry", "C. Pleased", "D. Tired"]',
  'C',
  'Happy = pleased/joyful. Đây là từ cơ bản band thấp.',
  3.5, 4.0, 1.0, 90,
  ARRAY['daily_life'], 'approved'
),
(
  'reading', 'true_false_ng',
  'Read: "The library opens at 8am on weekdays." — Statement: "The library is open before 9am on Monday." — True, False, or Not Given?',
  '["True", "False", "Not Given"]',
  'True',
  'Library opens at 8am → before 9am is True.',
  3.5, 4.5, 1.0, 90,
  ARRAY['education'], 'approved'
),

-- ── BAND 4.0 – 5.0 ──────────────────────────────────────────

(
  'vocabulary', 'mcq',
  'Choose the correct collocation: "She _____ a decision after thinking for a long time."',
  '["A. did", "B. made", "C. took", "D. had"]',
  'B',
  '"Make a decision" là collocation chuẩn trong tiếng Anh.',
  4.0, 5.0, 1.2, 75,
  ARRAY['daily_life'], 'approved'
),
(
  'reading', 'mcq',
  'Read: "Despite the heavy rain, the match continued without interruption." — Why did the match continue?',
  '["A. The rain stopped", "B. Players wanted to continue", "C. Rain did not stop the match", "D. Officials delayed it"]',
  'C',
  '"Despite" = mặc dù → trời mưa to nhưng trận đấu vẫn tiếp tục.',
  4.0, 5.0, 1.2, 75,
  ARRAY['sport'], 'approved'
),
(
  'vocabulary', 'gap_fill',
  'Complete the sentence: "Air pollution has a negative _____ on public health." (effect / affect)',
  NULL,
  'effect',
  '"Effect" là danh từ, dùng sau "a negative ___". "Affect" là động từ.',
  4.0, 5.0, 1.2, 75,
  ARRAY['environment', 'health'], 'approved'
),
(
  'reading', 'true_false_ng',
  'Read: "Scientists believe that regular exercise reduces the risk of heart disease by up to 35%." — Statement: "Exercise can lower the chance of heart problems." — True, False, or Not Given?',
  '["True", "False", "Not Given"]',
  'True',
  '"Reduces the risk" = "lower the chance" → paraphrase của nhau.',
  4.5, 5.5, 1.3, 75,
  ARRAY['health'], 'approved'
),

-- ── BAND 5.0 – 6.0 ──────────────────────────────────────────

(
  'vocabulary', 'mcq',
  'Choose the word closest in meaning to "inevitable":',
  '["A. possible", "B. avoidable", "C. certain", "D. temporary"]',
  'C',
  '"Inevitable" = cannot be avoided = certain to happen.',
  5.0, 6.0, 1.5, 60,
  ARRAY['academic'], 'approved'
),
(
  'reading', 'mcq',
  'Read: "The government allocated significant funds to renewable energy projects, signalling a shift away from fossil fuels." — What does this suggest about government policy?',
  '["A. Fossil fuels remain the priority", "B. Renewable energy is being prioritised", "C. Funds were reduced overall", "D. Policy has not changed"]',
  'B',
  '"Shift away from fossil fuels" + funding renewable energy → policy prioritises renewables.',
  5.0, 6.0, 1.5, 60,
  ARRAY['environment', 'economy'], 'approved'
),
(
  'vocabulary', 'gap_fill',
  'Complete with the correct form: "The report _____ (publish) last year showed alarming results."',
  NULL,
  'published',
  'Reduced relative clause: "published last year" = which was published last year.',
  5.0, 6.0, 1.5, 60,
  ARRAY['academic'], 'approved'
),
(
  'reading', 'mcq',
  'Read: "While proponents argue that globalisation has lifted millions out of poverty, critics contend it has widened inequality between nations." — What is the writer doing in this sentence?',
  '["A. Supporting globalisation", "B. Opposing globalisation", "C. Presenting two opposing views", "D. Explaining poverty statistics"]',
  'C',
  '"While proponents… critics contend" → cấu trúc trình bày 2 quan điểm đối lập.',
  5.5, 6.5, 1.6, 60,
  ARRAY['globalisation', 'economy'], 'approved'
),

-- ── BAND 6.0 – 7.0 ──────────────────────────────────────────

(
  'vocabulary', 'mcq',
  'Choose the most appropriate academic collocation: "The study _____ a significant correlation between sleep deprivation and cognitive decline."',
  '["A. found out", "B. revealed", "C. told", "D. showed up"]',
  'B',
  '"Reveal a correlation" là collocation học thuật. "Found out" và "showed up" là informal.',
  6.0, 7.0, 1.7, 60,
  ARRAY['academic', 'health'], 'approved'
),
(
  'reading', 'mcq',
  'Read: "The author does not dispute the economic benefits of tourism; however, she questions whether these benefits are equitably distributed among local communities." — The author''s attitude is best described as:',
  '["A. fully supportive", "B. entirely critical", "C. selectively sceptical", "D. completely neutral"]',
  'C',
  '"Does not dispute" = accepts one part, but "questions" distribution = sceptical on specific point.',
  6.0, 7.0, 1.7, 60,
  ARRAY['economy', 'travel'], 'approved'
),

-- ── BAND 7.0+ ────────────────────────────────────────────────

(
  'vocabulary', 'mcq',
  'Which sentence uses "mitigate" correctly in an academic context?',
  '["A. We need to mitigate our holiday plans.", "B. Policies were introduced to mitigate the adverse effects of urbanisation.", "C. She mitigated her phone before the meeting.", "D. The team mitigated the football match."]',
  'B',
  '"Mitigate adverse effects" = reduce negative impacts. Đây là cách dùng chuẩn học thuật.',
  7.0, 8.0, 2.0, 60,
  ARRAY['academic', 'housing'], 'approved'
),
(
  'reading', 'mcq',
  'Read: "It would be reductive to attribute the decline of biodiversity solely to agricultural expansion; a confluence of anthropogenic pressures — including urbanisation, pollution, and climate change — demands a more nuanced analytical framework." — The writer implies that:',
  '["A. Agriculture is the main cause of biodiversity loss", "B. Biodiversity decline has a single clear cause", "C. Multiple human-driven factors must be considered together", "D. Climate change is more important than agriculture"]',
  'C',
  '"Reductive to attribute solely" + "confluence of pressures" → không thể quy về 1 nguyên nhân.',
  7.0, 8.5, 2.0, 60,
  ARRAY['environment', 'academic'], 'approved'
),

-- ── LISTENING ───────────────────────────────────────────────

(
  'listening', 'mcq',
  'You hear: "The seminar has been moved from Room 12 to Room 14." Where will the seminar take place?',
  '["A. Room 10", "B. Room 12", "C. Room 14", "D. Room 16"]',
  'C',
  'Thông tin trực tiếp: moved to Room 14.',
  3.5, 4.5, 1.0, 90,
  ARRAY['education'], 'approved'
),
(
  'listening', 'true_false_ng',
  'Audio transcript: "The museum opens at 9 a.m. and closes at 5 p.m., except Friday when it closes at 7 p.m." Statement: "On Friday the museum closes at 5 p.m."',
  '["True", "False", "Not Given"]',
  'False',
  'Friday closes at 7 p.m., không phải 5 p.m.',
  4.0, 5.0, 1.2, 75,
  ARRAY['daily_life'], 'approved'
),
(
  'listening', 'gap_fill',
  'Complete the note from audio: "The delivery will arrive on _____ morning."',
  NULL,
  'Thursday',
  'Người nói xác nhận thời gian giao hàng là Thursday morning.',
  5.0, 6.0, 1.5, 60,
  ARRAY['business'], 'approved'
),
(
  'listening', 'mcq',
  'Lecture excerpt: "While solar remains cost-effective, grid stability requires diversified sources including storage and wind." What is the speaker''s main point?',
  '["A. Solar should be abandoned", "B. One source is enough", "C. Energy mix and storage are necessary", "D. Wind is too expensive"]',
  'C',
  'Ý chính: cần diversified sources + storage để ổn định lưới.',
  6.0, 7.0, 1.7, 60,
  ARRAY['environment', 'academic'], 'approved'
),
(
  'listening', 'mcq',
  'Interview excerpt: "The policy appears equitable in principle, yet implementation gaps disproportionately affect rural districts." What does the speaker imply?',
  '["A. Policy is equally effective everywhere", "B. Rural areas are less affected", "C. Implementation creates unequal outcomes", "D. The policy should be cancelled immediately"]',
  'C',
  'Cụm "implementation gaps disproportionately affect" = kết quả chưa công bằng.',
  7.0, 8.5, 2.0, 60,
  ARRAY['policy', 'academic'], 'approved'
),

-- ── WRITING ─────────────────────────────────────────────────

(
  'writing', 'gap_fill',
  'Choose the correct word to complete: "There are _____ students in the library today than yesterday."',
  NULL,
  'fewer',
  'Students là countable noun nên dùng fewer.',
  3.5, 4.5, 1.0, 90,
  ARRAY['grammar_basic'], 'approved'
),
(
  'writing', 'mcq',
  'Which sentence is best for IELTS Task 1 overview?',
  '["A. The chart is very interesting.", "B. Overall, sales increased steadily despite a brief decline in 2019.", "C. I think the company did great.", "D. The data is about numbers."]',
  'B',
  'Task 1 overview cần nêu trend chính, khách quan.',
  4.0, 5.0, 1.2, 75,
  ARRAY['task1'], 'approved'
),
(
  'writing', 'mcq',
  'Choose the strongest thesis statement for Task 2 (agree/disagree): "Some people think university should be free."',
  '["A. This is a topic many people discuss.", "B. I strongly agree that tertiary education should be publicly funded because it promotes equal opportunity and long-term economic growth.", "C. University has students and teachers.", "D. Free things are good."]',
  'B',
  'Thesis tốt: rõ lập trường + 2 lý do cụ thể.',
  5.0, 6.0, 1.5, 60,
  ARRAY['task2', 'argumentation'], 'approved'
),
(
  'writing', 'true_false_ng',
  'Statement about IELTS Writing: "Using a wide range of cohesive devices always increases score, even if overused."',
  '["True", "False", "Not Given"]',
  'False',
  'Overuse cohesive devices làm câu thiếu tự nhiên, có thể bị trừ điểm coherence.',
  6.0, 7.0, 1.7, 60,
  ARRAY['coherence'], 'approved'
),
(
  'writing', 'mcq',
  'Which sentence demonstrates more advanced lexical resource?',
  '["A. The problem is very big.", "B. The issue is serious.", "C. The issue is of considerable magnitude and warrants immediate intervention.", "D. The issue is okay."]',
  'C',
  'Câu C có lexical sophistication và collocation học thuật tốt hơn.',
  7.0, 8.5, 2.0, 60,
  ARRAY['lexical_resource'], 'approved'
),

-- ── SPEAKING ────────────────────────────────────────────────

(
  'speaking', 'mcq',
  'Which response is most natural for Speaking Part 1: "Do you enjoy reading books?"',
  '["A. Yes.", "B. Yes, I do. I usually read before bed because it helps me unwind.", "C. Reading book is good.", "D. Books."]',
  'B',
  'Part 1 cần câu trả lời ngắn nhưng có mở rộng tự nhiên.',
  3.5, 4.5, 1.0, 90,
  ARRAY['part1'], 'approved'
),
(
  'speaking', 'true_false_ng',
  'Speaking tip statement: "In IELTS Speaking, memorised answers may reduce your score if they sound unnatural."',
  '["True", "False", "Not Given"]',
  'True',
  'Giám khảo đánh giá khả năng giao tiếp tự nhiên, không phải đọc thuộc lòng.',
  4.0, 5.0, 1.2, 75,
  ARRAY['fluency'], 'approved'
),
(
  'speaking', 'gap_fill',
  'Fill the missing linker for a coherent response: "I prefer public transport; _____, it is cheaper and more eco-friendly."',
  NULL,
  'moreover',
  'Liên từ bổ sung ý phù hợp: moreover.',
  5.0, 6.0, 1.5, 60,
  ARRAY['coherence'], 'approved'
),
(
  'speaking', 'mcq',
  'Which answer better demonstrates balanced discussion for Part 3?',
  '["A. Technology is good.", "B. Technology has improved access to education, but it can also widen inequality where internet infrastructure is limited.", "C. I do not know.", "D. Technology is bad."]',
  'B',
  'Part 3 band cao cần phát triển ý hai chiều và lập luận rõ.',
  6.0, 7.0, 1.7, 60,
  ARRAY['part3', 'critical_thinking'], 'approved'
),
(
  'speaking', 'mcq',
  'Choose the sentence with better grammatical range and accuracy:',
  '["A. If people will have more time, they travel.", "B. If people had more time, they would be able to travel more frequently.", "C. People has time and travel.", "D. People travel more better."]',
  'B',
  'Câu B dùng conditional type 2 đúng và có cấu trúc tự nhiên hơn.',
  7.0, 8.5, 2.0, 60,
  ARRAY['grammar_range'], 'approved'
);