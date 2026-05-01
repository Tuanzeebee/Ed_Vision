# Requirements Document

## Introduction

Hệ thống Ed Vision hiện tại sử dụng Gemini 2.0 Flash để xử lý nhập từ vựng từ ảnh và file. Tuy nhiên, Gemini 2.0 đang bị quá tải và không thể sử dụng được. Tính năng này thay thế Gemini bằng OpenRouter API để đảm bảo tính ổn định và khả năng mở rộng cho module Teacher trong việc nhập từ vựng TOEIC.

Hệ thống cần xử lý ảnh chứa từ vựng (thường 2-3 cột), phát hiện cột bằng OpenCV, cắt ảnh theo cột, OCR từng phần, và sử dụng AI (OpenRouter) để làm sạch và chuẩn hóa dữ liệu trước khi lưu vào database.

## Glossary

- **OpenRouter_API**: Dịch vụ API cung cấp truy cập đến nhiều mô hình AI khác nhau thông qua một giao diện thống nhất
- **Vision_Model**: Mô hình AI có khả năng xử lý và phân tích hình ảnh (vision tasks)
- **Vocab_Import_Service**: Service backend xử lý logic nhập từ vựng
- **Column_Detector**: Module sử dụng OpenCV để phát hiện cột trong ảnh
- **OCR_Engine**: Tesseract.js - công cụ nhận dạng ký tự quang học
- **Data_Cleaner**: Module AI làm sạch và chuẩn hóa dữ liệu từ vựng
- **Teacher_Module**: Module dành cho giảng viên trong hệ thống Ed Vision
- **Vocabulary_Entry**: Một từ vựng bao gồm: word, pos, meaning, examples, topic, level
- **TOEIC_Topic**: Chủ đề từ vựng TOEIC (10 chủ đề cố định: Office Work, Finance, HR, Marketing, Travel, Healthcare, Technology, Legal, Customer Service, General Business)
- **Preview_Mode**: Chế độ xem trước kết quả phân tích trước khi lưu vào database
- **Gemini_API**: Google Generative AI API (hệ thống cũ đang bị quá tải)

## Requirements

### Requirement 1: OpenRouter API Configuration

**User Story:** Là một developer, tôi muốn cấu hình OpenRouter API, để hệ thống có thể kết nối và sử dụng các mô hình AI thay thế Gemini.

#### Acceptance Criteria

1. THE System SHALL đọc OpenRouter API key từ biến môi trường OPENROUTER_API_KEY
2. THE System SHALL đọc OpenRouter model name từ biến môi trường OPENROUTER_MODEL_NAME với giá trị mặc định là model free phù hợp cho vision tasks
3. WHEN OPENROUTER_API_KEY không được cấu hình, THE System SHALL ghi log cảnh báo và sử dụng Tesseract OCR với regex fallback
4. THE System SHALL khởi tạo OpenRouter client khi service khởi động
5. THE System SHALL validate API key bằng cách thực hiện một test request đơn giản khi khởi động

### Requirement 2: Free Vision Model Selection

**User Story:** Là một developer, tôi muốn chọn model free phù hợp nhất từ OpenRouter, để tối ưu chi phí và hiệu suất xử lý vision tasks.

#### Acceptance Criteria

1. THE System SHALL hỗ trợ danh sách các free vision models từ OpenRouter (ví dụ: google/gemini-flash-1.5-8b, meta-llama/llama-3.2-11b-vision-instruct:free)
2. THE System SHALL cho phép cấu hình model name thông qua biến môi trường
3. WHEN model được chọn không hỗ trợ vision, THE System SHALL ghi log lỗi và fallback sang Tesseract OCR
4. THE System SHALL ghi log model name đang được sử dụng khi xử lý mỗi request
5. THE Documentation SHALL liệt kê các free vision models được khuyến nghị và đặc điểm của từng model

### Requirement 3: Column Detection with OpenCV

**User Story:** Là một giảng viên, tôi muốn hệ thống tự động phát hiện cột trong ảnh từ vựng, để xử lý chính xác ảnh có 2-3 cột mà không bị mất dữ liệu.

#### Acceptance Criteria

1. WHEN ảnh được upload, THE Column_Detector SHALL phân tích ảnh để phát hiện số lượng cột
2. THE Column_Detector SHALL sử dụng OpenCV edge detection và contour analysis để xác định ranh giới cột
3. WHEN phát hiện được 2 hoặc nhiều cột, THE Column_Detector SHALL trả về tọa độ (x, y, width, height) của từng cột
4. WHEN không phát hiện được cột rõ ràng, THE Column_Detector SHALL xử lý ảnh như một cột duy nhất
5. THE Column_Detector SHALL xử lý ảnh với độ phân giải tối đa 4000x4000 pixels

### Requirement 4: Image Segmentation by Column

**User Story:** Là một giảng viên, tôi muốn hệ thống cắt ảnh theo từng cột đã phát hiện, để OCR từng phần riêng biệt và tránh lỗi trộn lẫn dữ liệu giữa các cột.

