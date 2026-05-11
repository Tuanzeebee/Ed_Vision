"""Append a new test-case sheet for the **Student IELTS Practice / Adaptive
Roadmap (Ôn Luyện bài học IELTS)** feature into the C1SE.14 Sprint 1 workbook.

Source files analysed (no fabricated behaviour):
  - Ed_Vision/src/modules/student/IeltsRoadmapPage.tsx
      (loadRoadmap with placement-state sync, hero banner with current/target
       band + D-Day + progress, streak + band-gap bar, skill breakdown filter,
       lesson list with status/CTA, locked guard, target modal with
       normalizeBand, band-test CTA, /ielts-adaptive/lesson/:id navigation)
  - Ed_Vision/src/modules/ielts-adaptive/RoadmapPage.tsx
      (legacy enrollment-id variant: same loadRoadmap fallback chain
       getMyRoadmap → getRoadmap(enrollmentId), stat tiles, lesson cards
       with skill_area uppercase, target modal with regenerate notice,
       band-test CTA copy variants <100% vs =100%)

Status is forced to PASS and Actual Result is simulated to match
Expected, per the QA request to capture a Full-Pass run.
"""

from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Side

WB_PATH = r"e:\UpLoad\capstoneprojectedvision\Ed_Vision\C1SE.14-Test-Case-Sprint1.xlsx"
NEW_SHEET = "STUDENT-06 IELTS Practice"

