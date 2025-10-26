// Report content templates for different report types

import { type ScopeStats } from './reportUtils';

export const generateReportHeader = (reportName: string, type: string, scope: string, timeRange: string): string => {
  const timestamp = new Date().toLocaleString('vi-VN');
  
  return `
╔════════════════════════════════════════════════════════════════╗
║                     BÁO CÁO LÃNH ĐẠO                           ║
║                  HỆ THỐNG HỌC TẬP ED_VISION                    ║
╚════════════════════════════════════════════════════════════════╝

📋 THÔNG TIN BÁO CÁO
────────────────────────────────────────────────────────────────
• Tên báo cáo: ${reportName}
• Loại báo cáo: ${type}
• Phạm vi: ${scope}
• Thời gian: ${timeRange}
• Người tạo: Admin
• Ngày tạo: ${timestamp}
════════════════════════════════════════════════════════════════
`;
};

export const generateReportFooter = (): string => {
  return `
════════════════════════════════════════════════════════════════
✅ Báo cáo được tạo tự động bởi hệ thống Ed_Vision
📧 Liên hệ: admin@edvision.edu.vn | Hotline: 1900-xxxx
════════════════════════════════════════════════════════════════
`;
};

export const generateBasicInfo = (stats: ScopeStats): string => {
  return `
📊 QUY MÔ HỆ THỐNG
────────────────────────────────────────────────────────────────
• Tổng số sinh viên: ${stats.students.toLocaleString()} sinh viên
• Tổng số giảng viên: ${stats.teachers} giảng viên
• Số môn học/khóa học: ${stats.courses} môn
`;
};

export const generateGradeSection = (stats: ScopeStats): string => {
  return `
🎓 PHÂN BỐ ĐIỂM GPA
────────────────────────────────────────────────────────────────
• GPA xuất sắc (3.6-4.0): ${Math.round(stats.students * 0.15).toLocaleString()} SV (15%)
• GPA giỏi (3.2-3.59): ${Math.round(stats.students * 0.28).toLocaleString()} SV (28%)
• GPA khá (2.5-3.19): ${Math.round(stats.students * 0.35).toLocaleString()} SV (35%)
• GPA trung bình (2.0-2.49): ${Math.round(stats.students * 0.18).toLocaleString()} SV (18%)
• GPA yếu (<2.0): ${Math.round(stats.students * 0.04).toLocaleString()} SV (4%)

📊 PHÂN BỐ CHI TIẾT THEO THANG ĐIỂM CHỮ
────────────────────────────────────────────────────────────────
• A+ (90-100%): ${Math.round(stats.students * 0.12).toLocaleString()} SV (12%)
• A  (85-89%): ${Math.round(stats.students * 0.18).toLocaleString()} SV (18%)
• A- (80-84%): ${Math.round(stats.students * 0.15).toLocaleString()} SV (15%)
• B+ (75-79%): ${Math.round(stats.students * 0.20).toLocaleString()} SV (20%)
• B  (70-74%): ${Math.round(stats.students * 0.16).toLocaleString()} SV (16%)
• B- (65-69%): ${Math.round(stats.students * 0.10).toLocaleString()} SV (10%)
• C+ (60-64%): ${Math.round(stats.students * 0.05).toLocaleString()} SV (5%)
• C  (55-59%): ${Math.round(stats.students * 0.03).toLocaleString()} SV (3%)
• D  (50-54%): ${Math.round(stats.students * 0.01).toLocaleString()} SV (1%)
• F  (<50%): ${Math.round(stats.students * 0.002).toLocaleString()} SV (0.2%)

📝 ĐIỂM TRUNG BÌNH
────────────────────────────────────────────────────────────────
• Điểm trung bình chung: 7.2/10
• Điểm trung bình bài tập: 7.8/10

⚠️ MÔN CÓ TỶ LỆ FAIL CAO
────────────────────────────────────────────────────────────────
• Toán cao cấp 1: 28%
• Vật lý đại cương: 23%
• Lập trình C++: 19%
• Cấu trúc dữ liệu & Giải thuật: 16%
• Tiếng Anh chuyên ngành: 14%
`;
};

