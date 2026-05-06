# IELTS Adaptive Learning Roadmap - Setup & Testing Guide

## 📋 Overview
Module này cung cấp hệ thống học IELTS thích nghi dựa trên band hiện tại của học viên, bao gồm:
- Auto-generate learning roadmap theo band
- 6 kỹ năng: Reading, Listening, Grammar, Vocabulary, Writing, Speaking
- Mỗi lesson: flashcards → practice questions → mini test
- Band test tổng hợp để đánh giá và thay đổi band
- Tự động tạo roadmap mới khi band UP/DOWN

---

## 🚀 Bước 1: Cập nhật Database Schema

### 1.1. Thêm Models vào `prisma/schema.prisma`

Mở file `ed_vision_backend/prisma/schema.prisma` và thêm 5 models sau (copy từ `prisma/ielts_adaptive_models.prisma`):

```prisma
// IELTS Adaptive Learning Models

model IeltsAdaptiveRoadmap {
  id                    Int      @id @default(autoincrement())
  enrollment_id         Int
  current_band          Float    // e.g., 4.0, 4.5
  target_band           Float    // e.g., 5.0
  status                String   @default("active") // active, completed, abandoned
  progress_percent      Float    @default(0)
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  enrollment            CertificateEnrollment @relation(fields: [enrollment_id], references: [id], onDelete: Cascade)
  lessons               IeltsLesson[]
  band_tests            IeltsBandTest[]
  skill_progress        IeltsSkillProgress[]

  @@map("ielts_adaptive_roadmap")
}

model IeltsLesson {
  id                    Int      @id @default(autoincrement())
  roadmap_id            Int
  skill_area            String   // reading, listening, grammar, vocabulary, writing, speaking
  lesson_order          Int
  lesson_title          String
  lesson_description    String?
  difficulty_level      Float    // e.g., 4.0, 4.5
  status                String   @default("locked") // locked, unlocked, in_progress, completed
  flashcard_repo_id     Int?
  practice_repo_id      Int?
  mini_test_repo_id     Int?
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  roadmap               IeltsAdaptiveRoadmap @relation(fields: [roadmap_id], references: [id], onDelete: Cascade)
  flashcardRepo         LearningRepository?  @relation("FlashcardRepo", fields: [flashcard_repo_id], references: [id])
  practiceRepo          LearningRepository?  @relation("PracticeRepo", fields: [practice_repo_id], references: [id])
  miniTestRepo          LearningRepository?  @relation("MiniTestRepo", fields: [mini_test_repo_id], references: [id])
  practice_sessions     IeltsPracticeSession[]

  @@map("ielts_lessons")
}

model IeltsPracticeSession {
  id                    Int      @id @default(autoincrement())
  lesson_id             Int
  session_type          String   // warmup, mini_test
  repository_id         Int
  accuracy_percent      Float
  correct_count         Int
  total_questions       Int
  avg_time_per_q        Float?
  detailed_results      Json?    // [{item_id, question, is_correct, student_answer, correct_answer, explanation}]
  created_at            DateTime @default(now())

  lesson                IeltsLesson         @relation(fields: [lesson_id], references: [id], onDelete: Cascade)
  repository            LearningRepository  @relation(fields: [repository_id], references: [id])

  @@map("ielts_practice_sessions")
}

model IeltsBandTest {
  id                    Int      @id @default(autoincrement())
  roadmap_id            Int
  test_name             String
  skills_tested         Json     // ["reading", "listening", ...]
  question_ids          Json     // [1, 2, 3, ...]
  total_questions       Int
  correct_count         Int      @default(0)
  accuracy_percent      Float    @default(0)
  previous_band         Float
  estimated_band        Float?
  band_change           String?  // UP, DOWN, STABLE
  confidence_level      String?  // high, medium, low
  response_time_factor  Float?
  consistency_score     Float?
  recommendation        String?  // ADVANCE, MAINTAIN, REMEDIAL
  weak_skills           Json?    // ["reading", "grammar"]
  skill_breakdown       Json?    // {reading: {correct: 8, total: 10, accuracy: 80}}
  detailed_results      Json?
  created_at            DateTime @default(now())

  roadmap               IeltsAdaptiveRoadmap @relation(fields: [roadmap_id], references: [id], onDelete: Cascade)

  @@map("ielts_band_tests")
}

model IeltsSkillProgress {
  id                    Int      @id @default(autoincrement())
  roadmap_id            Int
  skill_area            String   // reading, listening, grammar, vocabulary, writing, speaking
  lessons_completed     Int      @default(0)
  total_lessons         Int
  avg_accuracy          Float    @default(0)
  last_practice_at      DateTime?
  updated_at            DateTime @updatedAt

  roadmap               IeltsAdaptiveRoadmap @relation(fields: [roadmap_id], references: [id], onDelete: Cascade)

  @@unique([roadmap_id, skill_area])
  @@map("ielts_skill_progress")
}
```

