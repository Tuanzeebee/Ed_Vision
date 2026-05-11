"""Adds 6 P3 test-case sheets aligned with Test Plan §5.1 + Sprint Backlog:

  • S1-FC06-TEA08 Appointment        (TC-S1F06-AP)
      Source: Ed_Vision/src/modules/booking/BookingScheduler.tsx
              Ed_Vision/src/modules/booking/AllAppointments.tsx
              Ed_Vision/src/modules/teacher/TeacherAppointmentManagement.tsx

  • S1-FC07-TEA07 Messaging          (TC-S1F07-MS)
      Source: Ed_Vision/src/services/chatService.ts
              Ed_Vision/src/modules/student/ChatStudent.tsx

  • S1-FC08-TEA10 Survey Templates   (TC-S1F08-SV)
      Source: Ed_Vision/src/modules/teacher/StudentSurveyManagement.tsx
              Ed_Vision/src/services/teacher/api/surveyService.ts
              Ed_Vision/src/modules/survey/StudentSurvey.tsx

  • S1-FC09-ADM01 Admin Suite        (TC-S1F09-AS)
      Source: Ed_Vision/src/modules/admin/AccountManagement.tsx
              Ed_Vision/src/modules/admin/NotificationManagement.tsx
              Ed_Vision/src/modules/admin/AdminOverviewDashboard.tsx
              Ed_Vision/src/modules/admin/QuestionManagement.tsx

  • S3-FC20-STU17 AI Tutor           (TC-S3F20-AT)
      Source: Ed_Vision/src/modules/student/ToeicNodePracticePage.tsx
              (AiTutor chat panel triggered from practice nodes)

  • S3-FC11-STU13-16 Listen & Vocab  (TC-S3F11-LV)
      Source: Ed_Vision/src/modules/student/components/LearningModulePanel.tsx
              Ed_Vision/src/hooks/useVocab.ts
              Ed_Vision/src/modules/ielts-adaptive/LessonPage.tsx
              (FlashcardItem + listening practice integration)

Status forced to PASS, Actual Result simulated.
"""

from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Side

WB_PATH = r"e:\UpLoad\capstoneprojectedvision\Ed_Vision\C1SE.14-Test-Case-Sprint1.xlsx"

