-- ============================================================
-- SEED v2: LISTENING + SPEAKING — Placement Test
-- ============================================================


-- ============================================================
-- PHẦN A: LISTENING — 4 passages × 3 câu = 12 câu
-- ============================================================
INSERT INTO ielts_passages (
  skill, title, content,
  band_min, band_max,
  topic_tags, section_type,
  audio_url, audio_duration_sec, accent_type, tts_generated,
  is_ai_generated, status
) VALUES
(
  'listening',
  'Hotel Room Booking',
  'RECEPTIONIST: Good afternoon, Bluewater Hotel. How may I help you?
CALLER: Hello. I''d like to make a reservation for next month, please.
RECEPTIONIST: Of course. What dates were you looking at?
CALLER: From the twelfth to the fifteenth of August — so three nights.
RECEPTIONIST: Let me check availability... Yes, we have rooms available. What type of room would you prefer? We have standard doubles at eighty-nine pounds per night, or superior doubles at one hundred and fifteen pounds per night. The superior rooms have a sea view and a king-size bed.
CALLER: I think the standard double would be fine, thank you. Does that include breakfast?
RECEPTIONIST: Standard rooms include continental breakfast. If you''d like a full cooked breakfast, that''s an extra eight pounds per person per day.
CALLER: Continental is fine. Is there free parking at the hotel?
RECEPTIONIST: Yes, we have a car park on site — it''s complimentary for guests. You''ll need to register your vehicle at check-in.
CALLER: Perfect. Could I book now?
RECEPTIONIST: Certainly. Could I take your name, please?
CALLER: It''s Graham. David Graham. G-R-A-H-A-M.
RECEPTIONIST: And a contact phone number?
CALLER: Zero seven seven — four five two — eight eight one three.
RECEPTIONIST: Thank you, Mr Graham. I''ve booked you in for the twelfth to the fifteenth of August, standard double with continental breakfast. Check-in is from three o''clock, and check-out by eleven in the morning. Is there anything else?
CALLER: No, that''s everything. Thank you.',
  3.5, 4.5,
  ARRAY['travel', 'daily_life'], 1,
  NULL, 110, 'british', false,
  false, 'approved'
),
(
  'listening',
  'University Library Registration',
  'LIBRARIAN: Hello, welcome to the university library. Are you a new student?
STUDENT: Yes, I just started this semester. I need to register for a library card.
LIBRARIAN: No problem. I''ll need a few details. Can I start with your full name?
STUDENT: Sure — it''s Omar Al-Rashidi. O-M-A-R. Al-Rashidi: A-L, hyphen, R-A-S-H-I-D-I.
LIBRARIAN: Thank you. And your student ID number?
STUDENT: It''s two zero two four, dash, zero seven, dash, three four eight.
LIBRARIAN: Great. Which faculty are you in?
STUDENT: Engineering. Specifically, Civil Engineering.
LIBRARIAN: And are you an undergraduate or postgraduate?
STUDENT: Postgraduate — I''m doing a Master''s.
LIBRARIAN: Right. Postgraduate students can borrow up to fifteen books at a time, compared to eight for undergraduates. The loan period is four weeks, with one renewal allowed online through your student portal.
STUDENT: Can I access journals and databases from home?
LIBRARIAN: Yes. You''ll use your student email and the password you set for the university portal. The library website has a full list of databases we subscribe to — over two hundred academic databases including Scopus and Web of Science.
STUDENT: That''s great. What are the library''s opening hours?
LIBRARIAN: During term time, we''re open Monday to Friday from eight a.m. to ten p.m., and weekends from nine to six. During examination periods we extend to midnight on weekdays.
STUDENT: Perfect. Is there a quiet study area?
LIBRARIAN: The entire second floor is a silent study zone. We also have six group study rooms on the ground floor — these can be booked up to three days in advance online.',
  4.5, 5.5,
  ARRAY['education', 'academic'], 1,
  NULL, 130, 'british', false,
  false, 'approved'
),
(
  'listening',
  'Community Recycling Centre Orientation',
  'Good morning, everyone, and welcome to the Greenfield Community Recycling Centre. I''m going to give you a brief overview of how our facility works and what we accept here.
First, a bit of background. The centre opened in two thousand and fourteen and processes around four hundred tonnes of waste per month. We work with twelve local councils and have diverted over eighty percent of the waste we receive away from landfill — which we''re very proud of.
Now, let me explain the layout. As you enter the main gate, you''ll see a large covered area directly ahead — that''s the sorting hall, where all incoming waste is separated. To your left is the composting zone, which handles garden waste and food scraps. To your right are the container bays, organised by material type.
In terms of what we accept: we take glass, paper and cardboard, metals — including cans and scrap metal — and most plastics marked with recycling symbols one through seven. We also have a dedicated area for electrical items — things like old toasters, kettles, and small appliances. Please note we do not accept televisions or large white goods such as washing machines here — these need to go to our sister facility on the Parkway Industrial Estate.
We accept drop-offs seven days a week between seven in the morning and six in the evening. You don''t need an appointment for most items, but for large quantities of construction waste — things like rubble or timber — you''ll need to book in advance by calling our main office number, which is printed on the leaflet you were given at the entrance.
One important rule: please do not leave items outside the gate when the centre is closed. Fly-tipping is illegal and undermines the whole purpose of what we do here.
Any questions so far?',
  5.0, 6.0,
  ARRAY['environment', 'daily_life'], 2,
  NULL, 155, 'british', false,
  false, 'approved'
),
(
  'listening',
  'Seminar Discussion: Remote Work and Productivity',
  'TUTOR: Let''s start with what you found in the research. Tom, you were looking at productivity metrics — what did the literature say?
TOM: So the findings are actually quite mixed. Some studies show productivity gains for individual tasks — things that require concentration and minimal collaboration. But team-based work seems to suffer. One meta-analysis from Stanford found that remote workers completed tasks about thirteen percent faster, but this was mainly for call-centre type roles — highly structured, individual work.
TUTOR: That''s an important caveat. Priya, you were looking at the wellbeing side?
PRIYA: Yes. The picture is similarly complicated. Remote work does reduce commuting stress, which has a measurable positive effect on reported wellbeing. But sustained remote work — over twelve months — correlates with increased rates of loneliness and what researchers call ''always-on'' culture, where employees feel unable to properly disconnect.
TOM: There''s also a significant equity issue. The research I looked at showed that junior employees and those from lower socioeconomic backgrounds benefit less from remote work — they''re more likely to have inadequate home working conditions, and they miss out on the informal mentoring that happens naturally in an office.
TUTOR: That''s a point that''s often missed in the policy debate. So when we''re thinking about your recommendations for the assignment — should organisations adopt hybrid models, fully remote, or return to office?
PRIYA: I think the evidence points towards hybrid as the optimal model for most organisations. You get the focused work benefits of remote while preserving the collaboration and social capital benefits of in-person work.
TOM: I''d agree, though I''d add that hybrid only works if organisations redesign how they use office time deliberately — just requiring people to be present two days a week without restructuring how meetings and collaboration work doesn''t actually solve the problems.
TUTOR: Good point. That''s the implementation question that a lot of the current research is focusing on.',
  6.0, 7.5,
  ARRAY['work', 'technology', 'academic'], 3,
  NULL, 185, 'british', false,
  false, 'approved'
);

