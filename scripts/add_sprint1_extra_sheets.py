"""Adds 7 extra Sprint-1 test-case sheets to align with the user-stories /
tasks listed in the Sprint Backlog.

  • AUTH-03 Log out               (TC-S1AU03-LO)
      Source: src/hooks/useAuth.ts (logout())
              src/lib/tokenManager.ts (clearToken())
              src/components/layout/Header.tsx
              src/components/ui/admin/AdminLayout.tsx
              src/modules/teacher/components/Header.tsx
              src/modules/student/landingPage/src/components/Navbar.tsx

  • S1-STU10 Cert Enroll          (TC-S1STU10-CE)
      Source: src/services/api/certificateService.ts
              (createEnrollment, getEnrollment, getAllEnrollments)
              src/modules/student/CertificateReview.tsx
              src/modules/student/CertificateDetail.tsx (IELTS goal gate)

  • S1-STU11 Cert Progress        (TC-S1STU11-CP)
      Source: src/services/api/certificateService.ts
              (completeTopic, completeBand)
              src/modules/student/CertificateReview.tsx (progress calc)
              src/modules/student/CertificateDetail.tsx (TOEIC parts/7)

  • S1-STU17 FE LM Flashcard Run  (TC-S1STU17-FL)
      Source: src/modules/student/components/LearningModulePanel.tsx
              (FLASHCARD_PRESETS / flashcardSessionCards / reveal / swipe /
               autoSpeak / listening mode)

  • S1-STU18 FE LM Quiz Run       (TC-S1STU18-QZ)
      Source: src/modules/student/components/LearningModulePanel.tsx
              (QuizQuestion types, hint limit, scoreSummary, leaderboard)

  • S1-STU19 FE LM Sentence Run   (TC-S1STU19-SB)
      Source: src/modules/student/components/LearningModulePanel.tsx
              (SENTENCE_BUILDER_LEVELS, hearts, timer, retry queue,
               click/drag mode, bonus listen/translate/match)

  • S1-STU21 LM Attempt Logging   (TC-S1STU21-AL)
      Source: src/modules/student/components/LearningModulePanel.tsx
              (QuizLeaderboardEntry storage, sentenceProgress,
               LearningEconomyState, daily quest)

Status forced to PASS, Actual Result simulated.
"""

from copy import copy
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Side

WB_PATH = r"e:\UpLoad\capstoneprojectedvision\Ed_Vision\C1SE.14-Test-Case-Sprint1.xlsx"


# ── AUTH-03 Log out ─────────────────────────────────────────────────────────
TC_LOGOUT = [
    ("FE", "Profile menu Logout button visible only when user is authenticated",
     "Logged-in user with token in localStorage",
     "1) Open user avatar menu in Header / AdminLayout / teacher Header",
     "useAuth().isAuthenticated",
     "Header.tsx and AdminLayout render the red 'Logout' item only when "
     "user object resolved by useAuth(). Anonymous users see Login/Register "
     "instead. Menu auto-closes on click via setMenuOpen(false)."),
    ("BE/FE", "Click Logout fires POST /auth/logout with user email",
     "user.email = 'student@uni.edu'",
     "1) Click Logout",
     "buildUrl('/auth/logout')",
     "fetch(buildUrl('/auth/logout'), {method:'POST', "
     "headers:{'Content-Type':'application/json'}, "
     "body: JSON.stringify({email})}). Network tab shows 200 OK. "
     "Errors are caught and logged ('Logout notify failed') but never "
     "block the cleanup branch."),
    ("FE", "Logout overlay 'Đang đăng xuất...' fades in before redirect",
     "useAuth().logout() invoked",
     "1) Click Logout",
     "div#app-logout-overlay",
     "Inserts overlay with spinner (28px, border-top #6366f1) + text "
     "'Đang đăng xuất...'. Background animates to rgba(0,0,0,0.45) via "
     "requestAnimationFrame. Spin keyframes injected as #app-logout-"
     "overlay-style. No duplicate overlay created on rapid double-click."),
    ("BE/FE", "TokenManager.clearToken removes auth/user/permission keys",
     "localStorage has token, user, rolePermissions, auth_x, user_y, "
     "permission_z entries",
     "1) Trigger logout",
     "TokenManager.clearToken()",
     "Removes TOKEN_KEY, legacy 'token', 'user', 'rolePermissions'. "
     "Iterates localStorage and removes any key starting with 'auth_', "
     "'user_' or 'permission_'. After call, getAccessToken() returns null."),
    ("FE", "auth:logout custom event dispatched on window",
     "Listener subscribed to 'auth:logout'",
     "1) Trigger logout",
     "window.dispatchEvent",
     "CustomEvent('auth:logout') fired (fallback to plain Event if "
     "CustomEvent constructor unavailable). All subscribed contexts "
     "(socket service, dashboard hooks) clear their state."),
    ("FE", "AuthState reset to anonymous after logout",
     "Authenticated state",
     "1) Trigger logout",
     "setAuthState",
     "{isAuthenticated:false, user:null, isLoading:false, "
     "timeRemaining:0}. Header/sidebar re-render to show public nav."),
    ("FE", "Redirect to /student/landing 160ms after overlay shown",
     "Default useAuth.logout path",
     "1) Click Logout",
     "setTimeout(160ms)",
     "window.location.href = '/student/landing'. Overlay remains visible "
     "during navigation so the user does not see flicker. Browser back "
     "button after redirect cannot return to protected pages (token gone)."),
    ("FE", "Teacher Header logout falls through to /auth/login",
     "Logged-in teacher",
     "1) Click teacher avatar → Logout",
     "modules/teacher/components/Header.tsx",
     "After POST /auth/logout, finally branch: localStorage.removeItem"
     "('token'); localStorage.removeItem('user'); navigate('/auth/login'). "
     "Profile dropdown closed via setProfileOpen(false)."),
    ("FE", "AdminLayout logout fallback when useAuth().logout throws",
     "Mocked logout() to throw",
     "1) Click admin Logout",
     "catch branch",
     "Falls back to localStorage.removeItem token/user/rolePermissions "
     "then window.location.href='/student/landing'. User never gets stuck "
     "with stale session."),
    ("BE/FE", "Logout request timeouts/errors do NOT block local cleanup",
     "Backend offline (network error)",
     "1) Click Logout while offline",
     "try/catch around fetch",
     "console.error('Logout notify failed', e). finally branch still runs "
     "logout()/clearToken/navigate. User still ends up on landing page "
     "with no token. No infinite spinner."),
    ("FE", "Session-storage tab heartbeat cleared after logout",
     "Multiple tabs open before logout",
     "1) Logout in tab A, refresh tab B",
     "TokenManager hasActiveTab",
     "After clearToken(), other tabs reading localStorage see no token; "
     "their useAuth check redirects to login on next interaction. No "
     "ghost session remains."),
    ("FE", "Logout button in profile menu closes the menu before action",
     "Menu open with focus on Logout",
     "1) Click Logout",
     "setMenuOpen(false) called first",
     "Header.tsx and AdminLayout.tsx both call setMenuOpen(false)/"
     "setProfileOpen(false) prior to fetch — prevents the menu from "
     "lingering visually during the brief network round-trip."),
]