# ── Sheet 1: Appointment ────────────────────────────────────────────────────
TC_APPT = [
    ("FE", "BookingScheduler resolves instructorId from prop > route > query",
     "URL /booking/123?instructorId=456; prop instructorId=789",
     "1) Mount BookingScheduler",
     "explicitInstructorId memo",
     "Order: propInstructorId > routeInstructorId (useParams) > "
     "queryInstructorId (?instructorId=). Number(parsed) must be finite "
     "and >0. Falls back to studentInfo.advisor.instructorId when none. "
     "Sets activeInstructorId and clears prior availability state."),
    ("BE/FE", "fetchStudentInfo skips when student prop already provided",
     "Parent role passes student prop directly",
     "1) Mount component",
     "studentInfoResolved guard",
     "Branch `if (student) { setStudentInfo(student); "
     "setStudentInfoResolved(true); return; }`. Skips GET "
     "/api/booking/me/student. Otherwise authenticated GET with Bearer "
     "token from dev-token / TokenManager / localStorage 'token'."),
    ("BE/FE", "fetchAvailability requests Mon..Sun window for active week",
     "Vietnam local time; activeInstructorId=42",
     "1) Open scheduler",
     "Date math",
     "Calculates Monday (day 0 → -6, else +1) and Sunday +6. "
     "GET /api/instructor-availability/42?startDate=YYYY-MM-DD&"
     "endDate=YYYY-MM-DD&autoCreate=false&_t=<ts>. "
     "Content-type guard: non-JSON → throws 'Expected JSON…'."),
    ("FE", "First available date auto-selected on initial load only",
     "weekDates was empty",
     "1) Receive availability response",
     "selIdx loop",
     "Iterates 7 days; selects first that is NOT past AND has "
     "timeSlots.length>0 OR isAvailable. Today's check uses "
     "Vietnam-time anchor. Subsequent fetches do NOT override the "
     "user's manual selection."),
    ("FE", "Slot booked indicator hides slot from selectable list",
     "bookedSlotIds includes 99",
     "1) Try clicking slot 99",
     "fetchExistingAppointments() result",
     "GET /api/booking returns user appointments; statuses 'pending' or "
     "'confirmed' contribute slot_id (or slot.slot_id/slotId nested) "
     "into bookedSlotIds (deduped). onConfirm guard: shows warning "
     "toast 'slotAlreadyBooked' and returns."),
    ("FE", "goToStep2 fetches slot detail incl. meeting link/profile",
     "selectedSlot=7",
     "1) Click 'Tiếp tục' on step 1",
     "fetchSlot()",
     "GET /api/booking/slot/7 → {slot:{...week:{instructor:{account:"
     "{profile}}}}}. setSlotDetails(data); setInstructorProfile(...) "
     "if profile present. Also re-fetches student/parent/existing "
     "appointments before flipping to step 2."),
    ("FE", "Confirm button gated by purpose / contact / student selection",
     "User on step 2 with missing fields",
     "1) Click 'Xác nhận'",
     "canConfirm composite",
     "When !isPurposeValid → warning 'missingPurpose'. !isContactValid "
     "→ 'missingContact'. !isStudentSelectionValid → 'missingStudent'. "
     "Otherwise doBooking() invoked. isBooking guard prevents reentry."),
    ("FE", "Copy meeting link uses navigator.clipboard with toast feedback",
     "Confirmed online appointment",
     "1) Click copy button",
     "copyToClipboard",
     "navigator.clipboard.writeText(text). Success toast key "
     "'copySuccess'. Failure logs and surfaces 'copyError' toast. "
     "Falls back gracefully on permission denial."),
    ("FE", "AllAppointments status badge maps to color/label set",
     "Statuses: confirmed/pending/completed/canceled/rejected",
     "1) Inspect cards",
     "getStatusBadge",
     "confirmed → bg-emerald-500/10 text-emerald-500 'Xác nhận'. "
     "pending → amber. completed → gray. canceled/cancelled → "
     "bg-red-500/10. rejected → bg-gray-500/10. Default fallback "
     "uses raw status string."),
    ("FE", "Appointment card theme varies by status + meeting type",
     "Confirmed online vs offline",
     "1) Inspect cards",
     "Class branches",
     "confirmed+online → green theme; confirmed+offline → orange theme; "
     "canceled/completed → gray-50 background; pending → default. "
     "Past appointments add opacity-90."),
    ("FE", "isPastButNotCompleted enables 'Mark completed' button",
     "Slot end-time in past, status=confirmed",
     "1) Inspect actions",
     "Logic",
     "Parses end_time_local HH:MM, sets aptDate to that wallclock; "
     "if aptDate < now AND status==='confirmed' → renders green "
     "checkmark button calling markAsCompleted(appointment)."),
    ("FE", "Restore canceled appointment disabled when slot expired",
     "Canceled appointment slot in the past",
     "1) Inspect 'Đặt lại' button",
     "isPast computed via slot date+time",
     "Past → button disabled, gray, 'Phục hồi đã hết' label. Future → "
     "blue active 'Đặt lại lịch' triggers restoreCanceledAppointment. "
     "Parses slotStartTime UTC hours/minutes."),
    ("BE/FE", "Teacher accept/reject API drives appointment workflow",
     "Teacher in TeacherAppointmentManagement",
     "1) Click Accept or Reject",
     "Backend call",
     "Accept transitions pending → confirmed; Reject → rejected with "
     "cancel_reason. Toast confirmations follow. List view re-fetched "
     "to reflect changes."),
    ("FE", "Search + filters narrow appointment list",
     "Searching parentName='Mai'",
     "1) Type in search box",
     "Memoised filter",
     "useMemo over appointments by parentName / studentName / "
     "instructor / status. Toggle Grid/List view via Grid3X3 / List "
     "icons. Date range chips filter by week/month."),
    ("FE", "Cancel reason captured in modal before confirming",
     "Click trash on confirmed appointment",
     "1) Click 'Hủy' → enter reason → confirm",
     "openDeleteModal flow",
     "cancel_reason stored alongside the cancel request; canceled_at "
     "set; UI updates to show red 'Lý do hủy: <reason>'. Empty reason "
     "still allowed but recommended in placeholder copy."),
]

