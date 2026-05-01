# Implementation Plan: OpenRouter Vision Vocab Import

## Overview

Thay thế Gemini 2.0 Flash bằng OpenRouter API trong module nhập từ vựng TOEIC. Kế hoạch triển khai theo thứ tự từ bottom-up: tạo các class độc lập trước (`RegexExtractor`, `PreviewBuilder`, `ColumnDetector`, `OpenRouterClient`), sau đó refactor `VocabImportService` để wire tất cả lại, cuối cùng viết integration tests và kiểm tra backward compatibility.

## Tasks

- [x] 1. Tạo `RegexExtractor` class
  - [x] 1.1 Tạo file `src/teacher_be/toeic-repository/regex-extractor.ts`
    - Tách logic regex extraction hiện có trong `VocabImportService` ra thành class riêng
    - Implement `extract(rawText: string): ExtractedWord[]`
    - Implement private `mergeLines(lines: string[]): string[]` để ghép dòng bị ngắt
    - Implement private `parseLine(line: string): ExtractedWord | null` với pattern `"Number. Word (pos) : Vietnamese meaning"`
    - Export `ExtractedWord` interface từ file này
    - _Requirements: 7.4, 9.4_

  - [ ]* 1.2 Viết unit tests cho `RegexExtractor`
    - Test parse dòng đúng format: `"1. abandon (v.) : từ bỏ"`
    - Test parse dòng thiếu pos, thiếu số thứ tự
    - Test input rỗng → trả về `[]`
    - Test nhiều dòng hỗn hợp hợp lệ và không hợp lệ
    - _Requirements: 7.4_

  - [ ]* 1.3 Viết property test cho `RegexExtractor` — Property 9
    - **Property 9: Invalid JSON triggers regex fallback**
    - Với bất kỳ string không phải JSON hợp lệ, `parseJsonResponse` trả về `[]`
    - **Validates: Requirements 7.4, 9.4**

- [x] 2. Tạo `PreviewBuilder` class
  - [x] 2.1 Tạo file `src/teacher_be/toeic-repository/preview-builder.ts`
    - Tách logic `buildPreview` hiện có trong `VocabImportService` ra thành class riêng
    - Implement `build(extracted: ExtractedWord[], topicId?: number): ParsedVocabWord[]`
    - Implement `classifyTopic(word: string, meaning: string): string` — keyword matching với 10 TOEIC topics
    - Implement `determineLevel(word: string): string` — ≤6 chars = "Cơ bản", ≤11 = "Trung bình", >11 = "Nâng cao"
    - Implement `normalizePos(raw: string): string` — map n→n., v→v., adj→adj., adv→adv.
    - Deduplication: giữ lại occurrence đầu tiên của mỗi `word`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 2.2 Viết unit tests cho `PreviewBuilder`
    - Test `determineLevel`: word length 6 → "Cơ bản", 7 → "Trung bình", 12 → "Nâng cao"
    - Test `normalizePos`: "n" → "n.", "verb" → "v.", chuỗi không nhận dạng được → "n."
    - Test `classifyTopic`: từ liên quan finance → "finance", fallback → "general-business"
    - Test deduplication: list có duplicate word → chỉ giữ lần đầu
    - Test input rỗng → trả về `[]`
    - _Requirements: 10.1–10.5_

  - [ ]* 2.3 Viết property test cho `PreviewBuilder` — Property 10
    - **Property 10: Deduplication by word field**
    - Với bất kỳ array `ExtractedWord[]`, `build()` trả về list không có duplicate `word`
    - **Validates: Requirements 7.5**

  - [ ]* 2.4 Viết property test cho `PreviewBuilder` — Property 13
    - **Property 13: Preview completeness**
    - Với bất kỳ `ExtractedWord` hợp lệ, `build()` trả về `ParsedVocabWord` có đủ tất cả required fields
    - **Validates: Requirements 10.1, 10.5**

  - [ ]* 2.5 Viết property test cho `PreviewBuilder` — Property 14
    - **Property 14: Topic classification always returns valid topic**
    - Với bất kỳ `word` và `meaning` string, `classifyTopic()` trả về slug thuộc 10 TOEIC topics
    - **Validates: Requirements 10.2**

  - [ ]* 2.6 Viết property test cho `PreviewBuilder` — Property 15
    - **Property 15: Level assignment follows word-length rule**
    - Với bất kỳ word string độ dài L, `determineLevel()` trả về đúng level theo quy tắc
    - **Validates: Requirements 10.3**

  - [ ]* 2.7 Viết property test cho `PreviewBuilder` — Property 16
    - **Property 16: POS normalization produces valid output**
    - Với bất kỳ raw POS string, `normalizePos()` trả về string kết thúc bằng "." và length ≤ 8
    - **Validates: Requirements 10.4**