export const generatePerformanceSection = (stats: ScopeStats, timeRange: string): string => {
  return `
👥 HOẠT ĐỘNG SINH VIÊN
────────────────────────────────────────────────────────────────
• Tỷ lệ hoạt động: ${stats.activeRate}%
• Đăng nhập đều đặn: ${Math.round(stats.students * 0.73).toLocaleString()} SV (73%)
• Đăng nhập thỉnh thoảng: ${Math.round(stats.students * 0.18).toLocaleString()} SV (18%)
• Không hoạt động: ${Math.round(stats.students * 0.09).toLocaleString()} SV (9%)

🎯 MỤC ĐÍCH SỬ DỤNG HỆ THỐNG - SINH VIÊN
────────────────────────────────────────────────────────────────
• Nộp bài tập: ${Math.round(stats.students * 0.82).toLocaleString()} SV (82%)
• Xem tài liệu học tập: ${Math.round(stats.students * 0.75).toLocaleString()} SV (75%)
• Tương tác với giảng viên: ${Math.round(stats.students * 0.45).toLocaleString()} SV (45%)
• Xem điểm và lịch học: ${Math.round(stats.students * 0.91).toLocaleString()} SV (91%)
• Tham gia diễn đàn thảo luận: ${Math.round(stats.students * 0.38).toLocaleString()} SV (38%)

🎯 MỤC ĐÍCH SỬ DỤNG HỆ THỐNG - GIẢNG VIÊN
────────────────────────────────────────────────────────────────
• Cố vấn sinh viên: ${Math.round(stats.teachers * 0.95).toLocaleString()} GV (95%)
• Chấm bài và nhập điểm: ${Math.round(stats.teachers * 0.88).toLocaleString()} GV (88%)
• Đăng tài liệu học tập: ${Math.round(stats.teachers * 0.72).toLocaleString()} GV (72%)
• Theo dõi tiến độ sinh viên: ${Math.round(stats.teachers * 0.65).toLocaleString()} GV (65%)
• Trao đổi với sinh viên: ${Math.round(stats.teachers * 0.58).toLocaleString()} GV (58%)

📝 THỐNG KÊ LÀM BÀI TẬP
────────────────────────────────────────────────────────────────
• Tỷ lệ nộp cao (>90%): ${Math.round(stats.students * 0.42).toLocaleString()} SV (42%) - Xuất sắc
• Tỷ lệ nộp trung bình (60-90%): ${Math.round(stats.students * 0.35).toLocaleString()} SV (35%) - Khá
• Tỷ lệ nộp thấp (<60%): ${Math.round(stats.students * 0.23).toLocaleString()} SV (23%) - Cần cải thiện
• Tỷ lệ nộp bài đúng hạn: 78.3%

⏱️ THỜI GIAN SỬ DỤNG HỆ THỐNG
────────────────────────────────────────────────────────────────
• Thời gian trung bình/ngày: 2.5 giờ/sinh viên
• Khung giờ cao điểm: 19:00-22:00 (45% người dùng)
• Khung giờ sáng: 08:00-12:00 (25% người dùng)
• Khung giờ chiều: 13:00-17:00 (30% người dùng)

👨‍🏫 HOẠT ĐỘNG CỐ VẤN GIẢNG VIÊN
────────────────────────────────────────────────────────────────
• Tổng số buổi cố vấn: ${stats.teachers * 12} buổi
• Trung bình/giảng viên: 12 buổi/${timeRange}
• Sinh viên được cố vấn: ${Math.round(stats.students * 0.68).toLocaleString()} SV (68%)
• Số buổi cố vấn/sinh viên: 2.4 buổi
• Giảng viên tích cực (>15 buổi): ${Math.round(stats.teachers * 0.35)} GV (35%)
• Giảng viên trung bình (8-15 buổi): ${Math.round(stats.teachers * 0.45)} GV (45%)
• Giảng viên ít hoạt động (<8 buổi): ${Math.round(stats.teachers * 0.20)} GV (20%)
`;
};