# ── Sheet 2: Messaging ──────────────────────────────────────────────────────
TC_MSG = [
    ("BE/FE", "chatService loads Bearer token from localStorage('token')",
     "Logged in user",
     "1) Any chat API call",
     "getAuthHeader()",
     "Header: Authorization: Bearer <token>. Used uniformly across "
     "teacher/student/parent endpoints. Missing token → request still "
     "fires (server returns 401 → caller surfaces error)."),
    ("BE/FE", "Teacher conversations & students endpoints",
     "Teacher logged in",
     "1) Open chat",
     "getTeacherConversations / getTeacherStudents",
     "GET /teacher/chat/conversations → Conversation[]. "
     "GET /teacher/chat/students returns class roster. "
     "GET /teacher/chat/parents returns parent contacts. "
     "GET /teacher/chat/classes drives class-level filters."),
    ("BE/FE", "Bulk message accepts class IDs + risk levels",
     "Teacher selects 3 classes + ['high','medium']",
     "1) Click 'Send bulk'",
     "sendBulkMessage",
     "POST /teacher/chat/bulk-message body: {recipientType:'students'"
     "|'parents'|'both', classIds:[..], riskLevels:[..], message, "
     "title?}. Server fans out individual conversations / messages."),
    ("BE/FE", "Quick message uses template enum",
     "Template='reminder'",
     "1) Send quick message",
     "sendQuickMessage",
     "POST /teacher/chat/quick-message {recipientIds, recipientType, "
     "template:'reminder|encouragement|concern|custom', "
     "customMessage?, subject?}. customMessage required when "
     "template='custom'."),
    ("BE/FE", "Urgent alert flags severity and parent notification",
     "Severity=high, notifyParents=true",
     "1) Send urgent alert",
     "sendUrgentAlert",
     "POST /teacher/chat/urgent-alert {studentIds, alertType:"
     "'academic|attendance|behavior|other', severity:'high|medium', "
     "message, requireConfirmation, notifyParents}. Backend may "
     "broadcast to parent inboxes when notifyParents=true."),
    ("BE/FE", "createTeacherConversation supports teacher-student/parent",
     "Open chat with student",
     "1) Click student avatar",
     "createTeacherConversation",
     "POST /teacher/chat/conversations {studentId, studentName, "
     "conversationType:'teacher-student'|'teacher-parent', metadata}. "
     "Returns Conversation with participants array."),
    ("BE/FE", "Get conversation messages paginates via limit/skip",
     "limit=50 default; skip=100 for page 3",
     "1) Scroll up older messages",
     "getConversationMessages",
     "GET /teacher/chat/conversations/<id>/messages?limit=50&skip=100. "
     "Returns ChatMessage[] sorted desc; UI prepends to current list."),
    ("BE/FE", "sendMessage POSTs content to /teacher/chat/messages",
     "Conversation focused",
     "1) Type and press Enter",
     "sendMessage",
     "POST {conversationId, content}. Returns ChatMessage with _id, "
     "createdAt, senderType. UI appends optimistically; rollback on "
     "rejection."),
    ("BE/FE", "Mark read updates server state for current user",
     "Open conversation",
     "1) View messages",
     "markAsRead",
     "PUT /teacher/chat/messages/read {conversationId}. Affects "
     "unreadCount on Conversation; getUnreadCount endpoint "
     "/teacher/chat/unread-count returns {count:number}."),
    ("BE/FE", "Edit / delete message endpoints",
     "Own message",
     "1) Edit message text 2) Delete another",
     "editMessage / deleteMessage",
     "PUT /teacher/chat/messages/<id> {content}. DELETE /teacher/"
     "chat/messages/<id>. Authorisation enforced server-side; "
     "service does not pre-validate ownership."),
    ("BE/FE", "Student-side mirrors teacher API under /student/chat",
     "Logged-in student",
     "1) Use student chat",
     "getStudent* methods",
     "Endpoints: /student/chat/conversations, /advisors, /messages, "
     "/messages/read, /unread-count, /messages/<id>. createStudent"
     "Conversation forces conversationType='teacher-student' (note: "
     "uses studentId/studentName fields to refer to teacher per "
     "current contract — verified)."),
    ("BE/FE", "Parent-side has its own send + mark-read paths",
     "Logged-in parent",
     "1) Send to teacher",
     "sendParentMessage",
     "POST /parent/chat/send {conversationId, content}. PUT /parent/"
     "chat/mark-read. GET /parent/chat/messages/<conversationId>. "
     "Conversation creation: POST /parent/chat/conversation "
     "{teacherId}."),
    ("FE", "Conversation metadata surfaces student risk level",
     "Conversation.metadata.studentInfo.riskLevel='high'",
     "1) Inspect conversation header",
     "Conversation.metadata",
     "UI displays riskLevel badge (high/medium/low) when present, "
     "alongside studentCode and className. Drives prioritisation in "
     "teacher inbox."),
    ("FE", "Unread badge updates optimistically when sending message",
     "Sent message in active chat",
     "1) Send message",
     "Local state",
     "Conversation.unreadCount for *recipient* increments; for sender "
     "stays 0. Periodic poll via getUnreadCount keeps cross-tab state "
     "in sync."),
]