- [x] 3. Checkpoint — Đảm bảo `RegexExtractor` và `PreviewBuilder` hoạt động đúng
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Tạo `ColumnDetector` class
  - [x] 4.1 Tạo file `src/teacher_be/toeic-repository/column-detector.ts`
    - Implement `detectColumns(imagePath: string): Promise<ColumnDetectionResult>`
    - Thuật toán: grayscale → Otsu threshold → vertical projection profile → tìm valleys (width ≥ 20px) → trả về `ColumnRegion[]`
    - Nếu không tìm được valley → trả về 1 region bao toàn bộ ảnh
    - Implement `cropToColumns(imagePath, regions, outputDir): Promise<string[]>`
    - Tên file tạm: `{basename}_col_{index}{ext}` (ví dụ: `vocab_col_0.jpg`)
    - Implement private `resizeIfNeeded(imagePath): Promise<string>` — resize nếu max dimension > 4000px
    - Export `ColumnRegion` và `ColumnDetectionResult` interfaces
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 12.5_

  - [ ]* 4.2 Viết unit tests cho `ColumnDetector`
    - Test ảnh 1 cột → trả về 1 region bao toàn bộ ảnh
    - Test ảnh 2 cột với gap rõ ràng → trả về 2 regions đúng thứ tự x
    - Test ảnh > 4000px → được resize trước khi xử lý
    - Test `cropToColumns` → file tạm được tạo đúng tên format
    - Test cleanup: file tạm bị xóa sau khi xử lý
    - _Requirements: 3.1–3.5, 4.1–4.5_

  - [ ]* 4.3 Viết property test cho `ColumnDetector` — Property 1
    - **Property 1: Column coordinate validity**
    - Với bất kỳ ảnh hợp lệ, mỗi `ColumnRegion` có tọa độ không âm, dimensions > 0, không vượt quá kích thước ảnh gốc
    - **Validates: Requirements 3.3**

  - [ ]* 4.4 Viết property test cho `ColumnDetector` — Property 2
    - **Property 2: Column ordering invariant**
    - Với bất kỳ ảnh có nhiều cột, `ColumnRegion[]` được sắp xếp tăng dần theo `x`
    - **Validates: Requirements 4.3**

  - [ ]* 4.5 Viết property test cho `ColumnDetector` — Property 3
    - **Property 3: Image crop pixel fidelity**
    - Với bất kỳ ảnh và `ColumnRegion` hợp lệ, pixel values trong ảnh con khớp chính xác với ảnh gốc tại cùng tọa độ
    - **Validates: Requirements 4.4**

  - [ ]* 4.6 Viết property test cho `ColumnDetector` — Property 4
    - **Property 4: Column filename format**
    - Với bất kỳ original filename và column index, tên file tạm khớp pattern `{basename}_col_{index}{ext}`
    - **Validates: Requirements 4.2**

  - [ ]* 4.7 Viết property test cho `ColumnDetector` — Property 18
    - **Property 18: Image resize respects max dimension**
    - Với bất kỳ ảnh có max(W, H) > 4000, sau resize cả W và H ≤ 4000 và aspect ratio được giữ nguyên (error < 0.01)
    - **Validates: Requirements 12.5**

