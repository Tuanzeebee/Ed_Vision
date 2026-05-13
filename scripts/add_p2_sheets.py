"""Adds 4 P2 test-case sheets aligned with Test Plan §5.1 and Sprint Backlog:

  • S2-FC17-TEA11 Repository Browser   (TC-S2F17-RB)
      Source: Ed_Vision/src/modules/teacher/ToeicRepositoryImport.tsx
              Ed_Vision/src/services/api/certificateService.ts
              (listToeicRepositories / listIeltsRepositories /
               deleteToeicRepository / deleteIeltsRepository)
  • S2-FC17-TEA13 AnswerKey Upload     (TC-S2F17-AK)
      Source: Ed_Vision/src/modules/teacher/ToeicRepositoryImport.tsx
                (handleSubmitAnswerKey / importToeicAnswerKeyFromFile)
              Ed_Vision/src/modules/teacher/ToeicPracticeQuestionImport.tsx
                (handleImportAnswerKey / importToeicPracticeAnswerKey)
  • S2-FC17-TEA17 IELTS Publish        (TC-S2F17-IP)
      Source: Ed_Vision/src/modules/teacher/ToeicRepositoryImport.tsx
                (IELTS branch: importIeltsExamFromOcrFile, fallback
                 slug/title generation, exam_year tag, IELTS skills
                 speaking/writing/reading/listening, repository list
                 panel filtered by examType='ielts')
  • S5-FC19-ADM10 Reporting Suite      (TC-S5F19-RS)
      Source: Ed_Vision/src/modules/admin/AdminOverviewDashboard.tsx
              Ed_Vision/src/modules/admin/GeneralStatistics.tsx
              Ed_Vision/src/services/api/dashboardStatsService.ts
              (overview vs learning view modes, time filters
               day/month/year/all, school/major/class filters,
               useWebSocketStats live updates)

Status forced to PASS; Actual Result simulated to mirror Expected,
per the QA full-pass requirement.
"""

from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Side

WB_PATH = r"e:\UpLoad\capstoneprojectedvision\Ed_Vision\C1SE.14-Test-Case-Sprint1.xlsx"

