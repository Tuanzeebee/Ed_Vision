# Implementation Tasks — Listening Data Processing Fix

## Tasks

- [x] 1. Fix Bug 1: OCR Image Extraction — Text/Watermark Detection
  - [x] 1.1 Add `numpy` import and dependency check to `pdf_image_extractor.py`
  - [x] 1.2 Implement `is_text_only_image()` function using pixel-level white-ratio + dark-pixel variance analysis
  - [x] 1.3 Implement `is_watermark_by_aspect_and_size()` function using aspect ratio and compressed size heuristics
  - [x] 1.4 Update `save_optimised_webp()` to call both detection functions and skip text-only images
  - [x] 1.5 Verify existing images without text overlay are still extracted correctly (preservation check)

- [x] 2. Fix Bug 2: Audio Chunking — Whisper Method
  - [x] 2.1 Add `MIN_CHUNK_DURATION_BY_PART` and `WHISPER_PRE_MARKER_BUFFER_MS` constants
  - [x] 2.2 Update `whisper_split()` to apply pre-marker buffer when computing chunk end time
  - [x] 2.3 Update `whisper_split()` to use part-aware minimum duration validation with look-ahead extension

- [x] 3. Fix Bug 2: Audio Chunking — Silence Method
  - [x] 3.1 Implement `_estimate_part_for_position()` helper for proportional TOEIC part estimation
  - [x] 3.2 Implement `_merge_short_segments()` to merge consecutive short silence-detected segments
  - [x] 3.3 Update `silence_split()` to call `_merge_short_segments()` before mapping to TOEIC slots
  - [x] 3.4 Verify merged segment count is reasonable (close to 100 questions or 48 talk-level segments)
