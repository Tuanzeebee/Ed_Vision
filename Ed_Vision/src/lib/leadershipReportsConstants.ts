// Constants for Leadership Reports
// Majors data by school
export const majorsBySchool: { [key: string]: string[] } = {
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

// Classes data by major (simplified mapping)
export const classesByMajor: { [key: string]: string[] } = {
  "Công nghệ Phần mềm": ["TPM1", "TPM2", "TPM3"],
  "An toàn Thông tin": ["ATT1", "ATT2"],
  "Khoa học Máy tính": ["KMT1", "KMT2"],
  "Trí tuệ Nhân tạo": ["TNT1", "TNT2"],
  "Khoa học Dữ liệu": ["DLS1", "DLS2"],
  "Điện tử-Viễn thông": ["DVT1", "DVT2"],
  "Kỹ thuật Ô tô": ["KTO1", "KTO2"],
  "Thiết kế Đồ họa": ["TDH1", "TDH2"],
  "Kiến trúc Công trình": ["KTC1", "KTC2"],
  "Quản trị Kinh doanh Tổng hợp": ["QTK1", "QTK2"],
  "Marketing": ["MKT1", "MKT2"],
  "Tài chính-Ngân hàng": ["TCN1", "TCN2"],
  "Kế toán Doanh nghiệp": ["KTD1", "KTD2"],
  "Tiếng Anh Biên-Phiên dịch": ["TAB1", "TAB2"],
  "Tiếng Trung Biên-Phiên dịch": ["TTB1", "TTB2"],
  "Tiếng Nhật Biên-Phiên dịch": ["TNB1", "TNB2"],
  "Luật Kinh tế": ["LKT1", "LKT2"]
};

// Classes data by school and major (detailed mapping)
export const classesBySchoolAndMajor: { [key: string]: { [key: string]: string[] } } = {
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

// Report types
export const REPORT_TYPES = [
  "Báo cáo điểm số",
  "Báo cáo hiệu suất",
  "Báo cáo tổng hợp"
];

// Export formats
export const EXPORT_FORMATS = [
  "PDF",
  "Excel",
  "Word"
];

// Time ranges
export const TIME_RANGES = [
  "Học kỳ hiện tại",
  "Tháng này",
  "Quý này",
  "Năm học này",
  "Tùy chỉnh tuần"
];

// Schools list
export const SCHOOLS = Object.keys(majorsBySchool);

// Chart colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  purple: '#8b5cf6',
  danger: '#ef4444'
};

// Status colors
export const STATUS_COLORS: { [key: string]: string } = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800'
};

// PDF Configuration
export const PDF_CONFIG = {
  margin: { top: 20, right: 20, bottom: 20, left: 20 },
  fontSize: {
    title: 18,
    heading: 14,
    normal: 11,
    small: 9
  },
  colors: {
    primary: [59, 130, 246],
    text: [0, 0, 0],
    lightGray: [240, 240, 240]
  }
};