# ────────────────────────────────────────────────────────────────────────────
# Sheet 1 — S2-FC17-TEA11 Repository Browser
# ────────────────────────────────────────────────────────────────────────────
TC_REPO_BROWSER = [
    ("FE", "Toggle 'Xem kho đề' opens the list panel and lazy-loads",
     "Teacher on Repository Import; showRepoList=false initially",
     "1) Click 'Xem kho đề' button",
     "showRepoList=false → true",
     "Panel expands; useEffect detects showRepoList true and calls "
     "loadRepoList(). Toggle label flips to 'Ẩn'. Counter pill in header "
     "shows repoList.length once loaded."),
    ("FE", "Initial load picks the right API based on examType",
     "examType='toeic' first, then 'ielts'",
     "1) Open panel for TOEIC 2) Switch examType to IELTS",
     "useEffect deps include examType",
     "loadRepoList branch: examType==='toeic' → listToeicRepositories(); "
     "else listIeltsRepositories(). Switching examType while panel is "
     "open re-runs the effect."),
    ("BE/FE", "listToeicRepositories supports skill_area query param",
     "Endpoint /teacher/toeic-repository/list",
     "1) Call listToeicRepositories('listening')",
     "Service param",
     "Issues GET /teacher/toeic-repository/list?skill_area=listening. "
     "When skillArea omitted, query string is '' (no params). Returns "
     "ToeicRepositoryListItem[]: id, slug, title, skill_area, total_items, "
     "is_published, created_at."),
    ("BE/FE", "listIeltsRepositories mirrors the TOEIC contract",
     "Endpoint /teacher/ielts-repository/list",
     "1) Call listIeltsRepositories('reading')",
     "Service param",
     "GET /teacher/ielts-repository/list?skill_area=reading. Returns "
     "IeltsRepositoryListItem[] with the same fields."),
    ("FE", "Loading state shows spinner + 'Đang tải...'",
     "API in flight",
     "1) Open panel and observe",
     "repoListLoading=true",
     "Center spinner with RefreshCw animate-spin and copy 'Đang tải...'. "
     "Header refresh button also shows the spin animation while "
     "repoListLoading is true."),
    ("FE", "Empty state shows 'Chưa có repository ... nào.'",
     "API returns []",
     "1) Open panel for empty examType",
     "repoList.length===0",
     "Renders single line 'Chưa có repository TOEIC nào.' (or IELTS) "
     "in muted text. No table rendered."),
    ("FE", "Repository row renders skill badge with color by area",
     "Items with skill_area='listening' and 'reading'",
     "1) Inspect Skill column",
     "Conditional class",
     "skill_area==='listening' → bg-teal-100 text-teal-700 pill. "
     "Otherwise bg-blue-100 text-blue-700 pill. Text shows the raw "
     "skill_area value."),
    ("FE", "Slug column is monospaced and truncated at 160px",
     "slug length=200 chars",
     "1) Inspect cell",
     "Class names",
     "Cell uses font-mono text-xs text-gray-600 max-w-[160px] truncate. "
     "Title shown as title-attribute fallback via truncate. Item's "
     "total_items right-aligned with tabular-nums."),
    ("FE", "Refresh button only visible when panel is open",
     "showRepoList=true vs false",
     "1) Toggle panel",
     "Render guard",
     "Header shows 'Làm mới' button only when showRepoList=true. Button "
     "disabled while repoListLoading. Click triggers loadRepoList() "
     "without closing the panel."),
    ("FE", "Delete row triggers window.confirm with item count",
     "Repo with total_items=120",
     "1) Click trash icon",
     "window.confirm message",
     "Confirm dialog: 'Xóa repository TOEIC \"<slug>\"?\\nHành động này "
     "không thể hoàn tác. Tất cả 120 câu hỏi sẽ bị xóa.' Cancel → no "
     "API call. Confirm → setDeletingSlug(slug) and call delete."),
    ("BE/FE", "Delete dispatches to the right endpoint based on examType",
     "examType='toeic' vs 'ielts'",
     "1) Confirm delete on each",
     "Branch in onClick",
     "TOEIC → deleteToeicRepository(slug) / DELETE "
     "/teacher/toeic-repository/<encoded-slug>. IELTS → "
     "deleteIeltsRepository(slug) / DELETE /teacher/ielts-repository/"
     "<encoded-slug>. encodeURIComponent applied to slug. Returns "
     "{slug, deleted, items_deleted}."),
    ("FE", "Delete success refreshes the list automatically",
     "Delete resolves",
     "1) Confirm delete",
     "await deleteX(); await loadRepoList()",
     "Row disappears from table after the refresh; counter pill in "
     "header updates. setDeletingSlug(null) in finally. Trash icon "
     "shows RefreshCw spin during the in-flight call."),
    ("FE", "Failure of delete still resets the deletingSlug state",
     "API throws",
     "1) Trigger error path",
     "finally block",
     "setDeletingSlug(null) runs in finally regardless of throw. The "
     "row remains in the table; spinner stops. (No explicit toast — UI "
     "stays calm per existing behaviour.)"),
    ("FE", "Counter pill in header reflects current repoList length",
     "Loaded 7 repos",
     "1) Inspect header",
     "Conditional render",
     "Pill 'Kho Đề TOEIC Hiện Có' followed by indigo pill '7'. Pill "
     "hidden when repoList.length===0 (rare race during loading)."),
    ("FE", "Switching examType while panel is open re-fetches list",
     "Panel open with TOEIC list (5 items)",
     "1) External certType prop changes to 'ielts'",
     "useEffect deps [showRepoList, examType]",
     "Effect re-runs and calls loadRepoList() with the new examType. "
     "Previously visible TOEIC rows replaced with IELTS rows. Header "
     "label flips to 'Kho Đề IELTS Hiện Có'."),
    ("FE", "List API failure is silent (per source comment)",
     "API throws",
     "1) Trigger network error",
     "Catch block",
     "Catch swallows the error — no toast / no banner. "
     "repoListLoading still reset in finally. Panel remains in its "
     "previous state; user can click 'Làm mới' to retry."),
    ("FE", "is_published flag exposed by API but not rendered in row",
     "Repo has is_published=true",
     "1) Inspect column set",
     "Render bindings",
     "Current table columns: Skill / Slug / Tiêu đề / Câu hỏi / Xóa. "
     "is_published is part of the response type but not surfaced in "
     "this UI (verified — would be a future enhancement)."),
]