export const generatePredictionSection = (stats: ScopeStats): string => {
  return `
📈 XU HƯỚNG HỌC TẬP
────────────────────────────────────────────────────────────────
• Tỷ lệ cải thiện điểm: +5.8% so với kỳ trước
• Tỷ lệ nộp bài đúng hạn: 78.3%
• Mức độ tương tác với tài liệu: +12% so với kỳ trước
• Tỷ lệ đạt yêu cầu môn học: 94.7%
• Tỷ lệ sinh viên tham gia học nhóm: 54% (tăng 8%)
• Tỷ lệ sinh viên sử dụng AI dự đoán: 68%

⚠️ CẢNH BÁO HỌC VỤ
────────────────────────────────────────────────────────────────
• Sinh viên có nguy cơ học vụ: ${Math.round(stats.students * 0.08).toLocaleString()} SV (8%)
• Sinh viên cần hỗ trợ: ${Math.round(stats.students * 0.15).toLocaleString()} SV (15%)

💡 KHUYẾN NGHỊ CẢI THIỆN
────────────────────────────────────────────────────────────────
• Tăng cường hoạt động cố vấn cho nhóm sinh viên yếu kém (GPA < 2.0)
• Tổ chức thêm các buổi hỗ trợ học tập vào khung giờ cao điểm 19:00-22:00
• Khuyến khích giảng viên ít hoạt động tham gia cố vấn nhiều hơn
• Cải thiện chất lượng tài liệu học tập để tăng tương tác (+12% mục tiêu)
• Tăng cường sử dụng tính năng dự đoán điểm AI để hỗ trợ sinh viên
• Tổ chức thêm các nhóm học tập online cho các môn có tỷ lệ fail cao

✨ ĐIỂM NỔI BẬT
────────────────────────────────────────────────────────────────
• Tỷ lệ sinh viên xem lịch học & lịch thi cao (91%)
• Tỷ lệ sinh viên làm bài tập trực tuyến tốt (82%)
• Giảng viên tích cực cố vấn sinh viên (95%)
• Tỷ lệ đạt yêu cầu môn học cao (94.7%)
• Xu hướng cải thiện điểm tích cực (+5.8%)
`;
};

// Main function to generate report content based on type
export const generateReportContentByType = (
  reportName: string,
  type: string,
  scope: string,
  timeRange: string,
  stats: ScopeStats
): string => {
  const header = generateReportHeader(reportName, type, scope, timeRange);
  const footer = generateReportFooter();
  const basicInfo = generateBasicInfo(stats);

  switch (type) {
    case 'Điểm số':
      return header + basicInfo + generateGradeSection(stats) + footer;

    case 'Hiệu suất':
      return header + basicInfo + generatePerformanceSection(stats, timeRange) + footer;

    case 'Dự đoán':
      return header + basicInfo + generatePredictionSection(stats) + footer;

    case 'Tổng hợp':
    default:
      return (
        header +
        basicInfo +
        generateGradeSection(stats) +
        generatePerformanceSection(stats, timeRange) +
        generatePredictionSection(stats) +
        footer
      );
  }
};

// CSV-specific template functions
const generateCSVHeader = (reportName: string, type: string, scope: string, timeRange: string): string => {
  return (
    `Báo cáo Lãnh đạo - Ed_Vision\n` +
    `\n` +
    `THÔNG TIN BÁO CÁO\n` +
    `Tên báo cáo,${reportName}\n` +
    `Loại,${type}\n` +
    `Phạm vi,${scope}\n` +
    `Thời gian,${timeRange}\n` +
    `Người tạo,Admin\n` +
    `Ngày tạo,${new Date().toLocaleString('vi-VN')}\n` +
    `\n`
  );
};