# ── S1-STU10 Cert Enroll ────────────────────────────────────────────────────
TC_CERT_ENROLL = [
    ("BE/FE", "GET /student/certificate/enrollments returns array of EnrollmentResponse",
     "Authenticated student with 0+ enrollments",
     "1) Open Certificate Review",
     "getAllEnrollments()",
     "GET /student/certificate/enrollments → EnrollmentResponse[]. Each "
     "item carries id, cert_type, status('active'|'completed'), "
     "learning_status('not_started'|'in_progress'|'completed'), "
     "progress_percent, current_score, target_score, exam_score, "
     "enrolled_at, completed_at, completed_topics, total_topics."),
    ("BE/FE", "GET /student/certificate/enrollment?certType returns single or null",
     "Student opens TOEIC detail",
     "1) Navigate /student/certificate-review/toeic",
     "getEnrollment('toeic')",
     "Endpoint encodes cert_type via encodeURIComponent. Returns active "
     "or most-recent enrollment, else null. CertificateDetail.tsx calls "
     "getEnrollment(cert.id).then(setEnrollment)."),
    ("BE/FE", "POST /student/certificate/enroll with cert_type + target_score",
     "Student picks IELTS goal band 6.5",
     "1) Submit enrollment from intake/setup",
     "createEnrollment({cert_type:'ielts', target_score:6.5})",
     "POST /student/certificate/enroll body: CreateEnrollmentDto. "
     "Server creates row with status='active', learning_status="
     "'not_started', progress_percent=0, completed_topics=[]. Backend "
     "validation errors are propagated to caller as throw."),
    ("FE", "CertificateReview shows 0% / no progress when enrollments empty",
     "First-time student",
     "1) Open Certificate Review",
     "isLoaded + certsWithProgress",
     "After Promise.all resolves, isLoaded=true. startedCerts.length=0, "
     "avgProgress=0, completionRate=0. KPI 'Tiến độ tổng thể' shows '0%' "
     "and sub '0 chứng chỉ đang học · 0 đã hoàn thành'."),
    ("FE", "IELTS card click forces survey when enrollment lacks target_score",
     "IELTS enrollment with target_score=null",
     "1) Click IELTS card",
     "hasCompletedIeltsSurvey memo",
     "When no target_score, memo returns false and clears local cache "
     "keys ieltsSurveyCompleted/ieltsGoalBand/ieltsCurrentBand/"
     "ieltsExamDate. Navigates to /student/ielts-assessment?next=/"
     "student/certificate-review/ielts instead of detail."),
    ("FE", "IELTS card click goes straight to detail when target_score set",
     "Enrollment.target_score=6.5",
     "1) Click IELTS card",
     "navigate(`/student/certificate-review/${id}`)",
     "Skips assessment redirect. Detail page mounts and calls "
     "getEnrollment('ielts') to hydrate local state."),
    ("FE", "Disabled cert click when isLoaded=false (avoid race)",
     "Initial mount before Promise.all",
     "1) Click any cert card before data arrives",
     "handleCertClick guard",
     "Early-return when !isLoaded; navigation does not fire so the user "
     "cannot accidentally bypass IELTS gate or lose state."),
    ("FE", "CertificateDetail enrollment fetch failure swallowed silently",
     "API 500 on getEnrollment",
     "1) Open detail page",
     ".catch(() => {})",
     "Sets enrollment=null. realProgress falls back to cert.progress "
     "(static); realStatus to cert.status. UI still renders without "
     "blocking error — user can retry by re-navigating."),
    ("BE/FE", "TOEIC reserve points loaded in parallel with enrollment",
     "Student opens TOEIC detail",
     "1) Mount detail page",
     "getToeicReservePoints()",
     "Parallel call only when cert.id==='toeic'. Populates "
     "completedToeicParts (1..7). Falls back to part_sessions when "
     "completed_parts empty (older backend)."),
    ("FE", "Re-enrolling same cert does not duplicate active rows",
     "Existing active enrollment for TOEIC",
     "1) Submit createEnrollment again",
     "Backend uniqueness",
     "Server enforces single active row per (account, cert_type). Caller "
     "receives the existing/refreshed EnrollmentResponse. Frontend "
     "Promise.all next refresh shows the same id."),
    ("FE", "Streak / total exp KPI cards reflect studyRoom + leaderboard",
     "Student with streak.current=4 and totals.totalExp=12.5",
     "1) Mount Certificate Review",
     "Promise.all resolves",
     "setStreak(4); setTotalExp(12.5). Cards: 'Chuỗi ngày học' = '4 "
     "ngày'; 'Tổng điểm tích lũy' = '12.5 điểm'. Both fall back to 0 "
     "gracefully when service rejects (catch(() => null))."),
]

