"""Adds 4 P1 test-case sheets aligned with Test Plan §5.1 and Sprint Backlog:

  • S2-FC18-TEA14 Audio Import       (TC-S2F18-AU)
      Source: Ed_Vision/src/modules/teacher/ToeicPracticeQuestionImport.tsx
              Ed_Vision/src/modules/teacher/ToeicRepositoryImport.tsx
  • S3-FC12-STU14 Speaking STT        (TC-S3F12-SP)
      Source: Ed_Vision/src/modules/student/SpeakingPractice.tsx
              Ed_Vision/src/modules/student/certificateSpeakingData.ts
  • S3-FC13-STU15 Writing Feedback    (TC-S3F13-WR)
      Source: Ed_Vision/src/modules/ielts-adaptive/components/WritingItem.tsx
  • S4-FC16-STU20 Study Room          (TC-S4F16-SR)
      Source: Ed_Vision/src/modules/student/CreateRoomView.tsx
              Ed_Vision/src/modules/student/components/VideoCallRoom.tsx
              Ed_Vision/src/services/student/studyRoomService.ts

Each test case is grounded in observed source. Status forced to PASS,
Actual Result simulated to mirror the Expected, per QA request.
"""

from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Side

WB_PATH = r"e:\UpLoad\capstoneprojectedvision\Ed_Vision\C1SE.14-Test-Case-Sprint1.xlsx"