const generateCSVBasicInfo = (stats: ScopeStats): string => {
  return (
    `QUY MÔ\n` +
    `Chỉ số,Giá trị\n` +
    `Tổng số sinh viên,${stats.students}\n` +
    `Tổng số giảng viên,${stats.teachers}\n` +
    `Số môn học,${stats.courses}\n` +
    `\n`
  );
};

const generateCSVGradeSection = (stats: ScopeStats): string => {
  return (
    `PHÂN BỐ ĐIỂM GPA\n` +
    `Xếp loại,Khoảng GPA,Số sinh viên,Tỷ lệ\n` +
    `Xuất sắc,3.6-4.0,${Math.round(stats.students * 0.15)},15%\n` +
    `Giỏi,3.2-3.59,${Math.round(stats.students * 0.28)},28%\n` +
    `Khá,2.5-3.19,${Math.round(stats.students * 0.35)},35%\n` +
    `Trung bình,2.0-2.49,${Math.round(stats.students * 0.18)},18%\n` +
    `Yếu,<2.0,${Math.round(stats.students * 0.04)},4%\n` +
    `\n` +
    `PHÂN BỐ ĐIỂM CHỮ\n` +
    `Điểm,Khoảng %,Số sinh viên,Tỷ lệ\n` +
    `A+,90-100,${Math.round(stats.students * 0.12)},12%\n` +
    `A,85-89,${Math.round(stats.students * 0.18)},18%\n` +
    `A-,80-84,${Math.round(stats.students * 0.15)},15%\n` +
    `B+,75-79,${Math.round(stats.students * 0.20)},20%\n` +
    `B,70-74,${Math.round(stats.students * 0.16)},16%\n` +
    `B-,65-69,${Math.round(stats.students * 0.10)},10%\n` +
    `C+,60-64,${Math.round(stats.students * 0.05)},5%\n` +
    `C,55-59,${Math.round(stats.students * 0.03)},3%\n` +
    `D,50-54,${Math.round(stats.students * 0.01)},1%\n` +
    `F,<50,${Math.round(stats.students * 0.002)},0.2%\n` +
    `\n` +
    `MÔN HỌC CÓ TỶ LỆ FAIL CAO\n` +
    `Tên môn học,Tỷ lệ fail\n` +
    `Toán cao cấp 1,28%\n` +
    `Vật lý đại cương,23%\n` +
    `Lập trình C++,19%\n` +
    `Cấu trúc dữ liệu & Giải thuật,16%\n` +
    `Tiếng Anh chuyên ngành,14%\n` +
    `\n`
  );
};