DO $$
DECLARE
  p_l1 uuid;
  p_l2 uuid;
  p_l3 uuid;
  p_l4 uuid;
BEGIN
SELECT id INTO p_l1 FROM ielts_passages WHERE title = 'Hotel Room Booking' LIMIT 1;
SELECT id INTO p_l2 FROM ielts_passages WHERE title = 'University Library Registration' LIMIT 1;
SELECT id INTO p_l3 FROM ielts_passages WHERE title = 'Community Recycling Centre Orientation' LIMIT 1;
SELECT id INTO p_l4 FROM ielts_passages WHERE title = 'Seminar Discussion: Remote Work and Productivity' LIMIT 1;

INSERT INTO ielts_questions (
  skill, sub_skill_code, question_type, question_text,
  options, correct_answer, explanation,
  passage_id, question_order, context_type,
  band_min, band_max, difficulty_weight, expected_time_sec,
  error_tag, topic_tags, status,
  irt_a, irt_b, irt_c, is_placement
) VALUES
('listening', 'form_completion', 'mcq', '[AUDIO] Hotel Room Booking\n\nHow much does a standard double room cost per night?', '["A. £79", "B. £89", "C. £99", "D. £115"]', 'B', 'Receptionist: "standard doubles at eighty-nine pounds per night".', p_l1, 1, 'audio', 3.5, 4.5, 1.0, 75, 'form_completion', ARRAY['travel'], 'approved', 1.0, -2.50, 0.25, true),
('listening', 'form_completion', 'mcq', '[AUDIO] Hotel Room Booking\n\nWhat does the standard double room include as standard?', '["A. Full cooked breakfast", "B. Continental breakfast", "C. No breakfast", "D. Dinner and breakfast"]', 'B', 'Receptionist: "Standard rooms include continental breakfast."', p_l1, 2, 'audio', 3.5, 4.5, 1.0, 70, 'form_completion', ARRAY['travel'], 'approved', 1.0, -2.50, 0.25, true),
('listening', 'mcq', 'mcq', '[AUDIO] Hotel Room Booking\n\nWhat must the guest do regarding their car when they arrive at the hotel?', '["A. Pay a daily parking fee", "B. Park on the street outside", "C. Register their vehicle at check-in", "D. Book parking in advance online"]', 'C', 'Receptionist: "You''ll need to register your vehicle at check-in." Parking itself is free.', p_l1, 3, 'audio', 4.0, 5.0, 1.2, 70, 'mcq', ARRAY['travel'], 'approved', 1.2, -1.91, 0.25, true),
('listening', 'form_completion', 'mcq', '[AUDIO] University Library Registration\n\nHow many books can a postgraduate student borrow at one time?', '["A. 8", "B. 10", "C. 12", "D. 15"]', 'D', 'Librarian: "Postgraduate students can borrow up to fifteen books at a time."', p_l2, 1, 'audio', 4.5, 5.5, 1.3, 70, 'form_completion', ARRAY['education'], 'approved', 1.3, -1.36, 0.25, true),
('listening', 'note_completion', 'mcq', '[AUDIO] University Library Registration\n\nUntil what time is the library open on weekday evenings during term time?', '["A. 9 p.m.", "B. 10 p.m.", "C. 11 p.m.", "D. Midnight"]', 'B', 'Librarian: "Monday to Friday from eight a.m. to ten p.m." Midnight is only during exam periods.', p_l2, 2, 'audio', 4.5, 5.5, 1.3, 65, 'note_completion', ARRAY['education'], 'approved', 1.3, -1.36, 0.25, true),
('listening', 'mcq', 'mcq', '[AUDIO] University Library Registration\n\nHow far in advance can group study rooms be booked?', '["A. Same day only", "B. Up to two days in advance", "C. Up to three days in advance", "D. Up to one week in advance"]', 'C', 'Librarian: "these can be booked up to three days in advance online."', p_l2, 3, 'audio', 5.0, 6.0, 1.4, 65, 'mcq', ARRAY['education'], 'approved', 1.4, -0.82, 0.25, true),
('listening', 'note_completion', 'mcq', '[AUDIO] Community Recycling Centre Orientation\n\nWhat percentage of waste received by the centre has been diverted from landfill?', '["A. Over 70%", "B. Over 75%", "C. Over 80%", "D. Over 90%"]', 'C', 'Guide: "we have diverted over eighty percent of the waste we receive away from landfill."', p_l3, 1, 'audio', 5.0, 5.5, 1.3, 65, 'note_completion', ARRAY['environment'], 'approved', 1.3, -1.36, 0.25, true),
('listening', 'mcq', 'mcq', '[AUDIO] Community Recycling Centre Orientation\n\nWhich item is NOT accepted at this recycling centre?', '["A. Glass bottles", "B. Old kettles", "C. Scrap metal", "D. Washing machines"]', 'D', 'Guide: "we do not accept televisions or large white goods such as washing machines here." Kettles and appliances are accepted in the electrical items area.', p_l3, 2, 'audio', 5.5, 6.0, 1.5, 65, 'mcq', ARRAY['environment'], 'approved', 1.5, -0.55, 0.25, true),
('listening', 'mcq', 'mcq', '[AUDIO] Community Recycling Centre Orientation\n\nWhen must visitors make an appointment before coming to the centre?', '["A. For all drop-offs at any time", "B. For drop-offs on weekends only", "C. For large quantities of construction waste", "D. For electrical items only"]', 'C', 'Guide: "for large quantities of construction waste — things like rubble or timber — you''ll need to book in advance."', p_l3, 3, 'audio', 5.5, 6.5, 1.6, 60, 'mcq', ARRAY['environment'], 'approved', 1.6, -0.27, 0.25, true),
('listening', 'mcq', 'mcq', '[AUDIO] Seminar Discussion: Remote Work and Productivity\n\nAccording to Tom, which type of work showed a 13% productivity increase for remote workers?', '["A. Creative and design work", "B. Structured, individual tasks like call-centre roles", "C. Team-based project work", "D. Management and leadership roles"]', 'B', 'Tom: "this was mainly for call-centre type roles — highly structured, individual work."', p_l4, 1, 'audio', 6.0, 7.0, 1.7, 60, 'mcq', ARRAY['work', 'technology'], 'approved', 1.7, 0.27, 0.25, true),
('listening', 'attitude_detection', 'mcq', '[AUDIO] Seminar Discussion: Remote Work and Productivity\n\nWhat equity concern does Tom raise about remote work?', '["A. Senior employees are disadvantaged by remote work arrangements", "B. Junior employees and those from lower socioeconomic backgrounds benefit less", "C. Remote work benefits only those in the technology sector", "D. Older employees are less productive when working remotely"]', 'B', 'Tom: "junior employees and those from lower socioeconomic backgrounds benefit less from remote work — they''re more likely to have inadequate home working conditions, and they miss out on informal mentoring."', p_l4, 2, 'audio', 6.5, 7.5, 1.8, 55, 'attitude_detection', ARRAY['work'], 'approved', 1.8, 0.55, 0.25, true),
('listening', 'attitude_detection', 'mcq', '[AUDIO] Seminar Discussion: Remote Work and Productivity\n\nWhat condition does Tom set for hybrid working to be effective?', '["A. Employees must be in the office at least three days per week", "B. Organisations must provide home office equipment to all staff", "C. Organisations must deliberately redesign how they use in-office time", "D. Remote work should only be offered to senior staff"]', 'C', 'Tom: "hybrid only works if organisations redesign how they use office time deliberately — just requiring people to be present two days a week without restructuring how meetings and collaboration work doesn''t actually solve the problems."', p_l4, 3, 'audio', 7.0, 7.5, 1.9, 55, 'attitude_detection', ARRAY['work', 'academic'], 'approved', 1.9, 0.82, 0.25, true);
END $$;

