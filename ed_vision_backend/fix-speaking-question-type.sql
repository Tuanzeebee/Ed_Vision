-- ============================================
-- FIX: Speaking Questions có questionType sai
-- ============================================
-- Vấn đề: Speaking questions trong DB có question_type = 'gap_fill'
-- Giải pháp: Update về 'speaking' để đúng với logic

-- Kiểm tra trước khi fix
SELECT 
  id, 
  skill, 
  question_type, 
  question_text,
  is_placement
FROM ielts_questions 
WHERE skill = 'speaking' 
  AND question_type != 'speaking'
LIMIT 10;

-- Fix: Update question_type về 'speaking'
UPDATE ielts_questions 
SET question_type = 'speaking' 
WHERE skill = 'speaking' 
  AND question_type != 'speaking';

-- Verify sau khi fix
SELECT 
  skill,
  question_type,
  COUNT(*) as count
FROM ielts_questions 
WHERE skill = 'speaking'
GROUP BY skill, question_type;

-- Expected result:
-- skill    | question_type | count
-- speaking | speaking      | X
