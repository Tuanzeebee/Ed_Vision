# Tiêu Chuẩn Format Báo Cáo Ed_Vision

## 📋 Tổng Quan

Tài liệu này định nghĩa tiêu chuẩn format cho tất cả các loại báo cáo xuất ra từ hệ thống Ed_Vision.

---

## 🎨 Tiêu Chuẩn Định Dạng Chung

### Font & Size
- **Font chữ**: Times (hoặc Cambria nếu có sẵn)
- **Kích thước**: 12pt cho tất cả nội dung
- **Header bảng**: In đậm (Bold)
- **Tên cột**: In đậm (Bold)

### Màu Sắc
- **Header thông thường**: RGB(41, 128, 185) - Xanh dương
- **Header cảnh báo**: RGB(231, 76, 60) - Đỏ
- **Text cảnh báo**: RGB(200, 0, 0) - Đỏ đậm
- **Text thông thường**: Đen (0, 0, 0)
- **Footer**: Xám (100, 100, 100)

---

## 📄 PDF Export

### Cấu Trúc

#### Trang 1: Thông tin & Hoạt động
1. **Header**
   - Tiêu đề: "BÁO CÁO LÃNH ĐẠO" (18pt, bold, center)
   - Phụ đề: "TRƯỜNG ĐẠI HỌC ED_VISION" (14pt, bold, center)

2. **Thông tin báo cáo** (Bảng 2 cột)
   - Tên báo cáo
   - Loại báo cáo
   - Phạm vi
   - Thời gian
   - Ngày tạo

3. **Thống kê tổng quan hệ thống** (Bảng 2 cột)
   - Tổng số sinh viên
   - Tổng số giảng viên
   - Số môn học

4. **Hoạt động sinh viên** (Bảng 3 cột)
   - Đăng nhập đều đặn
   - Đăng nhập thỉnh thoảng
   - Không hoạt động

5. **Mục đích sử dụng - Sinh viên** (Bảng 3 cột)
   - Nộp bài tập
   - Xem tài liệu
   - Tương tác giảng viên
   - Xem điểm/lịch
   - Diễn đàn

6. **Mục đích sử dụng - Giảng viên** (Bảng 3 cột)
   - Cố vấn sinh viên
   - Chấm bài/nhập điểm
   - Đăng tài liệu
   - Theo dõi tiến độ
   - Trao đổi sinh viên

#### Trang 2: Học tập & Cảnh báo
7. **Thống kê làm bài tập** (Bảng 4 cột)
   - Tỷ lệ nộp cao/TB/thấp
   - Điểm trung bình

8. **Phân bố GPA** (Bảng 4 cột)
   - Xuất sắc (3.6-4.0)
   - Giỏi (3.2-3.59)
   - Khá (2.5-3.19)
   - Trung bình (2.0-2.49)
   - Yếu (<2.0)

9. **Phân bố điểm chữ** (Bảng 3 cột)
   - A+ đến F với số lượng và tỷ lệ

10. **Hoạt động cố vấn** (Bảng 2 cột)
    - Tổng buổi cố vấn
    - TB/giảng viên
    - Sinh viên được cố vấn
    - Sinh viên chưa cố vấn

11. **⚠️ CẢNH BÁO HỌC VỤ** (Bảng 3 cột - MÀU ĐỎ)
    - Nguy cơ học vụ
    - Cần hỗ trợ
    - Tỷ lệ nộp bài thấp

12. **⚠️ MÔN HỌC FAIL CAO** (Bảng 2 cột - MÀU ĐỎ)
    - **CHI TIẾT CỤ THỂ 3 MÔN:**
      * Toán cao cấp 1 (28%)
      * Vật lý đại cương (23%)
      * Lập trình C++ (19%)
    - **Lưu ý**: Các môn này phải được liệt kê rõ tên, không chỉ nói "3 môn"

#### Footer
- "Báo cáo được tạo tự động bởi hệ thống Ed_Vision"
- "Email: admin@edvision.edu.vn | Website: edvision.edu.vn"

