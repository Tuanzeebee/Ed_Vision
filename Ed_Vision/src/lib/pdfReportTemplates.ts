// PDF generation templates for different report types using pdfMake

import { type ScopeStats } from './reportUtils';

export const generatePDFReportByType = (
  reportName: string,
  type: string,
  scope: string,
  timeRange: string,
  stats: ScopeStats
) => {
  const timestamp = new Date().toLocaleString('vi-VN');

  // Common header and basic info
  const commonContent = [
    { text: 'BÁO CÁO LÃNH ĐẠO', style: 'header', alignment: 'center' },
    { text: 'TRƯỜNG ĐẠI HỌC ED_VISION', style: 'subheader', alignment: 'center' },
    { text: '\n' },
    
    { text: 'THÔNG TIN BÁO CÁO', style: 'sectionHeader' },
    {
      table: {
        widths: ['30%', '70%'],
        body: [
          ['Tên báo cáo:', reportName],
          ['Loại báo cáo:', type],
          ['Phạm vi:', scope],
          ['Thời gian:', timeRange],
          ['Người tạo:', 'Admin'],
          ['Ngày tạo:', timestamp]
        ]
      },
      layout: 'lightHorizontalLines'
    },
    { text: '\n' },
    
    { text: 'QUY MÔ HỆ THỐNG', style: 'sectionHeader' },
    {
      table: {
        widths: ['50%', '50%'],
        body: [
          ['Tổng số sinh viên:', `${stats.students.toLocaleString()} sinh viên`],
          ['Tổng số giảng viên:', `${stats.teachers} giảng viên`],
          ['Số môn học/khóa học:', `${stats.courses} môn`]
        ]
      }
    },
    { text: '\n' }
  ];

  // Grade section content
  const gradeContent = [
    { text: 'PHÂN BỐ ĐIỂM GPA', style: 'sectionHeader' },
    {
      table: {
        widths: ['60%', '20%', '20%'],
        body: [
          ['Xếp loại', 'Số SV', 'Tỷ lệ'],
          ['GPA xuất sắc (3.6-4.0)', Math.round(stats.students * 0.15).toLocaleString(), '15%'],
          ['GPA giỏi (3.2-3.59)', Math.round(stats.students * 0.28).toLocaleString(), '28%'],
          ['GPA khá (2.5-3.19)', Math.round(stats.students * 0.35).toLocaleString(), '35%'],
          ['GPA trung bình (2.0-2.49)', Math.round(stats.students * 0.18).toLocaleString(), '18%'],
          ['GPA yếu (<2.0)', Math.round(stats.students * 0.04).toLocaleString(), '4%']
        ]
      },
      layout: 'lightHorizontalLines'
    },
    { text: '\n' },
    
    { text: 'PHÂN BỐ CHI TIẾT ĐIỂM CHỮ', style: 'sectionHeader' },
    {
      table: {
        widths: ['25%', '25%', '25%', '25%'],
        body: [
          ['Điểm', 'Số SV', 'Điểm', 'Số SV'],
          ['A+ (90-100%)', Math.round(stats.students * 0.12).toLocaleString(), 'B- (65-69%)', Math.round(stats.students * 0.10).toLocaleString()],
          ['A (85-89%)', Math.round(stats.students * 0.18).toLocaleString(), 'C+ (60-64%)', Math.round(stats.students * 0.05).toLocaleString()],
          ['A- (80-84%)', Math.round(stats.students * 0.15).toLocaleString(), 'C (55-59%)', Math.round(stats.students * 0.03).toLocaleString()],
          ['B+ (75-79%)', Math.round(stats.students * 0.20).toLocaleString(), 'D (50-54%)', Math.round(stats.students * 0.01).toLocaleString()],
          ['B (70-74%)', Math.round(stats.students * 0.16).toLocaleString(), 'F (<50%)', Math.round(stats.students * 0.002).toLocaleString()]
        ]
      },
      layout: 'lightHorizontalLines'
    },
    { text: '\n' },
    
    { text: 'ĐIỂM TRUNG BÌNH', style: 'sectionHeader' },
    {
      table: {
        widths: ['70%', '30%'],
        body: [
          ['Điểm trung bình chung:', '7.2/10'],
          ['Điểm trung bình bài tập:', '7.8/10']
        ]
      }
    },
    { text: '\n' },
    
    { text: 'MÔN CÓ TỶ LỆ FAIL CAO', style: 'sectionHeader' },
    {
      table: {
        widths: ['70%', '30%'],
        body: [
          ['Toán cao cấp 1', '28%'],
          ['Vật lý đại cương', '23%'],
          ['Lập trình C++', '19%'],
          ['Cấu trúc dữ liệu & Giải thuật', '16%'],
          ['Tiếng Anh chuyên ngành', '14%']
        ]
      }
    },
    { text: '\n' }
  ];

  // Performance section content
  const performanceContent = [
    { text: 'HOẠT ĐỘNG SINH VIÊN', style: 'sectionHeader' },
    {
      table: {
        widths: ['60%', '20%', '20%'],
        body: [
          ['Loại hoạt động', 'Số lượng', 'Tỷ lệ'],
          ['Đăng nhập đều đặn', Math.round(stats.students * 0.73).toLocaleString(), '73%'],
          ['Đăng nhập thỉnh thoảng', Math.round(stats.students * 0.18).toLocaleString(), '18%'],
          ['Không hoạt động', Math.round(stats.students * 0.09).toLocaleString(), '9%']
        ]
      },
      layout: 'lightHorizontalLines'
    },
    { text: '\n' },
    
    { text: 'THỐNG KÊ LÀM BÀI TẬP', style: 'sectionHeader' },
    {
      table: {
        widths: ['60%', '20%', '20%'],
        body: [
          ['Mức độ', 'Số SV', 'Đánh giá'],
          ['Tỷ lệ nộp cao (>90%)', Math.round(stats.students * 0.42).toLocaleString(), 'Xuất sắc'],
          ['Tỷ lệ nộp TB (60-90%)', Math.round(stats.students * 0.35).toLocaleString(), 'Khá'],
          ['Tỷ lệ nộp thấp (<60%)', Math.round(stats.students * 0.23).toLocaleString(), 'Cần cải thiện']
        ]
      },
      layout: 'lightHorizontalLines'
    },
    { text: '\n' },
    
    { text: 'THỜI GIAN SỬ DỤNG HỆ THỐNG', style: 'sectionHeader' },
    {
      table: {
        widths: ['70%', '30%'],
        body: [
          ['Sinh viên - TB/ngày:', '2.5 giờ'],
          ['Khung giờ cao điểm:', '19:00-22:00 (45%)'],
          ['Khung giờ sáng:', '08:00-12:00 (25%)'],
          ['Khung giờ chiều:', '13:00-17:00 (30%)']
        ]
      }
    },
    { text: '\n' },
    
    { text: 'HOẠT ĐỘNG CỐ VẤN GIẢNG VIÊN', style: 'sectionHeader' },
    {
      table: {
        widths: ['70%', '30%'],
        body: [
          ['Tổng số buổi cố vấn:', `${stats.teachers * 12} buổi`],
          ['Trung bình/giảng viên:', `12 buổi/${timeRange}`],
          ['Sinh viên được cố vấn:', `${Math.round(stats.students * 0.68).toLocaleString()} SV (68%)`],
          ['GV tích cực (>15 buổi):', `${Math.round(stats.teachers * 0.35)} GV (35%)`],
          ['GV trung bình (8-15):', `${Math.round(stats.teachers * 0.45)} GV (45%)`],
          ['GV ít hoạt động (<8):', `${Math.round(stats.teachers * 0.20)} GV (20%)`]
        ]
      }
    },
    { text: '\n' }
  ];

  // Prediction section content
  const predictionContent = [
    { text: 'XU HƯỚNG HỌC TẬP', style: 'sectionHeader' },
    {
      table: {
        widths: ['70%', '30%'],
        body: [
          ['Tỷ lệ cải thiện điểm so với kỳ trước:', '+5.8%'],
          ['Tỷ lệ nộp bài đúng hạn:', '78.3%'],
          ['Mức độ tương tác với tài liệu:', '+12%'],
          ['Tỷ lệ đạt yêu cầu môn học:', '94.7%'],
          ['Tỷ lệ tham gia học nhóm:', '54% (tăng 8%)'],
          ['Tỷ lệ sử dụng AI dự đoán:', '68%']
        ]
      }
    },
    { text: '\n' },
    
    { text: 'CẢNH BÁO HỌC VỤ', style: 'sectionHeader' },
    {
      table: {
        widths: ['70%', '30%'],
        body: [
          ['Sinh viên có nguy cơ học vụ:', `${Math.round(stats.students * 0.08).toLocaleString()} SV (8%)`],
          ['Sinh viên cần hỗ trợ:', `${Math.round(stats.students * 0.15).toLocaleString()} SV (15%)`]
        ]
      }
    },
    { text: '\n' },
    
    { text: 'KHUYẾN NGHỊ CẢI THIỆN', style: 'sectionHeader' },
    {
      ul: [
        'Tăng cường hoạt động cố vấn cho nhóm sinh viên yếu kém (GPA < 2.0)',
        'Tổ chức thêm các buổi hỗ trợ học tập vào khung giờ cao điểm 19:00-22:00',
        'Khuyến khích giảng viên ít hoạt động tham gia cố vấn nhiều hơn',
        'Cải thiện chất lượng tài liệu học tập để tăng tương tác (+12% mục tiêu)',
        'Tăng cường sử dụng tính năng dự đoán điểm AI để hỗ trợ sinh viên',
        'Tổ chức thêm các nhóm học tập online cho các môn có tỷ lệ fail cao'
      ],
      fontSize: 9
    },
    { text: '\n' },
    
    { text: 'ĐIỂM NỔI BẬT', style: 'sectionHeader' },
    {
      ul: [
        '✅ Tỷ lệ sinh viên xem lịch học & lịch thi cao (91%)',
        '✅ Tỷ lệ sinh viên làm bài tập trực tuyến tốt (82%)',
        '✅ Giảng viên tích cực cố vấn sinh viên (95%)',
        '✅ Tỷ lệ đạt yêu cầu môn học cao (94.7%)',
        '✅ Xu hướng cải thiện điểm tích cực (+5.8%)'
      ],
      fontSize: 9
    },
    { text: '\n' }
  ];

  // Footer
  const footer = [
    { text: '\n' },
    { text: '✅ Báo cáo được tạo tự động bởi hệ thống Ed_Vision', alignment: 'center', fontSize: 9, color: '#666' },
    { text: '📧 Liên hệ: admin@edvision.edu.vn | Hotline: 1900-xxxx', alignment: 'center', fontSize: 9, color: '#666' }
  ];

  // Build content based on report type
  let specificContent = [];
  
  switch (type) {
    case 'Điểm số':
      specificContent = gradeContent;
      break;
    
    case 'Hiệu suất':
      specificContent = performanceContent;
      break;
    
    case 'Dự đoán':
      specificContent = predictionContent;
      break;
    
    case 'Tổng hợp':
    default:
      specificContent = [...gradeContent, ...performanceContent, ...predictionContent];
      break;
  }

  return {
    content: [...commonContent, ...specificContent, ...footer],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10],
        color: '#1976d2'
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 20],
        color: '#1976d2'
      },
      sectionHeader: {
        fontSize: 13,
        bold: true,
        margin: [0, 10, 0, 5],
        color: '#424242'
      }
    },
    defaultStyle: {
      fontSize: 10
    }
  };
};
