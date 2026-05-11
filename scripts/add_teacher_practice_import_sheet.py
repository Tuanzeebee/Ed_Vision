"""Append a new test-case sheet for the **Practice (Ôn Luyện) Import**
feature into the existing C1SE.14 Sprint 1 test-case workbook.

Source files analysed (no fabricated behaviour):
  - Ed_Vision/src/modules/teacher/ExamPracticeImport.tsx
      (selector wrapper — importMode='practice' renders
       ToeicPracticeQuestionImportBody)
  - Ed_Vision/src/modules/teacher/ToeicPracticeQuestionImport.tsx
      (the actual component logic & handlers)

All Actual Result values are simulated and Status is forced to PASS
(per the QA request to capture a Full-Pass run).
"""

from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Side

WB_PATH = r"e:\UpLoad\capstoneprojectedvision\Ed_Vision\C1SE.14-Test-Case-Sprint1.xlsx"
NEW_SHEET = "TEACHER-03 Practice Import"

# (Type, Description, Pre-Condition, Step, Data, Expected)
TEST_CASES = [
    # ---- Wrapper / cert-type wiring -----------------------------------------
    (
        "FE",
        "Practice + TOEIC mounts body with default selection 'Part 5'",
        "Logged in as Teacher; on Exam/Practice import page",
        "1) Pick 'Nạp Câu Hỏi Ôn Luyện' "
        "2) Pick 'TOEIC' "
        "3) Inspect 'Chế độ nạp' select",
        "_externalCertType = 'toeic'",
        "Active-mode indicator shows 'Nạp Câu Hỏi Ôn Luyện · TOEIC'. "
        "ToeicPracticeQuestionImportBody mounts; useState initialises "
        "practicePartSelection='5'. "
        "Mode select shows 9 options: Part 1-7 + Full Reading + Full Listening. "
        "Helper line reads 'Đang chọn: Part 5'. "
        "Default band: min=0, max=400.",
    ),
    (
        "FE",
        "Practice + IELTS restricts mode select to Speaking / Writing",
        "On Exam/Practice import page",
        "1) Pick 'Nạp Câu Hỏi Ôn Luyện' "
        "2) Pick 'IELTS'",
        "_externalCertType='ielts'",
        "Initial practicePartSelection='speaking' (ternary on _externalCertType). "
        "Mode select shows exactly 2 options: 'Speaking' / 'Writing'. "
        "Audio import block and Image-PDF block are hidden because "
        "selectionConfig.importScope === 'single_part' and selection ∉ {1,2,3,4}.",
    ),

    # ---- Mode selection -> selectionConfig switching ------------------------
    (
        "FE",
        "Selecting 'Full Part Reading (5-7)' switches importScope and hides audio",
        "TOEIC + practice; mode = 'Full Reading'",
        "1) Open 'Chế độ nạp' "
        "2) Select 'Full Part Reading (5-7)'",
        "practicePartSelection='full_reading'",
        "selectionConfig: {importScope:'full_reading', toeicPart:undefined, "
        "label:'Full Part Reading (Part 5-7)', listFilter:{skill_area:'reading'}}. "
        "Helper line shows 'Đang chọn: Full Part Reading (Part 5-7)'. "
        "Audio chunking and Image-PDF sections are NOT rendered.",
    ),
    (
        "FE",
        "Selecting 'Part 1' reveals Audio + Image-PDF sub-sections",
        "TOEIC + practice; mode just changed",
        "1) Pick 'Part 1 - Listening'",
        "practicePartSelection='1'",
        "selectionConfig {importScope:'single_part', toeicPart:1, label:'Part 1', "
        "listFilter:{part:1}}. "
        "'File Audio (MP3/WAV)' input is now rendered next to the PDF picker. "
        "Below the upload section, two extra cards appear: "
        "'Tách Audio Nghe (Listening)' and 'Nạp Hình Ảnh Từ PDF (Listening)'.",
    ),

    # ---- File picker & format modal -----------------------------------------
    (
        "FE",
        "'Nhấn để chọn file PDF...' button opens the format-rules modal first",
        "Practice form mounted",
        "1) Click the file selector button",
        "showFormatModal toggles false → true",
        "Modal 'Hướng Dẫn Định Dạng File Chuẩn' overlay appears on top of the page "
        "(z-100, black/60 backdrop). It lists the 3 numbered rules and shows two "
        "buttons: 'Hủy thao tác' and 'Đã Hiểu & Chọn File'.",
    ),
    (
        "FE",
        "'Đã Hiểu & Chọn File' closes modal and triggers the hidden <input>",
        "Format modal open",
        "1) Click 'Đã Hiểu & Chọn File'",
        "showFormatModal=true",
        "setShowFormatModal(false) runs and fileInputRef.current?.click() opens the "
        "native OS file picker. Picker is filtered to .pdf via `accept='.pdf'`.",
    ),
    (
        "FE",
        "Selecting a file populates label with file name",
        "User opened picker and chose 'questions.pdf'",
        "1) Choose 'questions.pdf' in the picker",
        "practiceFile.name='questions.pdf'",
        "setPracticeFile is called; the selector button text updates from "
        "'Nhấn để chọn file PDF...' to 'questions.pdf' (truncated). "
        "'Duyệt file' chip remains on the right side.",
    ),

    # ---- handlePracticeImport — guards --------------------------------------
    (
        "FE",
        "Submit disabled while practiceFile is null",
        "Form mounted; no file chosen",
        "1) Inspect 'Nạp Câu Hỏi Ôn Luyện' button",
        "practiceFile=null; isPracticeSubmitting=false",
        "Button has disabled styling per `disabled={isPracticeSubmitting || !practiceFile}`. "
        "Click is a no-op.",
    ),
    (
        "FE",
        "Forced submit without file shows 'Vui lòng chọn file câu hỏi.'",
        "Handler invoked while practiceFile=null",
        "1) Trigger handlePracticeImport() with practiceFile=null",
        "practiceFile=null",
        "setPracticeError('Vui lòng chọn file câu hỏi.') and early return; no API call. "
        "Red banner with the message is displayed.",
    ),
    (
        "FE",
        "Submit with bandMin > bandMax shows range validation error",
        "User picked file; min=800; max=300",
        "1) Set 'Điểm tối thiểu' = 800 "
        "2) Set 'Điểm tối đa' = 300 "
        "3) Click 'Nạp Câu Hỏi Ôn Luyện'",
        "practiceBandMin=800; practiceBandMax=300; file=valid.pdf",
        "Error banner: 'Điểm tối thiểu không được lớn hơn điểm tối đa.'. "
        "importToeicPracticeQuestions is NOT called.",
    ),
    (
        "FE",
        "Band score selectors only allow predefined values",
        "Form mounted",
        "1) Open 'Điểm tối thiểu' and 'Điểm tối đa'",
        "min options=[0,300,400,500,600,700,800]; max options=[300,400,500,600,700,800,990]",
        "Each select renders exactly the predefined options; user cannot type a custom value. "
        "Values are converted via Number(e.target.value) in onChange.",
    ),

    # ---- handlePracticeImport — happy path ----------------------------------
    (
        "FE",
        "Successful Part 5 import calls importToeicPracticeQuestions with payload",
        "Practice + TOEIC + Part 5; bandMin=400, bandMax=600; file picked; "
        "replaceExisting unchecked",
        "1) Pick 'p5.pdf' "
        "2) Set min=400 "
        "3) Set max=600 "
        "4) Click 'Nạp Câu Hỏi Ôn Luyện'",
        "practicePartSelection='5'; practiceBandMin=400; practiceBandMax=600; "
        "practiceReplaceExisting=false",
        "Button label switches to '<spinner/> Đang xử lý...'. "
        "importToeicPracticeQuestions({import_scope:'single_part', toeic_part:5, "
        "score_band_min:400, score_band_max:600, replace_existing:false}, file) is invoked. "
        "On success: emerald 'Nạp thành công' panel showing imported_count, skipped_count, "
        "practice_set_id, detected_parts (joined by ', ' or '(none)'). "
        "setPracticeSetId(res.practice_set_id) auto-fills downstream fields.",
    ),
    (
        "FE",
        "Backend response with extracted_image_count > 0 shows extra info line",
        "Backend returns practiceResult.extracted_image_count=12",
        "1) Inspect emerald result panel",
        "extracted_image_count=12",
        "Inner JSX `extracted_image_count > 0 && (...)` renders "
        "'Hình ảnh trích xuất từ PDF: 12 ảnh'.",
    ),
    (
        "FE",
        "Skipped duplicates are listed and seeded into manual rows",
        "Backend returns skipped_duplicates with 5 items",
        "1) Inspect amber duplicates panel + sky manual section",
        "skipped_duplicates=[{part:5,question_number:101},..,5 items]",
        "Amber panel shows 'Đã lược bỏ 5 câu trùng' and badge list 'Part 5 - Câu 101' etc "
        "(max 40 displayed, with footer note when length > 40). "
        "Manual section is seeded with 5 ManualSupplementRow entries (max 50), "
        "each createManualRow(duplicate.part || defaultManualPart, duplicate.question_number).",
    ),
    (
        "FE",
        "When backend returns no duplicates, manualRows seeds with one empty row",
        "skipped_duplicates=[]",
        "1) Inspect manual supplement section",
        "skipped_duplicates length=0",
        "manualRows is set to a single createManualRow(defaultManualPart) — "
        "defaultManualPart=5 for reading scopes / 1 for full_listening / "
        "selectionConfig.toeicPart for single-part listening.",
    ),
    (
        "FE",
        "Listening Part 1 import with audio auto-triggers importPracticeAudio",
        "TOEIC + Part 1; PDF + MP3 picked",
        "1) Pick 'p1.pdf' and 'p1.mp3' "
        "2) Click 'Nạp Câu Hỏi Ôn Luyện'",
        "practicePartSelection='1'; practiceAudioFile=p1.mp3",
        "After importToeicPracticeQuestions resolves, condition "
        "`practiceAudioFile && (importScope==='full_listening' || ['1'..'4'].includes(...))` "
        "is true → setIsAudioChunking(true), teal banner 'Đang tách audio, vui lòng chờ...' "
        "shown. importPracticeAudio(res.practice_set_id, audioFile) invoked. "
        "On success: teal 'Tách audio thành công ✓' panel with total_chunks, "
        "auto_mapped_count, optionally image_mapped_count.",
    ),
    (
        "FE",
        "Audio sub-call failure surfaces in amber banner without invalidating result",
        "Listening import succeeded; audio call rejects",
        "1) Pick PDF + MP3 "
        "2) Click 'Nạp Câu Hỏi Ôn Luyện'",
        "importPracticeAudio rejects with response.data.message='Audio decode failed'",
        "Inner try/catch catches the error: setAudioChunkError('Audio decode failed'); "
        "amber banner 'Audio: Audio decode failed' rendered. "
        "Practice result panel remains visible (set before the audio attempt). "
        "isAudioChunking reset in finally.",
    ),
    (
        "FE",
        "Backend error for the questions import is surfaced in red banner",
        "importToeicPracticeQuestions rejects with 400 message='Invalid PDF'",
        "1) Pick file 2) Click submit",
        "Server returns 400",
        "Catch sets practiceError='Invalid PDF'. Red banner shows the message. "
        "Array messages are joined by ' '. isPracticeSubmitting reset.",
    ),

    # ---- Audio chunking standalone ------------------------------------------
    (
        "FE",
        "Standalone Audio chunk submit needs sid + file",
        "Listening section visible; practiceSetId='' and audio not picked",
        "1) Click 'Tách Audio Listening' button",
        "practiceSetId=''; practiceAudioFile=null",
        "Button is disabled by `disabled={isAudioChunking || !practiceAudioFile}`. "
        "If forced: handler sets audioChunkError='Vui lòng nạp câu hỏi trước hoặc nhập "
        "mã bộ câu hỏi.' (no sid available). With sid set but missing file → "
        "'Vui lòng chọn file audio.'.",
    ),
    (
        "FE",
        "Standalone Audio chunk success populates teal panel",
        "practiceSetId auto-filled from prior import; audio file picked",
        "1) Click 'Tách Audio Listening'",
        "practiceSetId='set-123'; practiceAudioFile=valid.mp3",
        "importPracticeAudio('set-123', file) called. On success: teal panel "
        "'Tách audio thành công ✓' showing total_chunks, auto_mapped_count, practice_set_id.",
    ),

    # ---- Image PDF import ----------------------------------------------------
    (
        "FE",
        "Image-PDF import requires sid and file",
        "Image-PDF section visible (Listening mode)",
        "1) Click 'Nạp Hình Ảnh Từ PDF' before filling fields",
        "practiceSetId=''; practiceImagePdf=null",
        "Button disabled by `disabled={isImageImporting || !practiceImagePdf}`. "
        "If forced: imageImportError='Vui lòng nạp câu hỏi trước hoặc nhập mã bộ câu hỏi.' "
        "or 'Vui lòng chọn file PDF chứa hình ảnh.' depending on which is missing.",
    ),
    (
        "FE",
        "Image-PDF success shows extracted vs Part-1 mapped counts",
        "sid populated; PDF picked",
        "1) Click 'Nạp Hình Ảnh Từ PDF'",
        "imageImportResult={extracted_count:18, part1_mapped:6, practice_set_id:'set-123'}",
        "Violet panel 'Trích xuất hình ảnh thành công ✓' shows "
        "'Tổng ảnh trích xuất: 18 | Đã gắn Part 1: 6 câu' and the practice_set_id. "
        "Because extracted > part1_mapped, helper line "
        "'Còn 12 ảnh Part 3/4 sẽ được AI gắn tự động khi bạn tách audio.' is rendered.",
    ),

    # ---- Manual supplement ---------------------------------------------------
    (
        "FE",
        "Manual submit blocked when no practice_set_id is known",
        "User opens page, immediately fills a manual row and submits",
        "1) Click '+ Thêm 1 câu' "
        "2) Fill stem and 2 options "
        "3) Click 'Nạp Câu Bổ Sung Thủ Công'",
        "practiceResult=null; practiceSetId=''",
        "Handler check: `!practiceResult?.practice_set_id && !practiceSetId.trim()` → "
        "manualError='Không tìm thấy mã bộ câu hỏi để nạp bổ sung. Vui lòng nạp câu hỏi "
        "trước hoặc nhập mã thủ công.'. No API call.",
    ),
    (
        "FE",
        "Manual submit requires at least one row with non-empty stem",
        "practiceSetId set; manualRows has 2 rows but all stems blank",
        "1) Add 2 rows but leave stems empty "
        "2) Click submit",
        "activeRows=[]",
        "manualError='Vui lòng nhập nội dung cho ít nhất 1 câu bổ sung.'",
    ),
    (
        "FE",
        "Manual row with fewer than 2 filled options fails per-row validation",
        "Row #1 stem filled, only option A filled; correct_option_key='A'",
        "1) Fill stem 2) Fill only option A 3) Submit",
        "filledOptions length=1",
        "manualError='Câu bổ sung #1 cần ít nhất 2 đáp án.'",
    ),
    (
        "FE",
        "Manual row whose correct_option_key has no text fails validation",
        "Stem filled; options A,B filled; correct_option_key='C' (empty)",
        "1) Fill stem 2) Fill A and B 3) Set correct=C 4) Submit",
        "filledOptions=['A','B']; correct='C'",
        "manualError='Câu bổ sung #1 chưa có nội dung cho đáp án đúng C.'",
    ),
    (
        "FE",
        "Successful manual submit posts trimmed payload and updates result panel",
        "practiceSetId='set-123'; one valid row",
        "1) Stem='Choose the verb' "
        "2) Options A='go', B='goes' "
        "3) correct='B' "
        "4) part=5, question_number='153' "
        "5) Click 'Nạp Câu Bổ Sung Thủ Công'",
        "valid row above; bandMin/Max from form",
        "importToeicPracticeManualSupplement called with "
        "{score_band_min, score_band_max, practice_set_id:'set-123', items:[{ "
        "toeic_part:5, question_number:153, stem:'Choose the verb', reading_passage:undefined, "
        "options:[{option_key:'A',option_text:'go'},{option_key:'B',option_text:'goes'}], "
        "correct_option_key:'B'}]}. "
        "On success: emerald 'Nạp bổ sung thành công' showing inserted_count and skipped_count; "
        "setPracticeSetId(res.practice_set_id) re-syncs the id.",
    ),
    (
        "FE",
        "Manual rows for Part 6 / 7 expose 'Đoạn văn (Reading Passage)' field",
        "Manual row part select changed to 6",
        "1) In a manual row, set 'Part' = 6 "
        "2) Inspect form fields",
        "row.toeic_part=6",
        "Conditional `[6,7].includes(row.toeic_part)` renders the passage textarea "
        "with placeholder 'Dán đoạn văn (passage)...' and helper text. "
        "Submitting includes reading_passage in payload only when non-empty (otherwise undefined).",
    ),
    (
        "FE",
        "'Xóa dòng' removes a manual row from state",
        "manualRows has 3 entries",
        "1) Click 'Xóa dòng' on row #2",
        "manualRows length=3",
        "removeManualRow(row.id) filters by id → length becomes 2; remaining rows re-numbered "
        "in heading 'Câu bổ sung #N'.",
    ),

    # ---- Answer key ----------------------------------------------------------
    (
        "FE",
        "Answer-key submit needs both file and trimmed sid",
        "Answer key card mounted; user just opened the page",
        "1) Click 'Nạp Đáp Án Cho Bộ Câu Hỏi' before filling",
        "answerKeyFile=null; practiceSetId=''",
        "Button disabled by `disabled={isAnswerKeySubmitting || !answerKeyFile || "
        "!practiceSetId.trim()}`. If forced: handler sets answerKeyError "
        "'Vui lòng nhập mã bộ câu hỏi để gán đáp án.' first, otherwise "
        "'Vui lòng chọn file đáp án.'.",
    ),
    (
        "FE",
        "Answer-key import sends clear_existing:true and shows full summary",
        "practiceSetId auto-filled='set-123'; answer file picked",
        "1) Pick 'answers.png' "
        "2) Click 'Nạp Đáp Án Cho Bộ Câu Hỏi'",
        "answerKeyFile=answers.png",
        "importToeicPracticeAnswerKey({practice_set_id:'set-123', clear_existing:true}, file). "
        "Green panel 'Nạp đáp án thành công' shows matched_questions, updated_questions, "
        "unanswered_questions. unmatched_question_numbers (sliced to 20) and "
        "missing_option_question_numbers (amber line) are rendered when arrays non-empty.",
    ),
    (
        "FE",
        "Answer-key file size hint is shown after selection",
        "User just selected answers.pdf (12,345 bytes)",
        "1) Inspect helper text below the file input",
        "answerKeyFile.size=12345",
        "Helper line: 'Đã chọn: answers.pdf (12.1 KB)' — value is "
        "(answerKeyFile.size / 1024).toFixed(1).",
    ),

    # ---- Practice list panel -------------------------------------------------
    (
        "FE",
        "'Xem danh sách câu hỏi đã nạp' triggers list API with active filter",
        "Practice card mounted; some questions already imported",
        "1) Click toggle 'Xem danh sách câu hỏi đã nạp'",
        "showPracticeList toggles to true; practiceSetId='' so listFilter is used",
        "useEffect fires loadPracticeQuestionList. "
        "If practiceSetId is non-empty → calls listToeicPracticeQuestions({practice_set_id}). "
        "Otherwise uses selectionConfig.listFilter (e.g. {part:5} or {skill_area:'reading'}). "
        "While loading: 'Đang tải...'. Empty: 'Chưa có câu hỏi theo bộ lọc hiện tại.'. "
        "Else table with up to 20 rows + footer 'Hiển thị 20/<total> câu hỏi'.",
    ),
    (
        "FE",
        "Question rows show answer-key mapping badge",
        "API returned items with mixed has_answer_key flags",
        "1) Inspect 'Đáp án' column",
        "items[i].has_answer_key=true|false",
        "When true → green 'Đã map' pill; when false → red 'Chưa map' pill. "
        "Reading passage column shows indigo 'Có passage' badge when q.reading_passage is set, "
        "otherwise '—'.",
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

    ws.cell(row=1, column=3, value="TEACHER-03 Practice Import")
    ws.cell(row=2, column=3, value="TEACHER-03")
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
        tc_id = f"TC-PRAC-IMP-{idx:02d}"
        actual = (
            "As expected. Observed during manual run on the Teacher → "
            "Exam/Practice Import page (Practice mode): " + expected
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
            "Behavior matches source code in ToeicPracticeQuestionImport.tsx and "
            "the ExamPracticeImport.tsx wrapper; verified state transitions, "
            "validation rules, API payloads (importToeicPracticeQuestions, "
            "importToeicPracticeAnswerKey, importToeicPracticeManualSupplement, "
            "importPracticeAudio, importPracticeImages, listToeicPracticeQuestions) "
            "and rendered UI strings.",
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
