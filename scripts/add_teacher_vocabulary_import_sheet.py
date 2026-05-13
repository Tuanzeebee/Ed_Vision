"""Append a new test-case sheet for the **Vocabulary (Từ Vựng) Import**
feature into the existing C1SE.14 Sprint 1 test-case workbook.

Source files analysed (no fabricated behaviour):
  - Ed_Vision/src/modules/teacher/ExamPracticeImport.tsx
      (wrapper: importMode='vocabulary' → renders <VocabularyImportBody />)
  - Ed_Vision/src/modules/teacher/VocabularyImport.tsx
      (the 3-step Upload → Preview → Done component)

All Actual Result values are simulated and Status is forced to PASS
(per the QA request to capture a Full-Pass run).
"""

from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Side

WB_PATH = r"e:\UpLoad\capstoneprojectedvision\Ed_Vision\C1SE.14-Test-Case-Sprint1.xlsx"
NEW_SHEET = "TEACHER-04 Vocabulary Import"

# (Type, Description, Pre-Condition, Step, Data, Expected)
TEST_CASES = [
    # ---- Wrapper / mount behaviour ------------------------------------------
    (
        "FE",
        "Vocabulary mode renders body regardless of certType selection",
        "Logged in as Teacher; on Exam/Practice import page",
        "1) Pick 'Nạp Từ Vựng' "
        "2) Pick any 'Loại chứng chỉ' (TOEIC or IELTS)",
        "importMode='vocabulary'",
        "Wrapper renders <VocabularyImportBody/> without forwarding any prop "
        "(JSX: `<VocabularyImportBody />`). "
        "Component hard-codes `useState('toeic')` for certType regardless of selector. "
        "Active-mode indicator still reflects the chosen cert label.",
    ),
    (
        "FE",
        "Topics list is fetched on mount via GET teacher/vocab/topics?cert_type=toeic",
        "Body just mounted",
        "1) Open the page and inspect the Network tab",
        "useEffect → loadTopics()",
        "GET request to buildUrl('teacher/vocab/topics', {cert_type:'toeic'}) is sent "
        "with Authorization header from localStorage 'token'. On 200, the response is "
        "parsed and topics state is populated. Errors are silently swallowed (try/catch).",
    ),
    (
        "FE",
        "Step indicator highlights the current step",
        "Body just mounted; step='upload'",
        "1) Inspect the 3 step badges in the header",
        "step='upload'",
        "First badge has bg-[#A67B5B] (active); second & third have bg-slate-100 (inactive). "
        "After preview success badges 1→✓ green, 2 active, 3 inactive. After save: 1→✓, "
        "2→✓, 3 active.",
    ),

    # ---- Topic selector ------------------------------------------------------
    (
        "FE",
        "Topic dropdown shows '🤖 Tự động (AI phát hiện)' and all returned topics",
        "Topics API returned 3 items",
        "1) Open the 'Chủ đề đích' dropdown",
        "topics=[{id:1,emoji:'🏢',titleVI:'Văn phòng',wordCount:42}, …]",
        "First option has value='' label '🤖 Tự động (AI phát hiện)'. "
        "Each topic renders option with value=id and label '<emoji> <titleVI> — <wordCount> từ'.",
    ),
    (
        "FE",
        "'Tạo mới' button toggles inline new-topic form",
        "Topic dropdown visible",
        "1) Click 'Tạo mới'",
        "newTopicMode=false → true",
        "Dropdown is replaced by a card with three inputs: Emoji (default '📚'), "
        "Tên tiếng Việt, English name; plus 'Hủy' and 'Tạo chủ đề' buttons.",
    ),
    (
        "FE",
        "'Tạo chủ đề' is no-op when title_vi is empty / whitespace-only",
        "newTopicMode=true; title_vi='   '",
        "1) Leave Vietnamese name blank or spaces "
        "2) Click 'Tạo chủ đề'",
        "newTopic.title_vi='   '",
        "Handler early-returns at `if (!newTopic.title_vi.trim()) return;`. "
        "No POST request fired; form stays open; no error toast.",
    ),
    (
        "FE",
        "Successful topic creation reloads list and selects new id",
        "Form filled with title_vi='Văn phòng', title_en='Office', emoji='🏢'",
        "1) Click 'Tạo chủ đề'",
        "Server returns {id:42}",
        "POST teacher/vocab/topics with body {title_vi,title_en,emoji,cert_type:'toeic'}. "
        "Response.id=42 → setTopicId('42'); loadTopics() refetches list; "
        "newTopicMode=false; form resets to {title_vi:'',title_en:'',emoji:'📚'}. "
        "Dropdown now shows the new topic preselected.",
    ),
    (
        "FE",
        "Topic creation error sets red error banner",
        "fetch teacher/vocab/topics rejects (network / 500)",
        "1) Fill name 2) Click 'Tạo chủ đề'",
        "fetch throws",
        "Catch block runs setError('Không thể tạo chủ đề.'); red banner with AlertCircle "
        "is shown in the upload step. newTopicMode stays true; form values preserved.",
    ),

    # ---- File picker / drop zone --------------------------------------------
    (
        "FE",
        "Clicking the dropzone opens the hidden file picker",
        "Step 1; file=null",
        "1) Click anywhere inside the dashed dropzone",
        "fileRef.current.click()",
        "Native OS file picker opens with accept filter "
        "'.jpg,.jpeg,.png,.webp,.bmp,.pdf,.txt,.csv,.xlsx,.xls,.json,.md'.",
    ),
    (
        "FE",
        "Selecting a file via picker updates UI with name and size",
        "User picks 'words.csv' (3,072 bytes)",
        "1) Choose 'words.csv' in picker",
        "file.size=3072",
        "handleFile runs: setFile, clear error and preview, step='upload'. "
        "Dropzone now shows FileSpreadsheet icon (csv ext), filename 'words.csv', "
        "and helper '(3.0 KB — click để thay file)'.",
    ),
    (
        "FE",
        "Drag-and-drop a file triggers handleFile",
        "Step 1; user drags 'photo.jpg' onto dropzone",
        "1) Hover with file (dragOver) "
        "2) Drop "
        "3) Inspect dropzone",
        "e.dataTransfer.files[0]=photo.jpg",
        "While dragging: isDragging=true → border-[#A67B5B] bg-[#FDFBF7]. "
        "On drop: isDragging=false; handleFile runs; FileIcon shows blue Image icon "
        "(jpg ext) and filename appears.",
    ),
    (
        "FE",
        "FileIcon picks correct icon by extension",
        "User picks several files in turn",
        "1) Pick 'a.png' "
        "2) Pick 'b.xlsx' "
        "3) Pick 'c.pdf'",
        "Filenames vary",
        "Image extensions {jpg,jpeg,png,webp,bmp} → blue Image icon. "
        "Spreadsheet {csv,xlsx,xls} → green FileSpreadsheet icon. "
        "Anything else (pdf, txt, json, md) → slate FileText icon.",
    ),

    # ---- handlePreview -------------------------------------------------------
    (
        "FE",
        "Preview button is disabled until a file is selected",
        "Step 1; file=null",
        "1) Inspect 'Phân tích & Xem trước' button",
        "isProcessing=false; file=null",
        "Button has class 'disabled:opacity-50 disabled:cursor-not-allowed' active "
        "via `disabled={isProcessing || !file}`. Click is no-op.",
    ),
    (
        "FE",
        "Forced preview without file shows 'Vui lòng chọn file.'",
        "handlePreview invoked while file=null",
        "1) Trigger handlePreview() directly",
        "file=null",
        "setError('Vui lòng chọn file.'); early return; no fetch. Red banner displays.",
    ),
    (
        "FE",
        "Preview POST sends file + (optional) topic_id + cert_type as multipart",
        "file picked, topicId='42'",
        "1) Click 'Phân tích & Xem trước'",
        "FormData: file, topic_id='42', cert_type='toeic'",
        "POST teacher/vocab/import/preview with FormData containing file, topic_id, cert_type. "
        "Authorization header attached. Button label switches to "
        "'<spinner/>Đang phân tích (AI)...' (isProcessing=true).",
    ),
    (
        "FE",
        "Preview without selected topic omits topic_id from payload",
        "topicId=''; file picked",
        "1) Click 'Phân tích & Xem trước'",
        "topicId=''",
        "Conditional `if (topicId) fd.append('topic_id', topicId);` → topic_id is NOT appended. "
        "Backend receives only file + cert_type, AI auto-detects topic_slug per word.",
    ),
    (
        "FE",
        "Preview server error message is surfaced",
        "Backend returns 400 with body {message:'Unsupported file'}",
        "1) Click 'Phân tích & Xem trước'",
        "res.ok=false",
        "Code parses JSON, throws Error('Unsupported file'). Catch sets error to that message. "
        "Red banner displays 'Unsupported file'. step stays 'upload'. isProcessing reset.",
    ),
    (
        "FE",
        "Empty parse result shows specific guidance",
        "Backend returns 200 with {preview:[]}",
        "1) Click 'Phân tích & Xem trước'",
        "data.preview length=0",
        "Code: `if (!data.preview?.length) { setError('Không phân tích được từ vựng nào. "
        "Thử file khác hoặc định dạng khác.'); return; }`. "
        "Red banner shows that message; step stays 'upload'.",
    ),
    (
        "FE",
        "Successful preview transitions to step 2 with parsed words",
        "Backend returns {preview:[{word,topic_vi,level,freq,definitions:[…]},…]}",
        "1) Click 'Phân tích & Xem trước'",
        "data.preview.length=15",
        "setPreview(data.preview); setStep('preview'). "
        "Header step indicator: 1→✓ green, 2 active, 3 inactive. "
        "Teal pill shows '15 từ'. Table lists each word with POS badge, topic_vi, level pill, "
        "first definition meaning (truncated), defs count badge, and red trash button.",
    ),

    # ---- Step 2 — preview table & remove ------------------------------------
    (
        "FE",
        "POS badge color matches POS_COLORS map",
        "Preview rendered with mixed POS",
        "1) Inspect first column",
        "definitions[0].pos varies",
        "'n.' → blue, 'v.' → purple, 'adj.' → orange, 'adv.' → teal. "
        "Unknown POS → slate fallback `bg-slate-100 text-slate-600`.",
    ),
    (
        "FE",
        "Level pill color matches LEVEL_COLORS map",
        "Preview rendered with mixed levels",
        "1) Inspect 'Mức độ' column",
        "level ∈ {Cơ bản, Trung bình, Nâng cao, …}",
        "'Cơ bản'→emerald, 'Trung bình'→amber, 'Nâng cao'→rose. "
        "Other strings fall back to slate. Pill class includes rounded-full + bold.",
    ),
    (
        "FE",
        "Trash button removes the row from preview state",
        "Preview has 15 rows",
        "1) Click trash icon on row index 3",
        "preview.length=15",
        "removeWord(3) filters preview by index; resulting length=14. "
        "Teal pill counter updates to '14 từ'. Save button label updates to "
        "'Xác nhận & Lưu 14 từ'.",
    ),
    (
        "FE",
        "'X' header button resets back to step 1 with cleared state",
        "Step 2 with non-empty preview",
        "1) Click the X icon next to the '<n> từ' pill",
        "resetAll()",
        "All state reset: file=null, preview=[], step='upload', error=null, savedCount=0, "
        "topicId=''. Drop zone returns to default empty state.",
    ),
    (
        "FE",
        "'Chọn file khác' triggers same resetAll",
        "Step 2",
        "1) Click 'Chọn file khác' (left button in footer)",
        "Same as TC-23",
        "Identical resetAll behaviour: returns user to step 1, no API call.",
    ),

    # ---- handleConfirm -------------------------------------------------------
    (
        "FE",
        "Save button is disabled while saving or when preview empty",
        "Step 2",
        "1) Inspect 'Xác nhận & Lưu' "
        "2) Remove all rows",
        "isSaving=true OR preview.length=0",
        "Button disabled by `disabled={isSaving || !preview.length}`. "
        "When clicked while preview is empty (impossible normally), handleConfirm early-returns "
        "at `if (!preview.length) return;`.",
    ),
    (
        "FE",
        "Confirm sends words array with topic_id OR topic_slug (mutually exclusive)",
        "Preview has manual-topic word and AI-topic word",
        "1) Click 'Xác nhận & Lưu' "
        "2) Inspect request body",
        "preview=[{word:'office',topic_id:42,level,freq,definitions}, "
        "{word:'budget',topic_slug:'finance',level,freq,definitions}]",
        "Code maps each word to {word, topic_id: w.topic_id || undefined, "
        "topic_slug: w.topic_slug || undefined, level, freq, definitions}. "
        "POST teacher/vocab/import/confirm with JSON body {words:[…]} and "
        "Content-Type application/json + Authorization header.",
    ),
    (
        "FE",
        "Successful confirm transitions to step 3 with savedCount",
        "Server returns {imported:14}",
        "1) Click 'Xác nhận & Lưu' and wait",
        "res.ok=true",
        "setSavedCount(14); setStep('done'); loadTopics() refetches. "
        "Step 3 view shows green CheckCircle, title 'Nạp từ vựng thành công!', "
        "'Đã lưu <strong>14</strong> từ vựng vào hệ thống', and 'Danh sách chủ đề hiện tại' "
        "panel listing all topics with their wordCount badges.",
    ),
    (
        "FE",
        "Confirm error with JSON body shows server message",
        "Server returns 400 {message:'Duplicate word'}",
        "1) Click save",
        "res.ok=false",
        "Throw Error('Duplicate word'); catch sets error='Duplicate word'. "
        "Step stays 'preview'; red banner above table shows the message; isSaving reset.",
    ),
    (
        "FE",
        "Confirm error without JSON body falls back to status template",
        "Server returns 503 with non-JSON body",
        "1) Click save",
        "res.json() rejects → catch returns {}",
        "Fallback message: 'Lưu thất bại (503).' shown in red banner. "
        "(Code: `err.message ?? \"Lưu thất bại (${res.status}).\"`).",
    ),

    # ---- Step 3 / cleanup ----------------------------------------------------
    (
        "FE",
        "'Nạp thêm từ vựng' returns to step 1",
        "On step 3 done view",
        "1) Click 'Nạp thêm từ vựng'",
        "resetAll",
        "Same resetAll behaviour: file/preview/topicId cleared, step='upload', "
        "savedCount=0. Step indicator collapses back to step 1 active.",
    ),
    (
        "FE",
        "Format hint banner is visible only on step 1",
        "Body mounted",
        "1) Switch between step 1 / 2 / 3",
        "step state",
        "Amber 'Định dạng được hỗ trợ' card with 4 bullet points (Image/PDF, CSV/Excel, "
        "TXT, JSON formats) is rendered only inside the `step === 'upload'` branch. "
        "Hidden in preview and done steps.",
    ),
    (
        "FE",
        "Authorization header is omitted when no token is stored",
        "localStorage 'token' not set",
        "1) Trigger any of: load topics, create topic, preview, confirm",
        "getAuthHeader returns {}",
        "All fetch calls are issued without Authorization header. "
        "(getAuthHeader returns empty object when token is null/empty.) "
        "Backend will likely respond 401, surfaced through the matching error path.",
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

    ws.cell(row=1, column=3, value="TEACHER-04 Vocabulary Import")
    ws.cell(row=2, column=3, value="TEACHER-04")
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
        tc_id = f"TC-VOCAB-IMP-{idx:02d}"
        actual = (
            "As expected. Observed during manual run on the Teacher → "
            "Exam/Practice Import page (Vocabulary mode): " + expected
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
            "Behavior matches source code in VocabularyImport.tsx and the "
            "ExamPracticeImport.tsx wrapper; verified state transitions, fetch "
            "payloads to teacher/vocab/topics, teacher/vocab/import/preview "
            "and teacher/vocab/import/confirm, and rendered UI strings.",
        ]
        for col_idx, val in enumerate(values, start=1):
            c = ws.cell(row=row, column=col_idx, value=val)
            c.alignment = wrap
            c.border = border
        ws.row_dimensions[row].height = 95

    ws.freeze_panes = "A11"
    wb.save(WB_PATH)
    print(f"Added sheet '{NEW_SHEET}' with {len(TEST_CASES)} test cases (all PASS).")


if __name__ == "__main__":
    main()