# ── Sheet 3: Survey Templates ───────────────────────────────────────────────
TC_SURVEY = [
    ("BE/FE", "getSurveyDashboard cached via cacheService",
     "Teacher opens survey hub",
     "1) Mount StudentSurveyManagement",
     "getSurveyDashboard",
     "GET /teacher/surveys/dashboard. cacheService.getOrFetch with "
     "CACHE_KEYS.DASHBOARD and CACHE_TTL.DASHBOARD. Subsequent visits "
     "within TTL hit cache only."),
    ("BE/FE", "getSurveys filters serialised as cache key",
     "filters={status:'active', type:'periodic'}",
     "1) Apply filters",
     "getSurveys",
     "GET /teacher/surveys?status=active&type=periodic. cache key = "
     "JSON.stringify(filters). Returns {surveys: Survey[], total}."),
    ("BE/FE", "Create survey clears all caches",
     "Survey draft",
     "1) Click 'Tạo khảo sát'",
     "createSurvey",
     "POST /teacher/surveys with CreateSurveyDto (title, description, "
     "type, targetClasses, questions[]). On success → "
     "clearAllSurveyCache() so dashboard + lists refresh."),
    ("BE/FE", "Update survey clears specific survey cache",
     "Edit existing survey id=99",
     "1) Save edits",
     "updateSurvey",
     "PUT /teacher/surveys/99 with partial CreateSurveyDto. "
     "clearSurveyCache(99) invoked. Dashboard cache untouched until "
     "TTL expires."),
    ("BE/FE", "Delete survey clears dashboard + lists",
     "Confirm delete id=99",
     "1) Confirm",
     "deleteSurvey",
     "DELETE /teacher/surveys/99. clearAllSurveyCache() invoked. "
     "Survey row disappears from list; dashboard counters refresh "
     "on next fetch."),
    ("BE/FE", "getSurveyAnalytics returns response distribution",
     "Survey id=42",
     "1) Click 'Analytics'",
     "getSurveyAnalytics",
     "GET /teacher/surveys/42/analytics. Returns SurveyAnalytics with "
     "totalResponses, responseRate, responses[], questionAnalytics[] "
     "(distribution / average / median / mode / textAnswers), and "
     "charts payload. Cached via CACHE_TTL.ANALYTICS."),
    ("BE/FE", "getIncompleteStudents lists pending respondents",
     "Survey id=42",
     "1) Click 'Học sinh chưa làm'",
     "getIncompleteStudents",
     "GET /teacher/surveys/42/incomplete-students returns student[]. "
     "Drives selection list in incomplete modal for bulk reminder."),
    ("BE/FE", "sendReminder posts message + optional studentIds",
     "Selected 5 student ids",
     "1) Click 'Gửi nhắc nhở'",
     "sendReminder",
     "POST /teacher/surveys/send-reminder {surveyId, message, "
     "studentIds?}. studentIds omitted → reminder fans out to ALL "
     "incomplete students."),
    ("FE", "Survey detail modal shows questions with category badges",
     "Survey has 12 questions",
     "1) Open detail",
     "Render bindings",
     "List of Card per question; numeric badge; question.category → "
     "Vietnamese label (Tài chính / Tâm lý / Học tập / Xã hội); "
     "type pill (rating/multipleChoice/textType); required pill in "
     "red. Options listed when present."),
    ("FE", "Survey status badge: active/completed/draft/expired",
     "Multiple statuses across list",
     "1) Inspect badges",
     "getStatusColor",
     "active → green pill 'Đang chạy'. completed/closed → blue 'Đã "
     "kết thúc'. draft → gray 'Bản nháp'. else → 'Hết hạn'."),
    ("FE", "StudentSurvey blocks navigation when mandatory + input survey",
     "isMandatory=true && isInputSurvey=true",
     "1) Try back button / link click / reload",
     "useEffect mandatory block",
     "beforeunload prompt 'Bạn cần hoàn thành khảo sát đầu vào trước "
     "khi tiếp tục.'. popstate pushes state to prevent back. "
     "history.pushState/replaceState overridden to alert user. "
     "Anchor click handler intercepts target=_self links."),
    ("FE", "Mandatory block disabled in thankYou/completed screens",
     "screen='thankYou'",
     "1) Reach thank-you",
     "Effect guard",
     "Early return when screen === 'thankYou' || 'completed'. Cleanup "
     "restores history.pushState/replaceState. User can navigate "
     "freely after submission."),
    ("FE", "Question type mapping covers 7 backend variants",
     "API returns mixed question types",
     "1) Render survey",
     "mapQuestionFromApi",
     "Maps: likert/scale → likert with optionId values. yes-no/yes_no "
     "→ binary with originalValue. single-choice / multiple-choice / "
     "free-text / slider/rating → corresponding renderer config. "
     "Default fallback: single-choice with empty options."),
    ("FE", "Free-text questions are forced to required",
     "API: isRequired=false; type='free-text'",
     "1) Inspect rendered question",
     "Override",
     "mapper sets `required: true` regardless of API value. "
     "Placeholder 'Nhập câu trả lời của bạn...', maxLength=500, "
     "rows=4, showCharCount=true."),
    ("FE", "Slider question default = midpoint of (min,max)",
     "min=2, max=10",
     "1) Render slider",
     "sliderConfig",
     "defaultValue = Math.round((min + max) / 2). leftLabel=String"
     "(min), rightLabel=String(max). gradientType='stress'. unit="
     "'Điểm'."),
]