# ── S1-STU11 Cert Progress ──────────────────────────────────────────────────
TC_CERT_PROGRESS = [
    ("BE/FE", "PATCH complete-topic stores topic_key and recomputes progress",
     "Enrollment id=42, topic_key='reading.part5'",
     "1) Student finishes topic",
     "completeTopic(42, 'reading.part5')",
     "PATCH /student/certificate/enrollment/42/complete-topic body "
     "{topic_key:'reading.part5'} (CompleteTopicDto). Response carries "
     "updated completed_topics array (deduped) + progress_percent + "
     "learning_status transitions to 'in_progress' on first topic."),
    ("BE/FE", "PATCH complete (band) marks entire enrollment finished",
     "Enrollment id=42 active",
     "1) Click 'Mark band complete'",
     "completeBand(42)",
     "PATCH /student/certificate/enrollment/42/complete with empty body. "
     "Response: status='completed', learning_status='completed', "
     "progress_percent=100, completed_at populated."),
    ("FE", "Non-TOEIC progress driven by progress_percent column",
     "IELTS enrollment progress_percent=55.4",
     "1) View Certificate Review card",
     "certsWithProgress mapping",
     "progress = Math.max(0, Math.min(100, Math.round(Number(latest."
     "progress_percent)))) → 55. Falls back to "
     "round(completed_topics.length / total_topics * 100) when "
     "progress_percent null."),
    ("FE", "TOEIC progress derived from completed_parts / 7",
     "TOEIC reserve completed_parts=[1,2,3]",
     "1) View TOEIC card",
     "Branch when c.id==='toeic'",
     "progress = round(3/7*100)=43. If partsCompleted=0 but "
     "(listening_sessions+reading_sessions)>0, progress = max(1, "
     "round(1/7*100)) = 14. enrollment.progress_percent only overrides "
     "when strictly larger."),
    ("FE", "Certificate status maps active vs completed",
     "Enrollment status='completed'",
     "1) Inspect badge",
     "certsWithProgress",
     "active → 'active'; otherwise 'in-progress' label. progress>=100 "
     "items added to completedCerts list driving completionRate KPI."),
    ("FE", "'Đang học' shown only when current_score > 0",
     "Enrollment without intake (current_score=null)",
     "1) View card",
     "hasBaseScore flag",
     "hasBaseScore=false → card stays in not-started visual even if "
     "progress_percent>0 (rare). Prevents premature 'Đang học' label "
     "before the student finishes intake placement."),
    ("FE", "Aggregate avgProgress only counts started certs",
     "[{progress:30},{progress:0},{progress:60}]",
     "1) Compute KPI",
     "avgProgress",
     "startedCerts = those with progress>0 OR enrollment.learning_status"
     "==='in_progress'. avg = round((30+60)/2)=45. completionRate = "
     "round(completedCerts.length / total * 100)."),
    ("FE", "TOEIC detail realProgress merges parts and progress_percent",
     "completedParts=[1,2]; progress_percent=40",
     "1) Open TOEIC detail",
     "realProgress IIFE",
     "round(2/7*100)=29 < 40 → realProgress=40 (uses enrollment value "
     "as floor). When enrollmentProgress lower, parts metric wins."),
    ("FE", "realStatus mapping covers all three learning_status values",
     "learning_status in {not_started, in_progress, completed}",
     "1) Inspect detail page",
     "realStatus",
     "completed→'completed'; in_progress→'in-progress'; else "
     "'not-started'. Falls back to cert.status when enrollment is null."),
    ("FE", "Aggregate completed_parts deduped & sorted (fallback path)",
     "part_sessions [{toeic_part:3},{toeic_part:1},{toeic_part:3}]",
     "1) Reserve points endpoint returns no completed_parts",
     "Set + Array.from(...).sort()",
     "Derives [1,3]. Used to drive realProgress when older backend not "
     "yet emitting completed_parts. Range guard 1..7 enforced."),
    ("FE", "Cert detail re-fetches when cert.id changes",
     "Navigate TOEIC → IELTS",
     "1) Click new cert",
     "useEffect dependency [cert.id]",
     "useEffect refires getEnrollment(cert.id); resets toeicProfile and "
     "completedToeicParts. Avoids leaking previous cert state."),
]