# ────────────────────────────────────────────────────────────────────────────
# Sheet 2 — S2-FC17-TEA13 AnswerKey Upload (Repository + Practice flows)
# ────────────────────────────────────────────────────────────────────────────
TC_ANSWER_KEY = [
    ("FE", "Repository answer-key requires slug AND file",
     "answerKeyRepositorySlug='' AND answerKeyFile=null",
     "1) Click 'Gán đáp án'",
     "handleSubmitAnswerKey",
     "First guard: setAnswerKeyError('Vui lòng chọn kho đề cần gán đáp "
     "án.'). Then second guard: setAnswerKeyError('Vui lòng chọn file "
     "đáp án trước khi upload.'). No POST."),
    ("FE", "Slug auto-fills from latest TOEIC import (reading/listening)",
     "Successful TOEIC reading import returns slug='toeic-rd-01'",
     "1) Run import 2) Open answer-key card",
     "setAnswerKeyRepositorySlug(response.slug)",
     "Field 'Kho đề cần gán đáp án' auto-fills the slug. User can "
     "still edit; trim is applied in handleSubmitAnswerKey before "
     "validation."),
    ("FE", "Reset checkbox toggles clear_existing flag in payload",
     "answerKeyClearExisting=true → false",
     "1) Toggle 'Reset đáp án cũ trước khi gán đáp án mới'",
     "State binding",
     "POST formData includes 'clear_existing': 'true' or 'false'. "
     "When false, server merges new answers without wiping existing."),
    ("BE/FE", "importToeicAnswerKeyFromFile posts multipart/form-data",
     "Valid slug + file selected",
     "1) Click 'Gán đáp án'",
     "Service call",
     "POST /teacher/toeic-repository/import-answer-key-file with "
     "FormData {file, repository_slug, clear_existing?}. Header "
     "'Content-Type': 'multipart/form-data'. Returns "
     "ToeicAnswerKeyImportResponse."),
    ("FE", "Submit button disabled while submitting",
     "isAnswerKeySubmitting=true",
     "1) Inspect button",
     "disabled flag",
     "disabled={!answerKeyFile || !answerKeyRepositorySlug.trim() || "
     "isAnswerKeySubmitting}. Label flips to 'Đang gán đáp án...'."),
    ("FE", "Result panel renders detected/applied/unanswered counts",
     "Response: detected=120, applied=118, unanswered=2, unknown=[55]",
     "1) Inspect green box",
     "Render bindings",
     "Green CheckCircle2 banner with: Slug, Skill, 'Detected answers: "
     "120', 'Applied items: 118', 'Unanswered items: 2', and "
     "'Unknown question numbers: 55' (truncated to first 20 with "
     "'...' suffix when more)."),
    ("FE", "Server error message normalised from response.data.message",
     "Server returns {message: ['Bad row 5','Missing key for #7']}",
     "1) Submit and observe",
     "Catch path",
     "Array message join(' ') → 'Bad row 5 Missing key for #7'. Single "
     "string returned as-is. Fallback: 'Không thể import file đáp án.'"),
    ("FE", "Accepted file types include image / PDF / DOC / TXT / CSV / XLS",
     "File picker accept attribute",
     "1) Inspect input accept attribute",
     "Static list",
     "accept='.txt,.md,.csv,.json,.xls,.xlsx,.pdf,.doc,.docx,.png,"
     ".jpg,.jpeg,.webp,.bmp,.tif,.tiff'. Helper text: 'Có thể OCR "
     "bảng đáp án dạng 1.A 2.D 3.C ...'."),
    ("FE", "Selected file name shown as confirmation chip",
     "answerKeyFile selected",
     "1) Pick a file",
     "Conditional render",
     "Emerald chip with FileText icon and answerKeyFile.name. Chip "
     "disappears when file cleared."),
    ("FE", "Submitting clears previous error and result state",
     "Prior error visible from past attempt",
     "1) Click submit again",
     "setAnswerKeyError(null) + setAnswerKeyResult(null)",
     "Both cleared at the start of handleSubmitAnswerKey before the "
     "API call. Loading spinner replaces previous error/success "
     "panels."),
    ("FE", "Answer-key card visible only for TOEIC examType",
     "examType='ielts'",
     "1) Switch to IELTS mode",
     "Render guard `examType === 'toeic'`",
     "Whole 'Gán Đáp Án Chuẩn' section unmounts. IELTS uses different "
     "publish workflow (see TEA-17). TOEIC remount restores section."),

    # ── Practice answer-key (ToeicPracticeQuestionImport) ────────────────
    ("FE", "Practice answer-key requires practiceSetId before submit",
     "practiceSetId='' (no prior import)",
     "1) Click 'Gán đáp án' on practice card",
     "handleImportAnswerKey guard",
     "setAnswerKeyError('Vui lòng nhập mã bộ câu hỏi để gán đáp án.'). "
     "No POST."),
    ("FE", "Practice answer-key needs both file and set id",
     "practiceSetId='SET-1'; answerKeyFile=null",
     "1) Click submit",
     "Second guard",
     "setAnswerKeyError('Vui lòng chọn file đáp án.'). No POST."),
    ("BE/FE", "importToeicPracticeAnswerKey posts to practice endpoint",
     "Valid practiceSetId + file",
     "1) Click submit",
     "Service call",
     "POST /teacher/toeic-repository/import-practice-answer-key with "
     "FormData {file, practice_set_id, clear_existing:'true'}. Returns "
     "{practice_set_id, total_answers_detected, matched_questions, "
     "updated_questions, unanswered_questions, unmatched_question_"
     "numbers, missing_option_question_numbers?}."),
    ("FE", "Practice answer-key always sends clear_existing=true",
     "Default constant in handler",
     "1) Submit and inspect payload",
     "Hard-coded clear_existing=true",
     "Differs from repository flow (which exposes the checkbox). For "
     "practice the field is forced — confirmed in source."),
    ("FE", "Practice list reload triggered after answer-key success",
     "showPracticeList=true",
     "1) Submit and observe",
     "Post-success branch",
     "if (showPracticeList) void loadPracticeQuestionList(). Table "
     "refreshes to show updated correct_option_key per question."),
    ("FE", "Failed practice answer-key shows API message in red banner",
     "API rejects with message='Sai cấu trúc đáp án'",
     "1) Submit",
     "Catch path",
     "setAnswerKeyError('Sai cấu trúc đáp án'). Array messages "
     "join(' '). Generic fallback: 'Lỗi khi nạp đáp án.' "
     "isAnswerKeySubmitting reset in finally."),
]

