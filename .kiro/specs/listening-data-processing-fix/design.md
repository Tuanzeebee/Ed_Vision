# Design Document — Listening Data Processing Fix

## Overview

Hai bugs được fix trực tiếp trong 2 Python scripts:
- `ml_service/pdf_image_extractor.py` — Bug 1: OCR/image extraction
- `ml_service/audio_chunker.py` — Bug 2: Audio chunking

Không thay đổi TypeScript service layer, database schema, hay API contracts.

---

## Bug 1: OCR Image Extraction — Root Cause & Fix

### Root Cause

`pdf_image_extractor.py` dùng `fitz.Document.extract_image()` (PyMuPDF) để lấy từng embedded image object trong PDF. Vấn đề là các file PDF TOEIC từ nhà xuất bản (ví dụ Zenlish) nhúng **watermark/logo như một image object riêng biệt** — không phải text layer. Khi script extract, nó lấy cả watermark image này vì:

1. Kích thước > 80×80px (vượt qua `min_width`/`min_height` filter)
2. File size > 10KB (vượt qua filter trong service layer)
3. Không có cơ chế phân biệt "ảnh chụp thực" vs "ảnh chứa text"

Kết quả: file `*_p003_img01.webp` được lưu chỉ chứa text "Zenlish - Học TOEIC 1 lần là Đạt" trên nền trắng.

### Solution

Thêm 2 hàm detection vào `save_optimised_webp()`:

**`is_text_only_image(pil_img)`** — Pixel-level analysis:
1. Convert sang grayscale, resize thumbnail 300×300 để tăng tốc
2. Đếm near-white pixels (value ≥ 240)
3. Nếu white_ratio > 85% → ảnh có nền trắng chiếm đa số
4. Kiểm tra variance của dark pixels: nếu `std < 40` → dark pixels rất đồng đều (text) → skip
5. Nếu dark pixels có variance cao → có thể là ảnh thật với nền sáng → giữ lại

**`is_watermark_by_aspect_and_size(w, h, size_bytes)`** — Geometric heuristic:
- Aspect ratio > 5:1 hoặc < 1:5 → banner/strip watermark → skip
- Compressed size < 15KB → quá nhỏ để là ảnh chụp thực → skip

Cả 2 checks được áp dụng trong `save_optimised_webp()` với flag `skip_text_images=True` (default).

### Preservation

- Ảnh thuần túy (không có text): `is_text_only_image` trả về False vì dark pixels có variance cao (ảnh chụp thực có nhiều màu sắc)
- Ảnh đen trắng thực (như ảnh tuyết trong screenshot): white_ratio có thể cao nhưng dark_std sẽ > 40 vì có gradient, texture
- Các skill area khác: không thay đổi logic

---

## Bug 2: Audio Chunking — Root Cause & Fix

### Root Cause

**Whisper method:**
Khi Whisper detect được "Number 5" tại t=45s và "Number 6" tại t=63s, chunk cho câu 5 được cắt từ 45s → 63s. Nhưng thực tế:
- 45s: "Number 5" được đọc
- 46-50s: Câu hỏi được đọc
- 51-62s: Đáp án A, B, C, D được đọc
- 63s: "Number 6" bắt đầu

Vấn đề: Nếu Whisper detect "Number 6" tại đúng 63.0s, chunk kết thúc tại 63.0s — OK. Nhưng nếu Whisper detect sớm hơn (ví dụ 62.8s khi người đọc bắt đầu hít thở), chunk bị cắt trước khi đáp án D kết thúc.

Vấn đề nghiêm trọng hơn: Với `tiny.en` model, Whisper đôi khi detect "Number X" sai vị trí (off by 1-2 giây). Kết quả là chunk 4 giây — chỉ chứa announcement, không có câu hỏi hay đáp án.

**Silence method:**
Silence detector tìm khoảng im lặng ≥ 800ms. Trong TOEIC audio, có nhiều khoảng im lặng ngắn:
- Giữa câu hỏi và đáp án A (~0.5-1s)
- Giữa các đáp án (~0.5-1s)
- Giữa các câu hỏi (~1-2s)

Với `min_silence_ms=800`, detector có thể split tại khoảng im lặng giữa đáp án B và C, tạo ra fragment 4 giây chỉ chứa đáp án C và D.

### Solution

**Fix 1 — Whisper: Pre-marker buffer**

```python
WHISPER_PRE_MARKER_BUFFER_MS = 200
end_ms = next_marker_ms - WHISPER_PRE_MARKER_BUFFER_MS
```

Thay vì cắt đúng tại marker tiếp theo, cắt sớm hơn 200ms. Điều này đảm bảo chunk không bị cắt giữa chừng khi Whisper detect marker hơi sớm.

**Fix 2 — Whisper: Part-aware minimum duration**

```python
MIN_CHUNK_DURATION_BY_PART = {1: 10.0, 2: 6.0, 3: 30.0, 4: 30.0}
```

Nếu chunk quá ngắn so với minimum của part đó:
1. Thử extend đến marker tiếp theo (next-next)
2. Nếu vẫn không đủ → skip chunk đó

**Fix 3 — Silence: Merge short segments**

Hàm `_merge_short_segments()` được thêm vào trước khi map segments sang TOEIC slots:

```
Algorithm:
  - Walk segments in order
  - Estimate TOEIC part dựa trên vị trí tương đối trong audio
  - Accumulate segments cho đến khi duration >= min cho part đó
  - Emit merged segment
```

Ước tính part theo vị trí:
- 0-5% audio → Part 1
- 5-30% → Part 2
- 30-65% → Part 3
- 65-100% → Part 4

### Preservation

- Manual audio upload (endpoint `/upload-listening-audio`): không thay đổi
- Database mapping logic: không thay đổi
- Folder structure và naming convention: không thay đổi
- Whisper transcription cho STT service: không thay đổi (file riêng biệt)

---

## Dependencies

Bug 1 cần thêm `numpy` vào requirements:
```
numpy>=1.24.0
```

Bug 2 không cần dependency mới.

---

## Files Changed

| File | Change |
|------|--------|
| `ml_service/pdf_image_extractor.py` | Thêm `is_text_only_image()`, `is_watermark_by_aspect_and_size()`, update `save_optimised_webp()` |
| `ml_service/audio_chunker.py` | Thêm `MIN_CHUNK_DURATION_BY_PART`, `WHISPER_PRE_MARKER_BUFFER_MS`, `_merge_short_segments()`, `_estimate_part_for_position()`, update `whisper_split()`, update `silence_split()` |