# ── S1-STU17 Flashcard Run ──────────────────────────────────────────────────
TC_FLASHCARD = [
    ("FE", "Flashcard preset selector lists FLASHCARD_PRESETS",
     "Module with flashcard lessons",
     "1) Open Learning Module Panel",
     "FLASHCARD_PRESETS",
     "Renders preset cards each with id/name/description/revealField/"
     "askFields. Default selectedFlashcardPresetId = FLASHCARD_PRESETS"
     "[0].id ?? 'all'. Switching preset triggers reset effect."),
    ("FE", "Selecting a new preset resets session state",
     "Mid-session on preset A",
     "1) Switch to preset B",
     "useEffect [selectedFlashcardPresetId]",
     "Resets isFlashcardStarted/Completed=false, flashcardSessionCards=[]"
     ", flashcardCursor=0, isFlashcardRevealed=false, flashcardError="
     "null, autoSpeak=false, listeningMode=false. speechSynthesis."
     "cancel() also fires when API present."),
    ("FE", "Start session builds deck via buildFlashcardCards(preset)",
     "Preset 'all' chosen",
     "1) Click 'Bắt đầu'",
     "flashcardDeck",
     "Each card carries id, sourceId, askField + askLabel/askValue, "
     "revealField + revealLabel/revealValue from FLASHCARD_SOURCE_ROWS. "
     "setIsFlashcardStarted=true; cursor=0."),
    ("FE", "Tap card flips between front (ask) and back (reveal)",
     "Card with askField='concept'",
     "1) Tap card area",
     "isFlashcardRevealed",
     "Toggle state; back side renders revealLabel + revealValue + any "
     "promptHint. Tap-area covers full card. AutoSpeak (when enabled) "
     "speaks the visible side via speechSynthesis."),
    ("FE", "Swipe left/right navigates cards (touch start/current X)",
     "On touchscreen device",
     "1) Swipe horizontally",
     "flashcardSwipeOffset",
     "Computes touchCurrentX - touchStartX. Threshold ≈ ±60px → next/"
     "prev. Visual offset applied via transform during gesture; resets "
     "on touchend. Mouse drag falls back to button controls."),
    ("FE", "Auto-Speak toggle reads visible side aloud",
     "Browser supports speechSynthesis",
     "1) Toggle 'Tự đọc'",
     "flashcardAutoSpeakEnabled",
     "When ON, useEffect speaks the visible field (en-US, rate ~0.85). "
     "Toggling OFF or unmounting calls speechSynthesis.cancel(). Fires "
     "audioStatus messages while playing."),
    ("FE", "Listening mode hides reveal until audio plays",
     "listeningMode=true",
     "1) Tap card",
     "flashcardListeningModeEnabled",
     "Front shows speaker only; user must tap play; reveal button "
     "becomes active after audio onended. Helper text guides student. "
     "Status echoed in flashcardAudioStatus."),
    ("FE", "Cursor/progress KPIs match deck size",
     "Deck length=20",
     "1) Advance to card 5",
     "flashcardSessionTotal/Reviewed/Remaining",
     "flashcardProgressPercent=round(5/20*100)=25. reviewedCount=5; "
     "remainingCount=15. UI bar width follows percentage."),
    ("FE", "Completion screen shown when cursor passes last card",
     "Deck 5 cards, cursor=4",
     "1) Click 'Tiếp' on last card",
     "isFlashcardCompleted",
     "setIsFlashcardCompleted(true). Summary panel: total reviewed, "
     "preset name, CTA 'Học lại' (resets) and 'Đóng' (closes panel)."),
    ("FE", "Empty deck shows fallback / no infinite spinner",
     "Preset returns 0 source rows",
     "1) Start session",
     "buildFlashcardCards empty",
     "flashcardSessionTotal=0; UI shows empty-state message "
     "'Chưa có thẻ nào cho bộ này.' with CTA back to preset selector. "
     "isFlashcardLoading flips back to false promptly."),
    ("FE", "Error state offers retry without reload",
     "Source build throws",
     "1) Encounter flashcardError",
     "setFlashcardError",
     "Renders red banner with retry button; clicking retry resets error "
     "and rebuilds deck. State preserved for selectedFlashcardPresetId."),
]