- [x] 5. Tạo `OpenRouterClient` class
  - [x] 5.1 Tạo file `src/teacher_be/toeic-repository/openrouter.client.ts`
    - Implement `OpenRouterConfig` interface và `OpenRouterClient` class
    - Implement `extractFromImage(base64: string, mimeType: string): Promise<ExtractedWord[]>`
      - Chuyển đổi sang `data:{mimeType};base64,{base64}` URL format
      - Gửi request với `content: [{type:"text", text: EXTRACTION_PROMPT}, {type:"image_url", ...}]`
    - Implement `extractFromText(text: string): Promise<ExtractedWord[]>`
      - Truncate text về tối đa 8000 ký tự trước khi gửi
    - Implement `validateApiKey(): Promise<boolean>` — test request nhỏ khi khởi động
    - Implement private `callApi(messages): Promise<string>` với retry logic
      - Retry tối đa 2 lần với delay 3000ms cho lỗi 429, 503, network timeout
      - Không retry cho lỗi 401, 400
    - Implement private `parseJsonResponse(raw: string): ExtractedWord[]`
      - Strip markdown code fences (` ```json ... ``` `)
      - Extract `{...}` block đầu tiên bằng regex
      - `JSON.parse` → validate `words` array → trả về `[]` nếu bất kỳ bước nào fail
    - Implement private `shouldRetry(error: AxiosError): boolean`
    - Sử dụng `axios` (đã có trong project), không thêm SDK mới
    - Headers: `Authorization: Bearer {key}`, `Content-Type: application/json`, `HTTP-Referer`, `X-Title`
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.2, 2.4, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 8.1–8.5, 9.1, 9.2, 12.4_

  - [ ]* 5.2 Viết unit tests cho `OpenRouterClient`
    - Test HTTP headers đúng (Authorization, Content-Type, HTTP-Referer, X-Title)
    - Test base64 image được include trong request body cho vision calls
    - Test text bị truncate về 8000 chars trước khi gửi
    - Test lỗi 401/400 không trigger retry
    - Test lỗi 429/503 trigger retry đúng 2 lần với delay ≥ 3000ms
    - Test markdown code fences bị strip khỏi response
    - Test `parseJsonResponse` với JSON hợp lệ → trả về `ExtractedWord[]`
    - Test `parseJsonResponse` với JSON không hợp lệ → trả về `[]`
    - _Requirements: 1.4, 1.5, 6.3–6.5, 7.1–7.4, 9.1, 9.2_

  - [ ]* 5.3 Viết property test cho `OpenRouterClient` — Property 7
    - **Property 7: Base64 image encoding round-trip**
    - Với bất kỳ image file bytes, encode base64 rồi decode lại → bytes giống hệt original
    - **Validates: Requirements 6.3**

  - [ ]* 5.4 Viết property test cho `OpenRouterClient` — Property 8
    - **Property 8: JSON response parsing validity**
    - Với bất kỳ JSON string hợp lệ theo schema `{"words":[{word, pos, meaning}]}`, parse trả về array với mỗi entry có `word` không rỗng bắt đầu bằng chữ cái, `meaning` không rỗng, `pos` đã normalize
    - **Validates: Requirements 7.3**

  - [ ]* 5.5 Viết property test cho `OpenRouterClient` — Property 9 (phía client)
    - **Property 9: Invalid JSON triggers regex fallback**
    - Với bất kỳ string không phải JSON hợp lệ hoặc không khớp schema, `parseJsonResponse` trả về `[]`
    - **Validates: Requirements 7.4, 9.4**

  - [ ]* 5.6 Viết property test cho `OpenRouterClient` — Property 11
    - **Property 11: Retry count and delay on transient errors**
    - Với sequence 429 hoặc 503 responses, client retry tối đa 2 lần với delay ≥ 3000ms trước khi give up
    - **Validates: Requirements 9.1, 9.2**

  - [ ]* 5.7 Viết property test cho `OpenRouterClient` — Property 17
    - **Property 17: Text truncation at 8000 characters**
    - Với bất kỳ text string độ dài N, text gửi đến OpenRouter có length = min(N, 8000)
    - **Validates: Requirements 12.4**