### 1.2. Thêm Relations vào LearningRepository

Tìm model `LearningRepository` trong `schema.prisma` và thêm các relations:

```prisma
model LearningRepository {
  // ... existing fields ...
  
  // Add these relations
  flashcardLessons      IeltsLesson[]         @relation("FlashcardRepo")
  practiceLessons       IeltsLesson[]         @relation("PracticeRepo")
  miniTestLessons       IeltsLesson[]         @relation("MiniTestRepo")
  practice_sessions     IeltsPracticeSession[]
}
```

### 1.3. Chạy Migration

```bash
cd ed_vision_backend
npx prisma migrate dev --name add_ielts_adaptive_models
npx prisma generate
```

---

## 🗂️ Bước 2: Copy Backend Files

### 2.1. Tạo thư mục module

```bash
mkdir -p ed_vision_backend/src/ielts-adaptive/dto
mkdir -p ed_vision_backend/src/ielts-adaptive/services
```

### 2.2. Copy các files sau:

**Backend Files đã tạo:**
- `src/ielts-adaptive/dto/ielts-adaptive.dto.ts` ✅
- `src/ielts-adaptive/services/band-estimation.service.ts` ✅
- `src/ielts-adaptive/services/ielts-adaptive.service.ts` ✅
- `src/ielts-adaptive/ielts-adaptive.controller.ts` ✅
- `src/ielts-adaptive/ielts-adaptive.module.ts` ✅

### 2.3. Import Module vào `app.module.ts`

Mở `ed_vision_backend/src/app.module.ts`:

```typescript
import { IeltsAdaptiveModule } from './ielts-adaptive/ielts-adaptive.module';

@Module({
  imports: [
    // ... existing imports ...
    IeltsAdaptiveModule,
  ],
  // ...
})
export class AppModule {}
```

---

## 🌱 Bước 3: Seed Database

### 3.1. Copy Seed File

File `prisma/seedIeltsAdaptive.js` đã được tạo với:
- 11+ IELTS questions (band 4.0-4.5) covering 6 skills
- 18 LearningRepository items (flashcards, practice, mini-tests)

### 3.2. Chạy Seed

```bash
cd ed_vision_backend
node prisma/seedIeltsAdaptive.js
```

**Expected Output:**
```
✅ Created 11 IELTS questions
✅ Created 18 learning repositories for band 4.0-4.5
✅ Seed completed successfully!
```

---

## 🎨 Bước 4: Copy Frontend Files

### 4.1. Tạo thư mục

```bash
mkdir -p Ed_Vision/src/pages/IeltsAdaptive
mkdir -p Ed_Vision/src/types
mkdir -p Ed_Vision/src/api
```

### 4.2. Copy các files sau:

**Frontend Files đã tạo:**
- `src/types/ielts-adaptive.types.ts` ✅
- `src/api/ielts-adaptive.api.ts` ✅
- `src/pages/IeltsAdaptive/RoadmapPage.tsx` ✅
- `src/pages/IeltsAdaptive/RoadmapPage.css` ✅
- `src/pages/IeltsAdaptive/LessonPage.tsx` ✅
- `src/pages/IeltsAdaptive/LessonPage.css` ✅
- `src/pages/IeltsAdaptive/BandTestPage.tsx` ✅
- `src/pages/IeltsAdaptive/BandTestPage.css` ✅

### 4.3. Thêm Routes vào App

Mở `Ed_Vision/src/App.tsx` (hoặc router config file):

```typescript
import { RoadmapPage } from './pages/IeltsAdaptive/RoadmapPage';
import { LessonPage } from './pages/IeltsAdaptive/LessonPage';
import { BandTestPage } from './pages/IeltsAdaptive/BandTestPage';

// Trong routes:
{
  path: '/ielts-adaptive/roadmap',
  element: <RoadmapPage />
},
{
  path: '/ielts-adaptive/lesson/:lessonId',
  element: <LessonPage />
},
{
  path: '/ielts-adaptive/band-test/:roadmapId',
  element: <BandTestPage />
}
```

---

## 🏃 Bước 5: Start Development Servers