-- ============================================================
-- PHẦN B: SPEAKING — 12 prompts (Fix: correct_answer = 'AI_EVAL')
-- ============================================================
INSERT INTO ielts_questions (
  skill, sub_skill_code, question_type, question_text,
  options, correct_answer, explanation,
  band_min, band_max, difficulty_weight, expected_time_sec,
  error_tag, topic_tags, status,
  irt_a, irt_b, irt_c, is_placement
) VALUES
('speaking', 'part1_personal', 'speaking_prompt', 'PART 1 — Personal Question\n\nTell me about the area where you grew up. What was it like?\n\n[Speak for about 30 seconds]', '{}', 'AI_EVAL', 'AI SCORING RUBRIC: Band 4-6 assessment.', 3.5, 4.5, 1.0, 30, 'fluency', ARRAY['daily_life', 'hometown'], 'approved', 1.0, -2.50, 0.25, true),
('speaking', 'part1_personal', 'speaking_prompt', 'PART 1 — Personal Question\n\nDo you prefer to cook at home or eat out at restaurants? Why?\n\n[Speak for about 30 seconds]', '{}', 'AI_EVAL', 'AI SCORING RUBRIC: Band 4-6 assessment.', 4.0, 5.0, 1.1, 30, 'fluency', ARRAY['daily_life', 'food'], 'approved', 1.1, -1.91, 0.25, true),
('speaking', 'part1_personal', 'speaking_prompt', 'PART 1 — Personal Question\n\nHow do you usually spend your weekends? Has this changed compared to when you were younger?\n\n[Speak for about 45 seconds]', '{}', 'AI_EVAL', 'AI SCORING RUBRIC: Band 4-6 assessment.', 4.5, 5.5, 1.3, 45, 'fluency', ARRAY['daily_life'], 'approved', 1.3, -1.36, 0.25, true),
('speaking', 'part1_personal', 'speaking_prompt', 'PART 1 — Personal Question\n\nSome people prefer to read physical books, while others prefer digital devices. Which do you prefer and why?\n\n[Speak for about 45 seconds]', '{}', 'AI_EVAL', 'AI SCORING RUBRIC: Band 5-7 assessment.', 5.0, 6.0, 1.4, 45, 'lexical_resource', ARRAY['technology', 'education'], 'approved', 1.4, -0.82, 0.25, true),
('speaking', 'part1_personal', 'speaking_prompt', 'PART 1 — Personal Question\n\nHow important is it to you to keep up with current news and events? How do you stay informed?\n\n[Speak for about 45 seconds]', '{}', 'AI_EVAL', 'AI SCORING RUBRIC: Band 5-7 assessment.', 5.5, 6.5, 1.6, 45, 'fluency', ARRAY['media', 'technology'], 'approved', 1.6, -0.27, 0.25, true),
('speaking', 'part2_monologue', 'speaking_prompt', 'PART 2 — Long Turn\n\nDescribe a skill you have learned that you find very useful.\n\nYou should say:\n• what the skill is\n• how you learned it\n• how long it took you to learn\n• and explain why you find it particularly useful.\n\n[You have 1 minute to prepare. Speak for 1–2 minutes.]', '{}', 'AI_EVAL', 'AI SCORING RUBRIC: Band 5-7 assessment.', 5.0, 6.0, 1.4, 90, 'fluency', ARRAY['education', 'work'], 'approved', 1.4, -0.82, 0.25, true),
('speaking', 'part2_monologue', 'speaking_prompt', 'PART 2 — Long Turn\n\nDescribe a place in your country that you would recommend to a foreign visitor.\n\nYou should say:\n• where the place is\n• what it is like\n• what visitors can do there\n• and explain why you would recommend it.\n\n[You have 1 minute to prepare. Speak for 1–2 minutes.]', '{}', 'AI_EVAL', 'AI SCORING RUBRIC: Band 5-7 assessment.', 5.5, 6.5, 1.6, 90, 'lexical_resource', ARRAY['travel', 'culture'], 'approved', 1.6, -0.27, 0.25, true),
('speaking', 'part2_monologue', 'speaking_prompt', 'PART 2 — Long Turn\n\nDescribe an important decision you made in your life.\n\nYou should say:\n• what the decision was\n• when you made it\n• how you made the decision\n• and explain what the outcome was and whether you think it was the right decision.\n\n[You have 1 minute to prepare. Speak for 1–2 minutes.]', '{}', 'AI_EVAL', 'AI SCORING RUBRIC: Band 5-8 assessment.', 6.0, 7.0, 1.7, 90, 'grammar_range', ARRAY['personal', 'academic'], 'approved', 1.7, 0.27, 0.25, true),
('speaking', 'part3_discussion', 'speaking_prompt', 'PART 3 — Discussion\n\nSome people believe that young people today have fewer opportunities than previous generations. Do you agree or disagree? Why?\n\n[Speak for about 1 minute]', '{}', 'AI_EVAL', 'AI SCORING RUBRIC: Band 5-7+ assessment.', 5.5, 6.5, 1.6, 60, 'part3_discussion', ARRAY['education', 'society'], 'approved', 1.6, -0.27, 0.25, true),
('speaking', 'part3_discussion', 'speaking_prompt', 'PART 3 — Discussion\n\nHow has technology changed the way people communicate with each other? Do you think these changes are mostly positive or negative?\n\n[Speak for about 1 minute]', '{}', 'AI_EVAL', 'AI SCORING RUBRIC: Band 5-7+ assessment.', 6.0, 7.0, 1.7, 60, 'part3_discussion', ARRAY['technology', 'society'], 'approved', 1.7, 0.27, 0.25, true),
('speaking', 'part3_discussion', 'speaking_prompt', 'PART 3 — Discussion\n\nTo what extent should governments be responsible for protecting the environment, compared to individuals and businesses?\n\n[Speak for about 1 minute]', '{}', 'AI_EVAL', 'AI SCORING RUBRIC: Band 6-7.5+ assessment.', 6.5, 7.5, 1.9, 60, 'part3_discussion', ARRAY['environment', 'academic'], 'approved', 1.9, 0.82, 0.25, true),
('speaking', 'part3_discussion', 'speaking_prompt', 'PART 3 — Discussion\n\nIs it more important for a society to preserve its traditional culture and customs, or to adapt and modernise? Justify your view.\n\n[Speak for about 1 minute]', '{}', 'AI_EVAL', 'AI SCORING RUBRIC: Band 6-8 assessment.', 7.0, 7.5, 2.0, 60, 'part3_discussion', ARRAY['culture', 'society', 'academic'], 'approved', 2.0, 1.36, 0.25, true);

-- VERIFY
SELECT skill, count(*) AS total FROM ielts_questions WHERE is_placement = true AND status = 'approved' GROUP BY skill;
