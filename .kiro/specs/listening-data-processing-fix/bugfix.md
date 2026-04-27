# Bugfix Requirements Document

## Introduction

Hệ thống Ed_Vision backend hiện có 2 bugs nghiêm trọng trong chức năng nạp và quản lý dữ liệu TOEIC Listening:

**Bug 1 - OCR xử lý ảnh có text overlay không đúng:** Khi file PDF chứa ảnh có text overlay (ví dụ: watermark "Zenlish - Học TOEIC 1 lần là Đạt"), hệ thống OCR extract text thay vì giữ nguyên ảnh gốc. Điều này gây mất ảnh quan trọng cho phần Listening (Part 1 - photo descriptions).

**Bug 2 - Audio chunking không chính xác:** Hệ thống sử dụng Whisper AI kết hợp silence detection để cắt audio 45 phút thành các chunks cho từng câu hỏi (1-100), nhưng kết quả không khớp với cấu trúc câu hỏi thực tế. Có đoạn audio quá ngắn (4 giây), thiếu (dừng trước khi hết câu), hoặc thừa (chạy qua câu khác).

Cả 2 bugs này ảnh hưởng trực tiếp đến chất lượng học tập của học viên trong hệ thống TOEIC.

---

## Bug Analysis

### Current Behavior (Defect)

#### Bug 1: OCR Image Extraction

1.1 WHEN file PDF chứa ảnh có text overlay (watermark, caption) THEN hệ thống extract text từ ảnh và lưu text dưới dạng image, bỏ mất ảnh gốc

1.2 WHEN file PDF chứa ảnh thuần túy (không có text) THEN hệ thống lấy ảnh về folder uploads bình thường

1.3 WHEN Python script `pdf_image_extractor.py` xử lý PDF với ảnh có text THEN script không có cơ chế loại bỏ text overlay trước khi lưu ảnh

#### Bug 2: Audio Chunking

1.4 WHEN hệ thống cắt audio 45 phút (câu 1-100) bằng Whisper AI + silence detection THEN các audio chunks không khớp chính xác với từng câu hỏi

1.5 WHEN audio chunk được tạo ra THEN có đoạn chỉ 4 giây (quá ngắn cho 1 câu hỏi TOEIC)

1.6 WHEN audio chunk được tạo ra THEN có đoạn thiếu (dừng trước khi đọc xong câu hỏi và 4 đáp án)

1.7 WHEN audio chunk được tạo ra THEN có đoạn thừa (chạy qua câu hỏi khác mới dừng)

1.8 WHEN `audio_chunker.py` sử dụng Whisper để phát hiện "Number X" markers THEN không phát hiện được cấu trúc câu hỏi TOEIC (part announcement + question + 4 đáp án A/B/C/D)

1.9 WHEN `audio_chunker.py` sử dụng silence detection THEN chỉ dựa vào khoảng im lặng mà không xác định được ranh giới chính xác của câu hỏi

### Expected Behavior (Correct)

#### Bug 1: OCR Image Extraction

2.1 WHEN file PDF chứa ảnh có text overlay (watermark, caption) THEN hệ thống SHALL xử lý loại bỏ text overlay và giữ nguyên ảnh gốc để lưu vào folder uploads

2.2 WHEN file PDF chứa ảnh thuần túy (không có text) THEN hệ thống SHALL tiếp tục lấy ảnh về folder uploads như hiện tại

2.3 WHEN Python script `pdf_image_extractor.py` xử lý PDF với ảnh có text THEN script SHALL áp dụng kỹ thuật image processing (OCR detection + inpainting hoặc masking) để loại bỏ text overlay trước khi lưu ảnh

2.4 WHEN ảnh được lưu vào uploads THEN ảnh SHALL không chứa text overlay nhưng vẫn giữ nguyên nội dung hình ảnh gốc với độ chính xác cao

#### Bug 2: Audio Chunking

2.5 WHEN hệ thống cắt audio 45 phút (câu 1-100) THEN mỗi audio chunk SHALL tương ứng chính xác với 1 câu hỏi hoàn chỉnh (bao gồm part announcement nếu có + question + 4 đáp án)

2.6 WHEN audio chunk được tạo ra cho Part 1 (câu 1-6) THEN chunk SHALL chứa đầy đủ 4 đáp án A/B/C/D cho câu hỏi photo description