### 5.1. Backend

```bash
cd ed_vision_backend
npm install
npm run start:dev
```

**Expected:** NestJS running on `http://localhost:3000`

### 5.2. Frontend

```bash
cd Ed_Vision
npm install
npm run dev
```

**Expected:** Vite running on `http://localhost:5173`

---

## 🧪 Bước 6: Testing Flow

### Test Flow: Roadmap → Lesson → Mini Test → Band Test → Result

#### 6.1. Tạo Roadmap mới

**API Request (Postman/Thunder Client):**

```http
POST http://localhost:3000/ielts-adaptive/roadmap
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "enrollment_id": 1,
  "current_band": 4.0,
  "target_band": 5.0
}
```

**Response:**
```json
{
  "id": 1,
  "enrollment_id": 1,
  "current_band": 4.0,
  "target_band": 5.0,
  "status": "active",
  "progress_percent": 0,
  "lessons": [
    {
      "id": 1,
      "skill_area": "reading",
      "lesson_title": "Band 4.0 - Reading Basics",
      "status": "unlocked"
    },
    // ... 29 more lessons
  ]
}
```

**Frontend:**
- Navigate to: `http://localhost:5173/ielts-adaptive/roadmap`
- Login required (JWT token in localStorage)
- Should see: Band display (4.0 → 5.0), 30 lesson cards (6 skills × 5 lessons)

---

#### 6.2. Complete một Lesson

**Click vào Lesson Card:**
- Route: `/ielts-adaptive/lesson/1`
- Flow: **Flashcards → Practice → Mini Test → Results**

**Phase 1: Flashcards (3 cards)**
- Hiển thị flashcard content với explanation
- Click "Next →" để chuyển card
- Không cần trả lời, chỉ đọc và học

**Phase 2: Practice Questions (2-3 questions)**
- Multiple choice questions
- Select answer → Click "Next →"
- Timer tracking cho mỗi câu hỏi
- **Không tính điểm**, chỉ để ôn tập

**Phase 3: Mini Test (2-3 questions)**
- Similar UI to practice
- Select answers → Click "Submit Test →"
- **CÓ tính điểm**, update skill progress

**API Call khi Submit Mini Test:**
```http
POST http://localhost:3000/ielts-adaptive/practice/submit
Content-Type: application/json

{
  "lesson_id": 1,
  "session_type": "MINI_TEST",
  "repository_id": 3,
  "answers": {
    "101": "A",
    "102": "B",
    "103": "C"
  },
  "time_per_question": {
    "101": 45,
    "102": 38,
    "103": 52
  }
}
```

**Phase 4: Results Display**
- Accuracy percentage (e.g., 66.67%)
- Correct/Incorrect count
- Average time per question
- Detailed review: question, your answer, correct answer, explanation
- Button: "Back to Roadmap"

**Backend Logic:**
- Update lesson status: `in_progress` → `completed`
- Update roadmap progress_percent
- Create IeltsPracticeSession record
- Update IeltsSkillProgress for skill_area

---

#### 6.3. Complete 80%+ Lessons → Take Band Test

**Khi progress >= 80%:**
- Roadmap page hiển thị "Band Test Available" section
- Click "Take Band Test" button
- Route: `/ielts-adaptive/band-test/1`

**Test Flow:**

**Setup Phase:**
- Select skills to test (default: Reading, Listening, Grammar, Vocabulary)
- Display: estimated questions (20), estimated time (20 mins)
- Click "Start Band Test"

**API Call:**
```http
POST http://localhost:3000/ielts-adaptive/band-test
Content-Type: application/json

{
  "roadmap_id": 1,
  "skills_to_test": ["reading", "listening", "grammar", "vocabulary"],
  "questions_per_skill": 5
}
```

**Testing Phase:**
- Display questions one by one
- Progress bar: "Question 1 / 20"
- Skill badge showing current skill
- Multiple choice answers
- Timer tracking per question
- Click "Next Question →" or "Submit Test →" (last question)

**API Call khi Submit:**
```http
POST http://localhost:3000/ielts-adaptive/band-test/submit
Content-Type: application/json

{
  "test_id": 1,
  "answers": {
    "1": "B",
    "2": "A",
    // ... 20 answers
  },
  "time_per_question": {
    "1": 60,
    "2": 45,
    // ...
  }
}
```

---

#### 6.4. View Band Test Results

**Results Phase Display:**

**Header:**
- 🎉 Test Complete!
- Band Comparison: `4.0 → [📈 UP] → 4.5` (with colors)
- Confidence Level badge: "HIGH Confidence"

