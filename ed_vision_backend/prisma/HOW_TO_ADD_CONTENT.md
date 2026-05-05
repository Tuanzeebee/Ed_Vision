# 📚 HƯỚNG DẪN THÊM NỘI DUNG MỚI CHO IELTS ADAPTIVE

## 🎯 Nguyên tắc quan trọng

### ✅ PHẢI LÀM:
1. **Mỗi band level phải có nội dung KHÁC NHAU**
   - Band 4.0 → Chủ đề đơn giản (daily routine, shopping, family)
   - Band 4.5 → Chủ đề hằng ngày mở rộng (public transport, education)
   - Band 5.0 → Chủ đề học thuật cơ bản (exercise, environment)
   - Band 5.5 → Chủ đề phức tạp hơn (social media, technology)
   - Band 6.0+ → Chủ đề học thuật nâng cao (AI, climate change)

2. **Tăng độ khó dần**
   - Reading passages: Dài hơn, từ vựng phức tạp hơn
   - Grammar: Từ simple tense → advanced structures
   - Vocabulary: Từ cơ bản → academic words

3. **Sử dụng nguồn JSON thay vì hardcode**
   - Tất cả content trong `learning_content.json`
   - KHÔNG hardcode trong seed scripts

### ❌ KHÔNG LÀM:
1. ❌ Copy-paste cùng passage/audio cho nhiều band
2. ❌ Hardcode content trong seedIeltsAdaptive.js
3. ❌ Dùng cùng câu hỏi cho nhiều band levels

## 📝 Cấu trúc file learning_content.json

```json
{
  "content": {
    "band40": {
      "reading": {
        "passage": "Bài đọc đơn giản cho Band 4.0...",
        "flashcards": [
          { "term": "routine", "definition": "something you do regularly", "hint": "daily habits" }
        ],
        "practice": [
          {
            "type": "single_choice",
            "stem": "What is the main topic?",
            "options": [...],
            "explanation": "...",
            "estimatedSeconds": 30
          }
        ],
        "miniTest": [...]
      },
      "listening": {...},
      "grammar": {...},
      "vocabulary": {...}
    },
    "band45": {
      // Nội dung KHÁC cho Band 4.5
    },
    "band50": {...},
    "band55": {...},
    "band60": {...}
  }
}
```

## 🔧 Các bước thêm nội dung mới

### 1. Thêm band level mới

Nếu muốn thêm Band 6.5, 7.0, v.v.:

**a) Cập nhật learning_content.json:**
```json
"band65": {
  "reading": {
    "passage": "Complex academic text about quantum computing...",
    ...
  }
}
```

**b) Cập nhật seedLearningContent.js:**
```javascript
const bandMap = {
    band40: { min: 400, max: 440, label: 'Band 4.0' },
    // ... existing bands ...
    band65: { min: 650, max: 690, label: 'Band 6.5' },  // THÊM MỚI
    band70: { min: 700, max: 1000, label: 'Band 7.0+' }, // THÊM MỚI
};
```

### 2. Thêm flashcards mới

```json
{
  "term": "revolutionary",
  "definition": "involving a dramatic change",
  "hint": "transformative, groundbreaking"
}
```

### 3. Thêm practice questions

```json
{
  "type": "single_choice",
  "stem": "According to the passage, what is the main challenge?",
  "options": [
    { "key": "A", "text": "Cost", "isCorrect": true },
    { "key": "B", "text": "Time", "isCorrect": false },
    { "key": "C", "text": "Technology", "isCorrect": false },
    { "key": "D", "text": "People", "isCorrect": false }
  ],
  "explanation": "The passage states 'high start-up costs'...",
  "estimatedSeconds": 45,
  "errorType": "Đọc hiểu chi tiết"
}
```

### 4. Thêm Band Test questions

File: `prisma/questions/band_test_questions.json`

```json
{
  "id": "bt_r_101",
  "skill": "reading",
  "bandMin": 6.5,
  "bandMax": 7.5,
  "difficulty": "hard",
  "type": "single_choice",
  "stem": "The author's primary argument is that...",
  "options": [...],
  "explanation": "...",
  "estimatedSeconds": 90
}
```

## 🚀 Commands để seed data

```bash
# 1. Xóa data cũ (nếu cần)
node clean-hardcoded-content.js

# 2. Seed toàn bộ từ JSON
node prisma/seed-all-ielts.js

# 3. Kiểm tra dữ liệu
node check-data.js

# 4. Kiểm tra tính đa dạng (phát hiện duplicate)
node check-content-diversity.js
```

## 📊 Ví dụ progression độ khó

### Reading Passages

**Band 4.0:** "My Daily Routine" (100 words, present simple)
- Chủ đề: Sinh hoạt hằng ngày
- Grammar: Simple tenses only
- Vocabulary: Basic 500 words

**Band 5.0:** "Benefits of Exercise" (200 words, present perfect, modal verbs)
- Chủ đề: Sức khỏe
- Grammar: Present perfect, modals
- Vocabulary: Academic Word List Level 1

**Band 6.0:** "AI Impact on Employment" (350 words, complex sentences)
- Chủ đề: Công nghệ & Xã hội
- Grammar: Passive voice, conditionals, relative clauses
- Vocabulary: Academic Word List Level 2-3

### Grammar Focus

**Band 4.0:**
- Simple Present/Past/Future
- Basic prepositions
- Articles (a/an/the)

**Band 5.0:**
- Present Perfect vs Past Simple
- Comparatives & Superlatives
- Modal verbs (can, should, must)

**Band 6.0:**
- Passive voice (all tenses)
- Conditional Type 2 & 3
- Reported speech
- Relative clauses

### Vocabulary

**Band 4.0:** big, happy, good, fast → Basic adjectives
**Band 5.0:** essential, maintain, demonstrate → High-frequency academic
**Band 6.0:** mitigate, proliferate, substantiate → Advanced academic

## 🔍 Kiểm tra chất lượng

### Checklist trước khi seed:

- [ ] Mỗi band có passage KHÁC NHAU
- [ ] Độ dài passage tăng dần: 100 → 200 → 350+ words
- [ ] Flashcards không trùng lặp giữa các band
- [ ] Practice questions có độ khó khác biệt rõ ràng
- [ ] Mini-test câu hỏi KHÔNG copy-paste
- [ ] estimatedSeconds phù hợp với độ khó

### Chạy verification:

```bash
node check-content-diversity.js
```

Nếu output hiển thị:
```
✅ Tất cả nội dung đều độc nhất cho mỗi band level!
```
→ Bạn đã làm đúng! 🎉

## 💡 Tips

1. **Tham khảo nguồn IELTS chính thức:**
   - IELTS.org sample materials
   - Cambridge IELTS books
   - British Council practice tests

2. **Sử dụng AI để tạo content (với kiểm duyệt):**
   - ChatGPT/Claude để tạo passages
   - Nhưng PHẢI review kỹ trước khi thêm vào

3. **Test trên frontend sau khi seed:**
   - Đảm bảo hiển thị đúng
   - Kiểm tra không có lỗi parse JSON
   - Verify độ khó phù hợp

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra lỗi JSON parse: `node prisma/seedLearningContent.js`
2. Xem log chi tiết: `node check-content-diversity.js`
3. Verify database: `node check-data.js`