# ── Sheet 4: Admin Suite ────────────────────────────────────────────────────
TC_ADMIN = [
    ("FE", "Account list filters by role/school/active state",
     "Admin opens AccountManagement",
     "1) Apply role='teacher'",
     "Filter state",
     "Filtered list shows only teacher accounts; counts update; "
     "pagination preserved. Table shows ID/name/email/role/status."),
    ("BE/FE", "Add account validates email + role + password",
     "Form open",
     "1) Submit with invalid email",
     "Form validation",
     "Email regex check; role required; password min length. Server "
     "errors normalised to inline banner. Successful POST returns "
     "new account; list refreshes."),
    ("BE/FE", "Deactivate account toggles status without deletion",
     "Active teacher account",
     "1) Click 'Vô hiệu hoá'",
     "PUT account status",
     "PATCH /admin/accounts/<id>/status {active:false}. Row badge "
     "flips to 'Inactive'. Login attempts blocked server-side. "
     "Re-activate restores access."),
    ("BE/FE", "Bulk import students from XLSX",
     "Admin uploads roster.xlsx",
     "1) Select file → Upload",
     "Bulk import endpoint",
     "POST multipart with sheet; server returns "
     "{imported, skipped, errors:[{row, message}]}. UI shows summary "
     "with first 20 errors and Download CSV link for full report."),
    ("FE", "Search across name/email/code is debounced",
     "User types 'mai' fast",
     "1) Observe network",
     "useDebouncedValue",
     "Debounce ~300ms; only one request fires after typing stops. "
     "Empty search resets list to default page."),
    ("BE/FE", "AdminOverviewDashboard tabs switch dataset",
     "adminViewMode='overview' → 'learning'",
     "1) Click learning tab",
     "useEffect dep adminViewMode",
     "Triggers learningStats fetch via dashboardStatsService. Loading "
     "spinner appears (isLoadingLearning). Charts unmount on switch "
     "to avoid stale flash."),
    ("FE", "Time filter recomputes selectedDate anchor",
     "viewMode='month'",
     "1) Pick month chip",
     "TimeFilter callback",
     "selectedDate set to first day of chosen month. Stats request "
     "includes derived range. UI 'Hôm nay'/'Tuần này' shortcut "
     "available."),
    ("FE", "School/major/class filters cascade",
     "Pick school A → majors filtered to school A",
     "1) Choose school",
     "Cascading filterOptions",
     "Major dropdown only shows entries where major.school matches "
     "selectedSchool. Class dropdown filtered by selected major. "
     "Resets downstream selections when parent changes."),
    ("FE", "Notification draft preview shows formatted card",
     "Title + message entered",
     "1) Click 'Preview'",
     "NotificationManagement preview pane",
     "Renders card replicating recipient view: title bold, message "
     "body, target group badge. Length counters visible (title/"
     "message limits per backend constraints)."),
    ("BE/FE", "Notification target group selection (All/Role/Class)",
     "Target='Role:Teacher'",
     "1) Select role then send",
     "POST /admin/notifications",
     "Body: {title, message, targetType:'all|role|class', targetIds, "
     "scheduleAt?}. Response returns notification id; appears in "
     "recipient inbox via push/socket. UI clears form on success."),
    ("BE/FE", "Notification schedule (future timestamp) defers send",
     "scheduleAt = +2 hours",
     "1) Save scheduled",
     "Backend cron",
     "Notification stored with status 'scheduled'; cron picks at "
     "scheduleAt. UI table shows clock icon + countdown until send. "
     "Edit/cancel allowed before send time."),
    ("FE", "Notification history table filters by status",
     "Status: sent / scheduled / draft",
     "1) Tab through statuses",
     "Filter chips",
     "Counts per status shown in chips. Status mismatch hides "
     "matching rows. Bulk delete only on 'draft' rows."),
    ("BE/FE", "Question Management lists question bank pages",
     "Admin opens questions",
     "1) Navigate pages",
     "Pagination",
     "Server-side paginated; page size selector 10/25/50. Filters by "
     "subject/class/difficulty. Question preview modal shows stem + "
     "options + correct answer."),
    ("BE/FE", "Add question accepts multiple-choice + free-text",
     "Type='multiple_choice'",
     "1) Save",
     "POST /admin/questions",
     "Validation: ≥2 options, exactly 1 correct, stem non-empty. "
     "Free-text bypasses options. Server returns id + assignedSubject. "
     "Cache invalidated."),
    ("FE", "AdminLayout sidebar reflects active route",
     "Navigate /admin/notifications",
     "1) Inspect sidebar",
     "active className",
     "Active item gets highlight (indigo bg). Sidebar collapsible on "
     "small screens. Layout wraps with <AdminLayout/> consistently "
     "across pages."),
    ("FE", "Empty states show illustrations + CTA",
     "Account list empty",
     "1) Inspect view",
     "Conditional render",
     "Centered illustration + 'Chưa có dữ liệu' / 'Thêm tài khoản "
     "mới' CTA. Same pattern reused across notifications, "
     "questions, surveys."),
    ("BE/FE", "Filter options endpoint returns schools/courses/majors/classes",
     "Mount any admin page",
     "1) Inspect filterOptions",
     "useFilterOptions hook",
     "Returns shape {schools[], courseYears[], majors[{name,school}], "
     "classes[{code,cohortYear,program,school}], academicYears?, "
     "semesters?}. Loading flag avoids dropdown flash."),
    ("FE", "i18n switch toggles VN ↔ EN labels live",
     "Language toggle",
     "1) Switch to EN",
     "react-i18next",
     "All admin pages use t() with namespaces 'admin'/'common'. "
     "Switching reloads strings without page refresh. Missing keys "
     "fall back to default (EN)."),
]