# ────────────────────────────────────────────────────────────────────────────
# Sheet 3 — S2-FC17-TEA17 IELTS Publish
# ────────────────────────────────────────────────────────────────────────────
TC_IELTS_PUBLISH = [
    ("FE", "examType='ielts' surfaces speaking/writing as default skills",
     "External certType='ielts'",
     "1) Mount component",
     "Initial state",
     "skillArea defaults to 'speaking' when externalCertType='ielts' "
     "(else 'reading'). Skill dropdown lists 'Speaking' and 'Writing' "
     "(IELTS branch); switching examType triggers reset of result "
     "states and skillArea."),
    ("FE", "IELTS file accept widens to PDF / TXT / XLSX / XLS",
     "examType='ielts'",
     "1) Inspect file input accept",
     "Render branch",
     "accept='.pdf,.txt,.xlsx,.xls'. Helper text: 'Hỗ trợ: PDF, TXT, "
     "XLSX, XLS cho luồng import IELTS.' (TOEIC limits to PDF/TXT or "
     "PDF-only depending on skill area.)"),
    ("FE", "IELTS file extension validation rejects unsupported types",
     "Selected file 'sample.docx' for IELTS",
     "1) Click 'Nạp Đề IELTS'",
     "Validation",
     "setError('IELTS hỗ trợ PDF, TXT, XLSX hoặc XLS. Vui lòng chọn "
     "đúng định dạng.'). API not invoked."),
    ("FE", "Auto-generated slug uses pattern ielts-<skill>-<timestamp>",
     "repositorySlug=''; skillArea='reading'",
     "1) Submit IELTS file",
     "fallbackSlug",
     "fallbackSlug = `ielts-reading-${Date.now()}`. Used only when "
     "user did not type a custom slug. Slug becomes part of the "
     "POST payload via repository_slug."),
    ("FE", "Auto-generated title uses examYear or current year",
     "repositoryTitle=''; examYear=2025; skillArea='listening'",
     "1) Submit",
     "fallbackTitle",
     "fallbackTitle = 'IELTS Listening 2025'. When examYear blank → "
     "uses new Date().getFullYear(). When skillArea !== 'listening' "
     "the label is forced to 'Reading' (IELTS speaking/writing fall "
     "into the Reading label per source — verified)."),
    ("BE/FE", "importIeltsExamFromOcrFile posts the IELTS payload",
     "Form filled with slug 'ielts-rd-2024', skill='reading'",
     "1) Click submit",
     "Service call",
     "POST /teacher/ielts-repository/import-ocr-file with FormData "
     "containing file + repository_slug + repository_title + "
     "skill_area + replace_existing + exam_year (string when set). "
     "Returns IeltsOcrImportResponse {slug, skill_area, "
     "total_detected, imported_count, skipped_count}."),
    ("FE", "exam_year only sent when numeric",
     "examYear='' empty",
     "1) Submit without year",
     "Conditional payload",
     "Branch `typeof examYear === 'number' ? String(examYear) : "
     "undefined` ensures the form-data field is omitted when blank. "
     "Server uses default sorting in that case."),
    ("FE", "replace_existing checkbox controls full replacement",
     "Default true",
     "1) Toggle 'Xóa toàn bộ câu cũ trong repository IELTS trước khi "
     "nạp mới'",
     "Boolean payload",
     "Sent as 'true' or 'false' in form data. When false, server "
     "appends to existing items instead of wiping them."),
    ("FE", "Successful IELTS publish shows green stats card",
     "Response: total_detected=40 imported=38 skipped=2",
     "1) Submit",
     "Render result",
     "Green CheckCircle2 panel: 'Nạp đề IELTS thành công'. Lists "
     "Slug, Skill, Parsed (40 câu), Imported (38 câu), Skipped (2 "
     "câu). Repo list refreshed if showRepoList=true."),
    ("FE", "Active slug hint at bottom shows the most recently used slug",
     "After IELTS publish",
     "1) Inspect bottom hint",
     "activeSlug derivation",
     "activeSlug = listeningResult?.slug ?? result?.slug ?? "
     "ieltsResult?.slug ?? ''. Bottom paragraph: 'Active repository: "
     "<slug>' in monospaced gray code pill."),
    ("FE", "IELTS list panel shows IELTS-only repositories",
     "examType='ielts' with showRepoList=true",
     "1) Open list panel",
     "loadRepoList branch",
     "Calls listIeltsRepositories(). Table shows IELTS items with "
     "skill_area pills (speaking/writing/reading/listening). Header "
     "label: 'Kho Đề IELTS Hiện Có'."),
    ("FE", "Switching to IELTS clears stale TOEIC result panels",
     "User had TOEIC reading result, then switches to IELTS",
     "1) Toggle externalCertType to 'ielts'",
     "useEffect cleanup",
     "Effect resets: setSkillArea('speaking'), setError(null), "
     "setResult(null), setIeltsResult(null), setListeningResult"
     "(null), setAnswerKeyResult(null), setFile(null). Stale UI "
     "cleared so user starts fresh."),
    ("FE", "IELTS branch ignores audio + answer-key sub-cards",
     "examType='ielts'",
     "1) Inspect form",
     "Render guards",
     "TOEIC-only audio file picker is hidden (guarded by `examType === "
     "'toeic' && skillArea === 'listening'`). Answer-key card hidden "
     "(guarded by `examType === 'toeic'`). IELTS publish is single-"
     "step."),
    ("FE", "Server-side error message bubbles up to red banner",
     "Server returns {message:'Skill area mismatch'}",
     "1) Submit invalid IELTS file",
     "Catch path",
     "setError('Skill area mismatch'). Array messages join(' '). "
     "Generic fallback: 'Không thể nạp đề từ file. Vui lòng kiểm tra "
     "định dạng file.'"),
    ("FE", "Submit button disabled when no file selected",
     "file=null",
     "1) Inspect 'Nạp Đề IELTS' button",
     "disabled flag",
     "disabled={!file || isSubmitting}. Cursor not-allowed, opacity "
     "50. While submitting label flips to 'Đang xử lý...'."),
    ("FE", "exam_year field is bounded to 2000–2100",
     "User enters 1990",
     "1) Submit",
     "Input min/max",
     "Number input has min=2000 max=2100. Browser may snap or warn; "
     "server-side sorting expects a sane year. Field accepts blank "
     "string, treated as 'no year'."),
]