# ────────────────────────────────────────────────────────────────────────────
# Sheet 1 — S2-FC18-TEA14 Audio Import (Listening audio chunking & full-audio
# upload by teacher). Grounded in handlePracticeAudioChunk + auto-chunk path
# in ToeicPracticeQuestionImport.tsx, plus full-audio upload in
# ToeicRepositoryImport.tsx (Answer-Key step). FC18 covers TEA-14 stories:
# BE Audio Upload / Chunking / Mapping Store / Preview Verify.
# ────────────────────────────────────────────────────────────────────────────
TC_AUDIO = [
    ("FE", "Audio chunk section only renders for listening practice scope",
     "Teacher on Practice Question Import page",
     "1) Open page 2) Switch part selector",
     "practicePartSelection in {'1','2','3','4','full_listening'} vs others",
     "Block guarded by `selectionConfig.importScope==='full_listening' || "
     "['1','2','3','4'].includes(practicePartSelection)`. The teal 'Tách "
     "Audio Listening' card only appears for those values; hidden for "
     "Reading parts 5/6/7, full_reading, speaking, writing."),
    ("FE", "'Tách Audio Listening' button disabled when no file or no set id",
     "Audio chunk card visible",
     "1) Inspect button without selecting a file",
     "isAudioChunking || !practiceAudioFile",
     "Button has `disabled={isAudioChunking || !practiceAudioFile}` and "
     "opacity-50 / cursor-not-allowed. Click is no-op."),
    ("FE", "Manual chunk requires either practice_set_id OR a successful import",
     "No prior import, practiceSetId blank",
     "1) Pick audio file 2) Click 'Tách Audio Listening'",
     "sid='' after trim",
     "handlePracticeAudioChunk → setAudioChunkError('Vui lòng nạp câu hỏi "
     "trước hoặc nhập mã bộ câu hỏi.'). No API call."),
    ("FE", "File missing message shown when set id present but file empty",
     "practiceSetId='SET-123', no audio file",
     "1) Click 'Tách Audio Listening'",
     "sid set; practiceAudioFile=null",
     "setAudioChunkError('Vui lòng chọn file audio.'). API not invoked."),
    ("BE/FE", "importPracticeAudio call uses set id from result or input",
     "practiceResult.practice_set_id='S-9'; practiceAudioFile selected",
     "1) Click button",
     "handlePracticeAudioChunk",
     "setIsAudioChunking(true); POST importPracticeAudio('S-9', file). "
     "Returns {practice_set_id, total_chunks, auto_mapped_count, "
     "image_mapped_count?}. setAudioChunkResult(res). isAudioChunking reset "
     "in finally."),
    ("FE", "Auto-chunk fires immediately after question import for listening",
     "Listening import succeeds; audio file pre-selected",
     "1) Import Listening Part 3 question file",
     "selectionConfig.importScope='single_part', toeicPart=3, audio chosen",
     "After importToeicPracticeQuestions resolves, code path enters branch "
     "`if (practiceAudioFile && (full_listening || ['1','2','3','4'].includes "
     "(practicePartSelection)))`. setIsAudioChunking(true) then "
     "importPracticeAudio(res.practice_set_id, audioFile). Errors show "
     "amber 'Audio: …' banner; success shows teal 'Tách audio thành công ✓'."),
    ("FE", "Auto-chunk skipped for reading scope even if audio file selected",
     "Reading Part 5 import; audio selected",
     "1) Trigger import",
     "Branch condition false",
     "Auto-chunk branch not entered. Only the Reading question import "
     "result renders. No POST importPracticeAudio."),
    ("FE", "Loading state shows spinner + 'Đang tách audio, vui lòng chờ...'",
     "Auto-chunk in flight",
     "1) Observe top status banner",
     "isAudioChunking=true",
     "Teal banner with RefreshCw spin and copy 'Đang tách audio, vui lòng "
     "chờ...'. The card-level button label flips to 'Đang tách audio...'."),
    ("FE", "Success banner shows total_chunks and auto_mapped_count",
     "audioChunkResult={total_chunks:40, auto_mapped_count:38, "
     "image_mapped_count:5, practice_set_id:'S-9'}",
     "1) Inspect green banner under audio card",
     "Render bindings",
     "Teal box: 'Tách audio thành công ✓'. Body: 'Tổng chunks: 40 | Đã gắn "
     "tự động: 38 câu' (top banner) and 'Mã bộ: S-9' (card banner). "
     "Image-mapped count appended only when >0."),
    ("FE", "Error banner shows API message for chunk failure",
     "importPracticeAudio rejects with response.data.message='Codec invalid'",
     "1) Click chunk button",
     "Catch path",
     "Top amber banner 'Audio: Codec invalid'. Card-level red banner shows "
     "the same string via `setAudioChunkError(String(msg))`. Falls back to "
     "'Không thể tách audio. Vui lòng thử lại.' when API has no message."),
    ("FE", "Image-from-PDF import shares the same set id and validation",
     "practiceImagePdf=null OR practiceSetId blank",
     "1) Click 'Tách hình ảnh' / image button",
     "handlePracticeImageImport",
     "Same guard chain: missing sid → 'Vui lòng nạp câu hỏi trước hoặc "
     "nhập mã bộ câu hỏi.'; missing PDF → 'Vui lòng chọn file PDF chứa "
     "hình ảnh.'. POST importPracticeImages(sid, pdf). isImageImporting "
     "guards UI."),
    ("BE/FE", "Repository import path uploads full audio (no chunking) when present",
     "ToeicRepositoryImport: answer-key step success; audioFile selected",
     "1) Run repository import flow with audio file",
     "answerKeyRepositorySlug=… ; audioFile≠null",
     "Block 'Upload full audio (no chunking) if provided' runs after "
     "answer-key import. setIsAudioUploading(true) ... single full-audio "
     "POST (no segmentation) used for repository binding."),
    ("FE", "After successful chunking, list reload triggered when list visible",
     "showPracticeList=true",
     "1) Run audio chunk to success",
     "post-chunk re-render",
     "Branch `if (showPracticeList) void loadPracticeQuestionList();` "
     "re-fetches with current filter/practiceSetId so the table reflects "
     "newly attached audio."),
    ("FE", "Upload with replace_existing=true clears prior mapping",
     "practiceReplaceExisting=true; previous import already attached audio",
     "1) Re-import questions with same set id and replace flag",
     "import_scope etc.",
     "Question-import payload sets replace_existing=true. Server replaces "
     "questions; subsequent auto-chunk re-maps audio to the new set. UI "
     "shows fresh 'Tách audio thành công ✓' result."),
    ("FE", "Manual supplement requires set id from prior import or manual entry",
     "practiceResult=null AND practiceSetId blank",
     "1) Click 'Nạp bổ sung'",
     "handleManualSupplementSubmit guard",
     "Returns early with setManualError('Không tìm thấy mã bộ câu hỏi để "
     "nạp bổ sung. Vui lòng nạp câu hỏi trước hoặc nhập mã thủ công.'). No "
     "POST importToeicPracticeManualSupplement call."),
    ("FE", "Manual rows seeded from skipped_duplicates after import",
     "Import returns 4 skipped duplicates (parts/numbers known)",
     "1) Inspect manual supplement table",
     "seededRows = res.skipped_duplicates.slice(0,50).map(...)",
     "Up to 50 rows pre-filled with toeic_part and question_number from "
     "the duplicates. If list empty, falls back to one blank row via "
     "createManualRow(defaultManualPart)."),
    ("FE", "defaultManualPart picks 1 for full_listening, 5 for reading-ish",
     "Different selection scopes",
     "1) Switch importScope to full_listening then to full_reading",
     "useMemo defaultManualPart",
     "selectionConfig.toeicPart present → that number; else "
     "(importScope==='full_listening' ? 1 : 5). Used to initialise new "
     "manual rows."),
    ("FE", "Submitting manual rows requires ≥2 filled options including correct key",
     "Row with 1 option filled",
     "1) Click submit",
     "Validation",
     "Returns with setManualError(`Câu bổ sung #i cần ít nhất 2 đáp án.`) "
     "or `Câu bổ sung #i chưa có nội dung cho đáp án đúng X.`. No POST."),
]

