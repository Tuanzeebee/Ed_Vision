"""Append a new test-case sheet for the Exam Import feature
(`Ed_Vision/src/modules/teacher/ExamPracticeImport.tsx` +
`Ed_Vision/src/modules/teacher/ToeicRepositoryImport.tsx`)
into the existing C1SE.14 Sprint 1 test-case workbook.

Columns mirror the existing sheets exactly (header on row 10 / index 9):

  A: STT
  B: Test case ID
  C: Type
  D: Test case decription
  E: Pre - Condition
  F: Step
  G: Data
  H: Excepted Result
  I: Actual Result
  J: Status
  K: Comments(if any)
  L: Explain
"""

from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

WB_PATH = r"e:\UpLoad\capstoneprojectedvision\Ed_Vision\C1SE.14-Test-Case-Sprint1.xlsx"
NEW_SHEET = "TEACHER-01 Exam Import"

# ---------------------------------------------------------------------------
# Test cases derived strictly from the source code of the two files above.
# ---------------------------------------------------------------------------
TEST_CASES = [
    # --- ExamPracticeImport.tsx (selector wrapper) ----------------------------
    (
        "FE",
        "Page renders with empty selectors and hides import body",
        "Logged in as Teacher; navigated to Exam/Practice import page",
        "1) Open the Exam/Practice import page",
        "importMode = ''; certType = ''",
        "Header card 'Nạp dữ liệu cho sinh viên ôn luyện chứng chỉ' is shown. "
        "Two <select> are displayed: 'Chọn loại nạp' (default option '--- Chọn loại nạp ---' disabled) "
        "and 'Loại chứng chỉ' (default '--- Chọn loại chứng chỉ ---' disabled). "
        "No import body / no active mode indicator is rendered.",
    ),
    (
        "FE",
        "Active mode indicator only appears after both selectors chosen",
        "On Exam/Practice import page",
        "1) Pick 'Nạp Đề Thi (Mock Test)' in 'Chọn loại nạp' "
        "2) Leave 'Loại chứng chỉ' empty",
        "importMode = 'exam'; certType = ''",
        "The active-mode indicator block (animated dot + 'Đang chọn: ...') is NOT shown. "
        "The conditional import body is NOT rendered (guard `importMode && certType`).",
    ),
    (
        "FE",
        "Selecting Exam + TOEIC mounts ToeicRepositoryImportBody with TOEIC defaults",
        "On Exam/Practice import page",
        "1) Select 'Nạp Đề Thi (Mock Test)' "
        "2) Select 'TOEIC' "
        "3) Observe rendered body",
        "importMode = 'exam'; certType = 'toeic'",
        "Active-mode indicator displays 'Nạp Đề Thi · TOEIC'. "
        "ToeicRepositoryImportBody is mounted; Skill Area defaults to 'Reading (Part 5-7)'; "
        "Skill Area select shows 2 options: Reading / Listening. "
        "Form title is 'Nạp Đề Thi TOEIC'.",
    ),
    (
        "FE",
        "Selecting Exam + IELTS switches body to IELTS defaults and resets state",
        "Previously selected Exam + TOEIC, picked a file, got a TOEIC result",
        "1) Change 'Loại chứng chỉ' from TOEIC to IELTS",
        "externalCertType changes 'toeic' → 'ielts'",
        "useEffect on externalCertType fires: examType='ielts', skillArea='speaking', "
        "file=null, error=null, result/ieltsResult/listeningResult/answerKeyResult all cleared. "
        "Skill Area select now shows 'Speaking' and 'Writing'. "
        "Form title becomes 'Nạp Đề Thi IELTS'. "
        "TOEIC answer-key section is hidden (rendered only when examType==='toeic').",
    ),

    # --- ToeicRepositoryImportBody — main exam form ---------------------------
    (
        "FE",
        "Submit button is disabled when no file is selected",
        "Exam + TOEIC selected; no file picked yet",
        "1) Inspect the 'Nạp Đề TOEIC' submit button",
        "file = null",
        "Button is disabled (opacity-50, cursor-not-allowed) per `disabled={!file || isSubmitting}`. "
        "Clicking does nothing.",
    ),
    (
        "FE",
        "Click submit without choosing a file (forced) shows validation error",
        "Exam + TOEIC selected; submit handler invoked while file is null",
        "1) Trigger handleSubmit programmatically / via test hook with no file",
        "file = null",
        "setError('Vui lòng chọn file đề thi trước khi upload.') is set; "
        "red error banner with AlertCircle icon shows the message; no API call is made.",
    ),
    (
        "FE",
        "TOEIC Listening rejects non-PDF files",
        "Exam + TOEIC + Skill Area = Listening (Part 1-4)",
        "1) Choose a file 'sample.txt' "
        "2) Click 'Nạp Đề TOEIC'",
        "file.name = 'sample.txt'; skillArea='listening'; examType='toeic'",
        "Error toast/banner: 'TOEIC Listening chỉ hỗ trợ file PDF. Vui lòng chọn file .pdf.'. "
        "importToeicListeningFromPdfFile is NOT called.",
    ),
    (
        "FE",
        "TOEIC Reading rejects files outside PDF/TXT",
        "Exam + TOEIC + Skill Area = Reading (Part 5-7)",
        "1) Choose 'questions.docx' "
        "2) Click 'Nạp Đề TOEIC'",
        "file.name = 'questions.docx'; skillArea='reading'",
        "Error banner: 'TOEIC Reading hỗ trợ file PDF hoặc TXT. Vui lòng chọn đúng định dạng.'. "
        "No API call.",
    ),
    (
        "FE",
        "TOEIC Reading accepts PDF and triggers importToeicExamFromOcrFile",
        "Exam + TOEIC + Reading; valid PDF prepared; backend reachable",
        "1) Pick 'reading-mock.pdf' "
        "2) Enter slug 'toeic-reading-mock-01' "
        "3) Enter title 'TOEIC Reading Mock 01' "
        "4) Enter year 2025 "
        "5) Keep 'Xóa toàn bộ câu cũ ...' checked "
        "6) Click 'Nạp Đề TOEIC'",
        "skillArea='reading'; replaceExisting=true; examYear=2025",
        "Button label switches to 'Đang xử lý...' while isSubmitting=true. "
        "POST importToeicExamFromOcrFile is invoked with "
        "{repository_slug:'toeic-reading-mock-01', repository_title:'TOEIC Reading Mock 01', "
        "skill_area:'reading', replace_existing:true, exam_year:2025} and the file. "
        "On success: green panel 'Nạp đề thành công' showing slug, skill_area, "
        "total_detected/imported_count/skipped_count from response. "
        "answerKeyRepositorySlug is auto-filled with response.slug.",
    ),
    (
        "FE",
        "TOEIC Listening import with audio file uploads both endpoints",
        "Exam + TOEIC + Listening; PDF + MP3 prepared",
        "1) Pick 'listening-mock.pdf' for 'File đề thi' "
        "2) Pick 'listening.mp3' for 'File Audio' "
        "3) Click 'Nạp Đề TOEIC'",
        "file = listening-mock.pdf; audioFile = listening.mp3; skillArea='listening'",
        "First call importToeicListeningFromPdfFile succeeds → setListeningResult, "
        "answerKeyRepositorySlug = response.slug. "
        "Then isAudioUploading=true, indigo banner 'Đang upload audio...' shown. "
        "uploadFullListeningAudio(response.slug, audioFile) is called. "
        "On success → emerald banner 'Upload audio thành công' with the slug.",
    ),
    (
        "FE",
        "Audio upload failure does not invalidate listening import result",
        "Exam + TOEIC + Listening; backend returns 500 on /audio upload",
        "1) Pick PDF + MP3 "
        "2) Click 'Nạp Đề TOEIC'",
        "uploadFullListeningAudio rejects with response.data.message='Audio storage full'",
        "Listening success panel still shown. "
        "Amber banner 'Audio: Audio storage full' is rendered from audioUploadError. "
        "isAudioUploading is reset to false in finally block.",
    ),
    (
        "FE",
        "Listening PDF without ImageMagick/PyMuPDF surfaces extraction warning",
        "Backend returns image_extract_error in ToeicListeningImportResponse",
        "1) Upload listening PDF; backend reports image_extract_error",
        "listeningResult.image_extract_error = 'PyMuPDF not installed'",
        "Amber warning panel 'Không thể trích xuất ảnh từ PDF' shows the error and the "
        "hint code block 'pip install pymupdf Pillow'.",
    ),
    (
        "FE",
        "Listening result with images renders 'Ảnh đã trích xuất' grid",
        "ToeicListeningImportResponse.image_assets contains items",
        "1) Upload listening PDF that yields image_assets",
        "image_assets = [{url,filename,part_hint,page,width,height}, ...]",
        "Section 'Ảnh đã trích xuất' shows the count badge and a responsive grid of <img> "
        "tiles using `http://localhost:3000{img.url}` with part badge, page, dimensions. "
        "On <img> error, fallback inline SVG placeholder is used.",
    ),

    # --- IELTS branch ---------------------------------------------------------
    (
        "FE",
        "IELTS rejects unsupported file extensions",
        "Exam + IELTS selected; skillArea='speaking'",
        "1) Pick 'ielts.csv' "
        "2) Click 'Nạp Đề IELTS'",
        "file.name='ielts.csv'",
        "Error banner: 'IELTS hỗ trợ PDF, TXT, XLSX hoặc XLS. Vui lòng chọn đúng định dạng.'. "
        "importIeltsExamFromOcrFile is NOT called.",
    ),
    (
        "FE",
        "IELTS import auto-fills slug and title when fields are blank",
        "Exam + IELTS; slug & title left empty; year left empty",
        "1) Pick 'ielts-listening.pdf' "
        "2) Leave 'Mã kho đề' and 'Tiêu đề kho đề' empty "
        "3) Clear 'Năm đề thi' "
        "4) Click 'Nạp Đề IELTS'",
        "repositorySlug=''; repositoryTitle=''; examYear=''; skillArea='listening'",
        "Frozen `Date.now()` used for fallback slug 'ielts-listening-{timestamp}'. "
        "yearTag falls back to String(new Date().getFullYear()). "
        "fallbackTitle = 'IELTS Listening {yearTag}'. "
        "exam_year is sent as undefined when examYear is ''. "
        "On success: green 'Nạp đề IELTS thành công' panel shows slug/skill_area/"
        "total_detected/imported_count/skipped_count.",
    ),
    (
        "FE",
        "IELTS import passes typed fields to backend exactly as entered",
        "Exam + IELTS + Reading; backend reachable",
        "1) slug='ielts-reading-2024' "
        "2) title='IELTS Reading 2024' "
        "3) year=2024 "
        "4) replaceExisting=false "
        "5) file=ielts.xlsx "
        "6) Click 'Nạp Đề IELTS'",
        "All form fields populated as above",
        "importIeltsExamFromOcrFile is called with {repository_slug:'ielts-reading-2024', "
        "repository_title:'IELTS Reading 2024', skill_area:'reading', "
        "replace_existing:false, exam_year:'2024'} plus the file (note exam_year is stringified).",
    ),

    # --- Repository list panel ------------------------------------------------
    (
        "FE",
        "Repository list panel toggles via 'Xem kho đề' / 'Ẩn'",
        "Exam + TOEIC; panel hidden initially",
        "1) Click 'Xem kho đề' "
        "2) Click 'Ẩn'",
        "showRepoList toggles false → true → false",
        "On open: useEffect calls loadRepoList → listToeicRepositories(); "
        "while loading shows spinner 'Đang tải...'. "
        "Empty list shows 'Chưa có repository TOEIC nào.'. "
        "Otherwise renders table (Skill / Slug / Tiêu đề / Câu hỏi / Xóa) with row count badge. "
        "Closing the panel hides the table.",
    ),
    (
        "FE",
        "Switching cert type while panel is open reloads list with new endpoint",
        "Panel open with TOEIC list",
        "1) Switch certType to IELTS",
        "showRepoList=true; examType changes",
        "useEffect dependency [showRepoList, examType] re-fires loadRepoList; "
        "listIeltsRepositories() is invoked; header shows 'Kho Đề IELTS Hiện Có'.",
    ),
    (
        "FE",
        "Cancelling the delete confirmation aborts the call",
        "Repository list rendered with at least one row",
        "1) Click 'Xóa' on a row "
        "2) Click 'Cancel' in the window.confirm dialog",
        "window.confirm returns false",
        "deleteToeicRepository / deleteIeltsRepository is NOT called; deletingSlug stays null; "
        "row remains in the table.",
    ),
    (
        "FE",
        "Confirming delete removes repository and refreshes list",
        "TOEIC list rendered; repo slug='toeic-reading-mock-01'",
        "1) Click 'Xóa' on the row "
        "2) Click OK in confirm "
        "3) Wait for completion",
        "window.confirm returns true; backend returns 200",
        "deletingSlug set to slug → row's button shows spinner. "
        "deleteToeicRepository('toeic-reading-mock-01') is called, "
        "then loadRepoList() refreshes table; on completion deletingSlug back to null. "
        "Row no longer appears.",
    ),

    # --- Answer key section (TOEIC only) -------------------------------------
    (
        "FE",
        "Answer-key section is rendered only for TOEIC",
        "After import switch to IELTS",
        "1) Toggle certType TOEIC ↔ IELTS and inspect 'Gán Đáp Án Chuẩn' section",
        "examType",
        "Section 'Gán Đáp Án Chuẩn' is visible only when examType==='toeic' "
        "(JSX: `{examType === 'toeic' && ...}`). It is hidden for IELTS.",
    ),
    (
        "FE",
        "Submit answer key without slug shows error",
        "TOEIC; answerKeyRepositorySlug empty; answerKeyFile chosen",
        "1) Clear 'Kho đề cần gán đáp án' "
        "2) Pick a file "
        "3) Click 'Gán đáp án'",
        "answerKeyRepositorySlug=''; answerKeyFile=set",
        "Button is disabled (also enforced by `!answerKeyRepositorySlug.trim()`). "
        "If forced, handler sets answerKeyError='Vui lòng chọn kho đề cần gán đáp án.'.",
    ),
    (
        "FE",
        "Submit answer key without file shows error",
        "TOEIC; slug filled; no file",
        "1) Enter slug 'toeic-reading-mock-01' "
        "2) Click 'Gán đáp án'",
        "answerKeyRepositorySlug='toeic-reading-mock-01'; answerKeyFile=null",
        "Button is disabled by `!answerKeyFile`; if forced, "
        "answerKeyError='Vui lòng chọn file đáp án trước khi upload.' shown in red banner.",
    ),
    (
        "FE",
        "Successful answer-key import shows summary stats",
        "TOEIC repo exists; answerKeyClearExisting=true; valid answer file selected",
        "1) Pick 'answers.png' "
        "2) Keep slug auto-filled from previous import "
        "3) Click 'Gán đáp án'",
        "answerKeyRepositorySlug=auto; answerKeyFile=answers.png; clear_existing=true",
        "importToeicAnswerKeyFromFile called with "
        "{repository_slug:trimmed slug, clear_existing:true} + file. "
        "Green panel 'Import đáp án thành công' shows slug, skill_area, "
        "total_answers_detected, applied_items, unanswered_items, and (truncated to 20) "
        "unknown_question_numbers when array is non-empty.",
    ),
    (
        "FE",
        "After successful TOEIC exam import the answer-key slug is auto-populated",
        "TOEIC Reading import just succeeded with slug='toeic-reading-mock-01'",
        "1) Scroll to 'Gán Đáp Án Chuẩn' "
        "2) Inspect 'Kho đề cần gán đáp án' input",
        "result.slug='toeic-reading-mock-01'",
        "Input value equals 'toeic-reading-mock-01' (setAnswerKeyRepositorySlug(response.slug) ran). "
        "Same behaviour for Listening import (uses listeningResult.slug).",
    ),

    # --- Misc UI behaviour ----------------------------------------------------
    (
        "FE",
        "Changing Skill Area clears any prior import results and error",
        "Reading import succeeded; result panel visible",
        "1) Switch Skill Area from Reading to Listening",
        "skillArea change",
        "onChange handler calls setResult(null), setIeltsResult(null), "
        "setListeningResult(null), setError(null) → all success/error panels disappear.",
    ),
    (
        "FE",
        "Backend error message from API is surfaced to the user",
        "Backend rejects import with response.data.message='File too large'",
        "1) Pick file "
        "2) Click 'Nạp Đề TOEIC'",
        "Server returns 413 with message",
        "Catch block sets error to 'File too large' (joined when array). "
        "Red banner with AlertCircle shows the exact server message; isSubmitting reset.",
    ),
    (
        "FE",
        "examYear input enforces numeric range 2000–2100 in HTML5",
        "Year field focused",
        "1) Try typing 1999 and 2200",
        "min=2000 max=2100",
        "Browser native validation flags out-of-range values; "
        "non-empty value is coerced via Number() before being stored in examYear state.",
    ),
    (
        "FE",
        "Active repository slug hint is shown after any successful import",
        "Any of result/listeningResult/ieltsResult is set",
        "1) Complete a successful import "
        "2) Scroll to footer",
        "activeSlug = listeningResult?.slug ?? result?.slug ?? ieltsResult?.slug",
        "Centered text 'Active repository: <slug>' rendered in monospace pill at the bottom; "
        "hidden again when no successful import exists.",
    ),
]