**Metrics Grid:**
- Accuracy: 75%
- Correct: 15/20
- Time Factor: 0.98x
- Consistency: 70%

**Recommendation Card:**
- Green border if UP
- Message based on `band_change`:
  - **UP**: "🎉 Excellent work! You are ready to advance..."
  - **STABLE**: "📚 Good effort! Focus on improving: Grammar, Vocabulary..."
  - **DOWN**: "📖 Keep practicing! We recommend reviewing fundamentals..."

**Skills Breakdown:**
- Reading: 80% (8/10) - Green bar
- Listening: 70% (7/10) - Green bar
- Grammar: 60% (6/10) - Green bar
- Vocabulary: 50% (5/10) - Red bar ⚠️

**Actions:**
- "Back to Roadmap" button
- "View New Roadmap →" button (if band UP)

---

#### 6.5. Backend Band Estimation Logic

**BandEstimationService Algorithm:**

```typescript
Input: 
- answers (student responses)
- time_per_question (seconds)
- IeltsBandTest record

Process:
1. Calculate accuracy = correct / total * 100
2. Calculate responseTimeFactor = actualTime / expectedTime
3. Fetch last 5 band tests for consistency
4. Calculate consistency = 100 - variance(last_5_accuracies)
5. Count severe errors (< 40% accuracy in any skill)

Determine Band Change:
- UP if:
  * accuracy >= 80% AND responseTimeFactor >= 0.95 AND consistency >= 60% AND severeErrors <= 1
  OR
  * accuracy >= 70% AND consistency >= 50% AND last_3_sessions >= 70%
  
- DOWN if:
  * accuracy < 50% AND errorCount >= 50%
  OR
  * severeErrors >= 3
  
- STABLE: otherwise

Calculate New Band:
- UP: currentBand + 0.5
- DOWN: currentBand - 0.5
- STABLE: currentBand
- Clamp between 1.0 and 9.0

Confidence:
- LOW if responseTimeFactor < 0.3 (too fast, suspicious)
- HIGH if responseTimeFactor >= 0.95 AND consistency >= 60%
- MEDIUM otherwise

Recommendation:
- ADVANCE if band UP
- REMEDIAL if band DOWN
- MAINTAIN if band STABLE
```

---

#### 6.6. Auto-Regenerate Roadmap on Band UP

**Khi band thay đổi từ 4.0 → 4.5:**

**Backend tự động:**
1. Mark old roadmap: `status = "completed"`
2. Create new roadmap:
   - `current_band = 4.5`
   - `target_band = 5.0`
   - Generate 30 new lessons (difficulty 4.5)
   - Reset progress to 0%

**API Called Automatically:**
```typescript
await this.ieltsAdaptiveService.regenerateRoadmap({
  enrollment_id: roadmap.enrollment_id,
  new_current_band: 4.5,
  target_band: 5.0,
});
```

**Frontend:**
- After clicking "View New Roadmap →"
- Navigate to `/ielts-adaptive/roadmap`
- Should see: Band display (4.5 → 5.0), NEW 30 lessons, progress 0%

---

## 📊 Database Records Created

### Sau khi complete test flow:

**IeltsAdaptiveRoadmap:**
```sql
id=1, current_band=4.0, target_band=5.0, progress_percent=83.33, status="completed"
id=2, current_band=4.5, target_band=5.0, progress_percent=0, status="active"
```

**IeltsLesson:** (30 lessons cho roadmap 1, 30 cho roadmap 2)
```sql
roadmap_id=1, skill_area="reading", status="completed", lesson_order=1
roadmap_id=1, skill_area="reading", status="completed", lesson_order=2
...
roadmap_id=2, skill_area="reading", status="unlocked", lesson_order=1
```

**IeltsPracticeSession:** (2 records per lesson = 50 sessions)
```sql
lesson_id=1, session_type="WARMUP", accuracy_percent=100
lesson_id=1, session_type="MINI_TEST", accuracy_percent=66.67
```

**IeltsBandTest:**
```sql
id=1, roadmap_id=1, accuracy_percent=75, band_change="UP", estimated_band=4.5
```

**IeltsSkillProgress:** (6 records per roadmap)
```sql
roadmap_id=1, skill_area="reading", avg_accuracy=78.5, lessons_completed=5
roadmap_id=1, skill_area="listening", avg_accuracy=72.0, lessons_completed=5
...
```

---

## 🔍 API Endpoints Summary

