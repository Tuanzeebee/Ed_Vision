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
}

/**
 * Get statistics based on data scope
 */
export const getScopeStats = (scope: string): ScopeStats => {
  if (scope === "Toàn trường") {
    return {
      students: 8450,
      teachers: 285,
      activeRate: 87.3,
      courses: 342
    };
  } else if (scope === "Theo khoa") {
    return {
      students: 2100,
      teachers: 68,
      activeRate: 89.5,
      courses: 95
    };
  } else if (scope === "Theo lớp") {
    return {
      students: 45,
      teachers: 12,
      activeRate: 92.1,
      courses: 8
    };
  } else {
    return {
      students: 1850,
      teachers: 42,
      activeRate: 85.7,
      courses: 28
    };
  }
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