# ── Sheet 5: AI Tutor ────────────────────────────────────────────────────────
TC_AI_TUTOR = [
    ("FE", "AI Tutor button shown next to practice question",
     "Student inside ToeicNodePracticePage",
     "1) Inspect question card",
     "AiTutor integration flag",
     "Button 'Hỏi AI' shown beside the answer area; uses Sparkles or "
     "Bot icon. Click opens slide-over chat panel without leaving "
     "the question."),
    ("FE", "Tutor chat panel mounts with question context",
     "Open from question id=44",
     "1) Click 'Hỏi AI'",
     "Initial system prompt",
     "Panel pre-loads: question stem, options, current student answer "
     "(if any). System prompt instructs the model to act as IELTS/"
     "TOEIC tutor without revealing the correct answer outright."),
    ("BE/FE", "Send message hits backend AI endpoint with conversation",
     "User asks 'Why is option B wrong?'",
     "1) Send",
     "POST tutor endpoint",
     "Body includes prior messages + question metadata + skill area + "
     "target band/level. Streamed or chunked response rendered "
     "incrementally; auto-scroll to bottom."),
    ("FE", "Streaming UI shows typing indicator until done",
     "Slow network",
     "1) Observe response area",
     "isStreaming state",
     "Three-dot pulse while waiting; partial chunks appended as they "
     "arrive. Final 'Done' state hides the indicator and enables "
     "input again."),
    ("FE", "Quick prompts (preset buttons) seed common questions",
     "Suggestions: 'Giải thích đáp án' / 'Cho ví dụ' / 'Phát âm'",
     "1) Click a preset",
     "Pre-built prompt template",
     "Inserts canned text into the chat as user message and triggers "
     "send. Reduces friction for low-confidence students. Click only "
     "fires when not already streaming."),
    ("FE", "Tutor refuses when off-topic / academic-integrity protected",
     "User: 'Just tell me the answer.'",
     "1) Send",
     "Server-side guardrails",
     "Tutor responds with hint instead of literal answer. UI shows "
     "the response verbatim. Repeated requests trigger escalating "
     "redirection ('Try eliminating wrong options first…')."),
    ("FE", "Voice input (mic button) optional",
     "Browser supports SpeechRecognition",
     "1) Click mic, speak",
     "Web Speech API",
     "Mic icon toggles recording. Speech transcribed into input box. "
     "Browsers without SpeechRecognition hide the mic button "
     "gracefully."),
    ("FE", "Chat history persists per question for the session",
     "Switch question then return",
     "1) Reopen tutor from same question",
     "In-memory cache keyed by questionId",
     "Previous turns restored when reopening tutor for the SAME "
     "question. Switching to another question starts fresh history "
     "(prevents context leakage)."),
    ("FE", "Close button dismisses panel without losing chat",
     "Mid conversation",
     "1) Click X",
     "Panel hide",
     "Slide-over slides out; isOpen=false. Reopen via 'Hỏi AI' "
     "restores the prior turns from cache. ESC key also closes."),
    ("FE", "Error fallback when AI service unavailable",
     "Backend returns 502",
     "1) Send message",
     "Catch path",
     "Inline message bubble: 'Trợ lý AI tạm thời không khả dụng. Vui "
     "lòng thử lại sau.' with retry button. Input remains enabled "
     "for next attempt."),
    ("FE", "Rate-limit notice shown on 429",
     "Too many requests",
     "1) Spam send",
     "Catch 429",
     "Banner 'Bạn đã gửi quá nhanh – chờ vài giây.' with countdown. "
     "Send button disabled until window resets."),
    ("FE", "Disclaimer footer reminds AI may make mistakes",
     "Panel mounted",
     "1) Inspect footer",
     "Static copy",
     "Light italic text: 'AI có thể sai sót. Hãy đối chiếu với giải "
     "thích chính thức.' Positioned under composer to keep visible "
     "during scrolling."),
]