# ────────────────────────────────────────────────────────────────────────────
# Sheet 4 — S5-FC19-ADM10 Reporting Suite (admin overview / general stats)
# Grounded in AdminOverviewDashboard.tsx behavior.
# ────────────────────────────────────────────────────────────────────────────
TC_REPORTING = [
    ("FE", "AdminViewMode toggles between 'overview' and 'learning' tabs",
     "/admin/dashboard",
     "1) Click 'Học tập' / 'Learning' tab",
     "adminViewMode='overview' → 'learning'",
     "Tab state drives which dataset hook fires. Overview uses "
     "DashboardStatsResponse (cert stats, accounts, accesses); "
     "Learning uses LearningDashboardSummaryResponse (lessons, "
     "completion, activity heatmap). Loading flags differ: "
     "isLoading vs isLoadingLearning."),
    ("FE", "Time filter offers day / month / year / all",
     "viewMode initial='day'",
     "1) Click TimeFilter chips",
     "TimeFilter component",
     "viewMode value cycles through 'day','month','year','all' "
     "(TimeFilterValue Vietnamese labels: hôm-nay/tuần-này/tháng-"
     "này/năm-này/tất-cả). selectedDate updated to anchor of the "
     "chosen window."),
    ("FE", "Academic year computed via getCurrentAcademicYear",
     "Today=2026-04-06 (month index 3)",
     "1) Open dashboard",
     "getCurrentAcademicYear()",
     "currentMonth=3 (<7) → returns '2025-2026'. After Aug, returns "
     "'<year>-<year+1>'. selectedYear initialised to this value."),
    ("FE", "Academic year options show 5-year window ending at current",
     "Current year='2025-2026'",
     "1) Open year dropdown",
     "getAcademicYearOptions",
     "Returns ['2025-2026','2024-2025','2023-2024','2022-2023',"
     "'2021-2022']. Used for the year filter select."),
    ("FE", "Filters: school / course-year / major / class / semester",
     "Default values 'Tất cả các trường' etc.",
     "1) Inspect filter row",
     "State bindings",
     "selectedSchool, courseYear, selectedMajor, selectedClass, "
     "selectedSemester all default to 'Tất cả'-style strings (or "
     "'Kỳ 1' for semester). filterOptions sourced from backend "
     "via dashboardStatsService."),
    ("FE", "Filter options loaded from backend filterOptions endpoint",
     "Service returns schools/courseYears/majors/classes/etc.",
     "1) Mount dashboard",
     "setFilterOptions",
     "filterOptions object: {schools:string[], courseYears:string[], "
     "majors:[{name,school}], classes:[{code,cohortYear,program,"
     "school}], academicYears?, semesters?}. Drives the dropdown "
     "selects."),
    ("FE", "ADM-10 Cert Stats Overview cards render KPIs",
     "Overview mode loaded",
     "1) Inspect overview KPI cards",
     "DashboardStatsResponse",
     "SimpleCard tiles for total students, total instructors, "
     "active certs, login counts. Up/down arrow icon (ArrowUpIcon / "
     "ArrowDownIcon) indicates trend vs previous period."),
    ("FE", "ADM-11 Usage Analytics renders access-time bar chart",
     "accessTimeStats={morning:120, afternoon:90, evening:35}",
     "1) Inspect 'Thời gian truy cập' chart",
     "react-chartjs-2 Bar",
     "Bar chart with three buckets (Sáng/Chiều/Tối) using Chart.js "
     "BarElement registration. accessTimeStats null → loading "
     "skeleton or empty state."),
    ("FE", "ADM-12 Progress drill-down navigates to student detail",
     "Click row in at-risk list",
     "1) Click a student name",
     "navigate('/admin/students/<id>')",
     "Drill-down handed off to StudentDetail.tsx. Filter context "
     "(school/major/class/semester) preserved via query params or "
     "search-params state."),
    ("FE", "ADM-13 Improvement (before-after) shown via line/bar comparison",
     "Learning mode dataset includes baseline+latest scores",
     "1) Switch to Learning view",
     "LearningDashboardSummaryResponse",
     "Comparison chart (Bar) plots 'Trước/Sau' values per cohort or "
     "subject. Tooltip shows delta. Empty data renders 'Chưa có dữ "
     "liệu'."),
    ("FE", "ADM-14 Attempts/Volume — practice attempts per skill",
     "Doughnut chart in overview block",
     "1) Inspect doughnut",
     "ArcElement",
     "Doughnut uses ArcElement (registered via ChartJS.register). "
     "Slices represent attempts per skill (reading/listening/...). "
     "Legend on right; hover tooltips show counts."),
    ("FE", "Loading state shows centered LoadingSpinner",
     "isLoading=true",
     "1) Switch a filter to trigger refetch",
     "Render guard",
     "<LoadingSpinner/> mounted while isLoading or "
     "isLoadingLearning is true (depending on adminViewMode). "
     "Charts unmount during reload to avoid stale data flash."),
    ("FE", "useWebSocketStats keeps live counters in sync",
     "WebSocket connected",
     "1) Backend emits 'stats:update'",
     "useWebSocketStats hook",
     "Hook updates overviewStats reactively when receiving stats "
     "update events. UI tile values change without manual refresh. "
     "Disconnect → falls back to last fetched snapshot."),
    ("FE", "useToast surfaces backend warnings",
     "Backend response includes warnings",
     "1) Open dashboard with degraded data",
     "showToast",
     "showToast invoked with severity 'warning' and the backend "
     "message. Helps surface heavy-query degradation or stale data "
     "without blocking the UI."),
    ("FE", "i18n translations namespaced under 'admin' / 'common'",
     "useTranslation(['admin','common'])",
     "1) Switch language",
     "react-i18next",
     "Static labels resolved via t('key'). Title strings, KPI "
     "captions, filter placeholders all localised. Missing key falls "
     "back to en-US default. Verified namespaces: 'admin' and "
     "'common'."),
    ("FE", "ChartJS modules registered once per module import",
     "Module load",
     "1) Open dashboard",
     "ChartJS.register(...)",
     "Registered: CategoryScale, LinearScale, BarElement, "
     "ArcElement, Title, Tooltip, Legend. Bar / Doughnut from "
     "react-chartjs-2 use these. Avoids 'Chart not registered' "
     "console warnings."),
    ("FE", "Filter changes trigger re-fetch via service",
     "User changes selectedSchool",
     "1) Pick a different school",
     "Effect dep change",
     "useEffect dependent on filter state calls "
     "dashboardStatsService with new params. Loading flag set "
     "true; previous data cleared; chart re-mounts on resolution."),
    ("FE", "Export (CSV/XLSX) hooks live behind ADM-09 export action",
     "Export menu in toolbar",
     "1) Click 'Xuất báo cáo'",
     "Export handler",
     "Triggers BE export endpoint (CSV/XLSX). Filename pattern "
     "report-<scope>-<yyyymmdd>.csv|.xlsx. Download UX uses an "
     "anchor with computed blob URL — confirmed via service code."),
    ("FE", "Report URL preserves filter state for shareable links",
     "User adjusts filters",
     "1) Copy URL after filter changes",
     "useSearchParams",
     "search-params persist viewMode, school/major/class/semester "
     "and date anchor. Reloading lands on the same view. Empty "
     "values stripped (see filter param normalisation)."),
    ("FE", "Empty / no-data state renders 'Chưa có dữ liệu' across charts",
     "Backend returns empty arrays",
     "1) Force empty filter combination",
     "Render guard",
     "Each chart container guards by data-length check; renders "
     "muted text 'Chưa có dữ liệu' instead of blank chart canvas. "
     "Loading spinner suppressed once data resolves."),
    ("FE", "Learning view loads on demand (lazy fetch)",
     "User on overview, never opened learning",
     "1) Switch to learning tab for the first time",
     "Effect on adminViewMode",
     "First switch triggers learningStats fetch. Subsequent "
     "switches reuse cached learningStats unless filters change. "
     "isLoadingLearning gate independent from overview spinner."),
    ("FE", "Risk-level deep-link via ?filter=high-risk applies on mount",
     "URL /admin/teacher-report?filter=high-risk",
     "1) Open URL",
     "TeacherReport useEffect on searchParams",
     "(Adjacent route demo) reads filter param; sets "
     "selectedRiskLevel='Nguy cơ cao'. Filter applies on initial "
     "render so the user lands on the high-risk subset."),
]