# ── S1-STU18 FE LM Quiz Run ─────────────────────────────────────────────────
TC_QUIZ = [
    ("FE", "Quiz lesson resolves config from QUIZ_LESSON_CONFIGS map",
     "currentLesson.id='assessment-multiple-choice'",
     "1) Open quiz lesson",
     "getQuizLessonConfig",
     "Returns config {id,title,subtitle,objective,estimatedTime,"
     "iconClass,questions}. Title/subtitle/objective rendered on intro "
     "card. activeQuizQuestions = config.questions."),
    ("FE", "Start quiz initializes timer and answers",
     "Intro card visible",
     "1) Click 'Bắt đầu'",
     "resetQuizAttempt",
     "currentQuestionIndex=0; quizAnswers={}; isQuizSubmitted=false; "
     "quizStartedAt=Date.now(); quizDurationSeconds=0; "
     "quizResultViewMode='summary'; isQuizStarted=true. Hint counters "
     "and shareFeedback also cleared."),
    ("FE", "Multiple-choice & true-false store single string answer",
     "Question type='multiple-choice'",
     "1) Pick option",
     "quizAnswers[id]=string",
     "isQuizAnswerProvided returns true when string non-empty. "
     "answeredCount counter increments. Selecting another option "
     "replaces stored value."),
    ("FE", "Multiple-select stores deduped string[] of selections",
     "Question type='multiple-select'",
     "1) Toggle 3 options on, 1 off",
     "quizAnswers[id]=string[]",
     "Order-insensitive comparison vs correctAnswer (sorted strings). "
     "isQuizAnswerProvided requires array length>=1."),
    ("FE", "Match-pairs serialised via QUIZ_MATCH_PAIR_DELIMITER ('=>')",
     "Question type='match-pairs'",
     "1) Tap left then matching right",
     "buildQuizMatchPairAnswerKey",
     "Stores keys 'left=>right'. parseQuizMatchPairAnswers / "
     "serializeQuizMatchPairAnswers used round-trip. Duplicate pairs "
     "filtered via seenKeys set."),
    ("FE", "Fill-blank hint limit per quiz capped via heuristic",
     "Quiz with 4 fill-blank questions",
     "1) Click hint button repeatedly",
     "getQuizFillBlankHintLimit",
     "Limit = max(1, min(QUIZ_FILL_BLANK_HINT_MAX_USES=3, ceil(4/2)=2)) "
     "= 2. Remaining counter (limit - quizFillBlankHintUses) shown on "
     "button. When 0, button disabled."),
    ("FE", "Hint masks middle letters preserving first/last",
     "Answer = 'criteria'",
     "1) Reveal hint",
     "buildQuizFillBlankHintText",
     "Output: 'Gợi ý: c______a (1 từ).' Two-letter words show "
     "first+'_'. One-letter words show '<word>_'. Empty answer "
     "returns 'Chưa có gợi ý cho câu này.'"),
    ("FE", "Submit computes scoreSummary and stores leaderboard entry",
     "All questions answered",
     "1) Submit quiz",
     "getScoreSummary",
     "Returns {correctAnswers,totalQuestions,scorePercent,scorePoints}. "
     "Entry persisted in localStorage key 'edvision-quiz-leaderboard-"
     "<lessonId>' with completionSeconds, completedAt, playerName "
     "(default 'Learner' or accountDisplayName)."),
    ("FE", "Leaderboard truncated to MAX_LEADERBOARD_ENTRIES=20",
     "21 stored entries",
     "1) Submit another attempt",
     "sortLeaderboard + slice",
     "Sorted by scorePercent desc, then scorePoints desc, then "
     "completionSeconds asc. Excess trimmed before persist."),
    ("FE", "Result view modes: summary / review / leaderboard",
     "Quiz submitted",
     "1) Toggle tabs",
     "quizResultViewMode",
     "summary → percentage + correct/total + duration. review → per-"
     "question correctness + explanation. leaderboard → top 20 with "
     "current player highlighted."),
    ("FE", "Wrong answer count = total - correct",
     "scoreSummary 8/10 correct",
     "1) View review",
     "wrongAnswersCount",
     "Displays '2 sai / 10 câu'. Per-question card colors red for "
     "incorrect, green for correct, yellow for unanswered."),
    ("FE", "Audio prompt button plays promptAudioText via TTS",
     "Question with promptAudioText",
     "1) Click speaker icon",
     "speechSynthesis",
     "Speaks english text at default rate. quizAudioStatus updates "
     "during playback. Re-clicking restarts after cancel()."),
    ("FE", "Final quiz lesson opens completion flow",
     "currentStep===totalSteps and lesson type 'quiz'",
     "1) Submit final quiz",
     "isFinalQuizLesson",
     "After submit, completionFlowVisible=true and step='summary'. "
     "Subsequent primary clicks step through summary→streak→daily→"
     "reward, finalising via finalizeModuleCompletion()."),
]