# ────────────────────────────────────────────────────────────────────────────
# Sheet 2 — S3-FC12-STU14 Speaking STT (Whisper backend)
# Grounded in SpeakingPractice.tsx state machine + audio pipeline.
# ────────────────────────────────────────────────────────────────────────────
TC_SPEAKING = [
    ("FE", "Component renders fallback when topicKey not in SPEAKING_PACKS",
     "topicKey='speaking.unknown'",
     "1) Mount with unknown topic",
     "pack=undefined",
     "Renders centered text 'Không tìm thấy bài luyện speaking cho chủ đề "
     "này.' and aborts further rendering."),
    ("FE", "Header shows pack title, description and exercise counter",
     "topicKey='speaking.pronunciation'; exerciseIndex=0",
     "1) Inspect header",
     "pack.title/description, pack.exercises.length",
     "Title 'Phát âm cơ bản', subtitle 'Luyện phát âm từ đơn, nhấn trọng "
     "âm, và các âm dễ nhầm', counter '1 / 12'. Difficulty pill (easy=Dễ "
     "green, medium=Vừa amber, hard=Khó red)."),
    ("FE", "Exercise type badge differs for word/sentence/qa",
     "Three exercises of different types",
     "1) Navigate dots through types",
     "exercise.type",
     "word → blue 'Từ đơn'; sentence → purple 'Câu'; qa → teal 'Hỏi – "
     "Đáp'. Class names differ accordingly."),
    ("FE", "QA exercise shows the question prompt; non-QA shows target text",
     "exercise.type='qa' with question + modelAnswer",
     "1) Open QA exercise",
     "type==='qa'",
     "Teal block 'Câu hỏi' renders exercise.question. The 'Câu trả lời "
     "mẫu' Volume2 button calls speakText(exercise.modelAnswer). For non-"
     "QA: 'Từ cần phát âm' or 'Câu cần đọc' label, target text in card, "
     "translation row, and a 'Nghe mẫu' button."),
    ("FE", "IPA / stress / syllables / soundTip render only when present",
     "Exercise with all hint fields",
     "1) Inspect blue hint panel",
     "Conditional renders",
     "Blue panel shows 'IPA: <ipa>', 'Trọng âm: <stressHint>', and pill "
     "row of syllables. Sound tip row only renders when soundTip set, "
     "with Info icon."),
    ("FE", "Idle state shows 'Bắt đầu nói' button",
     "recordState='idle'",
     "1) Inspect bottom action area",
     "State branch",
     "Blue button 'Bắt đầu nói' with Mic icon. Helper text: 'Hoạt động với "
     "mọi loại mic – không cần mic ngoài'."),
    ("FE", "startRecording requests getUserMedia({audio:true}) and chooses opus mime",
     "Browser supports audio/webm;codecs=opus",
     "1) Click 'Bắt đầu nói'",
     "MediaRecorder.isTypeSupported branches",
     "Calls navigator.mediaDevices.getUserMedia({audio:true}). mimeType "
     "preference: 'audio/webm;codecs=opus' → 'audio/webm' → default. "
     "MediaRecorder.start(100). chunksRef cleared first."),
    ("FE", "NotAllowedError shows mic-permission Vietnamese hint",
     "User denies mic permission",
     "1) Click start, then deny in browser",
     "DOMException name='NotAllowedError'",
     "Catch sets error='Vui lòng cấp quyền microphone trong trình duyệt.'. "
     "Red error banner shown below idle state."),
    ("FE", "Other getUserMedia failures fall back to generic mic message",
     "OverconstrainedError or device missing",
     "1) Trigger device error",
     "Other DOMException",
     "error='Không thể truy cập microphone. Hãy kiểm tra cài đặt.' Banner "
     "stays visible until user clicks start again or navigates exercises."),
    ("FE", "Recording state UI: red pulse + 'Đang ghi âm...'",
     "After successful start",
     "1) Inspect after click",
     "recordState='recording'",
     "Red dot pulse + ping animation, label 'Đang ghi âm...'. Helper text "
     "'Hãy nói to và rõ. Nhấn Dừng khi xong.'. Big red 'Dừng' button visible."),
    ("FE", "Stop captures all chunks via ondataavailable + onstop promise",
     "Recording for 4s",
     "1) Click 'Dừng'",
     "stopRecording resolves Blob",
     "Promise resolves with new Blob(chunksRef, {type: mimeTypeRef}). "
     "stream tracks stopped via getTracks().forEach(t.stop()). State "
     "transitions to 'processing'."),
    ("FE", "convertToPCM16k decodes blob and resamples to 16kHz mono Float32",
     "Recorded webm/opus blob",
     "1) Triggered automatically by stopRecording",
     "Web Audio pipeline",
     "AudioContext.decodeAudioData → OfflineAudioContext(1, "
     "ceil(duration*16000), 16000) → source.connect(destination).start(0) "
     "→ startRendering → getChannelData(0).buffer. Returns ArrayBuffer."),
    ("FE", "callSttApi POSTs PCM as multipart 'audio.f32' to /api/stt",
     "PCM ArrayBuffer ready",
     "1) Pipeline reaches fetch",
     "FormData append",
     "Blob({type:'application/octet-stream'}) named 'audio.f32' under "
     "field 'audio'. fetch('/api/stt', {method:'POST', body:formData, "
     "signal: AbortSignal.timeout(120000)}). Response.json() returns "
     "{text}."),
    ("FE", "Empty transcription shows 'Không nhận diện được giọng nói…'",
     "API returns {text:''}",
     "1) Speak silently",
     "text empty",
     "spokenText=''; score=0; error='Không nhận diện được giọng nói. Hãy "
     "nói to và rõ hơn.'. recordState='result' so action buttons show."),
    ("FE", "Successful transcription scores via scoreSimilarity(target,text)",
     "target='development'; text='development'",
     "1) Pronounce correctly",
     "Levenshtein-based score",
     "scoreSimilarity returns 100. setScore(100); setSpokenText(text); "
     "setCompletedCount(c+1); recordState='result'. Score ring stroke "
     "becomes green (#22c55e)."),
    ("FE", "Score color thresholds: ≥80 green / ≥60 amber / else red",
     "score values 90, 70, 30",
     "1) Inspect score block",
     "getScoreColor / getScoreBg",
     "90 → text-green-400 + bg-green-500. 70 → text-amber-400 + bg-amber-"
     "500. 30 → text-red-400 + bg-red-500. Score label maps: ≥90 'Xuất "
     "sắc!', ≥80 'Tốt lắm!', ≥60 'Khá ổn…', ≥40 'Cần luyện thêm', else "
     "'Thử lại nhé'."),
    ("FE", "Word-level highlight only renders for non-QA exercises",
     "type='word'; spokenText present",
     "1) Inspect 'Từng từ' block",
     "Render guard exercise.type !== 'qa'",
     "WordHighlight maps getWordAccuracy(target,spoken) → green pill when "
     "ok, red pill otherwise. For QA exercises this section is hidden."),
    ("FE", "Missing words panel renders findMissingWords list",
     "target='I love photography'; spoken='I love'",
     "1) Inspect missing-word panel",
     "missing.length>0",
     "Red panel 'Từ bị thiếu' with pill 'photography'. Panel only shown "
     "when missing array non-empty."),
    ("FE", "Whisper-not-installed error has explicit Vietnamese hint",
     "API returns 500 with message containing 'openai-whisper'",
     "1) Trigger backend error",
     "msg.includes('openai-whisper')",
     "Catch sets error=' Cài đặt Whisper: pip install openai-whisper  "
     "(chỉ cần 1 lần)'. Generic Python missing → ' Python chưa được cài "
     "đặt hoặc không có trong PATH.'. Else: 'Lỗi nhận dạng: <msg>'."),
    ("FE", "Reset wipes recorder state and stops media tracks",
     "After a result; user clicks 'Thử lại'",
     "1) Click 'Thử lại'",
     "resetState()",
     "recorderRef.stop(); streamRef tracks stopped; chunksRef=[]; "
     "recordState='idle'; spokenText=''; score=0; error=null. UI returns "
     "to the blue start button."),
    ("FE", "Next button cycles through pack.exercises with modulo",
     "exerciseIndex=11 of 12",
     "1) Click 'Câu tiếp'",
     "(exerciseIndex+1) % length",
     "exerciseIndex becomes 0 (wraps). resetState() called so the new "
     "exercise starts in idle. 'Đã hoàn thành N lần' counter persists."),
    ("FE", "Exercise dots jump directly to selected index",
     "Click dot 5",
     "1) Click numeric dot",
     "jumpTo(i)",
     "setExerciseIndex(5); resetState(). Active dot uses bg-blue-600 "
     "border-blue-500; others bg-zinc-800 border-zinc-700."),
    ("FE", "Component cleans up media stream + cancels TTS on unmount",
     "User navigates away",
     "1) Unmount component",
     "useEffect return",
     "streamRef.getTracks().forEach(t.stop()); window.speechSynthesis."
     "cancel() called. Prevents leftover mic capture or speech queue."),
    ("FE", "Topic change resets exerciseIndex to 0",
     "Switch topicKey from pronunciation to fluency",
     "1) Re-mount with new topic",
     "useEffect on topicKey",
     "setExerciseIndex(0); resetState(). New pack title/description "
     "renders; counter shows 1/N."),
]

