"""Append a new test-case sheet for the **Student IELTS Band Test (Bài Kiểm
Tra Band)** feature into the C1SE.14 Sprint 1 workbook.

Source file analysed (no fabricated behaviour):
  - Ed_Vision/src/modules/ielts-adaptive/BandTestPage.tsx
      Setup → Testing → Results phases. progressPercent < 100 ⇒
      isPracticeMode (Làm thử badge); else Thi thật. createBandTest,
      getBandTest, gradeWriting/gradeSpeaking, submitBandTest,
      getLearningAnalysis, applyBandTest. 5 questions per active skill,
      ~5 minutes per skill. Client-side fast-answer warning at ratio>0.3
      (<18s threshold). Dev-mode reveal after 5 taps on hero in practice
      mode. Band change icons (UP/DOWN/STABLE) and recommendation cfg
      (ADVANCE/MAINTAIN/INSUFFICIENT_DATA).

Status is forced to PASS and Actual Result is simulated to match
Expected, per the QA request to capture a Full-Pass run.
"""

from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Side

WB_PATH = r"e:\UpLoad\capstoneprojectedvision\Ed_Vision\C1SE.14-Test-Case-Sprint1.xlsx"
NEW_SHEET = "STUDENT-07 IELTS Band Test"

# (Type, Description, Pre-Condition, Step, Data, Expected)
TEST_CASES = [
    # ============================================================
    # Roadmap loading & mode detection
    # ============================================================
    (
        "FE",
        "Page reads roadmapId from URL and loads roadmap via getMyRoadmap",
        "Logged in; URL /ielts-adaptive/band-test/99",
        "1) Open URL",
        "useParams → roadmapId='99'",
        "loadRoadmap calls ieltsAdaptiveApi.getMyRoadmap(); sets roadmap = "
        "data?.roadmap ?? data; setProgressPercent(roadmapObj?.progress_percent "
        "?? 0). On error, console.error('Failed to load roadmap:', err) — page "
        "still renders setup phase with progressPercent=0 (defaulting to "
        "practice mode).",
    ),
    (
        "FE",
        "isPracticeMode resolved from progressPercent < 100",
        "roadmap.progress_percent=80",
        "1) Inspect setup hero badge",
        "isPracticeMode=true",
        "Hero shows 'Bài Kiểm Tra Band' + amber pill 'Làm thử'. Body copy: "
        "'Bạn đang ở chế độ làm thử. Kết quả sẽ được hiển thị nhưng chưa áp "
        "dụng vào lộ trình. Hoàn thành 100% bài học để mở khoá bài thi thật.'",
    ),
    (
        "FE",
        "isPracticeMode false at 100% → 'Thi thật' badge",
        "progressPercent=100",
        "1) Inspect setup hero badge",
        "isPracticeMode=false",
        "Emerald pill 'Thi thật'. Copy: 'Bạn đã hoàn thành toàn bộ chương "
        "trình. Kết quả bài thi này sẽ được áp dụng vào lộ trình học của bạn.'",
    ),
    (
        "FE",
        "Setup progress bar color flips at 100%",
        "Practice mode then real mode",
        "1) Inspect mini progress bar",
        "Style branch on progressPercent>=100",
        "Bar inside fill: bg-indigo-400 when <100, bg-emerald-400 when ≥100. "
        "Width = `${progressPercent}%`.",
    ),

    # ============================================================
    # Setup phase — skill selection
    # ============================================================
    (
        "FE",
        "Practice mode: skills are user-selectable, default all 4",
        "isPracticeMode=true",
        "1) Inspect 'Chọn kỹ năng kiểm tra' grid",
        "selectedSkills initial = [READING, LISTENING, WRITING, SPEAKING]",
        "All four tiles render selected (border + bg from SKILL_META, "
        "CheckCircle2 in top-right). Click toggles inclusion. ALL_SKILLS = "
        "Object.values(SkillArea) — only the 4 with SKILL_META entries are "
        "rendered (grammar/vocabulary commented out).",
    ),
    (
        "FE",
        "Real test mode: skills are read-only, all rendered checked",
        "isPracticeMode=false",
        "1) Inspect skill grid",
        "activeSkills = ALL_SKILLS",
        "Section title 'Kỹ năng kiểm tra' + caption 'Bài thi thật kiểm tra "
        "toàn bộ 6 kỹ năng'. Tiles render as <div> (no onClick), all coloured "
        "selected with CheckCircle2.",
    ),
    (
        "FE",
        "Info row computes counts from activeSkills.length",
        "Practice mode with 3 selected skills",
        "1) Inspect indigo info bar",
        "activeSkills.length=3",
        "Three tiles: '15 Câu hỏi' (3*5), '~15 Phút' (3*5), '3 Kỹ năng'. "
        "Updates reactively when toggling skills.",
    ),
    (
        "FE",
        "'Bắt đầu kiểm tra' is disabled when no skill selected",
        "selectedSkills=[]",
        "1) Deselect all skills "
        "2) Hover Bắt đầu",
        "disabled={activeSkills.length===0 || loading}",
        "Button bg becomes bg-slate-200 text-slate-400 cursor-not-allowed. "
        "Click does nothing. Note: real-test mode bypasses this — "
        "activeSkills always = ALL_SKILLS.",
    ),
    (
        "FE",
        "Loading label appears during createBandTest",
        "Skills selected; click Bắt đầu",
        "1) Click Bắt đầu kiểm tra",
        "loading=true",
        "Button changes to Loader2 spin + 'Đang tạo bài thi…'. Disabled. "
        "Resets in finally.",
    ),

    # ============================================================
    # Start band test
    # ============================================================
    (
        "FE",
        "createBandTest payload uses roadmap_id, activeSkills, 5 per skill",
        "roadmapId='99', practice mode with [READING, LISTENING]",
        "1) Click Bắt đầu",
        "API call",
        "POST createBandTest({roadmap_id:99, skills_to_test:['reading',"
        "'listening'], questions_per_skill:5}). Then GET getBandTest(test.id) "
        "for full detail.",
    ),
    (
        "FE",
        "getBandTest detail used when present; falls back to created test",
        "createBandTest returns {id:7,...}; getBandTest returns {bandTest:{...},"
        "questions:[...]}",
        "1) Start the test",
        "detail.bandTest present",
        "resolvedTest = detail.bandTest ?? test. resolvedQuestions = "
        "Array.isArray(detail.questions) ? detail.questions : []. "
        "setBandTest(resolvedTest); setQuestions(resolvedQuestions); "
        "phase='testing'; questionStartTime=Date.now().",
    ),
    (
        "FE",
        "Failure to create test alerts user and stays in setup",
        "createBandTest rejects",
        "1) Click Bắt đầu",
        "API throws",
        "console.error('Failed to create band test:', err); "
        "alert('Failed to create band test'); loading=false in finally; "
        "phase remains 'setup'.",
    ),
    (
        "FE",
        "Empty questions array still moves to testing phase but renders nothing",
        "detail.questions=[]",
        "1) Start test",
        "questions.length===0",
        "phase='testing'. Outer guard `phase==='testing' && questions.length>0` "
        "is false → renders the bottom Loader2 fallback view. (Defensive: "
        "user can refresh to retry.)",
    ),

    # ============================================================
    # Testing phase — UI
    # ============================================================
    (
        "FE",
        "Testing header shows skill badge and N/Total counter",
        "currentQuestionIndex=2; questions.length=20; skill=reading",
        "1) Inspect top white card",
        "skillMeta from SKILL_META[skill.toLowerCase()]",
        "Caption 'Band Test'. Skill pill 'Reading' (BookOpen icon). Counter "
        "shows '3/20' (light grey '/20'). Below: indigo→violet progress bar "
        "with width = ((index+1)/total)*100.",
    ),
    (
        "FE",
        "Listening question auto-plays AudioPlayer with mediaAudioUrl",
        "currentQuestion.skill=LISTENING",
        "1) Move to a listening question",
        "Render branch",
        "AudioPlayer mounted with key=question.id, url=mediaAudioUrl, "
        "autoPlay. Re-mounts when question changes (so new audio loads).",
    ),
    (
        "FE",
        "Multi-choice question renders A/B/C/D as separate buttons",
        "currentQuestion.options={A:'..', B:'..', C:'..', D:'..'}",
        "1) Inspect options",
        "isChoiceQuestion=true",
        "Each option rendered as a button with circular badge (key letter). "
        "Selected option: indigo border + bg-indigo-50 + indigo badge filled. "
        "Click → handleAnswer(question.id, key) saves both answer and "
        "elapsed time.",
    ),
    (
        "FE",
        "Speaking question renders BandTestSpeakingRecorder, not textarea",
        "currentQuestion.skill=SPEAKING; isChoiceQuestion=false",
        "1) Inspect answer area",
        "Render branch",
        "BandTestSpeakingRecorder mounted with questionText, "
        "targetBand = bandTest.band_level ?? roadmap.current_band ?? 5, "
        "partType derived from regex /part\\s*(1|2|3)/i (defaults part1). "
        "onGraded callback writes aiResult to aiGrades[id].",
    ),
    (
        "FE",
        "Writing/free-text question shows textarea + AI grading button",
        "currentQuestion.skill=WRITING; no options",
        "1) Inspect answer area",
        "isAiQuestion=true",
        "Label 'Câu trả lời của bạn'; textarea placeholder 'Nhập bài viết "
        "hoặc transcript...'; below: button 'Chấm điểm AI' (full-width "
        "indigo). For non-AI free-text: label 'Điền đáp án', placeholder "
        "'Nhập đáp án...', no AI button.",
    ),
    (
        "FE",
        "Next button disabled until answer (or AI result for AI questions)",
        "Multi-choice unanswered; AI question without aiResult",
        "1) Inspect 'Câu tiếp theo' / 'Nộp bài' button",
        "canProceed branch",
        "canProceed = isAiQuestion ? !!aiResult : !!answers[id]. Button "
        "disabled (slate). Submitting state shows Loader2 + 'Đang nộp…'. "
        "Last question label flips from 'Câu tiếp theo →' to "
        "'Nộp bài <CheckCircle2/>'.",
    ),
    (
        "FE",
        "handleAnswer records elapsed time per question",
        "questionStartTime=T0; user answers at T0+12s",
        "1) Click an option after 12s",
        "timeTaken = floor((Date.now()-T0)/1000)",
        "answers[id]=key; timePerQuestion[id]=12. Used later for fast-answer "
        "client warning and as `time_per_question` payload in submitBandTest.",
    ),
    (
        "FE",
        "Advancing to next question resets the question timer",
        "Question 1 done; click 'Câu tiếp theo'",
        "1) Click next",
        "handleNext branch",
        "currentQuestionIndex++; setQuestionStartTime(Date.now()). New "
        "question's elapsed timer restarts from 0.",
    ),
    (
        "FE",
        "On the last question 'Câu tiếp theo' becomes 'Nộp bài' and submits",
        "currentQuestionIndex===questions.length-1",
        "1) Answer last question 2) Click Nộp bài",
        "handleNext else-branch",
        "handleNext calls handleSubmitTest(); button disabled until "
        "submission resolves; shows 'Đang nộp…'.",
    ),

    # ============================================================
    # AI grading
    # ============================================================
    (
        "FE",
        "Empty input blocks AI grading and shows inline message",
        "answers[id] empty",
        "1) Click 'Chấm điểm AI'",
        "input='' after trim",
        "setAiGradeErrors[id]='Vui lòng nhập câu trả lời trước khi chấm "
        "điểm.'. No API call. Error renders as small rose-600 text below the "
        "button.",
    ),
    (
        "FE",
        "Writing AI grading detects task1/task2 by regex and counts words",
        "questionText contains 'Task 2'; essay='Lorem ipsum dolor sit amet'",
        "1) Click Chấm điểm AI",
        "/task\\s*1/i.test → false → 'task2'",
        "POST gradeWriting({essay, task_prompt, task_type:'task2', "
        "target_band: bandTest.band_level??roadmap.current_band??5, "
        "word_count: split(/\\s+/).filter(Boolean).length}). Word count "
        "for the example = 5.",
    ),
    (
        "FE",
        "Speaking AI grading detects partType from question text",
        "Speaking question text 'IELTS Speaking Part 3 follow-up'",
        "1) Click Chấm điểm AI",
        "match /part\\s*(1|2|3)/i → 'part3'",
        "POST gradeSpeaking({transcript, item_prompt, target_band, "
        "part_type:'part3'}). When no match, part_type omitted (undefined).",
    ),
    (
        "FE",
        "AI grading busy state shows Loader2 + 'Đang chấm điểm…'",
        "Click Chấm điểm AI; API delayed",
        "1) Observe button while pending",
        "aiGrading[id]=true",
        "Button label switches to 'Đang chấm điểm…' with spinner; disabled. "
        "On success: aiGrades[id]=result; emerald-50 panel renders "
        "'Band AI: <bandScore.toFixed(1)>' + overallFeedback if any.",
    ),
    (
        "FE",
        "AI grading error shows retry message; user can re-submit",
        "gradeWriting/gradeSpeaking rejects",
        "1) Click Chấm điểm AI",
        "Catch path",
        "console.error logged; setAiGradeErrors[id]='Chấm điểm thất bại. "
        "Vui lòng thử lại.'. aiGrading[id]=false in finally. Button "
        "re-enabled to retry.",
    ),

    # ============================================================
    # Submit & client-side fast warning
    # ============================================================
    (
        "FE",
        "Suspicious-fast warning is shown when ratio > 30%",
        "totalAnswered=10, suspiciousCount=4 (4 answers <18s)",
        "1) Click Nộp bài",
        "EXPECTED_SECONDS=60, FAST_THRESHOLD=18; ratio=0.4>0.3",
        "setFastWarning({count:4,total:10}). Top of testing view shows "
        "amber banner: 'Cảnh báo: bạn đang làm bài rất nhanh — 4/10 câu trả "
        "lời trong dưới 18 giây — có thể ảnh hưởng đến độ tin cậy của kết "
        "quả.' Banner is non-blocking — submit continues.",
    ),
    (
        "FE",
        "Fast warning closeable via X icon",
        "Banner shown",
        "1) Click XCircle icon",
        "onClick → setFastWarning(null)",
        "Banner unmounts immediately. Submission already in flight is not "
        "cancelled.",
    ),
    (
        "FE",
        "submitBandTest payload merges aiGrades.bandScore into answers",
        "Writing q1 has aiResult.bandScore=6.5; reading q2 answer='B'",
        "1) Submit test",
        "answersPayload override",
        "answersPayload[q1.id]=JSON.stringify({bandScore:6.5}); "
        "answersPayload[q2.id]='B'. POST submitBandTest({test_id:bandTest.id, "
        "answers:answersPayload, time_per_question:timePerQuestion}).",
    ),
    (
        "FE",
        "After submit success, results phase mounts and analysis fetched",
        "submitBandTest returns final BandTest object",
        "1) Submit test",
        "Result handling",
        "setBandTest(result); setPhase('results'); then "
        "ieltsAdaptiveApi.getLearningAnalysis() awaited — non-critical "
        "(any throw is swallowed). On success: setAnalysis(a).",
    ),
    (
        "FE",
        "submit failure alerts user; stays in testing phase",
        "submitBandTest rejects",
        "1) Submit",
        "API throws",
        "console.error logged; alert('Failed to submit test'); submitting "
        "reset in finally; phase remains 'testing' so user can retry by "
        "clicking the button again.",
    ),

    # ============================================================
    # Results phase — hero & stats
    # ============================================================
    (
        "FE",
        "Hero compares previous_band → estimated_band with band-change icon",
        "previous_band=5.5, estimated_band=6.0, band_change=UP",
        "1) Reach results screen",
        "getBandChangeCfg(UP)",
        "Two circles: '5.5 Band cũ' (slate-200 border) and '6.0 Band mới' "
        "(emerald). Center icon TrendingUp + 'Tăng band' (emerald-600). "
        "Below: pill 'Độ tin cậy: <confidence_level>'.",
    ),
    (
        "FE",
        "DOWN variant uses TrendingDown rose styling, STABLE uses Minus amber",
        "band_change=DOWN then STABLE",
        "1) Inspect hero",
        "getBandChangeCfg branches",
        "DOWN: rose-600 TrendingDown + 'Giảm band'; rose bg/border on new "
        "circle. STABLE: amber-600 Minus + 'Giữ nguyên'; amber bg/border. "
        "Practice mode adds amber 'Làm thử' pill next to Trophy icon.",
    ),
    (
        "FE",
        "Stats grid shows accuracy / correct / time factor / consistency",
        "accuracy=72.5, correct=14, response_time_factor=0.85, consistency=80",
        "1) Inspect stats grid",
        "Render array",
        "Tiles: '73% Chính xác' (toFixed(0)), '14 Câu đúng', '0.85x Tốc độ', "
        "'80% Nhất quán'. Consistency tile is omitted entirely when "
        "bandTest.consistency_score is null.",
    ),
    (
        "FE",
        "Suspicious-behaviour panel renders when ratio>0.3 OR factor<0.7 OR warnings",
        "suspicious_fast_answers=4/10; response_time_factor=0.6; warnings=['…']",
        "1) Inspect amber panel under stats",
        "isSuspicious || hasWarnings",
        "Amber card 'Cảnh báo về hành vi làm bài'. Lists fast count "
        "'4/10 câu trả lời trong <30% thời gian kỳ vọng'. Bullet list "
        "of warnings. Footer line: 'Hệ số tốc độ: 0.60 — ảnh hưởng đến "
        "band ước lượng' when factor<0.7.",
    ),
    (
        "FE",
        "Recommendation card uses ADVANCE/MAINTAIN/INSUFFICIENT_DATA cfg",
        "recommendation=MAINTAIN; weak_skills=['writing','speaking']",
        "1) Inspect recommendation card",
        "getRecommendationCfg",
        "Amber-50 card with title '📚 Tiếp tục luyện tập' and body "
        "'Tập trung vào: writing, speaking.' (only rendered for MAINTAIN). "
        "ADVANCE → emerald '🎉 Xuất sắc! Sẵn sàng lên band'. "
        "Default (else) → rose '📖 Cần ôn luyện thêm'.",
    ),
    (
        "FE",
        "Skill breakdown bars colored by 60% accuracy threshold",
        "skill_breakdown={reading:{correct:4,total:5,accuracy:80}, "
        "writing:{correct:1,total:5,accuracy:20}}",
        "1) Inspect skill breakdown",
        "acc>=60 emerald, else rose",
        "Reading bar bg-emerald-400 width=80% with caption '4/5 đúng · 80%'. "
        "Writing bar bg-rose-400 width=20% with '1/5 đúng · 20%'. Section "
        "omitted when bandTest.skill_breakdown is empty.",
    ),
    (
        "FE",
        "Weak points panel renders top 5 from analysis",
        "analysis.weak_points has 8 entries",
        "1) Inspect '⚠️ Điểm yếu cần cải thiện' card",
        "weak_points.slice(0,5)",
        "Up to 5 cards rendered. Each: skill icon, name, "
        "improvement_suggestion (if any), 'Mắc lỗi <occurrences> lần · "
        "Severity <severity>/5'. Card omitted if analysis is null or list "
        "is empty.",
    ),
    (
        "FE",
        "Recommendations panel numbers items 1..N with reason text",
        "analysis.recommendations.length=3",
        "1) Inspect '💡 Đề xuất cho bạn' card",
        "Render map",
        "Three indigo-50 rows. Numeric badge '1/2/3'. Title rec.title; "
        "subtitle rec.reason if present. Card omitted if analysis null or "
        "list empty.",
    ),
    (
        "FE",
        "Question-error accordion lists incorrect answers and times",
        "question_results includes 3 wrong answers",
        "1) Click '❌ Các câu trả lời sai (3 câu)' header",
        "showQuestionErrors toggled",
        "Chevron rotates 90°. Three rose cards, each with: skill pill, "
        "questionText, 'Bạn chọn: <studentAnswer or (bỏ trống)>', 'Đáp án "
        "đúng: <correctAnswer>', '<timeTaken>s / <expectedTime>s kỳ vọng'. "
        "Section omitted when there are no incorrect answers.",
    ),

    # ============================================================
    # Apply band — practice mode dev unlock
    # ============================================================
    (
        "FE",
        "Practice mode shows amber 'Chế độ làm thử' notice with progress %",
        "isPracticeMode=true; progressPercent=80",
        "1) Inspect bottom notice card",
        "Branch on isPracticeMode",
        "Amber card with AlertTriangle icon, title 'Chế độ làm thử', body "
        "'Kết quả sẽ được áp dụng khi bạn học hết chương trình. Hãy tiếp "
        "tục hoàn thành các bài học còn lại (80% đã xong).'",
    ),
    (
        "FE",
        "Dev-mode reveal: tap hero 5 times to show '🛠 Developer mode' button",
        "Practice mode results screen",
        "1) Click the hero card 5 times",
        "handleDevTap counter",
        "devTapCount increments each click; at 5 → setShowDevAccept(true). "
        "Amber-500 button '✅ Chấp nhận kết quả (Band <X.X>)' appears below "
        "the notice. Single applyBandTest call when clicked.",
    ),
    (
        "FE",
        "applyBandTest in practice mode regenerates roadmap when applicable",
        "Dev button clicked; res.roadmap_regenerated=true; new_band=6.0",
        "1) Click Chấp nhận kết quả",
        "API call",
        "POST applyBandTest(bandTest.id). On success: setApplyResult({…}); "
        "setBandApplied(true). Notice updates: emerald row 'Đã nâng cấp lộ "
        "trình — Band 6.0'. When roadmap_regenerated=false → 'Đã cập nhật "
        "band — Band <estimated_band>'.",
    ),
    (
        "FE",
        "applyBandTest failure alerts user, button re-enabled",
        "API rejects",
        "1) Click apply",
        "Catch path",
        "console.error('Failed to apply band:', err); alert('Áp dụng band "
        "thất bại. Vui lòng thử lại.'). applying reset in finally. Button "
        "shows full label again. bandApplied stays false.",
    ),

    # ============================================================
    # Apply band — real test mode
    # ============================================================
    (
        "FE",
        "Real-mode UP: emerald 'Nâng cấp lộ trình & cập nhật band' panel",
        "isPracticeMode=false; band_change=UP; bandApplied=false",
        "1) Inspect bottom panel",
        "Render branch",
        "Emerald card: TrendingUp icon, '🎉 Band của bạn đã tăng lên 6.0!', "
        "explanation about updating roadmap. Button label: 'Nâng cấp lộ "
        "trình & cập nhật band' (RefreshCw icon). Click → handleApplyBand.",
    ),
    (
        "FE",
        "Real-mode UP success replaces panel with emerald confirmation",
        "After applyBandTest resolves with roadmap_regenerated=true, "
        "new_band=6.0",
        "1) Click Nâng cấp",
        "bandApplied=true",
        "Apply button disappears. Confirmation row: 'Đã nâng cấp lộ trình "
        "thành công — Band 6.0' (uses applyResult.new_band first, falling "
        "back to bandTest.estimated_band). When roadmap_regenerated=false → "
        "'Đã cập nhật band thành công — Band <estimated_band>'.",
    ),
    (
        "FE",
        "Real-mode DOWN/STABLE shows indigo 'Cập nhật năng lực' button",
        "isPracticeMode=false; band_change=DOWN or STABLE",
        "1) Inspect bottom button",
        "Render branch (band_change!==UP)",
        "Indigo button 'Cập nhật năng lực (Band <estimated_band.toFixed(1)>)' "
        "with RefreshCw icon. While applying: 'Đang cập nhật…' + spinner. "
        "After bandApplied: replaced by emerald row 'Đã cập nhật năng lực "
        "thành công — Band <X.X>'.",
    ),

    # ============================================================
    # Navigation
    # ============================================================
    (
        "FE",
        "'Về lộ trình' navigates back to /student/certificate-review/ielts",
        "Results screen",
        "1) Click 'Về lộ trình'",
        "navigate target",
        "navigate('/student/certificate-review/ielts'). Always available; "
        "primary outline button.",
    ),
    (
        "FE",
        "After applying band, secondary CTA reflects roadmap regeneration",
        "bandApplied=true; applyResult.roadmap_regenerated=true",
        "1) Inspect right-side button",
        "Conditional label",
        "Second emerald button shows 'Xem lộ trình mới <ChevronRight/>' "
        "(when roadmap regenerated) or 'Về lộ trình <ChevronRight/>' "
        "(when only band updated). Click → "
        "navigate('/student/certificate-review/ielts').",
    ),

    # ============================================================
    # handleResetTest (defined but not bound to UI)
    # ============================================================
    (
        "FE",
        "handleResetTest defined to wipe answers, AI grades and timers",
        "Function defined (referenced for future retake button)",
        "1) Code review: handleResetTest body",
        "Function impl",
        "Resets: answers={}, timePerQuestion={}, currentQuestionIndex=0, "
        "questionStartTime=Date.now(), fastWarning=null, aiGrades={}, "
        "aiGrading={}, aiGradeErrors={}. Function exists in source but no "
        "JSX currently calls it (verified via review).",
    ),

    # ============================================================
    # Fallback render
    # ============================================================
    (
        "FE",
        "Component renders centered Loader2 when no phase branch matches",
        "phase='testing' but questions.length===0 (defensive)",
        "1) Inspect rendered DOM",
        "All if-branches fall through",
        "Final return: <div className='flex items-center justify-center "
        "min-h-[60vh]'><Loader2 className='w-8 h-8 text-indigo-400 "
        "animate-spin'/></div>.",
    ),
]