### Roadmap Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ielts-adaptive/roadmap` | Create new roadmap |
| GET | `/ielts-adaptive/roadmap/enrollment/:enrollmentId` | Get active roadmap |
| POST | `/ielts-adaptive/roadmap/:id/unlock-next` | Unlock next lesson |

### Lesson Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ielts-adaptive/lesson/:id` | Get lesson with content |
| POST | `/ielts-adaptive/lesson/:id/complete` | Mark lesson completed |

### Practice Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ielts-adaptive/practice/submit` | Submit practice/mini-test answers |

### Band Test Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ielts-adaptive/band-test` | Create new band test |
| POST | `/ielts-adaptive/band-test/submit` | Submit test and get results |
| GET | `/ielts-adaptive/band-test/:id` | Get test details |

### Progress Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ielts-adaptive/progress/enrollment/:enrollmentId` | Get skill progress breakdown |

---

## 🎯 Key Features Implemented

### ✅ Backend (NestJS + Prisma)

1. **Complex Band Estimation Algorithm**
   - Multiple thresholds (accuracy, time, consistency, errors)
   - Confidence level detection
   - Suspicious answer detection (too fast)

2. **Automatic Roadmap Regeneration**
   - Triggered on band UP/DOWN
   - Generates 30 new lessons with increased difficulty
   - Preserves enrollment relationship

3. **Skill Progress Tracking**
   - Per-skill accuracy tracking
   - Lessons completed count
   - Last practice timestamp

4. **Practice Session Management**
   - Separate WARMUP (practice) vs MINI_TEST sessions
   - Detailed results with question review
   - Time tracking per question

### ✅ Frontend (React + TypeScript)

1. **Roadmap Page**
   - Visual band progress (current → target)
   - 30 lesson cards with status colors
   - Band test availability at 80%+
   - Responsive grid layout

2. **Lesson Page**
   - Multi-phase flow (flashcards → practice → mini-test → results)
   - Answer selection with timing
   - Progress bar and phase indicators
   - Detailed results review

3. **Band Test Page**
   - Skill selection setup
   - Question-by-question interface
   - Comprehensive results display
   - Band change visualization with colors
   - Skills breakdown charts

---

## 🐛 Troubleshooting

### Backend không start

```bash
# Check NestJS errors
cd ed_vision_backend
npm run start:dev

# Common issues:
# 1. Missing dependencies
npm install

# 2. Prisma not generated
npx prisma generate

# 3. Database migration pending
npx prisma migrate dev
```

### Frontend compile errors

```bash
cd Ed_Vision

# Check TypeScript errors
npm run build

# Common issues:
# 1. Missing dependencies
npm install axios react-router-dom

# 2. Type errors - check imports
```

### Seed file fails

```bash
# Check database connection
cd ed_vision_backend
npx prisma studio

# Re-run seed
node prisma/seedIeltsAdaptive.js
```

### JWT Authentication issues

```bash
# Frontend: Ensure token in localStorage
localStorage.setItem('token', 'YOUR_JWT_TOKEN');

# Backend: Check JWT_SECRET in .env
JWT_SECRET=your-secret-key
```

---

## 📝 Next Steps

### Recommendations for Production:

1. **Extend Question Bank**
   - Add more questions for bands 5.0-9.0
   - Diversify question types (fill-in-blank, matching, etc.)

2. **Enhance Flashcards**
   - Add images/audio for better engagement
   - Implement spaced repetition algorithm

3. **Advanced Analytics**
   - Time-series charts for progress tracking
   - Skill radar charts
   - Comparative analysis with other students

4. **Mobile Responsiveness**
   - Test on mobile devices
   - Add touch gestures for flashcards

5. **Gamification**
   - Add XP/points system
   - Achievements/badges
   - Leaderboards

---

## ✅ Completion Checklist

- [ ] Database schema migrated
- [ ] Backend module imported in app.module.ts
- [ ] Seed data loaded (11+ questions)
- [ ] Frontend routes configured
- [ ] Backend running on :3000
- [ ] Frontend running on :5173
- [ ] Can create roadmap via API
- [ ] Can view roadmap page
- [ ] Can complete lesson flow
- [ ] Can take and submit band test
- [ ] Can see band change results
- [ ] New roadmap generated on band UP

---

## 📧 Support

Nếu gặp vấn đề, kiểm tra:
1. Database connection (Prisma Studio)
2. Backend console logs (NestJS)
3. Frontend console logs (Browser DevTools)
4. Network tab for API errors (F12)

**Happy Learning! 🚀📚**