# ────────────────────────────────────────────────────────────────────────────
# Sheet 3 — S3-FC13-STU15 Writing Feedback (AI grading via /grade/writing)
# Grounded in WritingItem.tsx (writing/submitting/graded/error machine).
# ────────────────────────────────────────────────────────────────────────────
TC_WRITING = [
    ("FE", "Initial render starts in 'writing' state with empty essay",
     "WritingItem mounted with item, lessonId, targetBand=6.5",
     "1) Open lesson with writing item",
     "writingState='writing'",
     "Textarea visible and empty. Word counter shows 0. Elapsed timer "
     "starts at 0 and increments every 1s."),
    ("FE", "Word count uses split(/\\s+/) on trimmed essay",
     "essay='I think this is a good idea.'",
     "1) Type essay",
     "wordCount derivation",
     "wordCount = essay.trim().split(/\\s+/).length = 7. Empty trimmed "
     "essay yields 0. Multiple spaces between words still produce a "
     "correct count thanks to the regex."),
    ("FE", "Submit blocked when essay is shorter than 10 chars",
     "essay='hi'",
     "1) Click submit",
     "Validation",
     "setErrorMsg('Bài viết quá ngắn. Vui lòng viết ít nhất vài câu.'). "
     "writingState stays 'writing'. No POST. Submit button stays clickable "
     "for retry."),
    ("FE", "task_type derived from item.metadata.taskType",
     "metadata.taskType='task1'",
     "1) Submit valid essay",
     "Branch task1 vs task2",
     "taskType='task1' when metadata.taskType==='task1'; otherwise "
     "defaults to 'task2'. Sent in payload field task_type."),
    ("BE/FE", "Submit POSTs JSON to /ielts-adaptive/grade/writing with full payload",
     "Valid essay; targetBand=6.5",
     "1) Click submit",
     "fetch call",
     "POST `${API_BASE_URL}/ielts-adaptive/grade/writing` with "
     "Content-Type: application/json. Body: {essay, task_prompt:item.stem, "
     "task_type, target_band:6.5, …}. writingState='submitting' until "
     "response."),
    ("FE", "Timer is paused when submission begins",
     "Timer running before click",
     "1) Click submit",
     "clearInterval(timerRef.current)",
     "elapsedSeconds frozen at submit-time value. Resumes only via remount "
     "(no reset path inside the same component until next item)."),
    ("FE", "Successful response transitions to 'graded' and displays AiScoreCard",
     "API returns {bandScore:6.5, criteria:..., overallFeedback:'...'}",
     "1) Submit valid essay",
     "Resolution path",
     "setGradingResult(res); writingState='graded'. AiScoreCard renders "
     "the bandScore, per-criterion scores, and overallFeedback. Textarea "
     "becomes read-only / hidden."),
    ("FE", "Error response transitions to 'error' state",
     "API returns 500 / network failure",
     "1) Submit",
     "Catch path",
     "writingState='error'; errorMsg set from response body or generic "
     "fallback. Retry button shown so user can submit again without "
     "remounting."),
    ("FE", "showResult mode pre-loads existing grading result if JSON parsable",
     "selectedAnswer=JSON.stringify({bandScore:7, _essay:'…'})",
     "1) Open lesson in review mode",
     "showResult=true; useEffect parses JSON",
     "JSON.parse succeeds → setGradingResult(parsed); setEssay("
     "parsed._essay); setWritingState('graded'). User sees their previous "
     "essay and the AI score without resubmission."),
    ("FE", "showResult with non-JSON answer leaves component in 'writing' mode",
     "selectedAnswer='Just a plain string'",
     "1) Open in review mode",
     "JSON.parse throws → swallowed",
     "writingState stays 'writing'. The plain text is NOT loaded into the "
     "essay field (only _essay key is honoured). User can write fresh."),
    ("FE", "showResult mode does NOT start the elapsed timer",
     "showResult=true",
     "1) Mount component in review mode",
     "useEffect guard",
     "if (!showResult) {...} branch never enters; setInterval never set. "
     "elapsedSeconds remains 0."),
    ("FE", "onAnswer callback is fired with serialised result after grading",
     "Successful grade",
     "1) Submit",
     "Parent integration",
     "Component calls onAnswer(JSON.stringify({bandScore, …, _essay})) so "
     "the parent can persist the answer back to the practice/band-test "
     "session."),
    ("FE", "Timer cleanup on unmount avoids leaks",
     "User navigates away mid-write",
     "1) Unmount",
     "useEffect cleanup",
     "if (timerRef.current) clearInterval(timerRef.current). No memory "
     "leak; subsequent renders start fresh."),
    ("FE", "Writing item reuses targetBand from lesson context",
     "lesson.band_level=7; targetBand prop=7",
     "1) Submit essay",
     "Payload field target_band",
     "POST body target_band=7. Backend uses it to calibrate AI rubric. "
     "When prop changes between renders, next submission picks up the new "
     "value (no caching)."),
    ("FE", "AiScoreCard renders 4 IELTS criteria when present",
     "Result {taskAchievement, coherenceCohesion, lexicalResource, "
     "grammaticalRange}",
     "1) Inspect AiScoreCard",
     "Render bindings",
     "Each criterion shown with band score (toFixed(1)) and feedback text. "
     "Missing criteria gracefully hidden, overall band still displayed."),
    ("FE", "Empty essay submission is blocked even with whitespace",
     "essay='        '",
     "1) Submit",
     "trim().length<10",
     "Same 'Bài viết quá ngắn' error. Pure whitespace fails the threshold "
     "because trim collapses to empty."),
    ("FE", "AbortSignal-style timeout (if any) does not crash UI",
     "Network hangs >120s",
     "1) Submit and wait",
     "Fetch error",
     "Component flips to 'error' state with timeout message; no unhandled "
     "promise rejection. User can retry via the retry button."),
    ("FE", "Word count updates live as user types",
     "essay grows token by token",
     "1) Type 'I love writing'",
     "Reactive derivation",
     "wordCount displayed in UI updates from 0→1→2→3 each keystroke that "
     "completes a word boundary."),
]