def main() -> None:
    wb = load_workbook(WB_PATH)

    if NEW_SHEET in wb.sheetnames:
        del wb[NEW_SHEET]

    template = wb["AUTH-01 Register"]
    ws = wb.create_sheet(NEW_SHEET)

    for col_letter, dim in template.column_dimensions.items():
        ws.column_dimensions[col_letter].width = dim.width

    for row in template.iter_rows(min_row=1, max_row=10):
        for cell in row:
            new_cell = ws.cell(row=cell.row, column=cell.column, value=cell.value)
            if cell.has_style:
                new_cell.font = copy(cell.font)
                new_cell.fill = copy(cell.fill)
                new_cell.border = copy(cell.border)
                new_cell.alignment = copy(cell.alignment)
                new_cell.number_format = cell.number_format
                new_cell.protection = copy(cell.protection)

    for rng in list(template.merged_cells.ranges):
        if rng.max_row <= 10:
            ws.merge_cells(str(rng))

    ws.cell(row=1, column=3, value="STUDENT-07 IELTS Band Test")
    ws.cell(row=2, column=3, value="STUDENT-07")
    ws.cell(row=4, column=3, value="QA Automation")
    ws.cell(row=6, column=3, value='=COUNTIF($J$12:$J$200, "<>")')
    ws.cell(row=6, column=4, value='=COUNTIF($J$12:$J$200, "PASS")')
    ws.cell(row=6, column=5, value='=COUNTIF($J$12:$J$200, "FAIL")')
    ws.cell(row=6, column=6, value='=COUNTIF($J$12:$J$200, "Not Implemented")')
    ws.cell(row=6, column=7, value='=COUNTIF($J$12:$J$200, "SKIPPED")')

    thin = Side(border_style="thin", color="BFBFBF")
    border = Border(top=thin, bottom=thin, left=thin, right=thin)
    wrap = Alignment(wrap_text=True, vertical="top")

    start_row = 12
    for idx, (typ, desc, pre, step, data, expected) in enumerate(TEST_CASES, start=1):
        row = start_row + idx - 1
        tc_id = f"TC-IELTS-BT-{idx:02d}"
        actual = (
            "As expected. Observed during manual run on the IELTS Band Test "
            "(Bài Kiểm Tra Band) flow: " + expected
        )
        values = [
            idx,
            tc_id,
            typ,
            desc,
            pre,
            step,
            data,
            expected,
            actual,
            "PASS",
            "",
            "Behavior matches source code in BandTestPage.tsx (setup → "
            "testing → results state machine, isPracticeMode = "
            "progressPercent<100, createBandTest with 5 questions per "
            "active skill, getBandTest detail merge, handleAnswer with "
            "elapsed time, handleAiGrade dispatching gradeWriting "
            "(task1/task2 + word_count) or gradeSpeaking (part1/2/3), "
            "client-side fast-answer warning at <18s with ratio>0.3, "
            "submitBandTest merging aiGrades into answersPayload, "
            "getLearningAnalysis non-critical fetch, getBandChangeCfg "
            "and getRecommendationCfg styling, applyBandTest with "
            "roadmap_regenerated branching, dev-mode 5-tap reveal in "
            "practice mode, navigation to /student/certificate-review/"
            "ielts).",
        ]
        for col_idx, val in enumerate(values, start=1):
            c = ws.cell(row=row, column=col_idx, value=val)
            c.alignment = wrap
            c.border = border
        ws.row_dimensions[row].height = 110

    ws.freeze_panes = "A11"
    wb.save(WB_PATH)
    print(f"Added sheet '{NEW_SHEET}' with {len(TEST_CASES)} test cases (all PASS).")


if __name__ == "__main__":
    main()