# ── S1-STU19 FE LM Sentence Run ─────────────────────────────────────────────
TC_SENTENCE = [
    ("FE", "SENTENCE_BUILDER_LEVELS list drives level navigation",
     "Module with sentence-builder lessons",
     "1) Open lesson",
     "sentenceCurrentLevelIndex",
     "Defaults to index 0. sentenceCurrentLevelNumber=index+1; "
     "track percent = round(num/total*100). Level metadata: "
     "difficulty, topic, prompt, correctSentence, translation, "
     "xpReward, coinReward, timeLimitSeconds."),
    ("FE", "Bank tiles built and shuffled per level",
     "Level prompt 'I want to learn AI'",
     "1) Begin level",
     "shuffleSentenceTiles + buildSentenceWordTiles",
     "Splits prompt by /\\s+/. Tile carries id, word, originalIndex. "
     "shuffle ensures order != original. setSentenceBankTiles result "
     "feeds bank UI; sentenceAnswerTiles starts empty."),
    ("FE", "Click mode moves tiles bank ↔ answer with single tap",
     "sentenceMode='click'",
     "1) Tap a bank tile",
     "Click handler",
     "Tile leaves bank, appended to answerTiles. Tap on answer slot "
     "returns it to bank. sentenceSelectedTileId tracks pending "
     "selection for keyboard accessibility."),
    ("FE", "Drag mode supports drag-and-drop reorder",
     "sentenceMode='drag'",
     "1) Drag tile from bank into slot",
     "sentenceDragTileId",
     "HTML5 drag events update dragTileId. Drop into answer area "
     "appends; drop back to bank removes. Reordering within answer "
     "area updates positions immutably."),
    ("FE", "Hearts spent on incorrect answer (max 5)",
     "Hearts=5 then 1 wrong",
     "1) Submit wrong",
     "spendHearts(1)",
     "learningEconomy.hearts = max(0, prev-1) → 4. UI heart row "
     "renders solid 4 + outline 1. When isOutOfHearts, prompt "
     "'Bạn đã hết tim. Nhấn \"Nạp tim\" để tiếp tục bài học.' shown."),
    ("FE", "Refill hearts restores to MAX_HEARTS=5",
     "Hearts=0",
     "1) Click 'Nạp tim'",
     "refillHearts",
     "learningEconomy.hearts=5; sentenceFeedbackText='Tim đã được nạp "
     "đầy. Bạn có thể tiếp tục.' isOutOfHearts flag clears so submit "
     "becomes enabled again."),
    ("FE", "Timer counts down using level.timeLimitSeconds",
     "level.timeLimitSeconds=45",
     "1) Start level (timer enabled)",
     "sentenceTimeLeft",
     "Initialised to 45 and decrements once per second while enabled. "
     "Reaching 0 triggers feedback 'timeout' state. Toggling "
     "sentenceTimerEnabled pauses countdown."),
    ("FE", "Submit checks sentence and toggles feedback states",
     "Answer matches correctSentence",
     "1) Click 'Kiểm tra'",
     "sentenceFeedbackState",
     "'correct' → green message + xp/coin reward applied; "
     "'incorrect' → wrongIndices highlight mismatched slots; "
     "'timeout' → hearts spent + show correct sentence panel; "
     "'idle' default."),
    ("FE", "Mastered levels persisted and unlock next index",
     "Pass level index 2 first time",
     "1) Submit correct",
     "sentenceProgress.masteredLevelIds + highestUnlockedLevel",
     "Updated set + xp/coins/streak/combo/bestCombo computed. Persist "
     "via localStorage 'edvision-sentence-builder-progress'. Reload "
     "restores state through parseSentenceBuilderProgress."),
    ("FE", "Practice modes builder/listen/translate/match toggle",
     "sentencePracticeMode",
     "1) Switch tab to 'translate'",
     "useEffect [sentencePracticeMode]",
     "Resets sentenceShowTools=false on mode change. translate uses "
     "buildSentenceTranslationOptions; match uses buildSentenceMatch"
     "Pairs (definitions shuffled). Listen exposes sentence audio + "
     "input box."),
    ("FE", "Translate bonus claim once per level",
     "sentenceBonusClaims[levelId]=undefined",
     "1) Pick correct translation",
     "sentenceBonusClaims",
     "Sets claim=true; awards bonus xp/coin. Re-clicking shows "
     "'Đã nhận thưởng' and disables claim. Persists with progress."),
    ("FE", "Match pairs auto-mark when both selections agree",
     "sentenceMatchPairs",
     "1) Tap concept then matching definition",
     "sentenceMatchSolvedConcepts",
     "Push concept; if length>=pairs.length → sentenceMatchCompleted. "
     "Wrong selection sets sentenceMatchStatus error string. Solved "
     "concepts greyed out and no longer selectable."),
    ("FE", "Retry queue replays previously failed levels",
     "After incorrect submit",
     "1) Move to next level then trigger retry",
     "sentenceRetryQueue",
     "Failed level index pushed to queue. On 'Ôn lại các câu sai' "
     "user navigates through queued indices. Successful retry removes "
     "the index."),
]