2.7 WHEN audio chunk được tạo ra cho Part 2 (câu 7-31) THEN chunk SHALL chứa câu hỏi + 3 đáp án A/B/C

2.8 WHEN audio chunk được tạo ra cho Part 3 (câu 32-70) THEN chunk SHALL chứa đoạn hội thoại + 3 câu hỏi + 12 đáp án (3 câu × 4 đáp án)

2.9 WHEN audio chunk được tạo ra cho Part 4 (câu 71-100) THEN chunk SHALL chứa bài nói ngắn + 3 câu hỏi + 12 đáp án (3 câu × 4 đáp án)

2.10 WHEN `audio_chunker.py` phát hiện cấu trúc câu hỏi THEN script SHALL nhận diện được:
- Part announcement ("Part 1", "Part 2", v.v.)
- Question number ("Number 1", "Câu 1", v.v.)
- Đáp án được đọc ("A", "B", "C", "D" hoặc "Option A", v.v.)
- Kết thúc đáp án cuối cùng (silence sau đáp án D hoặc C)

2.11 WHEN audio chunk duration được tính toán THEN duration SHALL phù hợp với cấu trúc TOEIC:
- Part 1: ~15-25 giây/câu (4 đáp án ngắn)
- Part 2: ~8-15 giây/câu (3 đáp án ngắn)
- Part 3: ~40-60 giây/talk (hội thoại + 3 câu hỏi)
- Part 4: ~40-60 giây/talk (bài nói + 3 câu hỏi)

### Unchanged Behavior (Regression Prevention)

#### Bug 1: OCR Image Extraction

3.1 WHEN file PDF không chứa ảnh THEN hệ thống SHALL CONTINUE TO xử lý OCR text bình thường như hiện tại

3.2 WHEN hệ thống import TOEIC Reading (Parts 5-7) THEN hệ thống SHALL CONTINUE TO xử lý text extraction như hiện tại (không cần xử lý ảnh)

3.3 WHEN hệ thống lưu ảnh vào folder structure `uploads/TOEIC/toeic-listening-exam/{slug}/images/` THEN folder structure và naming convention SHALL CONTINUE TO giữ nguyên

3.4 WHEN hệ thống map ảnh vào Part 1 items trong database THEN logic mapping (sort by size_bytes, filter > 10KB) SHALL CONTINUE TO hoạt động như hiện tại

3.5 WHEN hệ thống xử lý PDF với skill_area khác listening (reading, speaking, writing) THEN image extraction logic SHALL CONTINUE TO hoạt động như hiện tại

#### Bug 2: Audio Chunking

3.6 WHEN hệ thống upload audio file thủ công cho từng câu hỏi (endpoint `/upload-listening-audio`) THEN mapping logic theo part + track_number SHALL CONTINUE TO hoạt động như hiện tại

3.7 WHEN hệ thống lưu audio chunks vào folder `uploads/TOEIC/toeic-listening-exam/{slug}/audio/` THEN folder structure và naming convention SHALL CONTINUE TO giữ nguyên

3.8 WHEN audio chunks được map vào database `LearningRepositoryItem.media_audio_url` THEN database schema và mapping logic SHALL CONTINUE TO hoạt động như hiện tại

3.9 WHEN hệ thống xử lý audio cho skill_area khác listening THEN audio processing logic SHALL CONTINUE TO không bị ảnh hưởng

3.10 WHEN Whisper transcription được sử dụng cho mục đích khác (STT service, transcript generation) THEN Whisper functionality SHALL CONTINUE TO hoạt động độc lập không bị ảnh hưởng

---

## Bug Condition Specification

### Bug 1: OCR Image Extraction with Text Overlay

**Bug Condition Function:**
```pascal
FUNCTION isBugCondition_ImageWithText(X)
  INPUT: X of type PDFImageInput
    WHERE X.image_data: binary image data from PDF
          X.has_text_overlay: boolean (detected by OCR)
          X.skill_area: string ("listening")
  OUTPUT: boolean
  
  // Returns true when image has text overlay in listening section
  RETURN (X.has_text_overlay = true) AND (X.skill_area = "listening")
END FUNCTION
```

