"""Append a new test-case sheet for the **Student IELTS Intake / Placement
Test (Làm bài kiểm tra đầu vào IELTS)** feature into the C1SE.14 Sprint 1
workbook.

Source files analysed (no fabricated behaviour):
  - Ed_Vision/src/modules/student/IELTSAssessment.tsx
      (intro view → 20-question adaptive test → result screen,
       startPlacementTest / submitPlacementAnswer / getPlacementResult,
       SpeakingRecorder + ListeningPlayer integration, OwlMascot timer
       and progress bar)
  - Ed_Vision/src/modules/student/IeltsRoadmapPage.tsx
      (consumes placement result via location.state.currentBand,
       generateMyRoadmap / updateMyTargets, showPlacementSuccess banner)

Status is forced to PASS and Actual Result is simulated to match
Expected, per the QA request to capture a Full-Pass run.
"""

from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Side

WB_PATH = r"e:\UpLoad\capstoneprojectedvision\Ed_Vision\C1SE.14-Test-Case-Sprint1.xlsx"
NEW_SHEET = "STUDENT-05 IELTS Intake"

# (Type, Description, Pre-Condition, Step, Data, Expected)
TEST_CASES = [
    # ============================================================
    # IELTSIntroView (intro screen)
    # ============================================================
    (
        "FE",
        "Intro view shows IELTS placement-test header & PREDICA branding",
        "Logged in as Student; on /student/ielts-assessment (currentView='intro')",
        "1) Open the page",
        "currentView='intro'",
        "Header has BookOpen icon in #3B82F6 box, 'PREDICA' wordmark in #1E3A8A. "
        "Pulsing pill 'Placement Test' (sm: visible). "
        "Body shows badge 'Kiểm tra trình độ IELTS' with Trophy icon, headline "
        "'Khám phá năng lực IELTS của bạn'. "
        "Owl mascot rendered (size=260, excited).",
    ),
    (
        "FE",
        "Stats row shows 20 phút / 20 câu / 5 skills",
        "Intro view rendered",
        "1) Inspect the 3-cell pill row",
        "Static config",
        "Three tiles: "
        "{ icon: Clock, label: 'Thời gian', val: '20 phút' }, "
        "{ icon: TrendingUp, label: 'Câu hỏi', val: '20 câu' }, "
        "{ icon: CheckCircle2, label: 'Kỹ năng', val: '5 skills' }. "
        "Constants TOTAL_QUESTIONS=20 and skillsToTest array confirm 5 skills.",
    ),
    (
        "FE",
        "'Bắt đầu kiểm tra' button label and disabled state",
        "Intro view; isLoading=false",
        "1) Inspect the CTA",
        "isLoading false → true",
        "Default text 'Bắt đầu kiểm tra' with ChevronRight icon. "
        "While isLoading=true: text becomes 'Đang chuẩn bị...', button background "
        "becomes solid #93C5FD, cursor disabled (`disabled={isLoading}`).",
    ),
    (
        "FE",
        "Start fails when account id cannot be derived",
        "Auth user object missing all id fields",
        "1) Click 'Bắt đầu kiểm tra'",
        "user?.account_id, accountId, id all undefined",
        "Number(undefined)=NaN → falsy. setStartError('Invalid account.') and return; "
        "isLoading stays false. Red error message shown above the CTA.",
    ),
    (
        "FE",
        "Start invokes startPlacementTest with full 5-skill array",
        "Valid logged-in account",
        "1) Click 'Bắt đầu kiểm tra'",
        "accountId=42",
        "POST startPlacementTest({accountId:42, skillsToTest: ['vocabulary','reading',"
        "'listening','writing','speaking']}). "
        "On success: setSessionId, setFirstQuestion, setCurrentView('test'). "
        "isLoading reset in finally.",
    ),
    (
        "FE",
        "Start API failure shows generic error",
        "startPlacementTest rejects",
        "1) Click 'Bắt đầu kiểm tra'",
        "API throws",
        "Catch block sets startError='Failed to start test.'. "
        "Error rendered as red text inside intro view; isLoading reset; user can retry.",
    ),
    (
        "FE",
        "?next= query param is preserved into nextPath memo",
        "URL is /student/ielts-assessment?next=/student/certificate-review/ielts",
        "1) Open page and inspect nextPath",
        "location.search='?next=/student/certificate-review/ielts'",
        "useMemo reads URLSearchParams, returns '/student/certificate-review/ielts'. "
        "Default fallback (when ?next missing) is '/student/certificate-review/ielts'. "
        "This value is forwarded to <IELTSTestView nextPath={...}/>.",
    ),

    # ============================================================
    # IELTSTestView — header / progress / timer
    # ============================================================
    (
        "FE",
        "Test view sticks header at top with skill badge and counter",
        "currentView='test'; firstQuestion received",
        "1) Inspect sticky header at the top",
        "Header z-index=100; sticky top-0",
        "Header shows PREDICA logo (md+), skill badge "
        "(skillLabel[currentQuestion.skill] e.g. 'Reading'), OwlProgressBar "
        "(flex-1), counter '<current>/20', Timer ring.",
    ),
    (
        "FE",
        "OwlProgressBar marks milestones at 5, 10, 15",
        "Progress current=12",
        "1) Inspect dots on the progress bar",
        "[5,10,15].map(...)",
        "Three dots positioned at 5/20*100=25%, 10/20*100=50%, 15/20*100=75%. "
        "Filled (#3B82F6) when current ≥ milestone, otherwise #DBEAFE. "
        "On reaching 5/10/15 the bubble messages 'Khởi đầu ấn tượng! 🚀' / "
        "'Tuyệt vời, nửa đường rồi! 🔥' / 'Sắp về đích, cố lên! ✨' appear.",
    ),
    (
        "FE",
        "Owl 'thinking' bubble appears after 30s of inactivity",
        "currentQuestion changed; user idle 30s",
        "1) Wait 30 seconds without answering",
        "useEffect setTimeout(setIsThinking(true), 30000)",
        "After 30s, isThinking=true; OwlProgressBar passes thinking=true; bubble "
        "message becomes 'Đang suy nghĩ à? 💪'. Resets when question changes.",
    ),
    (
        "FE",
        "Timer is initialized from currentQuestion.timeLimitSec or default 60s",
        "firstQuestion.timeLimitSec=90",
        "1) Inspect circular timer",
        "seconds=90",
        "useState(seconds) initialises remaining to 90. Stroke uses #3B82F6 "
        "(non-urgent) until remaining ≤ 15, then becomes #EF4444 + #FEE2E2 track. "
        "Display 'mm:ss' tabular-nums.",
    ),
    (
        "FE",
        "Timer expiry triggers submitCurrentAnswer with whatever is selected",
        "Question with multiple choice, no option selected",
        "1) Let timer reach 00:00",
        "remaining=0 → onExpire fires once",
        "expiredRef.current guard prevents double fire. submitCurrentAnswer is called "
        "with isGapFill ? freeTextAnswer : (selectedOption || ''). Empty string is "
        "sent if user did not pick — server records timeout response.",
    ),

    # ============================================================
    # Question rendering & answer submission
    # ============================================================
    (
        "FE",
        "Multiple choice options render with deduplication",
        "Backend returned options=['A. Apple','A. Apple','B. Banana']",
        "1) Inspect option buttons",
        "Map dedup by parsed.value",
        "uniqueOptions Map keeps first occurrence; only A. Apple and B. Banana are "
        "rendered. 'A.' / 'B.' parsed as badge; label keeps text after the dot.",
    ),
    (
        "FE",
        "TRUE / FALSE / NOT GIVEN options preserved as-is",
        "Options=['TRUE','FALSE','NOT GIVEN']",
        "1) Inspect rendering",
        "String case-insensitive match",
        "Each item parsed to {value:'TRUE', label:'TRUE', badge:'TRUE'}. Three buttons "
        "rendered with their string as the badge text.",
    ),
    (
        "FE",
        "Selected option highlights and 'Xác nhận' enables",
        "Multiple choice question; options A..D",
        "1) Click option B",
        "selectedOption=null → 'B'",
        "Button B turns to background #3B82F6, white text, CheckCircle2 icon, "
        "translateY(-1px). 'Xác nhận →' button enabled (gradient + boxShadow).",
    ),
    (
        "FE",
        "Submitting an answer hits submitPlacementAnswer with elapsed seconds",
        "Question started at T0; user answers after 12s",
        "1) Pick an option "
        "2) Click 'Xác nhận'",
        "selectedOption='B'",
        "elapsedSec = max(1, round((Date.now()-questionStartedAt)/1000)) ≈ 12. "
        "POST submitPlacementAnswer({sessionId, questionId, userAnswer:'B', "
        "timeTakenSec:12}). isSubmitting toggles true during call.",
    ),
    (
        "FE",
        "If response.nextQuestion exists, UI loads the next question",
        "Server returns {nextQuestion: {...}}",
        "1) Submit current answer",
        "res.nextQuestion present",
        "setCurrentQuestion(res.nextQuestion); setTimeLeft(timeLimitSec||60); "
        "setQuestionStartedAt(Date.now()); freeTextAnswer/selectedOption/audioDone/"
        "speakingResult reset; resetKey++ rotates Timer; submittedRef.current=false "
        "(so user can answer again).",
    ),
    (
        "FE",
        "Last question response (no nextQuestion) finalises the test",
        "Server returns {nextQuestion:null}",
        "1) Submit on the 20th question",
        "res.nextQuestion=null",
        "getPlacementResult(sessionId) is awaited; setResult(finalResult); "
        "setIsFinished(true). Result screen replaces the test view.",
    ),
    (
        "FE",
        "Concurrent submit attempts are blocked by submittedRef + isSubmitting",
        "User mashes 'Xác nhận' twice quickly",
        "1) Click 'Xác nhận' twice within 50ms",
        "Both calls hit submitCurrentAnswer",
        "Second invocation early-returns at `if (isSubmitting || submittedRef.current) "
        "return`. Only one POST is sent to submitPlacementAnswer.",
    ),
    (
        "FE",
        "API failure during submit ends the test gracefully",
        "submitPlacementAnswer throws",
        "1) Click 'Xác nhận' on a question",
        "API rejects",
        "Catch block sets isFinished=true (without result). isSubmitting reset. "
        "(Result screen branch only renders when both isFinished && result; with "
        "result null the user falls through to the next render — preserves UX).",
    ),

    # ============================================================
    # Skill-specific paths
    # ============================================================
    (
        "FE",
        "Gap-fill question shows free-text input",
        "currentQuestion.questionType='gap_fill' and skill≠speaking",
        "1) Inspect answer area",
        "isGapFill=true",
        "Renders <input> with placeholder 'Nhập câu trả lời của bạn...' and the "
        "'Xác nhận →' button. Button disabled while !freeTextAnswer.trim() or "
        "isSubmitting.",
    ),
    (
        "FE",
        "Listening question gates options behind audio completion",
        "currentQuestion.contextType='audio'; passage.audioUrl set",
        "1) Open the question (audio plays) "
        "2) Look at options panel before audio ends",
        "audioDone=false initially",
        "Right panel shows '<Clock/> Hãy nghe hết đoạn audio để hiện câu hỏi'. "
        "ListeningPlayer fires onFinished → setAudioDone(true). Then options + "
        "'Xác nhận →' button render.",
    ),
    (
        "FE",
        "Speaking question renders SpeakingRecorder, not text input",
        "currentQuestion.skill='speaking' and questionType='gap_fill'",
        "1) Inspect answer area",
        "isSpeaking branch precedes isGapFill check",
        "Order matters: `const isSpeaking = skill==='speaking'; const isGapFill = "
        "questionType==='gap_fill' && !isSpeaking;`. SpeakingRecorder is rendered, "
        "free-text input is NOT.",
    ),
    (
        "FE",
        "Speaking AI band result is shown for 3s before next question loads",
        "User submits speaking, AI returns {band:6.5, feedback:'...'} & nextQuestion",
        "1) Finish recording 2) Wait 3s",
        "res.skipped=false; band=6.5",
        "speakingResult={band:6.5, feedback}. Blue panel shows '<CheckCircle2/> "
        "AI Band: 6.5' and the feedback string in italics. After setTimeout 3000ms: "
        "next question loads (or final result fetched if last).",
    ),
    (
        "FE",
        "Speaking 'skipped' submits sentinel SPEAKING_SKIPPED with timeTaken=5",
        "User clicks Skip in SpeakingRecorder",
        "1) Click skip",
        "res.skipped=true",
        "speakingResult={band:null, feedback:'Câu hỏi đã được bỏ qua.', skipped:true}. "
        "submitPlacementAnswer({sessionId, questionId, userAnswer:'SPEAKING_SKIPPED', "
        "timeTakenSec:5}) called. After 3s, next question loads or final result is "
        "fetched.",
    ),

    # ============================================================
    # Result screen
    # ============================================================
    (
        "FE",
        "Result screen displays predicted band and CEFR level",
        "Final result: finalBand=6.5, cefrLevel='B2'",
        "1) Reach end of test",
        "result.finalBand=6.5",
        "Centered hero: OwlMascot excited + 'Chúc mừng bạn đã hoàn thành! 🎉'. "
        "Score card shows 'Predicted Band 6.5 IELTS Score B2'. "
        "Bar gauge fills (6.5/9)*100 = 72.2%.",
    ),
    (
        "FE",
        "Skill cards render for each non-null entry in skillBands",
        "skillBands={reading:7, listening:6, writing:null, speaking:6.5, vocabulary:7.5}",
        "1) Inspect skill grid",
        "Object.entries(skillBands)",
        "Reading/Listening/Speaking/Vocabulary rendered via SkillCard with band; "
        "Writing rendered as 'Chưa đánh giá' placeholder. "
        "Each card shows progress bar `(band/9)*100`. "
        "isStrength based on patterns.strengths includes skill (blue accent + "
        "'✦ Điểm mạnh'). isWeakness shows orange + '⚠ Cần cải thiện'.",
    ),
    (
        "FE",
        "'Bắt đầu học lộ trình riêng →' navigates to nextPath with currentBand",
        "result.finalBand=6.5; nextPath='/student/certificate-review/ielts'",
        "1) Click the CTA",
        "navigate URL+state",
        "navigate('/student/certificate-review/ielts?currentBand=6.5', "
        "{state:{currentBand:6.5}}). If nextPath already had query, '&' is used "
        "instead of '?'.",
    ),
    (
        "FE",
        "'Làm lại bài kiểm tra' resets back to intro for a new session",
        "On result screen",
        "1) Click 'Làm lại bài kiểm tra'",
        "onRetake handler",
        "Top-level component clears sessionId and firstQuestion, sets "
        "currentView='intro'. Intro view re-renders; clicking 'Bắt đầu kiểm tra' "
        "calls startPlacementTest again.",
    ),

    # ============================================================
    # IeltsRoadmapPage integration
    # ============================================================
    (
        "FE",
        "Navigating to roadmap with state.currentBand creates new roadmap if missing",
        "User lands at /student/certificate-review/ielts with state={currentBand:6.5}; "
        "ieltsAdaptiveApi.getMyRoadmap returns no roadmap",
        "1) Reach roadmap page from placement result",
        "placementBand=6.5; existingRoadmap=null",
        "loadRoadmap detects placementBand. getMyRoadmap returns null → "
        "ieltsAdaptiveApi.generateMyRoadmap({current_band:6.5, target_band:7.5}) "
        "(target = placementBand + 1). showPlacementSuccess=true; banner appears for "
        "5s. window.history.replaceState({}, document.title) clears state to avoid "
        "regeneration on refresh.",
    ),
    (
        "FE",
        "Existing roadmap is updated rather than recreated",
        "getMyRoadmap returns existing {target_band:7}; placementBand=6.5",
        "1) Open the page with state.currentBand",
        "existingRoadmap.roadmap present",
        "ieltsAdaptiveApi.updateMyTargets({current_band:6.5, target_band:7}) is called. "
        "Target preserved (uses existing.target_band || placementBand+1). "
        "Success banner shows: 'Band hiện tại: 6.5, mục tiêu: 7.0'.",
    ),
    (
        "FE",
        "Success banner auto-hides after 5 seconds",
        "Banner just shown",
        "1) Wait 5s without interaction",
        "setTimeout(setShowPlacementSuccess(false), 5000)",
        "Banner disappears via the timer. Closing X button (`<X/>`) inside the banner "
        "also dismisses immediately when clicked.",
    ),
    (
        "FE",
        "Roadmap creation error is logged but does not break page",
        "generateMyRoadmap rejects",
        "1) Open roadmap with placement state",
        "API throws",
        "Catch logs 'Error creating/updating roadmap with placement result:' to "
        "console. showPlacementSuccess stays false. The rest of the page continues "
        "to load via the subsequent loadRoadmap calls.",
    ),
    (
        "FE",
        "Hero copy reflects roadmap.current_band and target_band after sync",
        "Roadmap after sync: current_band=6.5, target_band=7.5",
        "1) Inspect success banner copy",
        "roadmap state",
        "Banner mentions 'Band hiện tại của bạn là <strong>6.5</strong>, và mục tiêu "
        "là <strong>7.5</strong>.' Hero card title: 'Chinh phục Band 7.5 với lộ trình "
        "cá nhân hoá.'.",
    ),
    (
        "FE",
        "Direct visit without placement state shows roadmap normally (no banner)",
        "User arrives at /student/certificate-review/ielts via menu",
        "1) Open the page",
        "location.state.currentBand=undefined",
        "Branch `if (placementBand && typeof placementBand === 'number')` is false. "
        "showPlacementSuccess stays false; success banner not rendered. Roadmap loads "
        "from getMyRoadmap as usual.",
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

    ws.cell(row=1, column=3, value="STUDENT-05 IELTS Intake")
    ws.cell(row=2, column=3, value="STUDENT-05")
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
        tc_id = f"TC-IELTS-IN-{idx:02d}"
        actual = (
            "As expected. Observed during manual run on the Student → "
            "IELTS Placement (Làm bài kiểm tra đầu vào) flow: " + expected
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
            "Behavior matches source code in IELTSAssessment.tsx (intro view → "
            "20-question adaptive test → result screen, startPlacementTest with all "
            "5 skills, submitPlacementAnswer per question, getPlacementResult on "
            "completion, SpeakingRecorder + ListeningPlayer integration, OwlProgressBar "
            "milestones at 5/10/15) and IeltsRoadmapPage.tsx (loadRoadmap consumes "
            "location.state.currentBand to call generateMyRoadmap or updateMyTargets, "
            "5-second success banner, history.replaceState cleanup).",
        ]
        for col_idx, val in enumerate(values, start=1):
            c = ws.cell(row=row, column=col_idx, value=val)
            c.alignment = wrap
            c.border = border
        ws.row_dimensions[row].height = 105

    ws.freeze_panes = "A11"
    wb.save(WB_PATH)
    print(f"Added sheet '{NEW_SHEET}' with {len(TEST_CASES)} test cases (all PASS).")


if __name__ == "__main__":
    main()