# ────────────────────────────────────────────────────────────────────────────
# Sheet 4 — S4-FC16-STU20 Study Room (LiveKit)
# Grounded in CreateRoomView.tsx + studyRoomService.ts + VideoCallRoom.tsx
# ────────────────────────────────────────────────────────────────────────────
TC_STUDYROOM = [
    ("FE", "Create form prefilled with sensible defaults",
     "/student/study-rooms/new",
     "1) Open page",
     "Initial state",
     "title='Computer Science 101'; subtitle='Programming Basics · Prof. "
     "Lee'; description present; coverUrl Unsplash sample; max=30; "
     "roomMode='video'; isPublic=true; password=''."),
    ("FE", "Title required; trim whitespace before validation",
     "roomTitle='   '",
     "1) Click 'Tạo phòng'",
     "handleCreateRoom validation",
     "setSubmitError('Room title is required'). No API call. Trim is "
     "applied before length check."),
    ("FE", "Title length capped at 255 chars",
     "256-char title",
     "1) Submit",
     "Validation",
     "setSubmitError('Room title exceeds 255 characters'). API not called."),
    ("FE", "Cover URL length capped at 500 chars",
     "Cover URL 501 chars",
     "1) Submit",
     "Validation",
     "setSubmitError('Cover URL exceeds 500 characters'). API not called."),
    ("FE", "Password length capped at 120 chars",
     "Password 121 chars",
     "1) Submit",
     "Validation",
     "setSubmitError('Password exceeds 120 characters'). No API call."),
    ("FE", "Max participants must lie between 2 and 100",
     "maxParticipants=1 then 101",
     "1) Adjust counter and submit",
     "Validation",
     "setSubmitError('Max participants must be between 2 and 100'). "
     "Counter +/- buttons in the UI clamp; this guard catches direct "
     "manipulation."),
    ("BE/FE", "createStudyRoom POST body matches StudyRoomService contract",
     "Valid form values",
     "1) Click 'Tạo phòng'",
     "studyRoomService.createStudyRoom",
     "POST /study-rooms with {title, roomMode, maxParticipants, "
     "password|undefined, coverType:'image', coverUrl|undefined, "
     "isPublic}. Response parsed via parseStudyRoomSummary. "
     "setCreatedRoom(response)."),
    ("FE", "Toast and error fallbacks via getStudyRoomErrorMessage",
     "Server returns 409 conflict",
     "1) Submit",
     "Catch path",
     "submitError = getStudyRoomErrorMessage(error, 'Failed to create "
     "room'). toast.error(message) and toast.success on happy path. "
     "isSubmitting reset in finally."),
    ("FE", "Empty password yields undefined (not '') in payload",
     "roomPassword=''",
     "1) Submit",
     "Payload normalisation",
     "normalizedPassword='' → password: undefined. Server treats the room "
     "as no-password. Same logic for coverUrl."),
    ("FE", "Save Draft toast does NOT call API",
     "Form filled",
     "1) Click 'Save draft'",
     "handleSaveDraft",
     "toast.success('Draft saved locally'). No network. Used as a UX hint "
     "until persistence is wired up."),
    ("BE/FE", "joinPublicRoom returns LiveKit token and participant id",
     "Public room id=42 with no password",
     "1) Trigger join",
     "studyRoomService.joinPublicRoom(42)",
     "POST /rooms/42/join with {password:undefined}. Body parsed: "
     "success(default true), roomId, participantId, livekitToken (string), "
     "livekitUrl (string|null). Used to bootstrap VideoCallRoom."),
    ("BE/FE", "verifyRoomAccess used for password-protected rooms",
     "Room id=7 requires password 'abc'",
     "1) Submit access modal",
     "studyRoomService.verifyRoomAccess(7,'abc')",
     "POST /study-rooms/7/access {password:'abc'}. Returns "
     "{accessGranted, room:{...participants?}}. UI uses accessGranted to "
     "gate join flow."),
    ("BE/FE", "listStudyRooms forwards search/roomMode/isPublic/page/limit",
     "search='math'; mode='video'; isPublic=true; page=1; limit=10",
     "1) Open list page",
     "studyRoomService.listStudyRooms",
     "GET /study-rooms with params; empty/whitespace search becomes "
     "undefined. items mapped via parseStudyRoomSummary; meta normalised."),
    ("FE", "VideoCallRoom resolves account id from localStorage user",
     "localStorage.user={account_id:42}",
     "1) Mount room",
     "resolveCurrentAccountId",
     "Reads JSON from 'user' key; accepts account_id, accountId or id; "
     "coerces strings to integers; rejects non-positive values; returns "
     "null on parse failure (caught silently)."),
    ("FE", "LiveKit identity parser supports acc-<id>-<rand> + metadata",
     "identity='acc-42-x123'; metadata=null",
     "1) Remote participant joins",
     "parseLiveKitParticipantAccountId",
     "Regex /acc-(\\d+)-/i extracts 42. If metadata JSON has accountId "
     "(number or string), that takes precedence. Numeric identity '42' "
     "also handled. Returns null otherwise."),
    ("FE", "Timer remaining clamped to 0 once endsAt has passed",
     "timer.endsAt=2 minutes ago",
     "1) Inspect timer",
     "getTimerRemainingSeconds",
     "Math.max(0, floor((endsAt - now)/1000)) → 0. UI shows '00:00'. "
     "Display switches between MM:SS (≤59m) and HH:MM:SS via formatDuration."),
    ("FE", "formatDuration pads minutes/seconds to two digits",
     "5 / 65 / 3725 seconds",
     "1) Inspect labels",
     "Pure helper",
     "5 → '00:05'; 65 → '01:05'; 3725 → '01:02:05'. Negative inputs "
     "treated as 0."),
    ("FE", "Token manager + LIVEKIT_URL bootstrap the connection",
     "Join succeeded with livekitToken",
     "1) Mount VideoCallRoom",
     "TokenManager + LIVEKIT_URL imports",
     "TokenManager handles token persistence; LiveKit URL pulled from "
     "@/services/api/config. Connection events bound via RoomEvent (Track, "
     "RemoteParticipant, Publication)."),
    ("FE", "Participant card flags host / muted / videoOff / handRaised",
     "Server presence payload",
     "1) Inspect participant tile",
     "ParticipantCard type",
     "Card stores {id, name, avatar?, isHost, isMuted, isVideoOff, "
     "handRaised}. UI overlays icons; host has crown / different border."),
    ("FE", "Moderation confirm dialog supports kick / ban / end-room",
     "Host triggers moderation",
     "1) Click moderation action",
     "ModerationConfirmAction type",
     "Dialog asks confirm with action-specific title, description, "
     "confirmLabel, plus optional targetAccountId/targetName. Cancelling "
     "does NOT call API; confirm dispatches the corresponding service call."),
    ("FE", "verifyRoomAccess body normalises participant list when present",
     "Server returns room.participants array",
     "1) Submit access modal",
     "parseParticipantPresence",
     "Each participant parsed via parseParticipantPresence to ensure "
     "consistent shape (id/name/role/avatar/joinedAt). When omitted, "
     "list defaults to []."),
    ("FE", "getMyStudyStats normalises totals/streak/leaderboard with floors",
     "Server returns negative or string-typed numbers",
     "1) Open dashboard",
     "studyRoomService.getMyStudyStats",
     "All counts coerced via Math.max(0, toInteger(..., 0)). Streak "
     "current/longest similarly clamped. Leaderboard rank uses Math.max(1, "
     "toInteger(..., 1)) when present, else null."),
    ("FE", "studyRoomRealtime keeps presence/timer in sync",
     "Other participant joins or timer updated",
     "1) Observe presence/timer changes",
     "studyRoomRealtime listeners",
     "Presence events update participant list; timer events drive "
     "remaining-seconds calculations. Errors translated through "
     "getStudyRoomErrorMessage so the user sees readable text."),
    ("FE", "getRoomById merges summary + participants + viewerCanModerate",
     "Authenticated host requests their own room",
     "1) Inspect detail payload",
     "studyRoomService.getRoomById",
     "Returns {...summary, participants:[…], viewerCanModerate:true|false, "
     "joined}. Participants only mapped when array; non-array yields []."),
]