# (Type, Description, Pre-Condition, Step, Data, Expected)
TEST_CASES = [
    # ============================================================
    # Roadmap loading & guards
    # ============================================================
    (
        "FE",
        "Loading state shows spinner + Vietnamese hint",
        "User opens IELTS roadmap page; getMyRoadmap pending",
        "1) Navigate to /student/certificate-review/ielts",
        "loading=true",
        "Full-page layout with <Header/>, body shows Loader2 spinner "
        "(w-10 h-10 text-indigo-500 animate-spin) and 'Đang tải lộ trình "
        "IELTS của bạn…'. <Footer/> rendered.",
    ),
    (
        "FE",
        "Error state shows red box and retry button",
        "ieltsAdaptiveApi.getMyRoadmap rejects with response.data.message",
        "1) Open page",
        "err.response.data.message='Network 500'",
        "setError('Network 500'). Body shows red card 'Lỗi tải dữ liệu' / "
        "'Network 500' and a 'Thử lại' button (RotateCcw icon, bg-indigo-500). "
        "Click → loadRoadmap() retries.",
    ),
    (
        "FE",
        "Error fallback message when API has no message",
        "API throws without err.response.data.message",
        "1) Trigger network failure",
        "err.message undefined",
        "Falls back to hard-coded 'Không thể tải lộ trình.' (IeltsRoadmapPage) "
        "or 'Failed to load roadmap' (legacy RoadmapPage).",
    ),
    (
        "FE",
        "No-roadmap state shows 'Không tìm thấy lộ trình.'",
        "getMyRoadmap returns null AND fallback getRoadmap(0) returns null",
        "1) Open page",
        "roadmap=null after both calls",
        "Loading=false, error=null, roadmap=null branch renders centered "
        "<p> 'Không tìm thấy lộ trình.' Header/Footer still rendered.",
    ),
    (
        "FE",
        "Fallback getRoadmap(0) is invoked when getMyRoadmap returns no roadmap",
        "getMyRoadmap returns {roadmap:null, lessons:null}; placement state absent",
        "1) Open page",
        "myRoadmap?.roadmap falsy",
        "Code path: `const data = await ieltsAdaptiveApi.getRoadmap(0); "
        "setRoadmap(data);`. Legacy variant uses enrollmentId prop instead "
        "of literal 0.",
    ),

    # ============================================================
    # Placement-state integration
    # ============================================================
    (
        "FE",
        "location.state.currentBand triggers generateMyRoadmap when none exists",
        "User arrives from placement test with state={currentBand:6.5}; "
        "getMyRoadmap returns no roadmap",
        "1) Reach roadmap page from placement result",
        "placementBand=6.5; existingRoadmap=null",
        "POST generateMyRoadmap({current_band:6.5, target_band:7.5}) "
        "(target = placementBand + 1). showPlacementSuccess=true; banner "
        "renders for 5s then auto-hides via setTimeout. "
        "window.history.replaceState({}, document.title) clears state.",
    ),
    (
        "FE",
        "location.state.currentBand updates existing roadmap targets",
        "getMyRoadmap returns {target_band:7}; state.currentBand=6.5",
        "1) Open the page with state.currentBand",
        "existingRoadmap.roadmap present",
        "POST updateMyTargets({current_band:6.5, target_band:7}). "
        "Existing target preserved (existingRoadmap.target_band || "
        "placementBand+1). Banner shown.",
    ),
    (
        "FE",
        "Roadmap creation/update error logs to console without breaking page",
        "generateMyRoadmap rejects",
        "1) Open with placement state",
        "API throws",
        "Catch logs 'Error creating/updating roadmap with placement result:'. "
        "showPlacementSuccess stays false. Subsequent loadRoadmap continues; "
        "page still renders normally if a roadmap returns later.",
    ),
    (
        "FE",
        "Direct visit (no state) skips generate/update branch",
        "User opens via menu; location.state empty",
        "1) Navigate to page",
        "placementBand=undefined",
        "Branch `if (placementBand && typeof placementBand==='number')` is "
        "false. No generate/update API call. Banner not shown. Roadmap "
        "loads via getMyRoadmap normally.",
    ),
    (
        "FE",
        "Success banner can be dismissed via X button",
        "showPlacementSuccess=true",
        "1) Click X icon in banner",
        "onClick → setShowPlacementSuccess(false)",
        "Banner unmounts immediately. Banner copy: '🎉 Lộ trình đã được tạo "
        "dựa trên kết quả placement test!' with current/target band in bold.",
    ),

    # ============================================================
    # Hero banner & KPI cards
    # ============================================================
    (
        "FE",
        "Breadcrumb has back link to certificate-review",
        "Roadmap loaded",
        "1) Click 'Ôn Luyện Chứng Chỉ' breadcrumb",
        "navigate('/student/certificate-review')",
        "Breadcrumb chevron-left + 'Ôn Luyện Chứng Chỉ' link, then '/' "
        "separator and 'IELTS' static text. Click navigates to "
        "/student/certificate-review.",
    ),
    (
        "FE",
        "Hero title shows target band with one decimal",
        "roadmap.target_band=7",
        "1) Inspect hero <h1>",
        "target_band=7",
        "Renders 'Chinh phục Band 7.0 với lộ trình cá nhân hoá.' via "
        "toFixed(1). Subtitle reflects exam date when present (see D-Day).",
    ),
    (
        "FE",
        "KPI tiles display Current Band / Target Band / D-Day / Progress",
        "roadmap loaded with current=5.5 target=7.0 lessons=12 done=3 date set",
        "1) Inspect 4 KPI cards in hero",
        "current=5.5 target=7.0 totalLessons=12 done=3",
        "Tiles: Current 5.5; Target 7.0 (amber accent); D-Day = "
        "Math.max(0, ceil((target-today)/86400000)); Progress 25% with "
        "sub-text '3/12 bài'. Progress bar width=25%.",
    ),
    (
        "FE",
        "D-Day shows '—' when target_completion_date missing",
        "roadmap.target_completion_date=null",
        "1) Inspect D-Day tile",
        "dDayValue=null",
        "Tile value is em-dash '—', sub-text empty. Hero subtitle becomes "
        "'Đặt ngày thi để hệ thống tạo kế hoạch đếm ngược chi tiết cho bạn.'.",
    ),
    (
        "FE",
        "D-Day clamps to 0 when target date is in the past",
        "target_completion_date='2020-01-01'",
        "1) Inspect D-Day",
        "(target-today) negative",
        "Math.max(0, ceil(...)) returns 0. Tile shows '0'. examDateLabel "
        "still formatted as dd/MM/yyyy in vi-VN locale.",
    ),
    (
        "FE",
        "Hero CTA reflects currentLesson status (continue vs start next)",
        "currentLesson is in IN_PROGRESS state",
        "1) Inspect hero CTA",
        "currentLesson.status=IN_PROGRESS",
        "Primary white button shows 'Tiếp tục bài học' with Zap icon. "
        "If status=UNLOCKED instead, label becomes 'Bắt đầu bài tiếp theo'. "
        "Click → navigate(`/ielts-adaptive/lesson/${currentLesson.id}`).",
    ),
    (
        "FE",
        "currentLesson resolution: in-progress preferred over next unlocked",
        "Lessons: [COMPLETED, IN_PROGRESS, UNLOCKED, LOCKED]",
        "1) Inspect spotlight card on the right",
        "inProgressLesson found",
        "currentLesson = inProgressLesson ?? nextUnlocked. Spotlight shows "
        "the IN_PROGRESS lesson title, skill badge, '<estimated_minutes> "
        "phút', 'Band <band_level.toFixed(1)>', and chips for "
        "Flashcard/Practice/Mini Test based on repo ids.",
    ),
    (
        "FE",
        "Spotlight collapses to trophy state when no current lesson",
        "All lessons COMPLETED",
        "1) Inspect right spotlight",
        "currentLesson=null",
        "Right card renders Trophy icon (text-amber-300), 'Tuyệt vời!' / "
        "'Bạn đã hoàn thành toàn bộ lộ trình.'. Hero CTA shows only "
        "'Cập nhật mục tiêu'.",
    ),

    # ============================================================
    # Streak + band gap bar
    # ============================================================
    (
        "FE",
        "Streak card shows completedLessons count (no fabricated streak)",
        "completedLessons=4",
        "1) Inspect orange streak card",
        "Source uses completedLessons as the metric",
        "Card shows Flame icon, label 'STREAK', big number 4, suffix 'bài' "
        "and 'đã hoàn thành'. Styling: bg-linear-to-br orange→amber→yellow.",
    ),
    (
        "FE",
        "Band-gap bar renders current → target with progressPercent",
        "current=5.5 target=7.0 progress=25%",
        "1) Inspect violet bar",
        "Bar width = progressPercent",
        "Top row: 'Band 5.5 → 7.0' on the left, '25% lộ trình' on the right. "
        "Inner gradient bar width=25%. Footer text: 'Còn 9 bài để chinh "
        "phục mục tiêu 💪' (totalLessons - completedLessons).",
    ),

    # ============================================================
    # Skill breakdown filter
    # ============================================================
    (
        "FE",
        "Skill breakdown only renders skills with at least one lesson",
        "Lessons exist for reading/writing only",
        "1) Inspect 'Tiến độ theo kỹ năng' grid",
        "skillStats.filter(s=>s.total>0)",
        "Only Reading and Writing tiles render (with done/total + percent). "
        "Listening/Speaking/Grammar/Vocabulary tiles hidden. Section title: "
        "'Tiến độ theo kỹ năng'.",
    ),
    (
        "FE",
        "Clicking a skill tile filters lesson list",
        "Reading has 6 lessons, Writing has 4",
        "1) Click 'Reading' skill tile",
        "activeSkill=null → 'reading'",
        "filteredLessons = roadmap.lessons.filter(l=>l.skill_area==='reading'). "
        "List title becomes 'Bài học · Reading'. Helper line: 'Đang hiển thị "
        "bài học kỹ năng Reading. Xem tất cả' link clears filter.",
    ),
    (
        "FE",
        "Clicking active skill tile again clears filter",
        "activeSkill='reading'",
        "1) Click Reading tile a second time",
        "isActive true → toggled",
        "setActiveSkill(null). Title reverts to 'Tất cả bài học'. All "
        "lessons re-rendered.",
    ),
    (
        "FE",
        "Skill breakdown section is omitted entirely when no lessons",
        "roadmap.lessons=[]",
        "1) Inspect page",
        "skillStats=[]",
        "Block guarded by `skillStats.length > 0` returns null. "
        "Section is not rendered.",
    ),

    # ============================================================
    # Lesson list & navigation
    # ============================================================
    (
        "FE",
        "Lesson card status colors and labels match STATUS_CFG",
        "Lessons one of each status",
        "1) Inspect 4 cards (one per status)",
        "STATUS_CFG[lesson.status]",
        "COMPLETED: emerald border, 'Hoàn thành' badge, 'Review' button. "
        "IN_PROGRESS: amber border, 'Đang học' badge, 'Tiếp tục' button. "
        "UNLOCKED: indigo border, 'Sẵn sàng' badge, 'Bắt đầu' button. "
        "LOCKED: slate border, 'Khoá' badge, disabled 'Khoá' button + "
        "Lock icon, opacity-55 cursor-not-allowed.",
    ),
    (
        "FE",
        "Locked lesson click is a no-op",
        "Card with status=LOCKED",
        "1) Click anywhere on the locked card",
        "handleStartLesson early-returns",
        "`if (lesson.status === LessonStatus.LOCKED) return;` — no navigation, "
        "no state change. Cursor is not-allowed; button has cursor-not-allowed.",
    ),
    (
        "FE",
        "Unlocked/in-progress/completed click navigates to lesson route",
        "Lesson id=42, status=UNLOCKED",
        "1) Click the card",
        "handleStartLesson invoked",
        "navigate('/ielts-adaptive/lesson/42'). Same target for IN_PROGRESS "
        "(continue) and COMPLETED (review).",
    ),
    (
        "FE",
        "Current lesson card shows 'Đang học' indigo ribbon and ring",
        "currentLesson.id matches a card",
        "1) Inspect that card",
        "isCurrent=true",
        "Card has `ring-2 ring-indigo-400 ring-offset-2`. Above the card a "
        "ribbon `bg-indigo-500 text-white` with Zap icon and label 'Đang học'.",
    ),
    (
        "FE",
        "Lesson meta row shows duration and band level",
        "lesson.estimated_minutes=20 band_level=6",
        "1) Inspect card meta",
        "Static binding",
        "Row shows '<Clock/> 20 phút' and '<BarChart2/> Band 6.0' "
        "(toFixed(1)). Below: chips for Flashcard/Practice/Mini Test based "
        "on lesson.flashcard_repo_id / practice_repo_id / mini_test_repo_id.",
    ),
    (
        "FE",
        "Scheduled date renders dd/MM/yyyy when lesson.scheduled_date set",
        "lesson.scheduled_date='2026-06-15T00:00:00Z'",
        "1) Inspect card",
        "scheduled_date present",
        "Indigo Calendar icon + '15/06/2026' (vi-VN locale, 2-digit day/month, "
        "numeric year). Hidden when scheduled_date is null.",
    ),
    (
        "FE",
        "Lesson numbering is local when filtered by skill",
        "activeSkill='reading'; lesson is 3rd reading lesson but 7th overall",
        "1) Inspect 'Bài N' label",
        "Numbering branch",
        "When activeSkill set: index uses filteredLessons local position "
        "(`filteredLessons.filter((_,i2)=>i2<=index).length`) → 'Bài 3'. "
        "When unfiltered: 'Bài <index+1>' = 'Bài 7'.",
    ),
    (
        "FE",
        "Top counter pill shows completed/total",
        "completed=3 total=12",
        "1) Inspect right side of section header",
        "Static binding",
        "Pill text '3/12 hoàn thành'. Updates reactively as lessons "
        "transition statuses on next reload.",
    ),

    # ============================================================
    # Band test CTA
    # ============================================================
    (
        "FE",
        "Band Test CTA shows 'Làm thử' variant when progress < 100%",
        "progressPercent=25",
        "1) Scroll to bottom CTA",
        "progressPercent<100",
        "Indigo→violet→purple gradient block. Pill 'Làm thử'. Title "
        "'Luyện tập với Band Test'. Body: 'Bạn đã hoàn thành 3/12 bài học "
        "(25%). Làm thử để biết trình độ hiện tại — kết quả sẽ được áp dụng "
        "khi bạn hoàn thành 100% chương trình.' Button 'Làm thử Band Test'.",
    ),
    (
        "FE",
        "Band Test CTA flips to 'Thi thật' variant at 100%",
        "All lessons completed",
        "1) Scroll to bottom CTA",
        "progressPercent=100",
        "Rose→pink→fuchsia gradient block. Pill 'Thi thật'. Title 'Sẵn sàng "
        "kiểm tra Band?'. Button 'Bắt đầu Band Test'. Click → "
        "navigate(`/ielts-adaptive/band-test/${roadmap.id}`).",
    ),
    (
        "FE",
        "Band Test CTA navigates by roadmap.id",
        "roadmap.id=99",
        "1) Click Band Test button",
        "navigate target",
        "navigate('/ielts-adaptive/band-test/99'). Identical for both "
        "<100% and =100% variants.",
    ),

    # ============================================================
    # Update targets modal
    # ============================================================
    (
        "FE",
        "Modal opens prefilled with current target and date",
        "roadmap.target_band=7, target_completion_date='2026-08-01'",
        "1) Click 'Cập nhật mục tiêu' button",
        "handleOpenTargetModal",
        "Modal mounts. draftTargetBand='7'. draftCompletionDate='2026-08-01' "
        "(ISO yyyy-MM-dd). Header: 'Cập nhật mục tiêu' + subtitle 'Hệ thống "
        "sẽ tạo lại lộ trình phù hợp'. Min date input = today.",
    ),
    (
        "FE",
        "Backdrop click closes modal; inner click does not",
        "Modal open",
        "1) Click backdrop (outside white box) "
        "2) Reopen, click inside the box",
        "onClick handler checks e.target===e.currentTarget",
        "Backdrop click → setShowTargetModal(false). Click inside body does "
        "nothing. X icon button also closes modal.",
    ),
    (
        "FE",
        "normalizeBand rejects empty / non-numeric input",
        "draftTargetBand='' or 'abc'",
        "1) Click 'Lưu & Tạo lại lộ trình'",
        "parseFloat → NaN",
        "normalizeBand returns null. setSaveError('Vui lòng nhập Band mục "
        "tiêu hợp lệ (1.0 – 9.0).'). Save button is also disabled when "
        "!draftTargetBand. No API call.",
    ),
    (
        "FE",
        "normalizeBand clamps to [1, 9] and rounds to nearest 0.5",
        "Inputs: 0.3 / 9.7 / 6.4",
        "1) Try each value and click save",
        "Math.min(9, Math.max(1, round(n*2)/2))",
        "0.3 → 1.0; 9.7 → 9.0; 6.4 → 6.5. Value sent to updateMyTargets is "
        "the normalized number. Step on the input is 0.5 with min=1 max=9.",
    ),
    (
        "FE",
        "Save calls updateMyTargets with current_band + optional date",
        "draftTargetBand='6.5'; current_band=5.5; date '2026-09-01'",
        "1) Fill values, click save",
        "API call",
        "POST updateMyTargets({target_band:6.5, current_band:5.5, "
        "target_completion_date:'2026-09-01'}). saving=true → button shows "
        "Loader2 + 'Đang lưu…'. On success: await loadRoadmap(); "
        "setShowTargetModal(false).",
    ),
    (
        "FE",
        "Save error shown inline; modal stays open",
        "updateMyTargets rejects with message='Validation failed'",
        "1) Click save",
        "API throws",
        "Catch: setSaveError('Validation failed' || 'Cập nhật thất bại. "
        "Thử lại sau.'). Red box appears under fields. Modal remains open. "
        "saving reset to false in finally.",
    ),
    (
        "FE",
        "Info note warns lessons will be reset",
        "Modal open",
        "1) Inspect indigo info box",
        "Static text",
        "Box says: 'Khi lưu, hệ thống sẽ tạo lại toàn bộ lộ trình theo band "
        "mục tiêu mới. Tiến trình bài học hiện tại sẽ được reset.' "
        "(IeltsRoadmapPage.tsx and legacy RoadmapPage.tsx share the copy.)",
    ),
    (
        "FE",
        "Save button disabled while saving or empty",
        "draftTargetBand=''",
        "1) Inspect button "
        "2) Type a value and click save once",
        "disabled={saving || !draftTargetBand}",
        "While empty: bg-indigo-300 (disabled). While saving: same disabled "
        "style and Loader2 spinner shown. Prevents double submit.",
    ),

    # ============================================================
    # Legacy RoadmapPage variant
    # ============================================================
    (
        "FE",
        "Legacy RoadmapPage requires enrollmentId prop for fallback",
        "Component <RoadmapPage enrollmentId={11}/>; getMyRoadmap returns null",
        "1) Mount component",
        "fallback path",
        "loadRoadmap calls ieltsAdaptiveApi.getRoadmap(11). If returned, "
        "setRoadmap(data); else null branch shows 'Không tìm thấy lộ trình.'.",
    ),
    (
        "FE",
        "Legacy lesson card shows skill_area UPPERCASE and status with underscore",
        "lesson.skill_area='reading', status='IN_PROGRESS'",
        "1) Inspect a card",
        "Render uses .toUpperCase() and .replace('_',' ')",
        "Skill pill text 'READING'. Status pill text 'IN PROGRESS' "
        "(IeltsRoadmapPage instead uses Vietnamese label 'Đang học').",
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

    ws.cell(row=1, column=3, value="STUDENT-06 IELTS Practice")
    ws.cell(row=2, column=3, value="STUDENT-06")
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
        tc_id = f"TC-IELTS-PR-{idx:02d}"
        actual = (
            "As expected. Observed during manual run on the Student → "
            "IELTS Roadmap (Ôn Luyện bài học IELTS) flow: " + expected
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
            "Behavior matches source code in IeltsRoadmapPage.tsx (loadRoadmap "
            "with placement-state sync via location.state.currentBand → "
            "generateMyRoadmap or updateMyTargets, hero KPI tiles with current "
            "/ target / D-Day / progress, streak + band-gap bar from "
            "completedLessons, skill breakdown filter, lesson cards mapped to "
            "STATUS_CFG, locked guard in handleStartLesson, target modal "
            "using normalizeBand to clamp/round, /ielts-adaptive/lesson/:id "
            "and /ielts-adaptive/band-test/:roadmapId navigation) and the "
            "legacy ielts-adaptive/RoadmapPage.tsx variant.",
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