#### Acceptance Criteria

1. WHEN Column_Detector phát hiện được nhiều cột, THE System SHALL cắt ảnh gốc thành các ảnh con theo tọa độ từng cột
2. THE System SHALL lưu các ảnh con vào thư mục tạm với tên file có format: {original_name}_col_{index}.{ext}
3. THE System SHALL xử lý các ảnh con theo thứ tự từ trái sang phải
4. THE System SHALL giữ nguyên chất lượng ảnh khi cắt (không nén hoặc giảm chất lượng)
5. WHEN quá trình cắt hoàn tất, THE System SHALL xóa các ảnh con tạm sau khi xử lý xong

### Requirement 5: OCR Processing per Column

**User Story:** Là một giảng viên, tôi muốn hệ thống OCR từng phần ảnh đã cắt, để trích xuất text chính xác từ mỗi cột.

#### Acceptance Criteria

1. THE OCR_Engine SHALL xử lý từng ảnh cột riêng biệt bằng Tesseract.js
2. THE OCR_Engine SHALL sử dụng cả ngôn ngữ tiếng Anh và tiếng Việt (languages: ['eng', 'vie'])
3. WHEN OCR hoàn tất một cột, THE System SHALL ghi log số ký tự đã trích xuất
4. THE System SHALL ghép nối text từ tất cả các cột theo thứ tự từ trái sang phải
5. WHEN OCR thất bại cho một cột, THE System SHALL ghi log lỗi và tiếp tục xử lý các cột còn lại

### Requirement 6: OpenRouter Vision Integration

**User Story:** Là một developer, tôi muốn tích hợp OpenRouter API để xử lý ảnh trực tiếp, để có thể bỏ qua bước OCR khi model vision đủ mạnh.

#### Acceptance Criteria

1. THE System SHALL hỗ trợ hai chế độ xử lý: direct vision (gửi ảnh trực tiếp) và OCR-then-AI (OCR trước, AI sau)
2. WHEN OpenRouter vision model được cấu hình, THE System SHALL ưu tiên sử dụng direct vision mode
3. THE System SHALL chuyển đổi ảnh sang base64 format trước khi gửi đến OpenRouter API
4. THE System SHALL gửi prompt extraction cùng với ảnh base64 đến OpenRouter API
5. WHEN OpenRouter API trả về lỗi quota hoặc rate limit, THE System SHALL fallback sang OCR-then-AI mode

### Requirement 7: AI Data Cleaning with OpenRouter

**User Story:** Là một giảng viên, tôi muốn AI làm sạch và chuẩn hóa dữ liệu từ vựng, để kết quả cuối cùng có định dạng nhất quán và chính xác.

#### Acceptance Criteria

1. THE Data_Cleaner SHALL gửi text đã OCR hoặc kết quả từ vision model đến OpenRouter API với extraction prompt
2. THE Data_Cleaner SHALL yêu cầu OpenRouter trả về JSON format với cấu trúc: {words: [{word, pos, meaning}]}
3. THE Data_Cleaner SHALL parse JSON response và validate từng vocabulary entry
4. WHEN JSON response không hợp lệ, THE Data_Cleaner SHALL fallback sang regex extraction
5. THE Data_Cleaner SHALL loại bỏ các entry trùng lặp dựa trên word field

### Requirement 8: Extraction Prompt Optimization

**User Story:** Là một developer, tôi muốn tối ưu extraction prompt cho OpenRouter, để model hiểu rõ yêu cầu và trả về kết quả chính xác.

#### Acceptance Criteria

1. THE System SHALL sử dụng extraction prompt mô tả rõ định dạng input (ảnh hoặc text từ OCR)
2. THE Extraction_Prompt SHALL hướng dẫn model xử lý ảnh 2-3 cột và trích xuất từ TẤT CẢ các cột
3. THE Extraction_Prompt SHALL yêu cầu model giữ nguyên nghĩa tiếng Việt (không dịch hoặc sửa đổi)
4. THE Extraction_Prompt SHALL yêu cầu model trả về ONLY valid JSON, không có markdown hoặc giải thích
5. THE Extraction_Prompt SHALL định nghĩa rõ format của mỗi entry: "Number. Word (pos) : Vietnamese meaning"

### Requirement 9: Error Handling and Fallback Strategy

**User Story:** Là một giảng viên, tôi muốn hệ thống xử lý lỗi một cách thông minh, để luôn có kết quả dù API gặp sự cố.

#### Acceptance Criteria

1. WHEN OpenRouter API trả về lỗi 429 (rate limit), THE System SHALL chờ 3 giây và retry tối đa 2 lần
2. WHEN OpenRouter API trả về lỗi 503 (service unavailable), THE System SHALL chờ 3 giây và retry tối đa 2 lần
3. WHEN tất cả retry thất bại, THE System SHALL fallback sang Tesseract OCR với regex extraction
4. WHEN OpenRouter API trả về response không phải JSON, THE System SHALL fallback sang regex extraction
5. THE System SHALL ghi log chi tiết mỗi lỗi bao gồm: error code, message, và fallback strategy được sử dụng

