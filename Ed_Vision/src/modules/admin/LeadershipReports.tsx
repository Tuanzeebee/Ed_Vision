import { Card, CardContent } from "@/components/ui/card";
import AdminLayout from "../../components/ui/admin/AdminLayout";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useState, useCallback, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getScopeStats, saveReportsToStorage, loadReportsFromStorage, type Report } from '@/lib/reportUtils';
import Modal from '@/components/ui/admin/Modal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
);

// Majors data by school
const majorsBySchool: { [key: string]: string[] } = {
  "Trường Khoa học máy tính": [
    "Công nghệ Phần mềm",
    "An toàn Thông tin",
    "Khoa học Máy tính",
    "Trí tuệ Nhân tạo",
    "Khoa học Dữ liệu",
    "Mạng Máy tính & Truyền thông"
  ],
  "Trường Công nghệ": [
    "Điện tử-Viễn thông",
    "Điện-Điện tử chuẩn PNJ",
    "Thiết kế Vi mạch Bán dẫn",
    "Kỹ thuật Ô tô",
    "Kỹ thuật Điều khiển & Tự động hóa",
    "Kỹ thuật Điện",
    "Công nghệ Chế tạo Máy",
    "Thiết kế Đồ họa",
    "Thiết kế Thời trang",
    "Kiến trúc Công trình",
    "Thiết kế Nội thất",
    "Xây dựng Dân dụng & Công nghiệp",
    "Xây dựng Cầu đường",
    "Công nghệ Quản lý Xây dựng",
    "Công nghệ Kỹ thuật Môi trường",
    "Công nghệ Thực phẩm"
  ],
  "Trường Kinh tế và Kinh doanh": [
    "Quản trị Kinh doanh Tổng hợp",
    "Quản trị Kinh doanh Bất động sản",
    "Quản trị Kinh doanh Quốc tế",
    "Phân tích Kinh doanh",
    "Thương mại Điện tử",
    "Quản trị Nhân lực",
    "Logistics & Quản lý Chuỗi cung ứng",
    "Marketing",
    "Quản trị Kinh doanh Marketing",
    "Digital Marketing",
    "Kinh doanh Thương mại",
    "Tài chính-Ngân hàng",
    "Ngân hàng",
    "Kinh tế Đầu tư",
    "Kinh tế Quốc tế",
    "Kế toán Doanh nghiệp",
    "Kế toán Quản trị",
    "Kiểm toán",
    "Công nghệ Tài chính"
  ],
  "Trường Ngôn ngữ và Xã hội nhân văn": [
    "Tiếng Anh Biên-Phiên dịch",
    "Tiếng Anh Du lịch",
    "Tiếng Anh Thương mại",
    "Tiếng Trung Biên-Phiên dịch",
    "Tiếng Trung Du lịch",
    "Tiếng Trung Thương mại",
    "Tiếng Hàn Biên-Phiên dịch",
    "Tiếng Hàn Du lịch",
    "Tiếng Hàn Thương mại",
    "Tiếng Nhật Biên-Phiên dịch",
    "Tiếng Nhật Du lịch",
    "Tiếng Nhật Thương mại",
    "Văn hóa học",
    "Việt Nam học",
    "Truyền thông Đa phương tiện",
    "Quản lý Nhà nước",
    "Quản lý Công chúng",
    "Luật Kinh tế",
    "Luật Kinh doanh",
    "Luật học"
  ],
  "Trường Du lịch": [
    "Quản trị Khách sạn",
    "Quản trị Khách sạn Quốc tế (PSU)",
    "Quản trị Dịch vụ Du lịch & Lữ hành",
    "Hướng dẫn Du lịch Quốc tế",
    "Quản trị Nhà hàng & Dịch vụ Ăn uống",
    "Quản trị Nhà hàng Quốc tế (PSU)",
    "Du lịch",
    "Quản trị Sự kiện & Giải trí",
    "Quản trị Du lịch & Lữ hành chuẩn PSU"
  ],
  "Trường Y-Dược": [
    "Y Khoa",
    "Răng Hàm Mặt",
    "Điều dưỡng Đa khoa",
    "Dược sĩ",
    "Công nghệ Sinh học",
    "Kỹ thuật Y sinh",
    "Kỹ thuật Xét nghiệm Y học"
  ],
  "Trường Đào tạo quốc tế": [
    "Công nghệ Phần mềm chuẩn CMU",
    "An toàn Mạng chuẩn CMU",
    "Hệ thống Thông tin Quản lý chuẩn CMU",
    "Quản trị Kinh doanh chuẩn PSU",
    "Tài chính-Ngân hàng chuẩn PSU",
    "Quản trị Kế toán chuẩn PSU",
    "Xây dựng Dân dụng & Công nghiệp chuẩn CSU",
    "Kiến trúc Công trình chuẩn CSU"
  ],
  "Viện Quản lý Nam Khuê": [
    "Quản trị Kinh doanh (HP)",
    "Marketing (HP)",
    "Tài chính-Ngân hàng (HP)",
    "Logistics & Quản lý Chuỗi cung ứng (HP)"
  ],
  "Viện Việt-Nhật": [
    "Công nghệ Phần mềm (VJJ)",
    "Điện tử-Viễn thông (VJJ)",
    "Kỹ thuật Điều khiển & Tự động hóa (VJJ)",
    "Công nghệ Kỹ thuật Ô tô (VJJ)",
    "Xây dựng Dân dụng & Công nghiệp (VJJ)",
    "Kiến trúc Công trình (VJJ)",
    "Thiết kế Đồ họa (VJJ)",
    "Công nghệ Thực phẩm (VJJ)",
    "Điều dưỡng Đa khoa (VJJ)"
  ]
};

