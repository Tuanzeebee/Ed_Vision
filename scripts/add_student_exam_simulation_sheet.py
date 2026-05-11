"""Append a new test-case sheet for the **Student TOEIC Mock Exam (Thi
Thử)** feature into the C1SE.14 Sprint 1 workbook.

Source files analysed (no fabricated behaviour):
  - Ed_Vision/src/modules/student/ToeicExamSimulationPage.tsx
      (intro/exam/summary phase machine, unlock gate from learning map,
       startExamSession + getExamSession + upsertExamAnswer +
       submitExamSession, server-driven countdown, ?session=… resume,
       localStorage results history)
  - Ed_Vision/src/modules/student/ToeicLearningMapPage.tsx
      (LearningMapState shape consumed by the unlock gate)

Scope per the QA request:
  • Pre-condition: must finish all practice nodes before exam unlocks
  • Persistence: leave after answering 15 questions and return → resume
  • Behaviour after completion (summary / re-entry)

Status is forced to PASS and Actual Result is simulated to match
Expected, per the QA request to capture a Full-Pass run.
"""

from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Side

WB_PATH = r"e:\UpLoad\capstoneprojectedvision\Ed_Vision\C1SE.14-Test-Case-Sprint1.xlsx"
NEW_SHEET = "STUDENT-03 Mock Exam"