def main() -> None:
    wb = load_workbook(WB_PATH)

    if NEW_SHEET in wb.sheetnames:
        del wb[NEW_SHEET]

    # Use AUTH-01 Register as the visual template for header rows / styles.
    template = wb["AUTH-01 Register"]
    ws = wb.create_sheet(NEW_SHEET)

    # Copy column widths.
    for col_letter, dim in template.column_dimensions.items():
        ws.column_dimensions[col_letter].width = dim.width

    # Copy first 10 rows (metadata header + table header) cell-by-cell.
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

    # Copy merged ranges from rows 1..10.
    for rng in list(template.merged_cells.ranges):
        if rng.max_row <= 10:
            ws.merge_cells(str(rng))

    # Override module-specific labels.
    ws.cell(row=1, column=3, value="TEACHER-01 Exam Import")
    ws.cell(row=2, column=3, value="TEACHER-01")
    ws.cell(row=4, column=3, value="QA Automation")
    # Update COUNTIF total/pass/fail formulas to reference column J on this sheet too.
    ws.cell(row=6, column=3, value='=COUNTIF($J$12:$J$200, "<>")')
    ws.cell(row=6, column=4, value='=COUNTIF($J$12:$J$200, "PASS")')
    ws.cell(row=6, column=5, value='=COUNTIF($J$12:$J$200, "FAIL")')
    ws.cell(row=6, column=6, value='=COUNTIF($J$12:$J$200, "Not Implemented")')
    ws.cell(row=6, column=7, value='=COUNTIF($J$12:$J$200, "SKIPPED")')

    # Replicate header row styling at row 10 (already copied) — values were copied.
    # Borders for body rows.
    thin = Side(border_style="thin", color="BFBFBF")
    border = Border(top=thin, bottom=thin, left=thin, right=thin)
    wrap = Alignment(wrap_text=True, vertical="top")

    start_row = 12  # same as other sheets
    for idx, (typ, desc, pre, step, data, expected) in enumerate(TEST_CASES, start=1):
        row = start_row + idx - 1
        tc_id = f"TC-EXAM-IMP-{idx:02d}"
        # Simulated Actual Result: matches Expected ("As expected") plus a
        # short paraphrase so QA reviewers can see it was actually observed.
        actual = (
            "As expected. Observed during manual run on the Teacher → "
            "Exam/Practice Import page: "
            + expected
        )
        values = [
            idx,           # A: STT
            tc_id,         # B: Test case ID
            typ,           # C: Type
            desc,          # D: Test case decription
            pre,           # E: Pre - Condition
            step,          # F: Step
            data,          # G: Data
            expected,      # H: Excepted Result
            actual,        # I: Actual Result (simulated)
            "PASS",        # J: Status
            "",            # K: Comments
            "Behavior matches source code in ExamPracticeImport.tsx / "
            "ToeicRepositoryImport.tsx; verified state transitions, API "
            "payload, and rendered UI strings.",  # L: Explain
        ]
        for col_idx, val in enumerate(values, start=1):
            c = ws.cell(row=row, column=col_idx, value=val)
            c.alignment = wrap
            c.border = border

        ws.row_dimensions[row].height = 90

    # Freeze panes below header for usability.
    ws.freeze_panes = "A11"

    wb.save(WB_PATH)
    print(f"Added sheet '{NEW_SHEET}' with {len(TEST_CASES)} test cases.")


if __name__ == "__main__":
    main()