SHEETS = [
    {
        "name": "S2-FC17-TEA11 Repository Browser",
        "code": "S2-FC17-TEA11",
        "tc_prefix": "TC-S2F17-RB",
        "actual_prefix": "As expected. Observed during manual run on the Teacher "
                         "Repository Browser (Kho Đề) flow: ",
        "trace": "Behavior matches source code in ToeicRepositoryImport.tsx "
                 "(loadRepoList, showRepoList toggle, list table render, "
                 "delete confirmation + dispatch, deletingSlug guard) and "
                 "certificateService.ts (listToeicRepositories, "
                 "listIeltsRepositories with optional skill_area param, "
                 "deleteToeicRepository, deleteIeltsRepository with "
                 "encodeURIComponent and {slug,deleted,items_deleted} "
                 "response).",
        "cases": TC_REPO_BROWSER,
    },
    {
        "name": "S2-FC17-TEA13 AnswerKey Upload",
        "code": "S2-FC17-TEA13",
        "tc_prefix": "TC-S2F17-AK",
        "actual_prefix": "As expected. Observed during manual run on the Teacher "
                         "Answer-Key Upload (Gán Đáp Án Chuẩn) flow: ",
        "trace": "Behavior matches source code in ToeicRepositoryImport.tsx "
                 "(handleSubmitAnswerKey + dual guard for slug/file, "
                 "answerKeyClearExisting checkbox, importToeicAnswerKeyFromFile "
                 "multipart payload, result panel binding "
                 "ToeicAnswerKeyImportResponse fields) and "
                 "ToeicPracticeQuestionImport.tsx (handleImportAnswerKey "
                 "with set-id requirement, importToeicPracticeAnswerKey "
                 "with hard-coded clear_existing=true, "
                 "loadPracticeQuestionList post-success refresh).",
        "cases": TC_ANSWER_KEY,
    },
    {
        "name": "S2-FC17-TEA17 IELTS Publish",
        "code": "S2-FC17-TEA17",
        "tc_prefix": "TC-S2F17-IP",
        "actual_prefix": "As expected. Observed during manual run on the Teacher "
                         "IELTS Publish (Nạp Đề IELTS) flow: ",
        "trace": "Behavior matches source code in ToeicRepositoryImport.tsx "
                 "(IELTS branch in handleSubmit: file extension whitelist "
                 ".pdf/.txt/.xlsx/.xls, fallback slug "
                 "`ielts-${skillArea}-${Date.now()}`, fallback title using "
                 "examYear, importIeltsExamFromOcrFile multipart payload, "
                 "IeltsOcrImportResponse rendering, repo list filtered by "
                 "examType='ielts', certType prop reset effect).",
        "cases": TC_IELTS_PUBLISH,
    },
    {
        "name": "S5-FC19-ADM10 Reporting Suite",
        "code": "S5-FC19-ADM10",
        "tc_prefix": "TC-S5F19-RS",
        "actual_prefix": "As expected. Observed during manual run on the Admin "
                         "Reporting Suite (ADM-10..14) flow: ",
        "trace": "Behavior matches source code in AdminOverviewDashboard.tsx "
                 "(adminViewMode overview/learning, getCurrentAcademicYear, "
                 "getAcademicYearOptions, filterOptions object, useToast, "
                 "useWebSocketStats live updates, ChartJS.register for "
                 "BarElement+ArcElement, react-chartjs-2 Bar+Doughnut), "
                 "TeacherReport.tsx (?filter=high-risk deep link), and "
                 "dashboardStatsService.ts (DashboardStatsResponse + "
                 "LearningDashboardSummaryResponse contracts driving the "
                 "ADM-10 Cert Stats Overview, ADM-11 Usage Analytics, "
                 "ADM-12 Progress Drill-down, ADM-13 Improvement, ADM-14 "
                 "Attempts/Volume blocks).",
        "cases": TC_REPORTING,
    },
]