---

## 📊 Excel/CSV Export

### Cấu Trúc
Giống PDF nhưng dạng bảng CSV với:
- BOM UTF-8 encoding (`\ufeff`)
- Phân cách bằng dấu phẩy (`,`)
- Mỗi section cách nhau 1 dòng trống

### Sections (Theo thứ tự)
1. Header thông tin
2. Quy mô
3. Hoạt động sinh viên
4. Mục đích - Sinh viên
5. Mục đích - Giảng viên
6. Thống kê bài tập
7. Phân bố GPA
8. Phân bố điểm chữ
9. Hoạt động cố vấn
10. Xu hướng học tập
11. Cảnh báo học vụ
12. **Môn học fail cao** (CHI TIẾT 3 MÔN)

---

## 📝 Word Export

### Format
- Cùng cấu trúc với PDF
- Font: Times New Roman 12pt
- Margins: 2.5cm tất cả các cạnh
- Line spacing: 1.15
- Bảng với borders và shading như PDF

---

## 🎯 Quy Tắc Quan Trọng

### 1. Hiển Thị Dữ Liệu Đầy Đủ
❌ **SAI**: Chỉ hiển thị tên cột mà không có giá trị
```
Tên báo cáo:
Loại báo cáo:
```

✅ **ĐÚNG**: Hiển thị cả tên và giá trị
```
Tên báo cáo: Báo cáo tháng 10/2024
Loại báo cáo: Hoạt động học tập
```

### 2. Liệt Kê Chi Tiết
❌ **SAI**: "Môn có tỷ lệ fail cao: 3 môn"

✅ **ĐÚNG**: 
```
Môn có tỷ lệ fail cao:
- Toán cao cấp 1: 28%
- Vật lý đại cương: 23%
- Lập trình C++: 19%
```

### 3. Số Liệu Phải Có Ngữ Cảnh
- Luôn kèm đơn vị (SV, GV, buổi, %)
- Có so sánh khi cần (so với kỳ trước)
- Phân loại rõ ràng (xuất sắc, khá, yếu)

### 4. Màu Sắc Có Ý Nghĩa
- **Xanh dương**: Thông tin thông thường
- **Đỏ**: Cảnh báo, nguy cơ, vấn đề cần chú ý
- **Xanh lá**: Tích cực, tốt (nếu cần)

---

## 🔄 Cập Nhật Dữ Liệu Dynamic

Khi có dữ liệu thực từ backend:

### Môn học fail cao
```typescript
// Thay vì hardcode
const highFailSubjects = [
  { name: 'Toán cao cấp 1', failRate: 28 },
  { name: 'Vật lý đại cương', failRate: 23 },
  { name: 'Lập trình C++', failRate: 19 }
];

// Lấy từ API
const highFailSubjects = await api.getTopFailSubjects(scope, timeRange, 3);

// Hiển thị
highFailSubjects.forEach(subject => {
  `${subject.name}: ${subject.failRate}%`
});
```

### Tất cả thống kê khác
- Kết nối với database thực
- Tính toán theo phạm vi (Toàn trường/Khoa/Lớp/Môn)
- Cập nhật real-time hoặc theo định kỳ

---

## 📌 Checklist Trước Khi Export

- [ ] Font Times/Cambria size 12
- [ ] Header in đậm, màu xanh/đỏ phù hợp
- [ ] Tất cả dữ liệu hiển thị đầy đủ (không chỉ tên mục)
- [ ] 3 môn fail cao được liệt kê chi tiết
- [ ] Cảnh báo màu đỏ nổi bật
- [ ] Format nhất quán trên tất cả loại file (PDF/Excel/Word)
- [ ] Footer có đầy đủ thông tin liên hệ
- [ ] File encoding UTF-8 (đặc biệt cho Excel)

---

## 📞 Liên Hệ

Nếu có thắc mắc về format báo cáo, liên hệ:
- **Email**: dev@edvision.edu.vn
- **Hotline**: 1900-xxxx