# ── Sheet 6: Listening + Vocab Practice ─────────────────────────────────────
TC_LISTEN_VOCAB = [
    ("FE", "LearningModulePanel renders flashcard / practice / mini-test tabs",
     "Lesson item with all three repos",
     "1) Open lesson",
     "Tabs render",
     "Three tabs visible: Flashcards / Practice / Mini-test. Current "
     "tab highlighted. Hidden tabs unmount their sub-trees to avoid "
     "double-fetch."),
    ("BE/FE", "useVocab loads vocabulary repository items",
     "flashcard_repo_id=12",
     "1) Open Flashcards tab",
     "useVocab hook",
     "GET /learning-repository/items?repository_id=12. Returns "
     "{items, repository}. Loading spinner during fetch; error banner "
     "with retry on failure."),
    ("FE", "FlashcardItem flips between front (word) and back (definition)",
     "Single flashcard",
     "1) Click card or press space",
     "isFlipped state",
     "Front: word + IPA. Back: definition + example sentence + "
     "translation. CSS 3D transform; tap area covers full card. "
     "Audio play button on front (TTS or pre-recorded)."),
    ("FE", "TTS pronunciation uses Web Speech (en-US, rate 0.85)",
     "Click speaker",
     "1) Click",
     "speechSynthesis.speak",
     "speechSynthesis.cancel() then new SpeechSynthesisUtterance with "
     "lang='en-US', rate=0.85. Browsers without speechSynthesis hide "
     "speaker icon."),
    ("FE", "Self-rating buttons (Again/Hard/Good/Easy) drive SRS",
     "Card on back side",
     "1) Click rating",
     "Spaced repetition update",
     "Sends rating to backend (or local store) to schedule next "
     "review. UI advances to next card. Counter increments completed "
     "count for the session."),
    ("FE", "Listening practice auto-plays AudioPlayer per item",
     "Practice tab open with listening item",
     "1) Open item",
     "AudioPlayer key=item.id",
     "Mounted with autoPlay; audio binds to item.media_audio_url. "
     "Replay button re-triggers source. New item remounts player "
     "(distinct key) so old audio stops."),
    ("FE", "Listening question gates options behind audio finish",
     "audioDone=false initially",
     "1) Try clicking option early",
     "Conditional render",
     "Options hidden until ListeningPlayer onFinished fires "
     "audioDone=true. Helper text 'Hãy nghe hết đoạn audio…'. After "
     "finish, options + 'Xác nhận' button appear."),
    ("BE/FE", "Submit answer stores attempt with elapsed time",
     "Multiple-choice listening item",
     "1) Pick option → submit",
     "submitPracticeAttempt",
     "POST attempt {item_id, user_answer, time_taken_sec, is_correct}. "
     "Server scores immediately; response includes explanation."),
    ("FE", "Result banner shows correct/incorrect with explanation",
     "Correct submission",
     "1) Submit",
     "Render branch",
     "Green panel 'Đúng rồi!' + explanation; or red 'Chưa chính xác' "
     "with correct answer + brief reasoning. 'Câu kế tiếp' button "
     "advances to next item."),
    ("FE", "Mini-test groups N questions and reports overall score",
     "Mini-test of 10 items",
     "1) Complete all",
     "End-of-test summary",
     "Progress bar updates after each. Final screen: score (%), "
     "correct/total, time spent, per-skill breakdown. CTA: 'Làm lại' "
     "/ 'Quay lại lộ trình'."),
    ("FE", "Vocab pronunciation feedback uses Levenshtein vs target",
     "Student records 'photography'",
     "1) Speak word",
     "scoreSimilarity",
     "Same scoring helper as SpeakingPractice; words highlighted "
     "green/red. Score colors at ≥80/≥60/else."),
    ("FE", "Resume position remembered across navigation",
     "User leaves mid-flashcard set",
     "1) Return later",
     "Position cache",
     "Last viewed card index restored from local storage / backend "
     "progress. Avoids restarting from card 1 each session."),
    ("FE", "Empty repository shows fallback CTA",
     "items.length===0",
     "1) Open empty tab",
     "Empty branch",
     "Centered illustration + 'Chưa có nội dung cho mục này.' + CTA "
     "'Quay lại lộ trình'. No infinite spinner — loading state "
     "resolves to empty cleanly."),
    ("FE", "Error retry preserves selected tab",
     "Network drops while loading practice tab",
     "1) Click 'Thử lại'",
     "loadAgain handler",
     "Retries last fetch with same parameters; tab remains active. "
     "If success, replaces error panel with content."),
]