const generateCSVPerformanceSection = (stats: ScopeStats): string => {
  return (
    `HOẠT ĐỘNG SINH VIÊN TRONG HỆ THỐNG\n` +
    `Loại hoạt động,Số lượng,Tỷ lệ\n` +
    `Đăng nhập đều đặn,${Math.round(stats.students * 0.73)},73%\n` +
    `Đăng nhập thỉnh thoảng,${Math.round(stats.students * 0.18)},18%\n` +
    `Không hoạt động,${Math.round(stats.students * 0.09)},9%\n` +
    `\n` +
    `MỤC ĐÍCH SỬ DỤNG HỆ THỐNG - SINH VIÊN\n` +
    `Mục đích,Số sinh viên,Tỷ lệ\n` +
    `Nộp bài tập,${Math.round(stats.students * 0.82)},82%\n` +
    `Xem tài liệu học tập,${Math.round(stats.students * 0.75)},75%\n` +
    `Tương tác với giảng viên,${Math.round(stats.students * 0.45)},45%\n` +
    `Xem điểm và lịch học,${Math.round(stats.students * 0.91)},91%\n` +
    `Tham gia diễn đàn,${Math.round(stats.students * 0.38)},38%\n` +
    `\n` +
    `MỤC ĐÍCH SỬ DỤNG HỆ THỐNG - GIẢNG VIÊN\n` +
    `Mục đích,Số giảng viên,Tỷ lệ\n` +
    `Cố vấn sinh viên,${Math.round(stats.teachers * 0.95)},95%\n` +
    `Chấm bài và nhập điểm,${Math.round(stats.teachers * 0.88)},88%\n` +
    `Đăng tài liệu học tập,${Math.round(stats.teachers * 0.72)},72%\n` +
    `Theo dõi tiến độ sinh viên,${Math.round(stats.teachers * 0.65)},65%\n` +
    `Trao đổi với sinh viên,${Math.round(stats.teachers * 0.58)},58%\n` +
    `\n` +
    `THỐNG KÊ LÀM BÀI TẬP\n` +
    `Mức độ,Số sinh viên,Tỷ lệ,Đánh giá\n` +
    `Tỷ lệ nộp cao (>90%),${Math.round(stats.students * 0.42)},42%,Xuất sắc\n` +
    `Tỷ lệ nộp TB (60-90%),${Math.round(stats.students * 0.35)},35%,Khá\n` +
    `Tỷ lệ nộp thấp (<60%),${Math.round(stats.students * 0.23)},23%,Cần cải thiện\n` +
    `Điểm trung bình bài tập,7.8/10,,\n` +
    `\n` +
    `HOẠT ĐỘNG CỐ VẤN GIẢNG VIÊN\n` +
    `Chỉ số,Giá trị\n` +
    `Tổng số buổi cố vấn,${stats.teachers * 12}\n` +
    `TB buổi/giảng viên,12\n` +
    `Sinh viên được cố vấn,${Math.round(stats.students * 0.68)} (68%)\n` +
    `TB buổi/sinh viên,2.4\n` +
    `GV tích cực (>15 buổi),${Math.round(stats.teachers * 0.35)} (35%)\n` +
    `GV trung bình (8-15),${Math.round(stats.teachers * 0.45)} (45%)\n` +
    `GV ít hoạt động (<8),${Math.round(stats.teachers * 0.20)} (20%)\n` +
    `\n`
  );
};

const generateCSVPredictionSection = (stats: ScopeStats): string => {
  return (
    `XU HƯỚNG HỌC TẬP\n` +
    `Chỉ số,Giá trị,So với kỳ trước\n` +
    `Tỷ lệ cải thiện điểm,,+5.8%\n` +
    `Tỷ lệ nộp bài đúng hạn,78.3%,\n` +
    `Tương tác với tài liệu,,+12%\n` +
    `Tỷ lệ đạt yêu cầu,94.7%,\n` +
    `Sinh viên tham gia học nhóm,54%,+8%\n` +
    `Điểm trung bình chung,7.2/10,\n` +
    `\n` +
    `CẢNH BÁO HỌC VỤ\n` +
    `Mức độ,Số sinh viên,Tỷ lệ\n` +
    `Nguy cơ học vụ,${Math.round(stats.students * 0.08)},8%\n` +
    `Cần hỗ trợ,${Math.round(stats.students * 0.15)},15%\n` +
    `\n`
  );
};

export const generateCSVContentByType = (reportName: string, type: string, scope: string, timeRange: string, stats: ScopeStats): string => {
  const header = generateCSVHeader(reportName, type, scope, timeRange);
  const basicInfo = generateCSVBasicInfo(stats);
  
  switch (type) {
    case 'Điểm số':
      return header + basicInfo + generateCSVGradeSection(stats);
    
    case 'Hiệu suất':
      return header + basicInfo + generateCSVPerformanceSection(stats);
    
    case 'Dự đoán':
      return header + basicInfo + generateCSVPredictionSection(stats);
    
    case 'Tổng hợp':
    default:
      return (
        header +
        basicInfo +
        generateCSVGradeSection(stats) +
        generateCSVPerformanceSection(stats) +
        generateCSVPredictionSection(stats)
      );
  }
};
