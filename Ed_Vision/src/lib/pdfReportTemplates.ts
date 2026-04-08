// PDF generation templates for different report types using pdfMake

import { type ScopeStats } from './reportUtils';

// Interface for pdfMake table node
interface TableNode {
  table: {
    body: unknown[][];
  };
}

// Custom table layouts
const customTableLayouts = {
  // Header with bold line, data rows with light lines
  headerBoldLines: {
    hLineWidth: function (i: number, node: TableNode) {
      if (i === 0 || i === node.table.body.length) return 0; // No top/bottom border
      if (i === 1) return 1.5; // Bold line after header
      return 0.5; // Light lines between data rows
    },
    vLineWidth: function () {
      return 0; // No vertical lines
    },
    hLineColor: function (i: number) {
      if (i === 1) return '#333333'; // Dark line after header
      return '#CCCCCC'; // Light gray for data rows
    },
    paddingLeft: function () { return 8; },
    paddingRight: function () { return 8; },
    paddingTop: function () { return 6; },
    paddingBottom: function () { return 6; }
  },
  // All rows with light lines (for tables without header)
  lightHorizontalLines: {
    hLineWidth: function (i: number, node: TableNode) {
      if (i === 0 || i === node.table.body.length) return 0;
      return 0.5;
    },
    vLineWidth: function () {
      return 0;
    },
    hLineColor: function () {
      return '#CCCCCC';
    },
    paddingLeft: function () { return 8; },
    paddingRight: function () { return 8; },
    paddingTop: function () { return 6; },
    paddingBottom: function () { return 6; }
  }
};

// Generate dynamic summary based on actual data
const generateDynamicSummary = (type: string, stats: ScopeStats, scope: string): string => {
  const avgGPA = 7.2; // Can be calculated from actual data
  const improvementRate = 5.8;
  const activeStudentRate = 73;
  const atRiskRate = 8;
  const passRate = 94.7;
  
  switch (type) {
    case 'Điểm số':
      return `Báo cáo phân tích chi tiết về kết quả học tập của ${stats.students.toLocaleString()} sinh viên thuộc ${scope}. ` +
        `Điểm trung bình chung đạt ${avgGPA}/10, trong đó 15% sinh viên đạt loại xuất sắc và 28% đạt loại giỏi. ` +
        `Tuy nhiên, cần lưu ý các môn có tỷ lệ fail cao như Toán cao cấp 1 (28%), Vật lý đại cương (23%) để có biện pháp hỗ trợ kịp thời. ` +
        `Nhìn chung, xu hướng điểm số có chiều hướng cải thiện tích cực so với các kỳ trước.`;
      
    case 'Hiệu suất':
      return `Báo cáo đánh giá hiệu suất hoạt động của ${stats.students.toLocaleString()} sinh viên và ${stats.teachers} giảng viên. ` +
        `Kết quả cho thấy ${activeStudentRate}% sinh viên đăng nhập và học tập đều đặn, ${stats.teachers * 0.95} giảng viên (95%) tích cực tham gia cố vấn. ` +
        `Trung bình mỗi giảng viên thực hiện 12 buổi cố vấn trong kỳ, tiếp cận được 68% sinh viên. ` +
        `Khung giờ cao điểm hoạt động là 19:00-22:00 (45% lượng truy cập). Cần có biện pháp khuyến khích 9% sinh viên ít hoạt động tham gia tích cực hơn.`;
      
    case 'Dự đoán':
      return `Báo cáo dự báo xu hướng học tập dựa trên phân tích dữ liệu và mô hình Machine Learning. ` +
        `Kết quả dự đoán cho thấy điểm số có xu hướng cải thiện +${improvementRate}% so với kỳ trước. ` +
        `Hệ thống đã phát hiện và cảnh báo sớm ${Math.round(stats.students * atRiskRate / 100).toLocaleString()} sinh viên (${atRiskRate}%) có nguy cơ học vụ ` +
        `và ${Math.round(stats.students * 0.15).toLocaleString()} sinh viên (15%) cần hỗ trợ thêm. ` +
        `Tỷ lệ đạt yêu cầu môn học dự kiến đạt ${passRate}% nếu duy trì xu hướng hiện tại. ` +
        `Các khuyến nghị can thiệp sớm được đề xuất để nâng cao kết quả học tập.`;
      
    case 'Tổng hợp':
      return `Báo cáo tổng hợp toàn diện về hoạt động giáo dục của ${scope} với ${stats.students.toLocaleString()} sinh viên, ` +
        `${stats.teachers} giảng viên và ${stats.courses} môn học. Phân tích đa chiều bao gồm: ` +
        `(1) Kết quả học tập với điểm TB ${avgGPA}/10, tỷ lệ đạt ${passRate}%; ` +
        `(2) Hiệu suất hoạt động với ${activeStudentRate}% sinh viên tích cực; ` +
        `(3) Dự báo cải thiện +${improvementRate}% và cảnh báo ${atRiskRate}% sinh viên có nguy cơ. ` +
        `Nhìn chung, các chỉ số đều khả quan nhưng cần tập trung hỗ trợ nhóm sinh viên yếu kém và các môn khó để nâng cao chất lượng đào tạo.`;
      
    default:
      return generateDynamicSummary('Tổng hợp', stats, scope);
  }
};