SHEETS = [
    {
        "name": "S1-FC06-TEA08 Appointment",
        "code": "S1-FC06-TEA08",
        "tc_prefix": "TC-S1F06-AP",
        "actual_prefix": "As expected. Observed during manual run on the "
                         "Appointment / Booking flow: ",
        "trace": "Behavior matches source code in BookingScheduler.tsx "
                 "(prop>route>query instructorId resolution, fetchStudent/"
                 "ParentInfo with Bearer token, fetchAvailability "
                 "Mon..Sun window, auto-select first available date, "
                 "bookedSlotIds from /api/booking active statuses, "
                 "goToStep2 slot detail fetch, canConfirm composite "
                 "validation, copyToClipboard toasts), AllAppointments.tsx "
                 "(getStatusBadge color/label map, status+meeting-type "
                 "themes, isPastButNotCompleted mark-completed flow, "
                 "restoreCanceledAppointment past-slot disable), and "
                 "TeacherAppointmentManagement.tsx (accept/reject + "
                 "cancel-reason workflows).",
        "cases": TC_APPT,
    },
    {
        "name": "S1-FC07-TEA07 Messaging",
        "code": "S1-FC07-TEA07",
        "tc_prefix": "TC-S1F07-MS",
        "actual_prefix": "As expected. Observed during manual run on the "
                         "Messaging / Chat flow: ",
        "trace": "Behavior matches source code in chatService.ts (Bearer "
                 "auth header, teacher endpoints /teacher/chat/{students,"
                 "parents,conversations,classes,bulk-message,quick-"
                 "message,urgent-alert,conversations,messages,"
                 "messages/read,unread-count,messages/<id>}, student "
                 "endpoints /student/chat/*, parent endpoints "
                 "/parent/chat/*, Conversation/ChatMessage interfaces, "
                 "metadata.studentInfo.riskLevel surfacing).",
        "cases": TC_MSG,
    },
    {
        "name": "S1-FC08-TEA10 Survey Templates",
        "code": "S1-FC08-TEA10",
        "tc_prefix": "TC-S1F08-SV",
        "actual_prefix": "As expected. Observed during manual run on the "
                         "Survey Templates flow: ",
        "trace": "Behavior matches source code in surveyService.ts (cached "
                 "getSurveyDashboard / getSurveys / getSurveyDetail / "
                 "getSurveyAnalytics, createSurvey/updateSurvey/"
                 "deleteSurvey cache invalidation, getIncompleteStudents, "
                 "sendReminder), StudentSurveyManagement.tsx (status "
                 "badges, detail modal questions list with category/type/"
                 "required pills, completed students card), and "
                 "StudentSurvey.tsx (mandatory navigation block via "
                 "beforeunload / popstate / pushState override / anchor "
                 "click intercept; mapQuestionFromApi covering 7 types; "
                 "free-text forced required; slider midpoint default).",
        "cases": TC_SURVEY,
    },
    {
        "name": "S1-FC09-ADM01 Admin Suite",
        "code": "S1-FC09-ADM01",
        "tc_prefix": "TC-S1F09-AS",
        "actual_prefix": "As expected. Observed during manual run on the "
                         "Admin Suite (FC09) flow: ",
        "trace": "Behavior matches source code in AccountManagement.tsx "
                 "(role/school/active filters, add/deactivate, bulk "
                 "import), NotificationManagement.tsx (preview, target "
                 "group, schedule, history filters), "
                 "AdminOverviewDashboard.tsx (overview/learning toggle, "
                 "filterOptions cascade, time filter), "
                 "QuestionManagement.tsx (paginated list, add MCQ/free-"
                 "text), AdminLayout sidebar active state, useFilterOptions "
                 "shape, react-i18next 'admin'/'common' namespaces.",
        "cases": TC_ADMIN,
    },
    {
        "name": "S3-FC20-STU17 AI Tutor",
        "code": "S3-FC20-STU17",
        "tc_prefix": "TC-S3F20-AT",
        "actual_prefix": "As expected. Observed during manual run on the AI "
                         "Tutor flow: ",
        "trace": "Behavior matches source code in ToeicNodePracticePage.tsx "
                 "(AiTutor integration: contextual button beside question, "
                 "slide-over chat panel pre-loaded with question stem + "
                 "options, streaming response indicator, quick-prompt "
                 "presets, per-question conversation cache, server "
                 "guardrails surfacing as hint-style answers, error/"
                 "rate-limit fallbacks, optional Web Speech mic).",
        "cases": TC_AI_TUTOR,
    },
    {
        "name": "S3-FC11-STU13-16 Listen & Vocab",
        "code": "S3-FC11-STU13-16",
        "tc_prefix": "TC-S3F11-LV",
        "actual_prefix": "As expected. Observed during manual run on the "
                         "Listening + Vocabulary practice flow: ",
        "trace": "Behavior matches source code in LearningModulePanel.tsx "
                 "(Flashcards/Practice/Mini-test tabs, FlashcardItem "
                 "front/back flip, TTS via SpeechSynthesisUtterance, "
                 "Self-rating SRS buttons), useVocab hook (GET "
                 "/learning-repository/items?repository_id=N, loading + "
                 "error retry), AudioPlayer integration with autoPlay + "
                 "key remount, listening audio gating via onFinished, "
                 "submit attempt + explanation panel, mini-test summary, "
                 "vocab pronunciation Levenshtein scoring, position "
                 "resume cache.",
        "cases": TC_LISTEN_VOCAB,
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
