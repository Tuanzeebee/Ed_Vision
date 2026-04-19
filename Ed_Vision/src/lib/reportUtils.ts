// Utility functions for Leadership Reports

export interface ScopeStats {
  students: number;
  teachers: number;
  activeRate: number;
  courses: number;
}

export interface Report {
  id: number;
  name: string;
  type: string;
  creator: string;
  date: string;
  scope: string;
  status: string;
  statusColor: string;
  format?: string; // Format to export: PDF, Excel, Word
}

/**
 * Get statistics based on data scope
 */
export const getScopeStats = (scope: string): ScopeStats => {
  // Stats for all schools combined
  if (scope === "Tất cả các trường"|| scope === "Toàn trường") {
    return {
      students: 18450,
      teachers: 685,
      activeRate: 87.3,
      courses: 842
    };
  }
  
  // Stats by individual school
  const schoolStats: { [key: string]: ScopeStats } = {
    "Trường Khoa học máy tính": {
      students: 3200,
      teachers: 95,
      activeRate: 89.5,
      courses: 142
    },
    "Trường Công nghệ": {
      students: 4100,
      teachers: 125,
      activeRate: 86.8,
      courses: 178
    },
    "Trường Kinh tế và Kinh doanh": {
      students: 3800,
      teachers: 110,
      activeRate: 88.2,
      courses: 165
    },
    "Trường Ngôn ngữ và Xã hội nhân văn": {
      students: 2500,
      teachers: 85,
      activeRate: 87.5,
      courses: 98
    },
    "Trường Du lịch": {
      students: 1800,
      teachers: 65,
      activeRate: 85.9,
      courses: 75
    },
    "Trường Y-Dược": {
      students: 1200,
      teachers: 78,
      activeRate: 91.2,
      courses: 68
    },
    "Trường Đào tạo quốc tế": {
      students: 950,
      teachers: 58,
      activeRate: 90.8,
      courses: 52
    },
    "Viện Quản lý Nam Khuê": {
      students: 450,
      teachers: 32,
      activeRate: 88.7,
      courses: 38
    },
    "Viện Việt-Nhật": {
      students: 450,
      teachers: 37,
      activeRate: 89.3,
      courses: 26
    }
  };
  
  // Return school-specific stats or default
  return schoolStats[scope] || {
    students: 1850,
    teachers: 42,
    activeRate: 85.7,
    courses: 28
  };
};

/**
 * Save reports to localStorage
 */
export const saveReportsToStorage = (reports: Report[]): void => {
  try {
    localStorage.setItem('leadershipReports', JSON.stringify(reports));
  } catch (error) {
    console.error('Failed to save reports to localStorage:', error);
  }
};

/**
 * Load reports from localStorage
 */
export const loadReportsFromStorage = (): Report[] | null => {
  try {
    const stored = localStorage.getItem('leadershipReports');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load reports from localStorage:', error);
    return null;
  }
};

/**
 * Generate report file name
 */
export const generateFileName = (reportName: string): string => {
  return `${reportName.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}`;
};

/**
 * Get score distribution data by school (0-10 scale)
 * Returns data for individual school or all schools comparison
 */
export interface ScoreDistribution {
  schoolName: string;
  scores: number[]; // Array of 11 elements representing scores 0-10
}

export const getScoreDistributionBySchool = (scope: string): ScoreDistribution[] => {
  const allSchools = [
    "Trường Khoa học máy tính",
    "Trường Công nghệ", 
    "Trường Kinh tế và Kinh doanh",
    "Trường Ngôn ngữ và Xã hội nhân văn",
    "Trường Du lịch",
    "Trường Y-Dược",
    "Trường Đào tạo quốc tế",
    "Viện Quản lý Nam Khuê",
    "Viện Việt-Nhật"];
  
  // Mock data for score distribution (0-10 scale)
  const schoolDistributions: { [key: string]: number[] } = {
    "Trường Khoa học máy tính": [12, 25, 45, 120, 280, 520, 680, 750, 480, 220, 68],
    "Trường Công nghệ": [18, 32, 58, 145, 310, 580, 720, 840, 690, 520, 187],
    "Trường Kinh tế và Kinh doanh": [15, 28, 52, 138, 295, 540, 680, 790, 650, 470, 142],
    "Trường Ngôn ngữ và Xã hội nhân văn": [10, 22, 40, 95, 220, 410, 520, 580, 380, 180, 43],
    "Trường Du lịch": [8, 18, 35, 78, 185, 320, 410, 450, 220, 65, 11],
    "Trường Y-Dược": [5, 12, 22, 58, 145, 280, 340, 220, 95, 20, 3],
    "Trường Đào tạo quốc tế": [3, 8, 15, 42, 95, 185, 280, 220, 85, 15, 2],
    "Viện Quản lý Nam Khuê": [2, 5, 12, 28, 65, 98, 125, 85, 25, 4, 1],
    "Viện Việt-Nhật": [2, 5, 10, 25, 58, 95, 120, 95, 32, 7, 1]
  };
  
  if (scope === "Tất cả các trường") {
    // Return all schools for comparison
    return allSchools.map(school =>({
      schoolName: school,
      scores: schoolDistributions[school]
    }));
  } else if (schoolDistributions[scope]) {
    // Return single school data
    return [{
      schoolName: scope,
      scores: schoolDistributions[scope]
    }];
  } else {
    // Default data
    return [{
      schoolName: scope,
      scores: [10, 20, 35, 80, 180, 350, 450, 520, 380, 150, 25]
    }];
  }
};

/**
 * Get top performing students by school
 */