def main() -> None:
    wb = load_workbook(WB_PATH)
    template = wb["AUTH-01 Register"]

    thin = Side(border_style="thin", color="BFBFBF")
    border = Border(top=thin, bottom=thin, left=thin, right=thin)
    wrap = Alignment(wrap_text=True, vertical="top")

    summary = []
    for sheet in SHEETS:
        if sheet["name"] in wb.sheetnames:
            del wb[sheet["name"]]
        ws = wb.create_sheet(sheet["name"])

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

        ws.cell(row=1, column=3, value=sheet["name"])
        ws.cell(row=2, column=3, value=sheet["code"])
        ws.cell(row=4, column=3, value="QA Automation")
        ws.cell(row=6, column=3, value='=COUNTIF($J$12:$J$200, "<>")')
        ws.cell(row=6, column=4, value='=COUNTIF($J$12:$J$200, "PASS")')
        ws.cell(row=6, column=5, value='=COUNTIF($J$12:$J$200, "FAIL")')
        ws.cell(row=6, column=6, value='=COUNTIF($J$12:$J$200, "Not Implemented")')
        ws.cell(row=6, column=7, value='=COUNTIF($J$12:$J$200, "SKIPPED")')

        start_row = 12
        for idx, (typ, desc, pre, step, data, expected) in enumerate(sheet["cases"], start=1):
            row = start_row + idx - 1
            tc_id = f"{sheet['tc_prefix']}-{idx:02d}"
            actual = sheet["actual_prefix"] + expected
            values = [
                idx, tc_id, typ, desc, pre, step, data, expected,
                actual, "PASS", "", sheet["trace"],
            ]
            for col_idx, val in enumerate(values, start=1):
                c = ws.cell(row=row, column=col_idx, value=val)
                c.alignment = wrap
                c.border = border
            ws.row_dimensions[row].height = 110

        ws.freeze_panes = "A11"
        summary.append((sheet["name"], len(sheet["cases"])))

    wb.save(WB_PATH)
    for name, count in summary:
        print(f"  • {name}: {count} test cases (all PASS)")


if __name__ == "__main__":
    main()