- [x] 6. Checkpoint — Đảm bảo `ColumnDetector` và `OpenRouterClient` hoạt động đúng
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Refactor `VocabImportService` để tích hợp các components mới
  - [x] 7.1 Cập nhật `src/teacher_be/toeic-repository/vocab-import.service.ts`
    - Import và inject `OpenRouterClient`, `ColumnDetector`, `RegexExtractor`, `PreviewBuilder`
    - Implement `initOpenRouter()`: đọc `OPENROUTER_API_KEY` và `OPENROUTER_MODEL_NAME` từ env, khởi tạo `OpenRouterClient`, gọi `validateApiKey()`, log warning nếu key không có
    - Implement private `processImage(file): Promise<ExtractedWord[]>` với fallback chain 4 cấp:
      1. Direct vision: `openRouter.extractFromImage(base64, mimeType)`
      2. OCR-then-AI: `ocrColumns()` → `openRouter.extractFromText(text)`
      3. Pure regex: `regexExtractor.extract(text)`
      4. Throw `BadRequestException` nếu tất cả thất bại
    - Implement private `ocrColumns(imagePath): Promise<string>`: `columnDetector.detectColumns()` → `cropToColumns()` → Tesseract OCR từng cột → ghép text theo thứ tự trái-phải → cleanup file tạm
    - Implement private `processPdf(filePath): Promise<ExtractedWord[]>`: `pdf-parse` → `openRouter.extractFromText()` hoặc `regexExtractor.extract()`
    - Implement private `processTextFile(filePath): Promise<ExtractedWord[]>`: đọc file → `regexExtractor.extract()`
    - Giữ nguyên public interface: `parseAndPreview`, `confirmImport`, `upsertTopic`, `listTopics`, `deleteWord`
    - Cập nhật field `source` trong `VocabWord` khi lưu: "openrouter-vision" | "openrouter-text" | "ocr-regex"
    - _Requirements: 1.3, 1.4, 2.3, 6.1, 6.2, 9.3, 9.5, 11.1–11.5, 13.1–13.5, 14.1–14.5_

  - [x] 7.2 Cập nhật environment variables
    - Thêm `OPENROUTER_API_KEY` và `OPENROUTER_MODEL_NAME` vào `.env.example` (hoặc file config tương đương)
    - Thêm comment giải thích fallback strategy và danh sách free vision models được khuyến nghị
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 15.1–15.5_

  - [ ]* 7.3 Viết unit tests cho `VocabImportService` (mocked dependencies)
    - Test image file với OpenRouter configured → dùng direct vision path
    - Test image file không có OpenRouter → dùng Tesseract path
    - Test PDF file → dùng pdf-parse rồi OpenRouter/regex
    - Test CSV/TXT/JSON → dùng regex trực tiếp
    - Test OpenRouter 429 → retry → retry → fallback Tesseract+regex
    - Test `OPENROUTER_API_KEY` không set → log warning, hoạt động như hệ thống cũ
    - _Requirements: 1.3, 6.1, 6.2, 9.3, 11.1–11.5, 14.4_

  - [ ]* 7.4 Viết property test cho `VocabImportService` — Property 5
    - **Property 5: OCR text concatenation completeness**
    - Với bất kỳ N column texts, kết quả ghép chứa tất cả N texts theo thứ tự trái-phải
    - **Validates: Requirements 5.4**

  - [ ]* 7.5 Viết property test cho `VocabImportService` — Property 6
    - **Property 6: OCR partial failure resilience**
    - Với N cột trong đó K cột fail OCR (0 ≤ K < N), hệ thống vẫn trả về text từ N-K cột còn lại mà không throw exception
    - **Validates: Requirements 5.5**

  - [ ]* 7.6 Viết property test cho `VocabImportService` — Property 12
    - **Property 12: Exhausted retries trigger fallback**
    - Khi tất cả retry attempts bị exhausted, hệ thống invoke `extractWithRegex` và KHÔNG throw unhandled exception
    - **Validates: Requirements 9.3**

- [x] 8. Checkpoint — Đảm bảo toàn bộ pipeline hoạt động đúng
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Viết integration tests và kiểm tra backward compatibility
  - [x] 9.1 Tạo file `src/teacher_be/toeic-repository/__tests__/vocab-import.service.spec.ts`
    - Test full pipeline: image upload → column detection → OCR → OpenRouter (mocked HTTP) → preview
    - Test fallback pipeline: image upload → OpenRouter 429 → retry → retry → Tesseract + regex
    - Test `confirmImport`: verify words được upsert đúng vào database (test DB hoặc Prisma mock)
    - Test OpenRouter API key validation on service startup (mocked HTTP)
    - _Requirements: 6.1, 6.2, 9.1–9.5, 14.1–14.5_

  - [x] 9.2 Kiểm tra backward compatibility của public interface
    - Verify `parseAndPreview` và `confirmImport` giữ nguyên signature và response format
    - Verify response format của `/teacher/vocab/import/preview` và `/teacher/vocab/import/confirm` không thay đổi
    - Verify `ParsedVocabWord` interface không thay đổi
    - Verify khi không có `OPENROUTER_API_KEY`, hệ thống hoạt động giống hệ thống cũ
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ]* 9.3 Viết integration test cho logging
    - Verify log khi khởi tạo OpenRouter client với model name
    - Verify log số cột được phát hiện
    - Verify log số ký tự OCR từ mỗi cột
    - Verify log số từ vựng extract được từ OpenRouter và từ regex fallback
    - _Requirements: 13.1–13.5_

- [x] 10. Final checkpoint — Đảm bảo tất cả tests pass và backward compatibility được giữ nguyên
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks đánh dấu `*` là optional và có thể bỏ qua để triển khai MVP nhanh hơn
- Mỗi task tham chiếu đến requirements cụ thể để đảm bảo traceability
- Thứ tự triển khai: `RegexExtractor` → `PreviewBuilder` → `ColumnDetector` → `OpenRouterClient` → `VocabImportService` (refactor) → Integration tests
- `fast-check` cần được cài đặt: `npm install --save-dev fast-check`
- Sử dụng `axios` đã có trong project cho `OpenRouterClient`, không thêm SDK mới
- Property tests chạy tối thiểu 100 iterations (fast-check default)
- Tag format cho property tests: `// Feature: openrouter-vision-vocab-import, Property {N}: {property_text}`