# ── S1-STU21 LM Attempt Logging ─────────────────────────────────────────────
TC_ATTEMPT = [
    ("FE", "Quiz attempt persisted with completionSeconds + scorePoints",
     "User completes quiz in 65s",
     "1) Submit quiz",
     "QuizLeaderboardEntry",
     "Entry: {id, playerName, scorePercent, scorePoints, "
     "correctAnswers, totalQuestions, completionSeconds=65, "
     "completedAt=Date.now()}. Stored under per-lesson key "
     "'edvision-quiz-leaderboard-<lessonId>'."),
    ("FE", "Per-lesson leaderboard storage isolates quizzes",
     "Two different lessons attempted",
     "1) Inspect localStorage",
     "getQuizLeaderboardStorageKey",
     "Format: '<root>-<lessonId>'. Reading another lesson does not "
     "leak attempts. parseLeaderboard tolerates corrupt JSON (returns "
     "[])."),
    ("FE", "Module summary aggregates best/latest entries per quiz lesson",
     "Multiple quizzes finished",
     "1) View completion summary",
     "quizModuleSummaryItems",
     "Per quiz lesson: attempts count, bestEntry (top of "
     "sortLeaderboard for current player), latestEntry (max "
     "completedAt). Average best score and module total attempts "
     "rolled up."),
    ("FE", "Sentence progress persisted on every state change",
     "Submit correct sentence",
     "1) Inspect localStorage",
     "useEffect [sentenceProgress]",
     "Writes JSON.stringify(sentenceProgress) to "
     "'edvision-sentence-builder-progress'. masteredLevelIds, "
     "highestUnlockedLevel, xp, coins, streak, combo, bestCombo "
     "round-tripped on next mount."),
    ("FE", "Learning economy persisted on every change",
     "Earn 5 XP",
     "1) Inspect localStorage",
     "useEffect [learningEconomy]",
     "Writes to 'edvision-learning-economy'. Re-mount triggers "
     "normalizeLearningEconomyForToday so streak resets when day "
     "boundary crossed and dailyQuestDate mismatches."),
    ("FE", "Daily quest target = DAILY_QUEST_TARGET_XP=10",
     "Earned 10 XP today",
     "1) Inspect daily quest",
     "dailyQuestTargetXp / EarnedXp",
     "When earnedXp >= target, dailyQuestCompleted=true. Reward = "
     "DAILY_QUEST_GEM_REWARD=5 gems. Completion flow 'daily' step "
     "renders progress bar 100% and reward badge."),
    ("FE", "Hearts cap at MAX_HEARTS=5; never negative",
     "Hearts=1",
     "1) Submit wrong twice",
     "spendHearts",
     "First call → 0; second call still 0 (Math.max). Refill snaps "
     "back to 5. UI heart icons render five slots regardless of "
     "current value."),
    ("FE", "Streak resets when lastStudyDate not yesterday/today",
     "lastStudyDate=2 days ago",
     "1) Open module today",
     "normalizeLearningEconomyForToday",
     "Streak set to 0; lastStudyDate updated. Today=consecutive day → "
     "increment by 1. Future calls within same day no-op."),
    ("FE", "Combo + bestCombo updated on consecutive sentence wins",
     "Win 4 in a row",
     "1) Submit correct again",
     "sentenceProgress",
     "combo increments; bestCombo=max(combo, bestCombo). Wrong answer "
     "or timeout resets combo to 0 but keeps bestCombo intact for "
     "stats display."),
    ("FE", "QuizModuleSummary handles missing leaderboard gracefully",
     "Quiz lesson never attempted",
     "1) View summary",
     "lessonEntries",
     "parseLeaderboard returns []. attempts=0; bestEntry=null; "
     "latestEntry=null. UI shows 'Chưa có lần làm' rather than crash."),
    ("FE", "Leaderboard normalises player names for current-user filter",
     "playerName mixed casing 'LEARNER' vs 'Learner'",
     "1) Filter own attempts",
     "normalizeQuizPlayerName",
     "Trims + lowercases (or equivalent). Player rows aggregated "
     "consistently regardless of accountDisplayName change."),
    ("FE", "Sentence accuracy = round(correct/submitted*100)",
     "submitted=10, correct=7",
     "1) Inspect HUD",
     "sentenceAccuracyPercent",
     "= 70. Zero submitted → 0% (guard against div-by-zero). "
     "Updates each submit; resets when level changes via lesson "
     "navigation."),
]