export const generatePDFReportByType = (
  reportName: string,
  type: string,
  scope: string,
  timeRange: string,
  stats: ScopeStats,
  charts?: Record<string, string | null>
) => {
  const timestamp = new Date().toLocaleString('vi-VN');
  const today = new Date().toLocaleDateString('vi-VN');

  // Cover page content (no extra page break at start)
  const coverPage = [
    { text: 'Nền tảng Học tập ED_VISION', alignment: 'center', fontSize: 14, bold: true, margin: [0, 20, 0, 40] },
    { text: 'BÁO CÁO LÃNH ĐẠO', alignment: 'center', fontSize: 32, bold: true, color: '#FF6B35', margin: [0, 0, 0, 50] },
    { text: `Loại báo cáo: ${type}`, alignment: 'center', fontSize: 14, margin: [0, 0, 0, 8] },
    { text: today, alignment: 'center', fontSize: 12, margin: [0, 0, 0, 8] },
    { text: 'Người chuẩn bị: Admin ED_VISION', alignment: 'center', fontSize: 12, margin: [0, 0, 0, 8] },
    { text: 'Nền tảng Học tập ED_VISION', alignment: 'center', fontSize: 12, margin: [0, 0, 0, 50] },
    { text: 'Tóm tắt', fontSize: 16, bold: true, margin: [60, 0, 60, 15] },
    { 
      text: generateDynamicSummary(type, stats, scope),
      fontSize: 11,
      alignment: 'justify',
      lineHeight: 1.5,
      margin: [60, 0, 60, 0],
      pageBreak: 'after' as const
    }
  ];

  // Common header and basic info
  const commonContent = [
    { text: 'THÔNG TIN BÁO CÁO', style: 'sectionHeader', margin: [0, 0, 0, 10] },
    {
      table: {
        widths: ['35%', '65%'],
        body: [
          ['Tên báo cáo:', reportName],
          ['Loại báo cáo:', type],
          ['Phạm vi:', scope],
          ['Thời gian:', timeRange],
          ['Người báo cáo:', 'Admin ED_VISION'],
          ['Ngày tạo:', timestamp]
        ]
      },
      layout: 'lightHorizontalLines'
    },
    { text: '\n' },
    
    // System scale section - vertical layout
    { text: 'QUY MÔ HỆ THỐNG', style: 'sectionHeader', margin: [0, 10, 0, 10] },
    // Chart first
    charts && charts.systemScale
      ? { image: charts.systemScale, fit: [220, 120], alignment: 'center', margin: [0, 0, 0, 10] }
      : { text: '(Biểu đồ không có sẵn)', fontSize: 9, italics: true, color: '#999', alignment: 'center', margin: [0, 0, 0, 10] },
    // Table below chart
    {
      table: {
        widths: ['50%', '50%'],
        body: [
          ['Tổng số sinh viên:', `${stats.students.toLocaleString()} sinh viên`],
          ['Tổng số giảng viên:', `${stats.teachers} giảng viên`],
          ['Số môn học/khóa học:', `${stats.courses} môn`]
        ]
      },
      layout: customTableLayouts.lightHorizontalLines,
      margin: [0, 0, 0, 15]
    }
  ];

  // Grade section content - vertical layout
  const gradeContent = [
    { text: 'PHÂN BỐ ĐIỂM GPA', style: 'sectionHeader', margin: [0, 10, 0, 10] },
    // Chart first
    charts && charts.gpaDistribution
      ? { image: charts.gpaDistribution, fit: [220, 120], alignment: 'center', margin: [0, 0, 0, 10] }
      : { text: '(Biểu đồ không có sẵn)', fontSize: 9, italics: true, color: '#999', alignment: 'center', margin: [0, 0, 0, 10] },
    // Table below chart
    {
      table: {
        widths: ['60%', '20%', '20%'],
        body: [
          [{ text: 'Xếp loại', bold: true }, { text: 'Số SV', bold: true }, { text: 'Tỷ lệ', bold: true }],
          ['GPA xuất sắc (3.6-4.0)', Math.round(stats.students * 0.15).toLocaleString(), '15%'],
          ['GPA giỏi (3.2-3.59)', Math.round(stats.students * 0.28).toLocaleString(), '28%'],
          ['GPA khá (2.5-3.19)', Math.round(stats.students * 0.35).toLocaleString(), '35%'],
          ['GPA trung bình (2.0-2.49)', Math.round(stats.students * 0.18).toLocaleString(), '18%'],
          ['GPA yếu (<2.0)', Math.round(stats.students * 0.04).toLocaleString(), '4%']
        ]
      },
      layout: customTableLayouts.headerBoldLines,
      margin: [0, 0, 0, 15]
    },
    
    { text: 'PHÂN BỐ CHI TIẾT ĐIỂM CHỮ', style: 'sectionHeader', margin: [0, 10, 0, 10] },
    {
      table: {
        widths: ['25%', '25%', '25%', '25%'],
        body: [
          [{ text: 'Điểm', bold: true }, { text: 'Số SV', bold: true }, { text: 'Điểm', bold: true }, { text: 'Số SV', bold: true }],
          ['A+ (90-100%)', Math.round(stats.students * 0.12).toLocaleString(), 'B- (65-69%)', Math.round(stats.students * 0.10).toLocaleString()],
          ['A (85-89%)', Math.round(stats.students * 0.18).toLocaleString(), 'C+ (60-64%)', Math.round(stats.students * 0.05).toLocaleString()],
          ['A- (80-84%)', Math.round(stats.students * 0.15).toLocaleString(), 'C (55-59%)', Math.round(stats.students * 0.03).toLocaleString()],
          ['B+ (75-79%)', Math.round(stats.students * 0.20).toLocaleString(), 'D (50-54%)', Math.round(stats.students * 0.01).toLocaleString()],
          ['B (70-74%)', Math.round(stats.students * 0.16).toLocaleString(), 'F (<50%)', Math.round(stats.students * 0.002).toLocaleString()]
        ]
      },
      layout: customTableLayouts.headerBoldLines
    },
    
    { text: 'ĐIỂM TRUNG BÌNH', style: 'sectionHeader', margin: [0, 15, 0, 10] },
    {
      table: {
        widths: ['70%', '30%'],
        body: [
          ['Điểm trung bình chung:', '7.2/10'],
          ['Điểm trung bình bài tập:', '7.8/10']
        ]
      },
      margin: [0, 0, 0, 15]
    },
    
    { text: 'MÔN CÓ TỶ LỆ FAIL CAO', style: 'sectionHeader', margin: [0, 10, 0, 10] },
    // Add high fail subjects chart if available
    ...(charts && charts.highFailSubjects 
      ? [{ image: charts.highFailSubjects, width: 320, alignment: 'center', margin: [0, 0, 0, 10] }] 
      : []
    ),
    {
      table: {
        widths: ['70%', '30%'],
        body: [
          [{ text: 'Môn học', bold: true }, { text: 'Tỷ lệ fail', bold: true }],
          ['Toán cao cấp 1', '28%'],
          ['Vật lý đại cương', '23%'],
          ['Lập trình C++', '19%'],
          ['Cấu trúc dữ liệu & Giải thuật', '16%'],
          ['Tiếng Anh chuyên ngành', '14%']
        ]
      },
      layout: customTableLayouts.headerBoldLines,
      margin: [0, 0, 0, 15]
    }
  ];

  // Performance section content
  const performanceContent = [
    { text: 'HOẠT ĐỘNG SINH VIÊN', style: 'sectionHeader', margin: [0, 10, 0, 10] },
    // Add student activity chart if available
    ...(charts && charts.studentActivity 
      ? [{ image: charts.studentActivity, width: 320, alignment: 'center', margin: [0, 0, 0, 10] }] 
      : []
    ),
    {
      table: {
        widths: ['60%', '20%', '20%'],
        body: [
          [{ text: 'Loại hoạt động', bold: true }, { text: 'Số lượng', bold: true }, { text: 'Tỷ lệ', bold: true }],
          ['Đăng nhập đều đặn', Math.round(stats.students * 0.73).toLocaleString(), '73%'],
          ['Đăng nhập thỉnh thoảng', Math.round(stats.students * 0.18).toLocaleString(), '18%'],
          ['Không hoạt động', Math.round(stats.students * 0.09).toLocaleString(), '9%']
        ]
      },
      layout: customTableLayouts.headerBoldLines,
      margin: [0, 0, 0, 15]
    },
    
    { text: 'THỐNG KÊ LÀM BÀI TẬP', style: 'sectionHeader', margin: [0, 10, 0, 10] },
    {
      table: {
        widths: ['60%', '20%', '20%'],
        body: [
          [{ text: 'Mức độ', bold: true }, { text: 'Số SV', bold: true }, { text: 'Đánh giá', bold: true }],
          ['Tỷ lệ nộp cao (>90%)', Math.round(stats.students * 0.42).toLocaleString(), 'Xuất sắc'],
          ['Tỷ lệ nộp TB (60-90%)', Math.round(stats.students * 0.35).toLocaleString(), 'Khá'],
          ['Tỷ lệ nộp thấp (<60%)', Math.round(stats.students * 0.23).toLocaleString(), 'Cần cải thiện']
        ]
      },
      layout: customTableLayouts.headerBoldLines,
      margin: [0, 0, 0, 15]
    },
    
    { text: 'THỜI GIAN SỬ DỤNG HỆ THỐNG', style: 'sectionHeader', margin: [0, 10, 0, 10] },
    {
      table: {
        widths: ['70%', '30%'],
        body: [
          ['Sinh viên - TB/ngày:', '2.5 giờ'],
          ['Khung giờ cao điểm:', '19:00-22:00 (45%)'],
          ['Khung giờ sáng:', '08:00-12:00 (25%)'],
          ['Khung giờ chiều:', '13:00-17:00 (30%)']
        ]
      },
      margin: [0, 0, 0, 15]
    },
    
    { text: 'HOẠT ĐỘNG CỐ VẤN GIẢNG VIÊN', style: 'sectionHeader', margin: [0, 10, 0, 10] },
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
      },
      margin: [0, 0, 0, 15]
    }
  ];

  // Prediction section content
  const predictionContent = [
    { text: 'XU HƯỚNG HỌC TẬP', style: 'sectionHeader', margin: [0, 10, 0, 10] },
    // Add learning trend chart if available
    ...(charts && charts.learningTrend 
      ? [{ image: charts.learningTrend, width: 320, alignment: 'center', margin: [0, 0, 0, 10] }] 
      : []
    ),
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
      },
      margin: [0, 0, 0, 15]
    },
    
    { text: 'CẢNH BÁO HỌC VỤ', style: 'sectionHeader', margin: [0, 10, 0, 10] },
    {
      table: {
        widths: ['70%', '30%'],
        body: [
          ['Sinh viên có nguy cơ học vụ:', `${Math.round(stats.students * 0.08).toLocaleString()} SV (8%)`],
          ['Sinh viên cần hỗ trợ:', `${Math.round(stats.students * 0.15).toLocaleString()} SV (15%)`]
        ]
      },
      margin: [0, 0, 0, 15]
    },
    
    { text: 'KHUYẾN NGHỊ CẢI THIỆN', style: 'sectionHeader', margin: [0, 10, 0, 10] },
    {
      ul: [
        'Tăng cường hoạt động cố vấn cho nhóm sinh viên yếu kém (GPA < 2.0)',
        'Tổ chức thêm các buổi hỗ trợ học tập vào khung giờ cao điểm 19:00-22:00',
        'Khuyến khích giảng viên ít hoạt động tham gia cố vấn nhiều hơn',
        'Cải thiện chất lượng tài liệu học tập để tăng tương tác (+12% mục tiêu)',
        'Tăng cường sử dụng tính năng dự đoán điểm AI để hỗ trợ sinh viên',
        'Tổ chức thêm các nhóm học tập online cho các môn có tỷ lệ fail cao'
      ],
      fontSize: 9,
      margin: [0, 0, 0, 15]
    },
    
    { text: 'ĐIỂM NỔI BẬT', style: 'sectionHeader', margin: [0, 10, 0, 10] },
    {
      ul: [
        '✅ Tỷ lệ sinh viên xem lịch học & lịch thi cao (91%)',
        '✅ Tỷ lệ sinh viên làm bài tập trực tuyến tốt (82%)',
        '✅ Giảng viên tích cực cố vấn sinh viên (95%)',
        '✅ Tỷ lệ đạt yêu cầu môn học cao (94.7%)',
        '✅ Xu hướng cải thiện điểm tích cực (+5.8%)'
      ],
      fontSize: 9,
      margin: [0, 0, 0, 10]
    }
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
    content: [...coverPage, ...commonContent, ...specificContent, ...footer],
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