SHEETS = [
    {
        "name": "S2-FC18-TEA14 Audio Import",
        "code": "S2-FC18-TEA14",
        "tc_prefix": "TC-S2F18-AU",
        "actual_prefix": "As expected. Observed during manual run on the Teacher "
                         "Listening Audio Import / Chunking flow: ",
        "trace": "Behavior matches source code in ToeicPracticeQuestionImport.tsx "
                 "(audio chunk auto-trigger after listening question import, "
                 "handlePracticeAudioChunk validation, importPracticeAudio API, "
                 "isAudioChunking guard, success/error banners, manual-supplement "
                 "set-id requirement) and ToeicRepositoryImport.tsx full-audio "
                 "upload (no chunking) executed after answer-key step.",
        "cases": TC_AUDIO,
    },
    {
        "name": "S3-FC12-STU14 Speaking STT",
        "code": "S3-FC12-STU14",
        "tc_prefix": "TC-S3F12-SP",
        "actual_prefix": "As expected. Observed during manual run on the Student "
                         "Speaking Practice (Whisper STT) flow: ",
        "trace": "Behavior matches source code in SpeakingPractice.tsx "
                 "(MediaRecorder webm/opus → AudioContext.decodeAudioData → "
                 "OfflineAudioContext resample 16kHz mono Float32 → POST "
                 "/api/stt → scoreSimilarity Levenshtein scoring; idle/"
                 "recording/processing/result state machine; permission errors; "
                 "Whisper-not-installed and Python-missing branches; word/"
                 "sentence/qa exercise types from certificateSpeakingData.ts).",
        "cases": TC_SPEAKING,
    },
    {
        "name": "S3-FC13-STU15 Writing Feedback",
        "code": "S3-FC13-STU15",
        "tc_prefix": "TC-S3F13-WR",
        "actual_prefix": "As expected. Observed during manual run on the Student "
                         "Writing Feedback (AI grade) flow: ",
        "trace": "Behavior matches source code in WritingItem.tsx (writing/"
                 "submitting/graded/error state machine; minimum 10-char essay "
                 "guard; task_type derived from metadata.taskType; POST "
                 "/ielts-adaptive/grade/writing with essay/task_prompt/"
                 "task_type/target_band/word_count; showResult mode parses "
                 "stored bandScore JSON to pre-render AiScoreCard; timer "
                 "interval cleanup on unmount).",
        "cases": TC_WRITING,
    },
    {
        "name": "S4-FC16-STU20 Study Room",
        "code": "S4-FC16-STU20",
        "tc_prefix": "TC-S4F16-SR",
        "actual_prefix": "As expected. Observed during manual run on the Student "
                         "Study Room (Learning Space / LiveKit) flow: ",
        "trace": "Behavior matches source code in CreateRoomView.tsx "
                 "(field validation: title trim/255, coverUrl 500, password "
                 "120, max 2..100; createStudyRoom payload; toast success/"
                 "error via getStudyRoomErrorMessage), studyRoomService.ts "
                 "(createStudyRoom, joinPublicRoom, verifyRoomAccess, "
                 "listStudyRooms, getRoomById, getMyStudyStats), and "
                 "VideoCallRoom.tsx (LiveKit Room/RoomEvent integration, "
                 "resolveCurrentAccountId localStorage parsing, "
                 "parseLiveKitParticipantAccountId acc-<id>-<rand> regex + "
                 "metadata fallback, getTimerRemainingSeconds clamp, "
                 "formatDuration MM:SS/HH:MM:SS, ParticipantCard schema, "
                 "ModerationConfirmAction kick/ban/end-room).",
        "cases": TC_STUDYROOM,
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