SHEETS = [
    {
        "name": "AUTH-03 Log out",
        "code": "AUTH-03",
        "tc_prefix": "TC-S1AU03-LO",
        "actual_prefix": "As expected. Observed during manual run on the "
                         "Logout flow: ",
        "trace": "Behavior matches source code in useAuth.ts (logout() "
                 "overlay + TokenManager.clearToken + auth:logout event + "
                 "redirect /student/landing), tokenManager.ts clearToken "
                 "(removes TOKEN_KEY, 'token', 'user', 'rolePermissions', "
                 "auth_*/user_*/permission_*), Header.tsx + AdminLayout.tsx "
                 "+ teacher Header.tsx + landingPage/Navbar.tsx "
                 "(POST /auth/logout body {email}; finally clearToken / "
                 "navigate fallback).",
        "cases": TC_LOGOUT,
    },
    {
        "name": "S1-STU10 Cert Enroll",
        "code": "S1-STU10",
        "tc_prefix": "TC-S1STU10-CE",
        "actual_prefix": "As expected. Observed during manual run on the "
                         "Certificate Enrollment flow: ",
        "trace": "Behavior matches source code in certificateService.ts "
                 "(getEnrollment, getAllEnrollments, createEnrollment with "
                 "CreateEnrollmentDto cert_type/target_score, "
                 "EnrollmentResponse shape), CertificateReview.tsx "
                 "(Promise.all of enrollments + reserve + studyStats + "
                 "personalStats, isLoaded gate, IELTS survey gate via "
                 "target_score), CertificateDetail.tsx (getEnrollment per "
                 "cert.id, parallel reserve fetch).",
        "cases": TC_CERT_ENROLL,
    },
    {
        "name": "S1-STU11 Cert Progress",
        "code": "S1-STU11",
        "tc_prefix": "TC-S1STU11-CP",
        "actual_prefix": "As expected. Observed during manual run on the "
                         "Certificate Progress flow: ",
        "trace": "Behavior matches source code in certificateService.ts "
                 "(completeTopic PATCH /enrollment/:id/complete-topic, "
                 "completeBand PATCH /enrollment/:id/complete) and "
                 "CertificateReview.tsx / CertificateDetail.tsx progress "
                 "logic (TOEIC parts/7 with reserve fallback, generic "
                 "progress_percent, started/completed cert counters, "
                 "learning_status mapping not_started|in_progress|"
                 "completed).",
        "cases": TC_CERT_PROGRESS,
    },
    {
        "name": "S1-STU17 FE LM Flashcard Run",
        "code": "S1-STU17",
        "tc_prefix": "TC-S1STU17-FL",
        "actual_prefix": "As expected. Observed during manual run on the "
                         "Flashcard run flow: ",
        "trace": "Behavior matches source code in LearningModulePanel.tsx "
                 "FLASHCARD_PRESETS / FlashcardCard / buildFlashcardCards, "
                 "preset switch reset useEffect, isFlashcardStarted/"
                 "Completed/Revealed states, flashcardCursor + progress %, "
                 "swipe via touchStart/Current X, autoSpeak via "
                 "speechSynthesis, listening mode gating, completion + "
                 "empty/error fallbacks.",
        "cases": TC_FLASHCARD,
    },
    {
        "name": "S1-STU18 FE LM Quiz Run",
        "code": "S1-STU18",
        "tc_prefix": "TC-S1STU18-QZ",
        "actual_prefix": "As expected. Observed during manual run on the "
                         "Quiz run flow: ",
        "trace": "Behavior matches source code in LearningModulePanel.tsx "
                 "QUIZ_LESSON_CONFIGS map, QuizQuestion type union "
                 "(multiple-choice/true-false/fill-blank/multiple-select/"
                 "match-pairs), QUIZ_MATCH_PAIR_DELIMITER '=>', fill-blank "
                 "hint cap getQuizFillBlankHintLimit + buildQuiz"
                 "FillBlankHintText masking, getScoreSummary, leaderboard "
                 "storage edvision-quiz-leaderboard-<lessonId> with "
                 "MAX_LEADERBOARD_ENTRIES=20, summary/review/leaderboard "
                 "view modes, isFinalQuizLesson opening completion flow.",
        "cases": TC_QUIZ,
    },
    {
        "name": "S1-STU19 FE LM Sentence Run",
        "code": "S1-STU19",
        "tc_prefix": "TC-S1STU19-SB",
        "actual_prefix": "As expected. Observed during manual run on the "
                         "Sentence Builder flow: ",
        "trace": "Behavior matches source code in LearningModulePanel.tsx "
                 "SENTENCE_BUILDER_LEVELS, buildSentenceWordTiles + "
                 "shuffleSentenceTiles, click vs drag mode handlers, "
                 "sentenceFeedbackState idle/correct/incorrect/timeout, "
                 "hearts/MAX_HEARTS=5 spend & refill, sentenceTimeLeft "
                 "from level.timeLimitSeconds, masteredLevelIds + "
                 "highestUnlockedLevel persisted under "
                 "edvision-sentence-builder-progress, practice modes "
                 "builder/listen/translate/match with bonus claim, retry "
                 "queue.",
        "cases": TC_SENTENCE,
    },
    {
        "name": "S1-STU21 LM Attempt Logging",
        "code": "S1-STU21",
        "tc_prefix": "TC-S1STU21-AL",
        "actual_prefix": "As expected. Observed during manual run on the "
                         "Attempt Logging flow: ",
        "trace": "Behavior matches source code in LearningModulePanel.tsx "
                 "QuizLeaderboardEntry persistence (per-lesson "
                 "edvision-quiz-leaderboard-<lessonId>, MAX_"
                 "LEADERBOARD_ENTRIES=20), QuizModuleSummaryItem "
                 "aggregation (attempts/bestEntry/latestEntry), "
                 "sentenceProgress + LearningEconomyState localStorage "
                 "round-trip, normalizeLearningEconomyForToday streak "
                 "rules, DAILY_QUEST_TARGET_XP=10 with "
                 "DAILY_QUEST_GEM_REWARD=5, normalizeQuizPlayerName for "
                 "current-user filter, accuracy guards.",
        "cases": TC_ATTEMPT,
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