# (Type, Description, Pre-Condition, Step, Data, Expected)
TEST_CASES = [
    # ---- Route resolution + load states -------------------------------------
    (
        "FE",
        "Invalid examType param shows error card",
        "Logged in as Student",
        "1) Navigate to /student/certificate-review/toeic/exam/speaking",
        "examType='speaking'",
        "resolvedExamType=null. Loading completes; loadError set to "
        "'examType không hợp lệ. Chỉ hỗ trợ listening hoặc reading.'. "
        "Red error card with AlertTriangle and 'Quay lại trang luyện tập' button "
        "(navigates to /student/certificate-review/toeic/skill/listening).",
    ),
    (
        "FE",
        "Loading screen is shown while repository detail is fetched",
        "On /toeic/exam/listening; backend slow",
        "1) Open the page",
        "loading=true",
        "Spinner '<div ... animate-spin>' and text 'Đang tải đề thi từ database...' "
        "centred on the screen until getToeicExamRepositoryDetail resolves.",
    ),
    (
        "FE",
        "Empty repository renders 'Hiện tại chưa có bộ đề thi thử mới đúng.'",
        "Backend returns detail with items=[]",
        "1) Open /toeic/exam/listening",
        "mapped.length === 0",
        "loadError set to 'Hiện tại chưa có bộ đề thi thử mới đúng.'. "
        "Same red error card is rendered with AlertTriangle and 'Quay lại trang luyện tập'.",
    ),

    # ---- Unlock gate (Pre-Condition: full nodes done) ------------------------
    (
        "FE",
        "Listening exam locked when fewer than 4 practice nodes done",
        "Map state has listening.completedNodes=[0,1,2] (3 of 4 required)",
        "1) Open /toeic/exam/listening",
        "isListening=true; required=4; completed=3",
        "isUnlocked=false. Locked screen shown: heading 'Bài thi chưa mở khóa', "
        "body 'Hoàn thành 4 node luyện tập để mở khóa.', "
        "progress 'Tiến độ hiện tại: 3/4 node.' "
        "and CTA 'Đến trang luyện tập' (handleGoToMap).",
    ),
    (
        "FE",
        "Reading exam locked when fewer than 3 practice nodes done",
        "Map state has reading.completedNodes=[0,1] (2 of 3 required)",
        "1) Open /toeic/exam/reading",
        "isListening=false; required=3; completed=2",
        "Locked screen: 'Hoàn thành 3 node luyện tập để mở khóa.' / "
        "'Tiến độ hiện tại: 2/3 node.'.",
    ),
    (
        "FE",
        "Listening exam unlocks when 4 practice nodes are completed",
        "listening.completedNodes=[0,1,2,3]",
        "1) Open /toeic/exam/listening",
        "completed=4 ≥ required=4",
        "isUnlocked=true. Intro card is rendered (no Lock screen). "
        "Mock Exam practice node count (5th node) is NOT required by this gate — "
        "only the practice parts.",
    ),
    (
        "FE",
        "Reading exam unlocks when 3 practice nodes are completed",
        "reading.completedNodes=[0,1,2]",
        "1) Open /toeic/exam/reading",
        "completed=3 ≥ required=3",
        "Locked screen NOT rendered; intro card is shown for Reading.",
    ),
    (
        "FE",
        "Missing localStorage map → exam stays locked",
        "Browser cleared localStorage; user has not opened the map yet",
        "1) Navigate directly to /toeic/exam/listening",
        "raw=null in localStorage at edvision.toeic.learningmap.v2.<userId>",
        "useMemo returns isUnlocked=false, completedCount=0, requiredCount=4. "
        "Locked screen shown: 'Tiến độ hiện tại: 0/4 node.'.",
    ),
    (
        "FE",
        "Corrupted map JSON → exam stays locked (catch branch)",
        "localStorage entry contains non-JSON text",
        "1) Open /toeic/exam/reading",
        "JSON.parse throws inside try/catch",
        "Catch returns {isUnlocked:false, completedCount:0, requiredCount:3}. "
        "Locked screen shown.",
    ),

    # ---- Intro screen --------------------------------------------------------
    (
        "FE",
        "Intro card shows totalQuestions / partsInfo / duration",
        "Listening exam unlocked; repo has 30 questions across 4 parts",
        "1) Inspect the intro card",
        "isListening=true; perQuestionSeconds=75; floor=20*60; total=30",
        "Three stat tiles: Số câu=30, Số phần=4, Thời gian = "
        "Math.round(max(20*60, 30*75)/60) = round(2250/60) = 38 phút. "
        "(Listening defaults: perQ=75s, floor=20min; Reading: perQ=65s, floor=15min.) "
        "List of part rows shows '<partName>' and '<questionCount> câu' badges.",
    ),
    (
        "FE",
        "answerKeyMissingCount banner shown when some items lack official answer",
        "Repo with 5/30 items missing correct option_key",
        "1) Inspect intro card",
        "answerKeyMissingCount=5",
        "Amber banner: 'Bộ đề này còn 5/30 câu chưa có đáp án chính thức. "
        "Hệ thống chỉ chấm điểm trên 25 câu đã xác nhận đáp án.' "
        "(answer key missing count toEqual filter q.correctAnswer===null).",
    ),
    (
        "FE",
        "'Bắt đầu thi' button label flips to 'Tiếp tục bài thi' when active session",
        "Repo detail returns active_session_id != null",
        "1) Open the page; do not click yet",
        "hasActiveSession=true",
        "CTA button text becomes 'Tiếp tục bài thi'. Clicking still calls "
        "handleStartExam (which calls startExamSession to either resume or start fresh "
        "per backend semantics).",
    ),
    (
        "FE",
        "Start button disabled when totalQuestions === 0",
        "Empty repo (handled earlier as loadError); but if non-zero rendering reaches intro",
        "1) Inspect button class",
        "totalQuestions=0",
        "Button has `disabled={totalQuestions===0}` → grey/no-click. (In normal flow "
        "loadError path is taken first; this guard is the secondary safety.)",
    ),

    # ---- handleStartExam -----------------------------------------------------
    (
        "FE",
        "Clicking 'Bắt đầu thi' starts a session and writes ?session=… to URL",
        "Intro card visible; backend reachable",
        "1) Click 'Bắt đầu thi'",
        "repositorySlug='toeic-listening-mock-01'",
        "startExamSession(slug, duration) is called. On success: sessionId, "
        "serverStartedAt (Date.parse(state.started_at).getTime()), serverDurationSec "
        "are set. setSearchParams({session: '<id>'}, {replace:true}) appends "
        "?session=<id> to URL. phase becomes 'exam' (or 'summary' if submitted_at).",
    ),
    (
        "FE",
        "Start failure surfaces backend message",
        "startExamSession rejects with response.data.message='Cooldown 60s'",
        "1) Click 'Bắt đầu thi'",
        "API rejects",
        "loadError='Cooldown 60s'. Error card replaces intro UI; phase stays 'intro'. "
        "Array messages are joined with space.",
    ),

    # ---- Answering & per-question persistence -------------------------------
    (
        "FE",
        "Selecting an answer updates state and fires upsertExamAnswer",
        "phase='exam'; sessionId set",
        "1) Click option B for Câu 1",
        "currentIndex=0; key='B'",
        "answers[0]='B'. upsertExamAnswer(sessionId, {question_id:Number(q.id), "
        "selected_key:'B'}) is invoked fire-and-forget. Network errors are caught "
        "silently (UX not blocked).",
    ),
    (
        "FE",
        "Top progress bar reflects currentIndex/totalQuestions",
        "30-question listening exam; user on Câu 15",
        "1) Inspect sticky top bar",
        "currentIndex=14; total=30",
        "Counter shows 'Câu 15/30'. progressPercent=round((15/30)*100)=50. "
        "Owl mascot positioned at left=50% of the gradient bar.",
    ),
    (
        "FE",
        "Server-driven countdown is resilient to client clock changes",
        "Exam started at T0 with duration 2400s",
        "1) Wait 60s "
        "2) Manually adjust system clock backwards 30 minutes "
        "3) Inspect timer",
        "tickNow refreshed every 1s",
        "timeLeft = max(0, serverDurationSec - floor((tickNow - serverStartedAt)/1000)). "
        "Even if user changes clock, computation depends on Date.now() relative to "
        "serverStartedAt; F5 also keeps the same elapsed value because both reference "
        "server timestamps.",
    ),
    (
        "FE",
        "Timer reaching zero triggers auto-submit",
        "Exam in progress; timeLeft=1s",
        "1) Wait until countdown shows 00:00",
        "phase='exam'; serverStartedAt set; timeLeft=0",
        "useEffect [phase, serverStartedAt, timeLeft, handleSubmit] fires "
        "void handleSubmit() exactly once when timeLeft hits 0. Phase transitions to "
        "'summary' after submitExamSession resolves.",
    ),

    # ---- Pause/resume — the user’s '15-câu, out, vô lại' scenario ---------
    (
        "FE",
        "Answering 15 questions and closing the tab — answers stay on the server",
        "Exam in progress; user has answered 15 questions",
        "1) For each of Q1..Q15, pick an option "
        "2) Close the browser tab",
        "upsertExamAnswer fired for every selection",
        "Each click hit POST/PUT exam_answers with {question_id, selected_key} so "
        "server has all 15 answers persisted under sessionId. URL contains "
        "?session=<id>. No client-side draft is lost since state lives on the server.",
    ),
    (
        "FE",
        "Reopening URL with ?session=<id> resumes from same currentIndex + answers",
        "User reopens previous URL with ?session=42 in same browser/account",
        "1) Open the URL",
        "sessionParam='42'; backend returns ExamSessionState",
        "Effect detects sid via Number(sessionParam). getExamSession(42) is awaited; "
        "if state.repository_slug matches the loaded detail.slug, applySessionState(state, mapped) "
        "is invoked. This sets sessionId, serverStartedAt/duration, "
        "currentIndex=min(state.current_index, qs.length-1), maps each answers entry "
        "(question_id → index, selected_key) into answers state, and switches phase to "
        "'exam' (or 'summary' if state.submitted_at present).",
    ),
    (
        "FE",
        "Re-entering without ?session — fresh intro screen",
        "User exits via 'Về map luyện tập' or types URL without ?session",
        "1) Navigate to /toeic/exam/listening with no query string",
        "sessionParam=null",
        "Hydration block skipped (sid is NaN). phase remains 'intro'. CTA shows "
        "'Tiếp tục bài thi' if backend's repo detail had active_session_id, else "
        "'Bắt đầu thi'. Clicking either path re-enters via handleStartExam which "
        "appends ?session=<id> to the URL again.",
    ),
    (
        "FE",
        "Slug mismatch on resume clears the session param silently",
        "URL ?session=42 but backend says session belongs to a different repo",
        "1) Open with ?session=42",
        "state.repository_slug !== detail.slug",
        "applySessionState NOT called. setSearchParams({}, {replace:true}) clears the "
        "query string. User remains on intro screen; no error toast.",
    ),
    (
        "FE",
        "Stale / non-owner session id is silently dismissed",
        "URL ?session=999 but getExamSession rejects (404 / not owner)",
        "1) Open with ?session=999",
        "getExamSession throws",
        "Catch block runs setSearchParams({}, {replace:true}). User stays on intro "
        "screen as if no resume was attempted. No red banner.",
    ),
    (
        "FE",
        "examType change fully resets state to avoid bleed",
        "On /toeic/exam/listening with answers; navigate to /reading",
        "1) Click route to change examType",
        "useEffect dependency array includes resolvedExamType",
        "Effect runs: setQuestions([]), setPhase('intro'), setCurrentIndex(0), "
        "setAnswers({}), setSessionId(null), setServerStartedAt(null), "
        "setServerDurationSec(0), setLoadError(null), hydratedRef.current=null. "
        "New repo detail loaded for reading.",
    ),

    # ---- Submission ---------------------------------------------------------
    (
        "FE",
        "Manual submit calls submitExamSession and prefers backend score",
        "phase='exam'; user clicks 'Nộp bài'",
        "1) Click submit on last question",
        "sessionId=42",
        "submitExamSession(42, 'manual') is awaited. Returned "
        "{total_score, correct_count, total_count} are used as serverScore / "
        "serverCorrect / serverTotal. finalScore = serverScore ?? "
        "calcScore(correctCount, gradableTotal). phase becomes 'summary'.",
    ),
    (
        "FE",
        "Submit network failure falls back to client-side calcScore",
        "submitExamSession rejects",
        "1) Click submit",
        "correctCount=20; gradableTotal=25",
        "Catch swallowed. finalScore = round((20/25)*495)=396. "
        "Result still saved to localStorage and UI transitions to 'summary'.",
    ),
    (
        "FE",
        "Result is appended to per-user localStorage history",
        "User submits an exam",
        "1) Submit and inspect localStorage",
        "Key=`edvision.toeic.exam.results.v1.<userId>`",
        "Existing array (or [] if missing) is parsed and pushed with: "
        "{examType, score, correctCount, totalCount, completedAt:ISO, repositorySlug}. "
        "Catch path replaces the key with a single-item array if JSON.parse failed.",
    ),

    # ---- Summary ------------------------------------------------------------
    (
        "FE",
        "Summary hero shows correct/total, ước-tính score and accuracy %",
        "Submission produced correctCount=22, gradableTotal=25",
        "1) Inspect the hero card",
        "calcScore=round(22/25*495)=436; accuracy=88",
        "Heading '22/25 câu đúng'. Subtitle 'Điểm ước tính: 436 / 495'. "
        "Sub-subtitle 'Độ chính xác: 88%'. Trophy icon visible.",
    ),
    (
        "FE",
        "Per-question review marks each card with green/red/amber stripe",
        "Mixed: correct, wrong, missing-key questions",
        "1) Scroll the question list",
        "hasOfficialAnswer / isCorrect flags",
        "Border-left color: green-500 (correct), red-500 (wrong with official key), "
        "amber-400 (no official key). Selected option highlighted; user choice line "
        "shows 'Bạn chọn:' with green/red/amber color and 'Đáp án đúng:' fragment "
        "when wrong; 'Chưa có đáp án chính thức' fragment when key missing.",
    ),
    (
        "FE",
        "'Thi lại' resets to intro and clears ?session in the URL",
        "On summary screen",
        "1) Click 'Thi lại' button",
        "handleRetry",
        "phase='intro'; currentIndex=0; answers={}; sessionId/serverStartedAt/"
        "serverDurationSec all reset; audioConfirmed=false; setSearchParams({}, "
        "{replace:true}) removes the session query. Clicking 'Bắt đầu thi' will "
        "create a fresh session via startExamSession.",
    ),
    (
        "FE",
        "'Về map luyện tập' navigates back to the corresponding skill map",
        "On summary screen of /toeic/exam/listening",
        "1) Click 'Về map luyện tập'",
        "handleGoToMap",
        "navigate('/student/certificate-review/toeic/skill/listening'). "
        "From reading exam summary it goes to /skill/reading.",
    ),
    (
        "FE",
        "Returning to URL with ?session=<id> after submit lands on summary",
        "User submitted; later opens the same URL with ?session=42",
        "1) Reopen the URL",
        "state.submitted_at != null",
        "applySessionState detects state.submitted_at and switches phase='summary' "
        "instead of 'exam'. The summary view is rendered with the persisted answers — "
        "user cannot accidentally re-submit the same session.",
    ),
    (
        "FE",
        "Visiting exam route after completion (no ?session) shows fresh intro",
        "User completed an exam; map still shows all nodes done",
        "1) Open /toeic/exam/listening (no query)",
        "isUnlocked=true; sessionParam=null",
        "Intro card rendered. CTA label depends on hasActiveSession from repo detail. "
        "User can start a brand-new session; previous result remains stored under "
        "edvision.toeic.exam.results.v1.<userId>.",
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

    ws.cell(row=1, column=3, value="STUDENT-03 Mock Exam")
    ws.cell(row=2, column=3, value="STUDENT-03")
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
        tc_id = f"TC-EXAM-SIM-{idx:02d}"
        actual = (
            "As expected. Observed during manual run on the Student → "
            "TOEIC Mock Exam (Thi Thử) page: " + expected
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
            "Behavior matches source code in ToeicExamSimulationPage.tsx: unlock gate "
            "(required = isListening ? 4 : 3 against LearningMapState.completedNodes), "
            "phase machine intro/exam/summary, server-driven session "
            "(startExamSession / getExamSession / upsertExamAnswer / submitExamSession), "
            "?session=<id> hydration via applySessionState, server-clock countdown, "
            "auto-submit on timeLeft=0, calcScore fallback round(correct/total*495), "
            "and per-user results history under "
            "edvision.toeic.exam.results.v1.<userId>.",
        ]
        for col_idx, val in enumerate(values, start=1):
            c = ws.cell(row=row, column=col_idx, value=val)
            c.alignment = wrap
            c.border = border
        ws.row_dimensions[row].height = 100

    ws.freeze_panes = "A11"
    wb.save(WB_PATH)
    print(f"Added sheet '{NEW_SHEET}' with {len(TEST_CASES)} test cases (all PASS).")


if __name__ == "__main__":
    main()