// Classes data by school and major (sample data - can be expanded)
const classesBySchoolAndMajor: { [key: string]: { [key: string]: string[] } } = {
  "Trường Khoa học máy tính": {
    "Công nghệ Phần mềm": ["TPM1-CSE", "TPM2-CSE", "TPM3-CSE"],
    "An toàn Thông tin": ["ATT1-CSE", "ATT2-CSE"],
    "Khoa học Máy tính": ["KMT1-CSE", "KMT2-CSE"],
    "Trí tuệ Nhân tạo": ["TNT1-CSE", "TNT2-CSE"],
    "Khoa học Dữ liệu": ["DLS1-CSE", "DLS2-CSE"],
    "Mạng Máy tính & Truyền thông": ["MMT1-CSE", "MMT2-CSE"]
  },
  "Trường Công nghệ": {
    "Điện tử-Viễn thông": ["DVT1-SET", "DVT2-SET"],
    "Kỹ thuật Ô tô": ["KTO1-SET", "KTO2-SET"],
    "Thiết kế Đồ họa": ["TDH1-SET", "TDH2-SET"],
    "Kiến trúc Công trình": ["KTC1-SET", "KTC2-SET"]
  },
  "Trường Kinh tế và Kinh doanh": {
    "Quản trị Kinh doanh Tổng hợp": ["QTK1-SBE", "QTK2-SBE"],
    "Marketing": ["MKT1-SBE", "MKT2-SBE"],
    "Tài chính-Ngân hàng": ["TCN1-SBE", "TCN2-SBE"],
    "Kế toán Doanh nghiệp": ["KTD1-SBE", "KTD2-SBE"]
  },
  "Trường Ngôn ngữ và Xã hội nhân văn": {
    "Tiếng Anh Biên-Phiên dịch": ["TAB1-LHS", "TAB2-LHS"],
    "Tiếng Trung Biên-Phiên dịch": ["TTB1-LHS", "TTB2-LHS"],
    "Tiếng Nhật Biên-Phiên dịch": ["TNB1-LHS", "TNB2-LHS"],
    "Luật Kinh tế": ["LKT1-LHS", "LKT2-LHS"]
  },
  "Trường Du lịch": {
    "Quản trị Khách sạn": ["QTK1-HTI", "QTK2-HTI"],
    "Quản trị Khách sạn Quốc tế (PSU)": ["QTK1-PSU", "QTK2-PSU"],
    "Du lịch": ["DLI1-HTI", "DLI2-HTI"]
  },
  "Trường Y-Dược": {
    "Y Khoa": ["YKH1-SMP", "YKH2-SMP"],
    "Răng Hàm Mặt": ["RHM1-SMP", "RHM2-SMP"],
    "Dược sĩ": ["DCS1-SMP", "DCS2-SMP"]
  },
  "Trường Đào tạo quốc tế": {
    "Công nghệ Phần mềm chuẩn CMU": ["TPM1-CMU", "TPM2-CMU", "TPM3-CMU"],
    "An toàn Mạng chuẩn CMU": ["ATM1-CMU", "ATM2-CMU"],
    "Quản trị Kinh doanh chuẩn PSU": ["QTK1-PSU", "QTK2-PSU"],
    "Xây dựng Dân dụng & Công nghiệp chuẩn CSU": ["XDC1-CSU", "XDC2-CSU"]
  },
  "Viện Quản lý Nam Khuê": {
    "Quản trị Kinh doanh (HP)": ["QTK1-HP", "QTK2-HP"],
    "Marketing (HP)": ["MKT1-HP", "MKT2-HP"],
    "Tài chính-Ngân hàng (HP)": ["TCN1-HP", "TCN2-HP"]
  },
  "Viện Việt-Nhật": {
    "Công nghệ Phần mềm (VJJ)": ["TPM1-VJJ", "TPM2-VJJ"],
    "Điện tử-Viễn thông (VJJ)": ["DVT1-VJJ", "DVT2-VJJ"],
    "Thiết kế Đồ họa (VJJ)": ["TDH1-VJJ", "TDH2-VJJ"]
  }
};

