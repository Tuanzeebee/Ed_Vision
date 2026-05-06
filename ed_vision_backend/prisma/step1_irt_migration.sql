-- ============================================================
-- STEP 1: Migration — Thêm IRT columns vào ielts_questions
-- Chạy file này trước tất cả mọi thứ
-- ============================================================

-- 1A. Thêm cột IRT parameters
ALTER TABLE ielts_questions
ADD COLUMN IF NOT EXISTS irt_a        NUMERIC(5,3) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS irt_b        NUMERIC(5,3) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS irt_c        NUMERIC(5,3) DEFAULT 0.25,
ADD COLUMN IF NOT EXISTS is_placement BOOLEAN      NOT NULL DEFAULT false;

-- 1B. Index cho placement pool query
CREATE INDEX IF NOT EXISTS idx_ielts_q_placement
ON ielts_questions (is_placement, status)
WHERE is_placement = true AND status = 'approved';

-- ============================================================
-- 1C. Update 15 câu seed với IRT values
-- Công thức map: irt_b = (band_mid - 6.25) / (5.5/6)
-- band 3.5 → irt_b ≈ -3.0
-- band 5.0 → irt_b ≈ -1.36
-- band 6.0 → irt_b ≈  0.0  (pivot)
-- band 7.5 → irt_b ≈ +1.36
-- band 9.0 → irt_b ≈ +3.0
--
-- irt_a: discrimination — câu placement cần ≥ 1.0
-- irt_c: guessing — MCQ 4 đáp án = 0.25, true/false = 0.33
-- is_placement = true — đưa vào pool placement
-- ============================================================

-- Band 3.5–4.0 (irt_b ≈ -2.7 đến -2.4)
UPDATE ielts_questions SET
irt_a = 1.0, irt_b = -2.73, irt_c = 0.25, is_placement = true
WHERE question_text LIKE '%She _____ to school every day%';

UPDATE ielts_questions SET
irt_a = 0.8, irt_b = -3.00, irt_c = 0.25, is_placement = true
WHERE question_text LIKE '%What does "happy" mean%';

UPDATE ielts_questions SET
irt_a = 1.0, irt_b = -2.45, irt_c = 0.33, is_placement = true
WHERE question_text LIKE '%library opens at 8am%';

-- Band 4.0–5.0 (irt_b ≈ -1.9 đến -1.4)
UPDATE ielts_questions SET
irt_a = 1.2, irt_b = -1.91, irt_c = 0.25, is_placement = true
WHERE question_text LIKE '%make a decision%' OR question_text LIKE '%made%decision%';

UPDATE ielts_questions SET
irt_a = 1.2, irt_b = -1.91, irt_c = 0.25, is_placement = true
WHERE question_text LIKE '%heavy rain%match continued%';

UPDATE ielts_questions SET
irt_a = 1.1, irt_b = -1.64, irt_c = 0.00, is_placement = true
WHERE question_text LIKE '%negative _____ on public health%';

UPDATE ielts_questions SET
irt_a = 1.2, irt_b = -1.45, irt_c = 0.33, is_placement = true
WHERE question_text LIKE '%regular exercise reduces%';

-- Band 5.0–6.0 (irt_b ≈ -0.9 đến -0.2)
UPDATE ielts_questions SET
irt_a = 1.4, irt_b = -0.82, irt_c = 0.25, is_placement = true
WHERE question_text LIKE '%closest in meaning to "inevitable"%';

UPDATE ielts_questions SET
irt_a = 1.4, irt_b = -0.82, irt_c = 0.25, is_placement = true
WHERE question_text LIKE '%allocated significant funds%renewable energy%';

UPDATE ielts_questions SET
irt_a = 1.3, irt_b = -0.55, irt_c = 0.00, is_placement = true
WHERE question_text LIKE '%publish%last year showed alarming%';

UPDATE ielts_questions SET
irt_a = 1.5, irt_b = -0.27, irt_c = 0.25, is_placement = true
WHERE question_text LIKE '%proponents%critics contend%';

-- Band 6.0–7.0 (irt_b ≈ +0.2 đến +0.8)
UPDATE ielts_questions SET
irt_a = 1.6, irt_b = 0.27, irt_c = 0.25, is_placement = true
WHERE question_text LIKE '%significant correlation between sleep%';

UPDATE ielts_questions SET
irt_a = 1.6, irt_b = 0.55, irt_c = 0.25, is_placement = true
WHERE question_text LIKE '%does not dispute the economic benefits%';

-- Band 7.0+ (irt_b ≈ +1.4 đến +2.0)
UPDATE ielts_questions SET
irt_a = 1.8, irt_b = 1.45, irt_c = 0.25, is_placement = true
WHERE question_text LIKE '%mitigate%correctly%';

UPDATE ielts_questions SET
irt_a = 2.0, irt_b = 1.91, irt_c = 0.25, is_placement = true
WHERE question_text LIKE '%reductive to attribute%decline of biodiversity%';

-- 1D. Verify kết quả
SELECT
LEFT(question_text, 50) AS question,
band_min, band_max,
irt_a, irt_b, irt_c,
is_placement
FROM ielts_questions
WHERE is_placement = true
ORDER BY irt_b ASC;
