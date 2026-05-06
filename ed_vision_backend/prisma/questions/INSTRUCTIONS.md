# IELTS Adaptive – Question Bank Instructions

## Cấu trúc thư mục

```
prisma/questions/
├── INSTRUCTIONS.md          ← file này
├── band_test_questions.json ← 300 câu hỏi Band Test (trộn ngẫu nhiên theo band)
├── audio/                   ← thư mục file nghe
│   ├── part1_housing.mp3
│   ├── part2_tourism.mp3
│   └── ...
└── (các file JSON bổ sung theo chủ đề)
```

---

## Cách đặt file nghe (Audio)

1. Copy file `.mp3` / `.ogg` vào thư mục **`prisma/questions/audio/`**
2. Đặt tên file rõ ràng: `part1_<topic>_band<X>.mp3`
   - Ví dụ: `part1_housing_band4.mp3`, `part2_travel_band6.mp3`
3. Trong JSON, trường `mediaAudioUrl` dùng path tương đối:
   ```json
   "mediaAudioUrl": "/audio/part1_housing_band4.mp3"
   ```
4. Backend sẽ serve file tĩnh qua endpoint `/uploads/audio/...`
   → Copy thêm file vào **`ed_vision_backend/uploads/audio/`** để backend có thể serve.

> **Hiện tại chưa có file nghe thật:** Trong seed, trường `mediaAudioUrl` để `null`.
> Khi có file thật, chạy lại `node prisma/seedBandTestQuestions.js` sẽ update.

---

## Cách đánh giá Writing

Writing trong Band Test hiện tại được đánh giá theo cơ chế:

| Phương pháp | Mô tả |
|---|---|
| **Word count check** | Bài viết phải ≥ 150 từ (Task 1) / ≥ 250 từ (Task 2) |
| **Keyword matching** | Hệ thống kiểm tra từ khoá liên quan đến đề bài |
| **Band score mapping** | Word count + keyword → điểm ước lượng band |

### Rubric ước tính (dùng trong `evaluation.service.ts`)

| Tiêu chí | Trọng số |
|---|---|
| Task Achievement | 25% |
| Coherence & Cohesion | 25% |
| Lexical Resource | 25% |
| Grammatical Range | 25% |

> **Lưu ý:** Đánh giá Writing chính xác đòi hỏi AI (GPT/Gemini). Hệ thống hiện dùng
> rule-based scoring. Nếu muốn tích hợp AI scoring, thêm API key vào `.env`:
> ```
> OPENAI_API_KEY=sk-...
> WRITING_EVAL_MODEL=gpt-4o
> ```

---

## Cách thêm câu hỏi vào `band_test_questions.json`

### Cấu trúc 1 câu hỏi MCQ:

```json
{
  "id": "bt_r_001",
  "skill": "reading",
  "bandMin": 4.0,
  "bandMax": 5.5,
  "difficulty": "easy",
  "type": "single_choice",
  "stem": "Câu hỏi ở đây",
  "readingPassage": "Đoạn văn (nếu có, để null nếu không có)",
  "mediaAudioUrl": null,
  "estimatedSeconds": 60,
  "errorType": "skimming",
  "options": [
    { "key": "A", "text": "Đáp án A", "isCorrect": false },
    { "key": "B", "text": "Đáp án B", "isCorrect": true },
    { "key": "C", "text": "Đáp án C", "isCorrect": false },
    { "key": "D", "text": "Đáp án D", "isCorrect": false }
  ],
  "explanation": "Giải thích tại sao B đúng"
}
```

### Cấu trúc câu True/False/Not Given:

```json
{
  "id": "bt_r_010",
  "skill": "reading",
  "bandMin": 4.0,
  "bandMax": 6.0,
  "difficulty": "medium",
  "type": "true_false_ng",
  "stem": "Statement cần đánh giá T/F/NG",
  "readingPassage": "Đoạn văn liên quan",
  "mediaAudioUrl": null,
  "estimatedSeconds": 45,
  "errorType": "detail",
  "options": [
    { "key": "TRUE", "text": "True", "isCorrect": true },
    { "key": "FALSE", "text": "False", "isCorrect": false },
    { "key": "NOT_GIVEN", "text": "Not Given", "isCorrect": false }
  ],
  "explanation": "Giải thích"
}
```

### Cấu trúc câu Gap Fill:

```json
{
  "id": "bt_l_010",
  "skill": "listening",
  "bandMin": 4.5,
  "bandMax": 6.0,
  "difficulty": "medium",
  "type": "gap_fill",
  "stem": "The meeting is scheduled for ___.",
  "readingPassage": null,
  "mediaAudioUrl": "/audio/part1_meeting.mp3",
  "estimatedSeconds": 50,
  "errorType": "listening_detail",
  "correctAnswer": "Tuesday",
  "explanation": "Speaker says 'scheduled for Tuesday'"
}
```

### Quy tắc `bandMin` / `bandMax`:

| Mức band | bandMin | bandMax | difficulty |
|---|---|---|---|
| Dưới 5.0 | 4.0 | 5.0 | easy |
| 5.0 – 5.5 | 5.0 | 5.5 | medium |
| 5.5 – 6.0 | 5.5 | 6.0 | medium |
| 6.0 – 7.0 | 6.0 | 7.0 | hard |
| 7.0+ | 7.0 | 9.0 | hard |

### `estimatedSeconds` theo skill và difficulty:

| Skill | easy | medium | hard |
|---|---|---|---|
| Reading MCQ | 50s | 70s | 90s |
| Reading T/F/NG | 40s | 55s | 70s |
| Listening | 35s | 50s | 65s |
| Grammar | 30s | 45s | 60s |
| Vocabulary | 25s | 40s | 55s |
| Writing | 600s | 900s | 1200s |

---

## Seed câu hỏi vào DB

```bash
cd ed_vision_backend
node prisma/seedBandTestQuestions.js
```

Script này:
1. Đọc `prisma/questions/band_test_questions.json`
2. Upsert vào bảng `IeltsQuestion` (keyed bởi `id`)
3. **Không xoá** câu hỏi cũ → an toàn chạy nhiều lần
4. In ra số câu được thêm / cập nhật

---

## Cơ chế trộn câu hỏi Band Test

Khi học sinh làm Band Test:
1. Backend lấy tất cả câu hỏi trong DB
2. **Lọc theo band hiện tại** của học sinh: ưu tiên câu có `bandMin ≤ currentBand + 1.0`
3. **Trộn ngẫu nhiên** với tỷ lệ:
   - 40% câu ở mức band hiện tại (core)
   - 35% câu ở mức band thấp hơn (review)
   - 25% câu ở mức band cao hơn (challenge)
4. Lấy tối đa 20 câu mỗi lần test (có thể cấu hình)
5. Mỗi lần test khác nhau → không lặp lại

Xem thêm logic trong `ielts-adaptive.service.ts` → `startBandTest()`.