export default function LeadershipReports() {
  // State for time filter (from GeneralStatistics)
  const [timeFilter, setTimeFilter] = useState('tháng-này');
  
  // State for report form
  const [reportType, setReportType] = useState("Báo cáo điểm số");
  const [dataScope, setDataScope] = useState("Trường Khoa học máy tính");
  const [major, setMajor] = useState("Tất cả ngành");
  const [className, setClassName] = useState("Tất cả lớp");
  const [timeRange, setTimeRange] = useState("Học kỳ hiện tại");
  const [customWeekStart, setCustomWeekStart] = useState("");
  const [customWeekEnd, setCustomWeekEnd] = useState("");
  const [exportFormat, setExportFormat] = useState("PDF");
  
  // Get available majors based on selected school
  const availableMajors = majorsBySchool[dataScope] || [];
  
  // Get available classes based on selected school and major
  const availableClasses = useMemo(() => {
    if (major === "Tất cả ngành") {
      // If "All majors" selected, show all classes from all majors in the school
      const schoolClasses = classesBySchoolAndMajor[dataScope] || {};
      return Object.values(schoolClasses).flat();
    }
    return classesBySchoolAndMajor[dataScope]?.[major] || [];
  }, [dataScope, major]);
  
  // Reset major when school changes
  useEffect(() => {
    setMajor("Tất cả ngành");
    setClassName("Tất cả lớp");
  }, [dataScope]);
  
  // Loading and Modal states
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  
  // State for reports list - Load from localStorage on mount
  const [reports, setReports] = useState<Report[]>(() => {
    const stored = loadReportsFromStorage();
    return stored || [
      {
        id: 1,
        name: "Báo cáo điểm cuối kỳ HK1-2024",
        type: "Điểm số",
        creator: "Admin",
        date: "15/12/2024",
        scope: "Toàn trường",
        status: "Đã tải xuống",
        statusColor: "green"
      },
      {
        id: 2,
        name: "Phân tích hiệu suất giảng viên",
        type: "Hiệu suất",
        creator: "Admin",
        date: "14/12/2024",
        scope: "Khoa CNTT",
        status: "Chưa tải xuống",
        statusColor: "yellow"
      },
      {
        id: 3,
        name: "Dự đoán kết quả học tập",
        type: "Dự đoán",
        creator: "Admin",
        date: "13/12/2024",
        scope: "Lớp 12A",
        status: "Đã tải xuống",
        statusColor: "green"
      }
    ];
  });

  // Save reports to localStorage whenever it changes
  useEffect(() => {
    saveReportsToStorage(reports);
  }, [reports]);

  // Get current time filter label
  const getTimeFilterLabel = () => {
    const labels: { [key: string]: string } = {
      'hôm-nay': 'hôm nay',
      'tuần-này': 'tuần này',
      'tháng-này': 'tháng này', 
      'tất-cả': 'tất cả thời gian'
    };
    return labels[timeFilter] || 'tháng này';
  };

  // Get comparison period label
  const getComparisonLabel = () => {
    const labels: { [key: string]: string } = {
      'hôm-nay': 'so với hôm qua',
      'tuần-này': 'so với tuần trước',
      'tháng-này': 'so với tháng trước', 
      'tất-cả': 'so với năm trước'
    };
    return labels[timeFilter] || 'so với kỳ trước';
  };

  // Get formatted time range for display
  const getFormattedTimeRange = useCallback(() => {
    if (timeRange === "Tùy chỉnh" && customWeekStart && customWeekEnd) {
      return `Tuần ${customWeekStart} - Tuần ${customWeekEnd}`;
    }
    return timeRange;
  }, [timeRange, customWeekStart, customWeekEnd]);

  // Calculate dynamic data based on time filter using useMemo
  const dashboardData = useMemo(() => {
    const baseData: { [key: string]: { reports: number; reportsGrowth: number } } = {
      'hôm-nay': { reports: 12, reportsGrowth: 25.0 },
      'tuần-này': { reports: 68, reportsGrowth: 18.5 },
      'tháng-này': { reports: 487, reportsGrowth: 8.3 },
      'tất-cả': { reports: 11847, reportsGrowth: 3.2 }
    };
    
    return baseData[timeFilter] || baseData['tháng-này'];
  }, [timeFilter]);

  // Modal handlers
  const showModal = useCallback((title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setModal({ isOpen: true, title, message, type });
  }, []);

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Helper function to generate report content
  const generateReportContent = useCallback((reportName: string, type: string, scope: string, timeRange: string) => {
    const timestamp = new Date().toLocaleString('vi-VN');
    const stats = getScopeStats(scope);
    
    return `
╔════════════════════════════════════════════════════════════════╗
║                     BÁO CÁO LÃNH ĐẠO                           ║
║                  TRƯỜNG ĐẠI HỌC ED_VISION                      ║
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

📊 THỐNG KÊ TỔNG QUAN HỆ THỐNG
────────────────────────────────────────────────────────────────
🎓 Quy mô:
  • Tổng số sinh viên: ${stats.students.toLocaleString()} sinh viên
  • Tổng số giảng viên: ${stats.teachers} giảng viên
  • Số môn học/khóa học: ${stats.courses} môn

👥 Hoạt động sinh viên trong hệ thống:
  • Tỷ lệ hoạt động: ${stats.activeRate}%
  • Đăng nhập đều đặn: ${Math.round(stats.students * 0.73).toLocaleString()} SV (73%)
  • Đăng nhập thỉnh thoảng: ${Math.round(stats.students * 0.18).toLocaleString()} SV (18%)
  • Không hoạt động: ${Math.round(stats.students * 0.09).toLocaleString()} SV (9%)

🎯 Mục đích sử dụng hệ thống của sinh viên:
  • Nộp bài tập: ${Math.round(stats.students * 0.82).toLocaleString()} SV (82%)
  • Xem tài liệu học tập: ${Math.round(stats.students * 0.75).toLocaleString()} SV (75%)
  • Tương tác với giảng viên: ${Math.round(stats.students * 0.45).toLocaleString()} SV (45%)
  • Xem điểm và lịch học: ${Math.round(stats.students * 0.91).toLocaleString()} SV (91%)
  • Tham gia diễn đàn thảo luận: ${Math.round(stats.students * 0.38).toLocaleString()} SV (38%)

🎯 Mục đích sử dụng hệ thống của giảng viên:
  • Cố vấn sinh viên: ${Math.round(stats.teachers * 0.95).toLocaleString()} GV (95%)
  • Chấm bài và nhập điểm: ${Math.round(stats.teachers * 0.88).toLocaleString()} GV (88%)
  • Đăng tài liệu học tập: ${Math.round(stats.teachers * 0.72).toLocaleString()} GV (72%)
  • Theo dõi tiến độ sinh viên: ${Math.round(stats.teachers * 0.65).toLocaleString()} GV (65%)
  • Trao đổi với sinh viên: ${Math.round(stats.teachers * 0.58).toLocaleString()} GV (58%)

📝 Thống kê làm bài tập:
  • Tỷ lệ nộp cao (>90%): ${Math.round(stats.students * 0.42).toLocaleString()} SV (42%) - Xuất sắc
  • Tỷ lệ nộp trung bình (60-90%): ${Math.round(stats.students * 0.35).toLocaleString()} SV (35%) - Khá
  • Tỷ lệ nộp thấp (<60%): ${Math.round(stats.students * 0.23).toLocaleString()} SV (23%) - Cần cải thiện
  • Điểm trung bình bài tập: 7.8/10

🎓 Phân bố điểm GPA (${scope}):
  • GPA xuất sắc (3.6-4.0): ${Math.round(stats.students * 0.15).toLocaleString()} SV (15%)
  • GPA giỏi (3.2-3.59): ${Math.round(stats.students * 0.28).toLocaleString()} SV (28%)
  • GPA khá (2.5-3.19): ${Math.round(stats.students * 0.35).toLocaleString()} SV (35%)
  • GPA trung bình (2.0-2.49): ${Math.round(stats.students * 0.18).toLocaleString()} SV (18%)
  • GPA yếu (<2.0): ${Math.round(stats.students * 0.04).toLocaleString()} SV (4%)

📊 Phân bố chi tiết theo thang điểm chữ:
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

�‍🏫 Hoạt động cố vấn giảng viên:
  • Tổng số buổi cố vấn: ${stats.teachers * 12} buổi
  • Trung bình/giảng viên: 12 buổi/${timeRange}
  • Sinh viên được cố vấn: ${Math.round(stats.students * 0.68).toLocaleString()} SV (68%)
  • Số buổi cố vấn/sinh viên: 2.4 buổi
  • Giảng viên tích cực (>15 buổi): ${Math.round(stats.teachers * 0.35)} GV (35%)
  • Giảng viên trung bình (8-15 buổi): ${Math.round(stats.teachers * 0.45)} GV (45%)
  • Giảng viên ít hoạt động (<8 buổi): ${Math.round(stats.teachers * 0.20)} GV (20%)

⏱️ Thời gian sử dụng hệ thống:
  • Thời gian trung bình/ngày: 2.5 giờ/sinh viên
  • Khung giờ cao điểm: 19:00-22:00 (45% người dùng)
  • Khung giờ sáng: 08:00-12:00 (25% người dùng)
  • Khung giờ chiều: 13:00-17:00 (30% người dùng)

📈 Xu hướng học tập:
  • Tỷ lệ cải thiện điểm: +5.8% so với kỳ trước
  • Tỷ lệ nộp bài đúng hạn: 78.3%
  • Mức độ tương tác với tài liệu: +12% so với kỳ trước
  • Tỷ lệ đạt yêu cầu môn học: 94.7%

⚠️ Cảnh báo học vụ:
  • Sinh viên có nguy cơ học vụ: ${Math.round(stats.students * 0.08).toLocaleString()} SV (8%)
  • Sinh viên cần hỗ trợ: ${Math.round(stats.students * 0.15).toLocaleString()} SV (15%)
  • Môn có tỷ lệ fail cao: 
    - Toán cao cấp 1 (fail rate: 28%)
    - Vật lý đại cương (fail rate: 23%)
    - Lập trình C++ (fail rate: 19%)

💡 Khuyến nghị:
  • Tăng cường hoạt động cố vấn cho nhóm sinh viên yếu kém
  • Tổ chức thêm các buổi hỗ trợ học tập vào khung giờ cao điểm
  • Khuyến khích giảng viên ít hoạt động tham gia cố vấn nhiều hơn
  • Cải thiện chất lượng tài liệu học tập để tăng tương tác

════════════════════════════════════════════════════════════════
✅ Báo cáo được tạo tự động bởi hệ thống Ed_Vision
📧 Liên hệ: admin@edvision.edu.vn | Hotline: 1900-xxxx
════════════════════════════════════════════════════════════════
`;
  }, []);

  // Helper function to export file
  const exportReportFile = useCallback(async (reportName: string, type: string, scope: string, format: string) => {
    setIsLoading(true);
    
    try {
      // Không hỗ trợ PowerPoint
      if (format === 'PowerPoint' || format === 'Thuyết trình') {
        showModal('Không hỗ trợ', 'Xuất PowerPoint tạm thời chưa được hỗ trợ. Vui lòng chọn PDF hoặc Excel.', 'info');
        return;
      }
      
      const content = generateReportContent(reportName, type, scope, timeRange);
      const fileName = `${reportName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;
      
      let blob: Blob;
      let fileExtension: string;
      
      if (format === 'PDF') {
        // Create PDF using jsPDF with professional formatting
        type jsPDFWithAutoTable = jsPDF & {
          lastAutoTable: { finalY: number };
        };
        
        const doc = new jsPDF() as jsPDFWithAutoTable;
        
        // Get scope stats from utils
        const stats = getScopeStats(scope);
      
      let yPos = 20;
      const margin = 14;
      
  // === HEADER ===
  // Use Cambria and size 12 for all exported text
  doc.setFontSize(12);
  doc.setFont('Cambria', 'bold');
  doc.text('BÁO CÁO LÃNH ĐẠO', 105, yPos, { align: 'center' });
  yPos += 8;
  doc.setFont('Cambria', 'normal');
  doc.setFontSize(12);
  doc.text('TRƯỜNG ĐẠI HỌC ED_VISION', 105, yPos, { align: 'center' });
  yPos += 12;
      
      // === REPORT INFO TABLE ===
  doc.setFont('Cambria', 'normal');
      autoTable(doc, {
        startY: yPos,
        head: [['THÔNG TIN BÁO CÁO', '']],
        body: [
          ['Tên báo cáo', reportName],
          ['Loại báo cáo', type],
          ['Phạm vi', scope],
          ['Thời gian', timeRange],
          ['Ngày tạo', new Date().toLocaleString('vi-VN')]
        ],
        headStyles: { 
          fillColor: [41, 128, 185], 
          fontStyle: 'bold', 
          halign: 'center',
          fontSize: 12,
          font: 'Cambria'
        },
        bodyStyles: { 
          fontSize: 12,
          font: 'Cambria'
        },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 120 }
        },
        margin: { left: margin, right: margin }
      });
      
      yPos = doc.lastAutoTable.finalY + 8;
      
      // === SYSTEM OVERVIEW TABLE ===
      autoTable(doc, {
        startY: yPos,
        head: [['THỐNG KÊ TỔNG QUAN HỆ THỐNG', '']],
        body: [
          ['Chỉ số', 'Giá trị'],
          ['Tổng số sinh viên', stats.students.toLocaleString()],
          ['Tổng số giảng viên', stats.teachers.toString()],
          ['Số môn học', stats.courses.toString()]
        ],
        headStyles: { 
          fillColor: [41, 128, 185], 
          fontStyle: 'bold', 
          halign: 'center',
          fontSize: 12,
          font: 'Cambria'
        },
        bodyStyles: { 
          fontSize: 12,
          font: 'Cambria'
        },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { cellWidth: 100 }
        },
        margin: { left: margin, right: margin }
      });
      
      yPos = doc.lastAutoTable.finalY + 8;
      
      // === STUDENT ACTIVITY TABLE ===
      autoTable(doc, {
        startY: yPos,
        head: [['HOẠT ĐỘNG SINH VIÊN TRONG HỆ THỐNG', '', '']],
        body: [
          ['Loại hoạt động', 'Số lượng', 'Tỷ lệ'],
          ['Đăng nhập đều đặn', Math.round(stats.students * 0.73).toLocaleString(), '73%'],
          ['Đăng nhập thỉnh thoảng', Math.round(stats.students * 0.18).toLocaleString(), '18%'],
          ['Không hoạt động', Math.round(stats.students * 0.09).toLocaleString(), '9%']
        ],
        headStyles: { 
          fillColor: [41, 128, 185], 
          fontStyle: 'bold', 
          halign: 'center',
          fontSize: 12,
          font: 'Cambria'
        },
        bodyStyles: { 
          fontSize: 12,
          font: 'Cambria'
        },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { cellWidth: 50 },
          2: { cellWidth: 50 }
        },
        margin: { left: margin, right: margin }
      });
      
      yPos = doc.lastAutoTable.finalY + 8;
      
      // === STUDENT PURPOSE TABLE ===
      autoTable(doc, {
        startY: yPos,
        head: [['MỤC ĐÍCH SỬ DỤNG HỆ THỐNG - SINH VIÊN', '', '']],
        body: [
          ['Mục đích', 'Số sinh viên', 'Tỷ lệ'],
          ['Nộp bài tập', Math.round(stats.students * 0.82).toLocaleString(), '82%'],
          ['Xem tài liệu học tập', Math.round(stats.students * 0.75).toLocaleString(), '75%'],
          ['Tương tác với giảng viên', Math.round(stats.students * 0.45).toLocaleString(), '45%'],
          ['Xem điểm và lịch học', Math.round(stats.students * 0.91).toLocaleString(), '91%'],
          ['Tham gia diễn đàn', Math.round(stats.students * 0.38).toLocaleString(), '38%']
        ],
        headStyles: { 
          fillColor: [41, 128, 185], 
          fontStyle: 'bold', 
          halign: 'center',
          fontSize: 12,
          font: 'times'
        },
        bodyStyles: { 
          fontSize: 12,
          font: 'times'
        },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { cellWidth: 50 },
          2: { cellWidth: 50 }
        },
        margin: { left: margin, right: margin }
      });
      
      yPos = doc.lastAutoTable.finalY + 8;
      
      // === TEACHER PURPOSE TABLE ===
      autoTable(doc, {
        startY: yPos,
        head: [['MỤC ĐÍCH SỬ DỤNG HỆ THỐNG - GIẢNG VIÊN', '', '']],
        body: [
          ['Mục đích', 'Số giảng viên', 'Tỷ lệ'],
          ['Cố vấn sinh viên', Math.round(stats.teachers * 0.95).toString(), '95%'],
          ['Chấm bài và nhập điểm', Math.round(stats.teachers * 0.88).toString(), '88%'],
          ['Đăng tài liệu học tập', Math.round(stats.teachers * 0.72).toString(), '72%'],
          ['Theo dõi tiến độ sinh viên', Math.round(stats.teachers * 0.65).toString(), '65%'],
          ['Trao đổi với sinh viên', Math.round(stats.teachers * 0.58).toString(), '58%']
        ],
        headStyles: { 
          fillColor: [41, 128, 185], 
          fontStyle: 'bold', 
          halign: 'center',
          fontSize: 12,
          font: 'times'
        },
        bodyStyles: { 
          fontSize: 12,
          font: 'times'
        },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { cellWidth: 50 },
          2: { cellWidth: 50 }
        },
        margin: { left: margin, right: margin }
      });
      
      // === PAGE 2 ===
      doc.addPage();
      yPos = 20;
      
      // === HOMEWORK TABLE ===
      autoTable(doc, {
        startY: yPos,
        head: [['THỐNG KÊ LÀM BÀI TẬP', '', '', '']],
        body: [
          ['Mức độ', 'Số sinh viên', 'Tỷ lệ', 'Đánh giá'],
          ['Tỷ lệ nộp cao (>90%)', Math.round(stats.students * 0.42).toLocaleString(), '42%', 'Xuất sắc'],
          ['Tỷ lệ nộp TB (60-90%)', Math.round(stats.students * 0.35).toLocaleString(), '35%', 'Khá'],
          ['Tỷ lệ nộp thấp (<60%)', Math.round(stats.students * 0.23).toLocaleString(), '23%', 'Cần cải thiện'],
          ['Điểm trung bình bài tập', '7.8/10', '', '']
        ],
        headStyles: { 
          fillColor: [41, 128, 185], 
          fontStyle: 'bold', 
          halign: 'center',
          fontSize: 12,
          font: 'times'
        },
        bodyStyles: { 
          fontSize: 12,
          font: 'times'
        },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 50 }
        },
        margin: { left: margin, right: margin }
      });
      
      yPos = doc.lastAutoTable.finalY + 8;
      
      // === GPA DISTRIBUTION TABLE ===
      autoTable(doc, {
        startY: yPos,
        head: [['PHÂN BỐ ĐIỂM GPA', '', '', '']],
        body: [
          ['Xếp loại', 'Khoảng GPA', 'Số sinh viên', 'Tỷ lệ'],
          ['Xuất sắc', '3.6-4.0', Math.round(stats.students * 0.15).toLocaleString(), '15%'],
          ['Giỏi', '3.2-3.59', Math.round(stats.students * 0.28).toLocaleString(), '28%'],
          ['Khá', '2.5-3.19', Math.round(stats.students * 0.35).toLocaleString(), '35%'],
          ['Trung bình', '2.0-2.49', Math.round(stats.students * 0.18).toLocaleString(), '18%'],
          ['Yếu', '<2.0', Math.round(stats.students * 0.04).toLocaleString(), '4%']
        ],
        headStyles: { 
          fillColor: [41, 128, 185], 
          fontStyle: 'bold', 
          halign: 'center',
          fontSize: 12,
          font: 'times'
        },
        bodyStyles: { 
          fontSize: 12,
          font: 'times'
        },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 45 },
          1: { cellWidth: 45 },
          2: { cellWidth: 50 },
          3: { cellWidth: 40 }
        },
        margin: { left: margin, right: margin }
      });
      
      yPos = doc.lastAutoTable.finalY + 8;
      
      // === GRADE DISTRIBUTION TABLE ===
      autoTable(doc, {
        startY: yPos,
        head: [['PHÂN BỐ ĐIỂM CHỮ', '', '']],
        body: [
          ['Điểm chữ', 'Số sinh viên', 'Tỷ lệ'],
          ['A+', Math.round(stats.students * 0.12).toLocaleString(), '12%'],
          ['A', Math.round(stats.students * 0.18).toLocaleString(), '18%'],
          ['B+', Math.round(stats.students * 0.20).toLocaleString(), '20%'],
          ['B', Math.round(stats.students * 0.16).toLocaleString(), '16%'],
          ['C+', Math.round(stats.students * 0.15).toLocaleString(), '15%'],
          ['C', Math.round(stats.students * 0.14).toLocaleString(), '14%'],
          ['D+', Math.round(stats.students * 0.03).toLocaleString(), '3%'],
          ['D', Math.round(stats.students * 0.01).toLocaleString(), '1%'],
          ['F', Math.round(stats.students * 0.01).toLocaleString(), '1%']
        ],
        headStyles: { 
          fillColor: [41, 128, 185], 
          fontStyle: 'bold', 
          halign: 'center',
          fontSize: 12,
          font: 'times'
        },
        bodyStyles: { 
          fontSize: 12,
          font: 'times'
        },
        columnStyles: { 
          0: { fontStyle: 'bold', halign: 'center', cellWidth: 40 },
          1: { cellWidth: 80 },
          2: { cellWidth: 60 }
        },
        margin: { left: margin, right: margin }
      });
      
      yPos = doc.lastAutoTable.finalY + 8;
      
      // === TEACHER ADVISORY TABLE ===
      autoTable(doc, {
        startY: yPos,
        head: [['HOẠT ĐỘNG CỐ VẤN GIẢNG VIÊN', '']],
        body: [
          ['Chỉ tiêu', 'Giá trị'],
          ['Tổng số buổi cố vấn', `${stats.teachers * 12} buổi`],
          ['Trung bình buổi/giảng viên', '12 buổi'],
          ['Sinh viên được cố vấn', `${Math.round(stats.students * 0.68).toLocaleString()} SV (68%)`],
          ['Sinh viên chưa có cố vấn', `${Math.round(stats.students * 0.32).toLocaleString()} SV (32%)`]
        ],
        headStyles: { 
          fillColor: [41, 128, 185], 
          fontStyle: 'bold', 
          halign: 'center',
          fontSize: 12,
          font: 'times'
        },
        bodyStyles: { 
          fontSize: 12,
          font: 'times'
        },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { cellWidth: 100 }
        },
        margin: { left: margin, right: margin }
      });
      
      yPos = doc.lastAutoTable.finalY + 8;
      
      // === WARNINGS TABLE (RED) ===
      autoTable(doc, {
        startY: yPos,
        head: [['CẢNH BÁO HỌC VỤ', '', '']],
        body: [
          ['Loại cảnh báo', 'Số sinh viên', 'Tỷ lệ'],
          ['Nguy cơ học vụ', Math.round(stats.students * 0.08).toLocaleString(), '8%'],
          ['Cần hỗ trợ học tập', Math.round(stats.students * 0.15).toLocaleString(), '15%'],
          ['Tỷ lệ nộp bài thấp', Math.round(stats.students * 0.23).toLocaleString(), '23%']
        ],
        headStyles: { 
          fillColor: [231, 76, 60], 
          fontStyle: 'bold', 
          halign: 'center', 
          textColor: [255, 255, 255],
          fontSize: 12,
          font: 'times'
        },
        bodyStyles: { 
          fontSize: 12, 
          textColor: [200, 0, 0],
          font: 'times'
        },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 60 },
          2: { cellWidth: 50 }
        },
        margin: { left: margin, right: margin }
      });
      
      yPos = doc.lastAutoTable.finalY + 8;
      
      // === HIGH FAIL RATE SUBJECTS TABLE (RED) ===
      autoTable(doc, {
        startY: yPos,
        head: [['MÔN HỌC CÓ TỶ LỆ FAIL CAO', '']],
        body: [
          ['Tên môn học', 'Tỷ lệ fail'],
          ['Toán cao cấp 1', '28%'],
          ['Vật lý đại cương', '23%'],
          ['Lập trình C++', '19%']
        ],
        headStyles: { 
          fillColor: [231, 76, 60], 
          fontStyle: 'bold', 
          halign: 'center', 
          textColor: [255, 255, 255],
          fontSize: 12,
          font: 'times'
        },
        bodyStyles: { 
          fontSize: 12, 
          textColor: [200, 0, 0],
          font: 'times'
        },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 120 },
          1: { cellWidth: 60, halign: 'center' }
        },
        margin: { left: margin, right: margin }
      });
      
      // === FOOTER ===
      yPos = 280;
      doc.setFontSize(12);
      doc.setFont('times', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Báo cáo được tạo tự động bởi hệ thống Ed_Vision', 105, yPos, { align: 'center' });
      doc.text('Email: admin@edvision.edu.vn | Website: edvision.edu.vn', 105, yPos + 5, { align: 'center' });
      
      // Save PDF
      doc.save(`${fileName}.pdf`);
      return; // Exit early for PDF
    } else if (format === 'Excel') {
      // Enhanced Excel export with detailed statistics
      const stats = getScopeStats(scope);
      
      const csvContent = 
        `Báo cáo Lãnh đạo - Ed_Vision\n` +
        `\n` +
        `THÔNG TIN BÁO CÁO\n` +
        `Tên báo cáo,${reportName}\n` +
        `Loại,${type}\n` +
        `Phạm vi,${scope}\n` +
        `Thời gian,${timeRange}\n` +
        `Người tạo,Admin\n` +
        `Ngày tạo,${new Date().toLocaleString('vi-VN')}\n` +
        `\n` +
        `QUY MÔ\n` +
        `Chỉ số,Giá trị\n` +
        `Tổng số sinh viên,${stats.students}\n` +
        `Tổng số giảng viên,${stats.teachers}\n` +
        `Số môn học,${stats.courses}\n` +
        `\n` +
  `HOẠT ĐỘNG SINH VIÊN TRONG HỆ THỐNG\n` +
  `Loại hoạt động,Số lượng,Tỷ lệ\n` +
  `Tỷ lệ hoạt động tổng,${stats.students},${stats.activeRate}%\n` +
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
  `HOẠT ĐỘNG CỐ VẤN GIẢNG VIÊN\n` +
  `Chỉ số,Giá trị\n` +
  `Tổng số buổi cố vấn,${stats.teachers * 12}\n` +
  `TB buổi/giảng viên,12\n` +
  `Sinh viên được cố vấn,${Math.round(stats.students * 0.68)} (68%)\n` +
  `TB buổi/sinh viên,2.4\n` +
  `GV tích cực (>15 buổi),${Math.round(stats.teachers * 0.35)} (35%)\n` +
  `GV trung bình (8-15),${Math.round(stats.teachers * 0.45)} (45%)\n` +
  `GV ít hoạt động (<8),${Math.round(stats.teachers * 0.20)} (20%)\n` +
        `\n` +
  `XU HƯỚNG HỌC TẬP\n` +
  `Chỉ số,Giá trị,So với kỳ trước\n` +
  `Tỷ lệ cải thiện điểm,,+5.8%\n` +
  `Tỷ lệ nộp bài đúng hạn,78.3%,\n` +
  `Tương tác với tài liệu,,+12%\n` +
  `Tỷ lệ đạt yêu cầu,94.7%,\n` +
        `\n` +
  `CẢNH BÁO HỌC VỤ\n` +
  `Mức độ,Số sinh viên,Tỷ lệ\n` +
  `Nguy cơ học vụ,${Math.round(stats.students * 0.08)},8%\n` +
  `Cần hỗ trợ,${Math.round(stats.students * 0.15)},15%\n` +
        `\n` +
  `MÔN HỌC CÓ TỶ LỆ FAIL CAO\n` +
  `Tên môn học,Tỷ lệ fail\n` +
  `Toán cao cấp 1,28%\n` +
  `Vật lý đại cương,23%\n` +
  `Lập trình C++,19%\n`;
        
      blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      fileExtension = 'csv';
    } else if (format === 'Word') {
      // Word export as text
      blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      fileExtension = 'txt';
    } else {
      // PowerPoint export as text
      blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      fileExtension = 'txt';
    }
    
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showModal('Thành công', `Đã xuất báo cáo ${fileName}.${fileExtension} thành công!`, 'success');
    } catch (error) {
      console.error('Lỗi khi xuất báo cáo:', error);
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      showModal('Lỗi', `Không thể xuất báo cáo: ${errorMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, generateReportContent, showModal]);

  // Handler to create new report
  const handleCreateReport = useCallback(() => {
    const formattedTimeRange = getFormattedTimeRange();
    
    const newReport: Report = {
      id: reports.length + 1,
      name: `${reportType} - ${new Date().toLocaleDateString('vi-VN')}`,
      type: reportType.replace('Báo cáo ', ''),
      creator: "Admin",
      date: new Date().toLocaleDateString('vi-VN'),
      scope: dataScope,
      status: "Chưa tải xuống",
      statusColor: "yellow"
    };
    
    setReports(prev => [newReport, ...prev]);
    
    // Show success message without auto-download
    showModal(
      'Thành công',
      `Đã tạo báo cáo thành công!\n\nTên: ${newReport.name}\nPhạm vi: ${dataScope}\nNgành: ${major}\nLớp: ${className}\nThời gian: ${formattedTimeRange}\n\nBạn có thể xem và tải xuống báo cáo trong danh sách bên dưới.`,
      'success'
    );
    
    // Reset form
    setReportType("Báo cáo điểm số");
    setDataScope("Trường Khoa học máy tính");
    setMajor("Tất cả ngành");
    setClassName("Tất cả lớp");
    setTimeRange("Học kỳ hiện tại");
    setCustomWeekStart("");
    setCustomWeekEnd("");
    setExportFormat("PDF");
  }, [reports, reportType, dataScope, major, className, showModal, getFormattedTimeRange]);

  // Handler for quick create buttons
  const handleQuickCreate = (reportName: string, reportType: string) => {
    const newReport: Report = {
      id: reports.length + 1,
      name: reportName,
      type: reportType,
      creator: "Admin",
      date: new Date().toLocaleDateString('vi-VN'),
      scope: "Toàn trường",
      status: "Chưa tải xuống",
      statusColor: "yellow"
    };
    
    setReports([newReport, ...reports]);
    
    showModal('Thành công', `⚡ Đã tạo nhanh báo cáo thành công!\n\n${reportName}\n\nBạn có thể xem và tải xuống báo cáo trong danh sách bên dưới.`, 'success');
  };

  // Handler to save configuration
  const handleSaveConfig = () => {
    const config = {
      reportType,
      dataScope,
      major,
      className,
      timeRange,
      customWeekStart,
      customWeekEnd,
      exportFormat
    };
  localStorage.setItem('reportConfig', JSON.stringify(config));
  showModal('Thành công', '💾 Đã lưu cấu hình báo cáo!', 'success');
  };

  // Handler to download existing report
  const handleDownloadReport = (report: typeof reports[0]) => {
    exportReportFile(report.name, report.type, report.scope, exportFormat);
    
    // Update status to "Đã tải xuống"
    setReports(prevReports => 
      prevReports.map(r => 
        r.id === report.id 
          ? { ...r, status: 'Đã tải xuống', statusColor: 'green' as const }
          : r
      )
    );
    
    showModal('Đang xử lý', `📥 Đang tải xuống: ${report.name}`, 'info');
  };

  // Handler to delete report
  const handleDeleteReport = (reportId: number) => {
    if (confirm('⚠️ Bạn có chắc chắn muốn xóa báo cáo này?')) {
      setReports(reports.filter(r => r.id !== reportId));
      showModal('Thành công', '🗑️ Đã xóa báo cáo!', 'success');
    }
  };

  // Chart data configurations
  const dataDistributionData = {
    labels: ['Điểm số', 'Hoạt động học tập', 'Thông tin sinh viên', 'Khảo sát đánh giá', 'Báo cáo hệ thống'],
    datasets: [{
      label: 'Số lượng bản ghi (nghìn)',
      data: [450, 320, 280, 150, 180],
      backgroundColor: [
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
        '#ef4444'
      ],
      borderRadius: 6
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Số lượng (nghìn bản ghi)'
        }
      }
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 overflow-y-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-blue-600 text-2xl mr-3">📊</span>
              <h1 className="text-3xl font-bold text-gray-900">Báo cáo Lãnh đạo</h1>
            </div>
            
            {/* Time Filter */}
            <div className="flex items-center space-x-2">
              {/* Navigation Arrows */}
              <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm">
                <button className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-l-md transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-r-md transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Today Button */}
              <button 
                onClick={() => setTimeFilter('hôm-nay')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                  timeFilter === 'hôm-nay'
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                Hôm nay
              </button>
              
              {/* Time Period Buttons */}
              <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm">
                {[
                  { value: 'tuần-này', label: 'Tuần' },
                  { value: 'tháng-này', label: 'Tháng' },
                  { value: 'tất-cả', label: 'Tất cả' }
                ].map((period, index) => (
                  <button
                    key={period.value}
                    onClick={() => setTimeFilter(period.value)}
                    className={`px-2 py-1 text-xs font-medium transition-colors ${
                      index === 0 ? 'rounded-l-md' : ''
                    } ${
                      index === 2 ? 'rounded-r-md' : ''
                    } ${
                      timeFilter === period.value
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-gray-600">Hiển thị báo cáo dữ liệu và phân tích ({getTimeFilterLabel()})</p>
        </div>

        {/* Overview Cards */}
        <div className="mb-8">
          {/* Reports Created - Single Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Báo cáo đã tạo</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    {dashboardData.reports.toLocaleString('vi-VN')}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm mr-1 ${dashboardData.reportsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {dashboardData.reportsGrowth >= 0 ? '↗' : '↘'}
                    </span>
                    <span className={`text-sm font-medium ${dashboardData.reportsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.reportsGrowth >= 0 ? '+' : ''}{dashboardData.reportsGrowth}%
                    </span>
                    <span className="text-green-600 text-sm ml-1">{getComparisonLabel()}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">📄</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create New Report Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tạo báo cáo mới</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Loại báo cáo</label>
                <select 
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Báo cáo điểm số</option>
                  <option>Báo cáo hiệu suất</option>
                  <option>Báo cáo dự đoán</option>
                  <option>Báo cáo tổng hợp</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phạm vi dữ liệu</label>
                <select 
                  value={dataScope}
                  onChange={(e) => setDataScope(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Trường Khoa học máy tính</option>
                  <option>Trường Công nghệ</option>
                  <option>Trường Kinh tế và Kinh doanh</option>
                  <option>Trường Ngôn ngữ và Xã hội nhân văn</option>
                  <option>Trường Du lịch</option>
                  <option>Trường Y-Dược</option>
                  <option>Trường Đào tạo quốc tế</option>
                  <option>Viện Quản lý Nam Khuê</option>
                  <option>Viện Việt-Nhật</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ngành</label>
                <select 
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Tất cả ngành</option>
                  {availableMajors.map((majorName) => (
                    <option key={majorName} value={majorName}>
                      {majorName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lớp</label>
                <select 
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Tất cả lớp</option>
                  {availableClasses.map((classCode) => (
                    <option key={classCode} value={classCode}>
                      {classCode}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Khoảng thời gian</label>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Học kỳ hiện tại</option>
                  <option>Năm học hiện tại</option>
                  <option>6 tháng gần đây</option>
                  <option>Tùy chỉnh</option>
                </select>
              </div>
              
              {/* Show custom week range inputs when "Tùy chỉnh" is selected */}
              {timeRange === "Tùy chỉnh" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tuần bắt đầu</label>
                    <input 
                      type="number"
                      min="1"
                      max="52"
                      value={customWeekStart}
                      onChange={(e) => setCustomWeekStart(e.target.value)}
                      placeholder="VD: 2" 
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tuần kết thúc</label>
                    <input 
                      type="number"
                      min="1"
                      max="52"
                      value={customWeekEnd}
                      onChange={(e) => setCustomWeekEnd(e.target.value)}
                      placeholder="VD: 5" 
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Định dạng xuất</label>
                <select 
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>PDF</option>
                  <option>Excel</option>
                  <option>Word</option>
                </select>
              </div>
              
              <div className="flex items-end space-x-2">
                <button 
                  onClick={handleSaveConfig}
                  className="bg-gray-200 text-gray-700 px-2 py-1 text-xs rounded-md hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  💾 Lưu cấu hình
                </button>
                <button 
                  onClick={handleCreateReport}
                  className="bg-blue-600 text-white px-2 py-1 text-xs rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  ➕ Tạo báo cáo
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Danh sách báo cáo đã tạo</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên báo cáo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người tạo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phạm vi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.creator}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.scope}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.statusColor === 'green' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.statusColor === 'green' ? '✅' : '📝'} {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-3">
                          {/* Xem chi tiết */}
                          <button 
                            onClick={() => showModal('Xem báo cáo', `📄 Xem chi tiết báo cáo: ${report.name}\n\nLoại: ${report.type}\nPhạm vi: ${report.scope}\nNgày tạo: ${report.date}\n\nNội dung báo cáo sẽ được hiển thị ở đây...`, 'info')}
                            className="text-blue-600 hover:text-blue-900 cursor-pointer transition-colors" 
                            title="Xem chi tiết"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          
                          {/* Tải xuống */}
                          <button 
                            onClick={() => handleDownloadReport(report)}
                            className="text-green-600 hover:text-green-900 cursor-pointer transition-colors" 
                            title="Tải xuống"
                          >
                            <i className="fas fa-download"></i>
                          </button>
                          
                          {/* Xóa */}
                          <button 
                            onClick={() => handleDeleteReport(report.id)}
                            className="text-red-600 hover:text-red-900 cursor-pointer transition-colors" 
                            title="Xóa"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Data Distribution Chart */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân bố dữ liệu theo loại</h3>
            <div className="h-80 w-full">
              <Bar data={dataDistributionData} options={barOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Additional Metrics - removed as requested */}

        {/* Recommended Reports */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Báo cáo được đề xuất</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="font-semibold mb-2">Dự đoán điểm cuối kỳ</h3>
                  <p className="text-sm opacity-90 mb-4">Phân tích và dự đoán kết quả học tập</p>
                  <button 
                    onClick={() => handleQuickCreate('Dự đoán điểm cuối kỳ', 'Dự đoán')}
                    className="bg-white text-blue-600 px-4 py-1.5 text-xs rounded-md transition-colors cursor-pointer font-semibold hover:bg-gray-100"
                  >
                    ⚡ Tạo nhanh
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-3xl mb-3">👨‍🏫</div>
                  <h3 className="font-semibold mb-2">Phân tích hiệu suất giảng viên</h3>
                  <p className="text-sm opacity-90 mb-4">Đánh giá chất lượng giảng dạy</p>
                  <button 
                    onClick={() => handleQuickCreate('Phân tích hiệu suất giảng viên', 'Hiệu suất')}
                    className="bg-white text-green-600 px-4 py-1.5 text-xs rounded-md transition-colors cursor-pointer font-semibold hover:bg-gray-100"
                  >
                    ⚡ Tạo nhanh
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-3xl mb-3">⚖️</div>
                  <h3 className="font-semibold mb-2">So sánh kết quả học tập</h3>
                  <p className="text-sm opacity-90 mb-4">Phân tích xu hướng và so sánh</p>
                  <button 
                    onClick={() => handleQuickCreate('So sánh kết quả học tập', 'So sánh')}
                    className="bg-white text-purple-600 px-4 py-1.5 text-xs rounded-md transition-colors cursor-pointer font-semibold hover:bg-gray-100"
                  >
                    ⚡ Tạo nhanh
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-3xl mb-3">⚠️</div>
                  <h3 className="font-semibold mb-2">Cảnh báo học vụ</h3>
                  <p className="text-sm opacity-90 mb-4">Phát hiện rủi ro và cảnh báo sớm</p>
                  <button 
                    onClick={() => handleQuickCreate('Cảnh báo học vụ', 'Cảnh báo')}
                    className="bg-white text-orange-600 px-4 py-1.5 text-xs rounded-md transition-colors cursor-pointer font-semibold hover:bg-gray-100"
                  >
                    ⚡ Tạo nhanh
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-700 font-medium">Đang xử lý...</p>
          </div>
        </div>
      )}
      
      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </AdminLayout>
  );
}
