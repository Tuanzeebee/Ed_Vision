# Báo cáo Lãnh đạo - Cập nhật Export với Biểu đồ

## Tổng quan thay đổi

Đã triển khai khả năng xuất báo cáo kèm biểu đồ (charts) cho tất cả định dạng: PDF, Excel (.xlsx), Word (.docx), và PowerPoint (.pptx).

## Các file đã thay đổi

### 1. `src/lib/exportHelpers.ts` (MỚI)
Helper functions để xuất báo cáo với biểu đồ nhúng:
- `exportToExcel()` - Xuất file .xlsx với dữ liệu + sheet biểu đồ riêng
- `exportToWord()` - Xuất file .docx với text + hình ảnh biểu đồ
- `exportToPowerPoint()` - Xuất file .pptx với slides chuyên nghiệp + biểu đồ

### 2. `src/lib/pdfReportTemplates.ts`
- Thêm parameter `charts?: Record<string, string | null>` vào `generatePDFReportByType()`
- Hiển thị biểu đồ phân bố dữ liệu bên cạnh bảng "QUY MÔ HỆ THỐNG" (dùng columns layout)
- Fallback: hiển thị ghi chú nếu biểu đồ không có

### 3. `src/modules/admin/LeadershipReports.tsx`
- Thêm `useRef` cho biểu đồ Bar (`dataDistRef`)
- Capture base64 image từ chart canvas khi export
- Tích hợp các helper functions cho Excel/Word/PowerPoint
- Cập nhật dropdown "Định dạng xuất" với 4 tùy chọn:
  - 📄 PDF
  - 📊 Excel (.xlsx)
  - 📝 Word (.docx)
  - 🎞️ PowerPoint (.pptx)

### 4. `package.json`
Thêm dependencies mới:
- `exceljs` - Tạo file Excel với hình ảnh và styling
- `pptxgenjs` - Tạo file PowerPoint với slides và charts

## Cách hoạt động

1. **Capture Chart**: Khi user nhấn "Tải xuống", hệ thống lấy ảnh base64 (JPEG 80% quality) từ canvas của Chart.js
2. **Embed vào Export**: 
   - PDF: Chèn ảnh vào docDefinition pdfMake (bên cạnh bảng số liệu)
   - Excel: Tạo sheet "Biểu đồ" riêng với ảnh
   - Word: Nhúng ImageRun vào document
   - PowerPoint: Tạo slide riêng cho biểu đồ
3. **Fallback**: Nếu chart không render được, hiển thị thông báo thay vì crash

## Đặc điểm kỹ thuật

- **Read-only**: Không thay đổi dữ liệu nguồn, chỉ tạo export artifacts
- **Performance**: Sử dụng JPEG với quality 0.8 để giảm file size
- **Type-safe**: Đã xử lý tất cả TypeScript type errors
- **Error handling**: Try-catch cho việc capture và embed charts

## Kiểm tra

Để test:
1. Mở trang "Báo cáo Lãnh đạo" (Leadership Reports)
2. Chart "Phân bố dữ liệu theo loại" đã được render
3. Tạo báo cáo mới hoặc nhấn "Tải xuống" cho báo cáo có sẵn
4. Chọn định dạng (PDF/Excel/Word/PowerPoint)
5. File tải xuống sẽ chứa:
   - Dữ liệu báo cáo (theo loại: Điểm số/Hiệu suất/Dự đoán)
   - Biểu đồ phân bố dữ liệu (nếu chart đã render)

## Mở rộng trong tương lai

Để thêm chart khác (ví dụ: biểu đồ GPA, biểu đồ hiệu suất):
1. Thêm ref cho chart mới (ví dụ: `const gpaChartRef = useRef(null)`)
2. Trong `exportReportFile`, capture thêm chart: `charts.gpa = gpaChartRef.current?.canvas.toDataURL(...)`
3. Cập nhật `generatePDFReportByType` để hiển thị chart GPA ở section tương ứng
4. Cập nhật `exportToExcel/Word/PowerPoint` tương tự

## Lưu ý

- Chart phải được render trên UI trước khi export (không thể export chart nếu user chưa scroll đến phần chart)
- Nếu cần export nhiều chart, cân nhắc performance (nhiều ảnh = file size lớn)
- Có thể điều chỉnh `fit: [width, height]` trong pdfMake để thay đổi kích thước chart trong PDF