**Property: Fix Checking**
```pascal
// Property: Images with text overlay should have text removed
FOR ALL X WHERE isBugCondition_ImageWithText(X) DO
  result ← extractAndSaveImage'(X)
  ASSERT (result.image_saved = true) AND 
         (result.text_overlay_removed = true) AND
         (result.original_content_preserved = true) AND
         (result.file_size > 10000)  // Not a tiny logo
END FOR
```

**Counterexample:**
```
Input: PDF page with image containing watermark "Zenlish - Học TOEIC 1 lần là Đạt"
Current Output: Text extracted, image lost
Expected Output: Image saved with watermark removed
```

### Bug 2: Audio Chunking Misalignment

**Bug Condition Function:**
```pascal
FUNCTION isBugCondition_AudioChunk(X)
  INPUT: X of type AudioChunkInput
    WHERE X.audio_file: 45-minute TOEIC listening audio (questions 1-100)
          X.chunking_method: "whisper" OR "silence"
          X.expected_structure: TOEIC structure (Parts 1-4)
  OUTPUT: boolean
  
  // Returns true when audio needs accurate question-level chunking
  RETURN (X.audio_file.duration_minutes >= 30) AND 
         (X.expected_structure.total_questions = 100) AND
         (X.chunking_method IN ["whisper", "silence", "both"])
END FUNCTION
```

**Property: Fix Checking**
```pascal
// Property: Each audio chunk must align with complete question structure
FOR ALL X WHERE isBugCondition_AudioChunk(X) DO
  chunks ← chunkAudio'(X)
  
  FOR EACH chunk IN chunks DO
    part ← chunk.part
    q_num ← chunk.question_number
    
    // Verify chunk contains complete question structure
    ASSERT chunk.contains_question_announcement = true
    ASSERT chunk.contains_all_answer_options = true
    
    // Verify duration is reasonable for the part
    IF part = 1 THEN
      ASSERT 15 <= chunk.duration_seconds <= 25
    ELSE IF part = 2 THEN
      ASSERT 8 <= chunk.duration_seconds <= 15
    ELSE IF part IN [3, 4] THEN
      ASSERT 40 <= chunk.duration_seconds <= 60
    END IF
    
    // Verify no overlap or gap with adjacent chunks
    IF chunk.index < chunks.length - 1 THEN
      next_chunk ← chunks[chunk.index + 1]
      ASSERT chunk.end_time = next_chunk.start_time  // No gap or overlap
    END IF
  END FOR
  
  // Verify total coverage
  ASSERT chunks.length = 100 OR chunks.length = 48  // 100 questions or 48 segments
  ASSERT chunks[0].start_time ≈ 0
  ASSERT chunks[last].end_time ≈ X.audio_file.duration
END FOR
```

**Counterexample:**
```
Input: 45-minute TOEIC audio file (questions 1-100)
Current Output: 
  - Chunk for Q5: 4 seconds (too short, missing answer options)
  - Chunk for Q12: ends mid-answer (incomplete)
  - Chunk for Q20: includes part of Q21 (overlap)
Expected Output:
  - Chunk for Q5: 18 seconds (complete: question + 4 answers A/B/C/D)
  - Chunk for Q12: 12 seconds (complete: question + 3 answers A/B/C)
  - Chunk for Q20: 11 seconds (ends after answer C, before Q21 starts)
```

### Preservation Goal

```pascal
// Property: Preservation Checking
// For inputs that don't trigger the bug conditions, behavior must remain unchanged

// Bug 1 Preservation
FOR ALL X WHERE NOT isBugCondition_ImageWithText(X) DO
  ASSERT extractAndSaveImage(X) = extractAndSaveImage'(X)
END FOR

// Bug 2 Preservation
FOR ALL X WHERE NOT isBugCondition_AudioChunk(X) DO
  ASSERT chunkAudio(X) = chunkAudio'(X)
END FOR
```

**Key Definitions:**
- **F**: Original (unfixed) functions - `extractAndSaveImage()`, `chunkAudio()`
- **F'**: Fixed functions - `extractAndSaveImage'()`, `chunkAudio'()`
- **C(X)**: Bug conditions defined above
- **¬C(X)**: Non-buggy inputs (images without text, non-TOEIC audio, manual uploads, etc.)