### Requirement 10: Vocabulary Preview Generation

**User Story:** Là một giảng viên, tôi muốn xem trước kết quả phân tích, để kiểm tra và chỉnh sửa trước khi lưu vào database.

#### Acceptance Criteria

1. WHEN extraction hoàn tất, THE System SHALL tạo preview với đầy đủ thông tin: word, topic, level, definitions
2. THE System SHALL tự động phân loại topic dựa trên keywords matching với 10 TOEIC topics
3. THE System SHALL tự động xác định level dựa trên độ dài từ: ≤6 chars = Cơ bản, ≤11 chars = Trung bình, >11 chars = Nâng cao
4. THE System SHALL chuẩn hóa part of speech (pos) theo mapping: n→n., v→v., adj→adj., adv→adv.
5. THE Preview_Mode SHALL trả về array of ParsedVocabWord với tất cả fields cần thiết để hiển thị trong UI

### Requirement 11: Multi-format File Support

**User Story:** Là một giảng viên, tôi muốn upload nhiều loại file khác nhau, để linh hoạt trong cách cung cấp dữ liệu từ vựng.

#### Acceptance Criteria

1. THE System SHALL hỗ trợ các định dạng ảnh: JPG, JPEG, PNG, WEBP, BMP
2. THE System SHALL hỗ trợ các định dạng document: PDF, TXT, CSV, XLSX, JSON, MD
3. WHEN file là ảnh, THE System SHALL sử dụng column detection + OCR hoặc direct vision
4. WHEN file là PDF, THE System SHALL extract text và gửi đến OpenRouter hoặc sử dụng regex
5. WHEN file là CSV/XLSX/TXT/JSON, THE System SHALL parse trực tiếp bằng regex extraction

### Requirement 12: Performance and Resource Management

**User Story:** Là một developer, tôi muốn hệ thống quản lý tài nguyên hiệu quả, để tránh memory leak và đảm bảo hiệu suất ổn định.

#### Acceptance Criteria

1. THE System SHALL giới hạn kích thước file upload tối đa 25MB
2. THE System SHALL xóa file tạm ngay sau khi xử lý xong
3. THE System SHALL xóa các ảnh cột tạm sau khi OCR hoàn tất
4. THE System SHALL giới hạn text gửi đến OpenRouter API tối đa 8000 ký tự
5. WHEN xử lý ảnh lớn, THE System SHALL resize ảnh xuống tối đa 4000x4000 pixels trước khi xử lý

### Requirement 13: Logging and Monitoring

**User Story:** Là một developer, tôi muốn có log chi tiết về quá trình xử lý, để dễ dàng debug và monitor hệ thống.

#### Acceptance Criteria

1. THE System SHALL ghi log khi khởi tạo OpenRouter client với model name
2. THE System SHALL ghi log số lượng cột được phát hiện trong mỗi ảnh
3. THE System SHALL ghi log số ký tự OCR được từ mỗi cột
4. THE System SHALL ghi log số lượng từ vựng được extract từ OpenRouter và từ regex fallback
5. THE System SHALL ghi log thời gian xử lý cho mỗi bước: column detection, OCR, AI extraction, preview generation

### Requirement 14: Backward Compatibility

**User Story:** Là một developer, tôi muốn đảm bảo tương thích ngược, để hệ thống vẫn hoạt động với code cũ và có thể rollback nếu cần.

#### Acceptance Criteria

1. THE System SHALL giữ nguyên interface của VocabImportService (parseAndPreview, confirmImport)
2. THE System SHALL giữ nguyên response format của API endpoints: /teacher/vocab/import/preview và /teacher/vocab/import/confirm
3. THE System SHALL giữ nguyên ParsedVocabWord interface
4. WHEN OPENROUTER_API_KEY không được cấu hình, THE System SHALL hoạt động giống hệ thống cũ với Tesseract + regex
5. THE System SHALL hỗ trợ cả Gemini API (nếu có) và OpenRouter API song song, ưu tiên OpenRouter

### Requirement 15: Configuration Documentation

**User Story:** Là một developer, tôi muốn có tài liệu hướng dẫn cấu hình, để dễ dàng setup và maintain hệ thống.

#### Acceptance Criteria

1. THE Documentation SHALL mô tả cách lấy OpenRouter API key
2. THE Documentation SHALL liệt kê các free vision models được khuyến nghị từ OpenRouter
3. THE Documentation SHALL cung cấp ví dụ cấu hình trong file .env
4. THE Documentation SHALL giải thích fallback strategy khi API gặp sự cố
5. THE Documentation SHALL cung cấp troubleshooting guide cho các lỗi thường gặp