export interface TopStudent {
  id: string;
  name: string;
  school: string;
  major: string;
  class: string;
  gpa: number;
  rank: number;
}

export const getTopStudentsBySchool = (scope: string, limit: number = 5): TopStudent[] => {
  const allSchools = [
    "Trường Khoa học máy tính",
    "Trường Công nghệ",
    "Trường Kinh tế và Kinh doanh",
    "Trường Ngôn ngữ và Xã hội nhân văn",
    "Trường Du lịch",
    "Trường Y-Dược",
    "Trường Đào tạo quốc tế",
    "Viện Quản lý Nam Khuê",
    "Viện Việt-Nhật"];
  
  // Sample students data by school
  const studentsBySchool: { [key: string]: TopStudent[] } = {
    "Trường Khoa học máy tính": [
      { id: "2022001", name: "Nguyễn Văn An", school: "Trường Khoa học máy tính", major: "Công nghệ Phần mềm", class: "TPM1-CSE", gpa: 9.8, rank: 1 },
      { id: "2022045", name: "Trần Thị Bình", school: "Trường Khoa học máy tính", major: "Trí tuệ Nhân tạo", class: "TNT1-CSE", gpa: 9.7, rank: 2 },
      { id: "2022089", name: "Lê Văn Cường", school: "Trường Khoa học máy tính", major: "An toàn Thông tin", class: "ATT1-CSE", gpa: 9.6, rank: 3 },
      { id: "2022134", name: "Phạm Thị Dung", school: "Trường Khoa học máy tính", major: "Khoa học Dữ liệu", class: "DLS1-CSE", gpa: 9.5, rank: 4 },
      { id: "2022178", name: "Hoàng Văn Em", school: "Trường Khoa học máy tính", major: "Công nghệ Phần mềm", class: "TPM2-CSE", gpa: 9.4, rank: 5 }
    ],
    "Trường Công nghệ": [
      { id: "2022210", name: "Võ Thị Phương", school: "Trường Công nghệ", major: "Điện tử-Viễn thông", class: "DVT1-SET", gpa: 9.6, rank: 1 },
      { id: "2022245", name: "Đặng Văn Giang", school: "Trường Công nghệ", major: "Kỹ thuật Ô tô", class: "KTO1-SET", gpa: 9.5, rank: 2 },
      { id: "2022289", name: "Bùi Thị Hà", school: "Trường Công nghệ", major: "Thiết kế Đồ họa", class: "TDH1-SET", gpa: 9.4, rank: 3 },
      { id: "2022334", name: "Ngô Văn Ích", school: "Trường Công nghệ", major: "Kiến trúc Công trình", class: "KTC1-SET", gpa: 9.3, rank: 4 },
      { id: "2022378", name: "Trương Thị Kiều", school: "Trường Công nghệ", major: "Điện tử-Viễn thông", class: "DVT2-SET", gpa: 9.2, rank: 5 }
    ],
    "Trường Kinh tế và Kinh doanh": [
      { id: "2022410", name: "Lý Văn Lâm", school: "Trường Kinh tế và Kinh doanh", major: "Quản trị Kinh doanh Tổng hợp", class: "QTK1-SBE", gpa: 9.7, rank: 1 },
      { id: "2022445", name: "Phan Thị Mai", school: "Trường Kinh tế và Kinh doanh", major: "Marketing", class: "MKT1-SBE", gpa: 9.6, rank: 2 },
      { id: "2022489", name: "Dương Văn Nam", school: "Trường Kinh tế và Kinh doanh", major: "Tài chính-Ngân hàng", class: "TCN1-SBE", gpa: 9.5, rank: 3 },
      { id: "2022534", name: "Vũ Thị Oanh", school: "Trường Kinh tế và Kinh doanh", major: "Kế toán Doanh nghiệp", class: "KTD1-SBE", gpa: 9.4, rank: 4 },
      { id: "2022578", name: "Hồ Văn Phúc", school: "Trường Kinh tế và Kinh doanh", major: "Marketing", class: "MKT2-SBE", gpa: 9.3, rank: 5 }
    ]
  };
  
  // Add default data for other schools
  allSchools.forEach(school => {
    if (!studentsBySchool[school]) {
      studentsBySchool[school] = [
        { id: `${school}-001`, name: "Sinh viên A", school, major: "Chuyên ngành 1", class: "Lớp 1", gpa: 9.5, rank: 1 },
        { id: `${school}-002`, name: "Sinh viên B", school, major: "Chuyên ngành 2", class: "Lớp 2", gpa: 9.3, rank: 2 },
        { id: `${school}-003`, name: "Sinh viên C", school, major: "Chuyên ngành 3", class: "Lớp 3", gpa: 9.1, rank: 3 },
        { id: `${school}-004`, name: "Sinh viên D", school, major: "Chuyên ngành 4", class: "Lớp 4", gpa: 9.0, rank: 4 },
        { id: `${school}-005`, name: "Sinh viên E", school, major: "Chuyên ngành 5", class: "Lớp 5", gpa: 8.9, rank: 5 }
      ];
    }
  });
  
  if (scope === "Tất cả các trường") {
    // Combine top students from all schools and re-rank
    const allStudents = allSchools.flatMap(school =>studentsBySchool[school]);
    return allStudents
      .sort((a, b) =>b.gpa - a.gpa)
      .slice(0, limit)
      .map((student, index) =>({ ...student, rank: index + 1 }));
  } else if (studentsBySchool[scope]) {
    return studentsBySchool[scope].slice(0, limit);
  } else {
    return [];
  }
};
