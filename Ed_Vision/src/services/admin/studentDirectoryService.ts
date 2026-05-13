import { apiFetch } from '@/services/api/fetch'

// Types matching backend API
export interface StudentDirectoryStats {
  totalStudents: number
  totalChangePercent: number
  ieltsCount: number
  toeicCount: number
  activeStudents: number
  activePercent: number
  atRiskCount: number
  atRiskHighCount: number
}

export interface StudentDirectoryItem {
  studentId: number
  accountId: number
  studentCode: string
  fullName: string
  email: string
  avatarUrl?: string
  certType: 'ielts' | 'toeic' | null
  certificateName?: string
  progressPercent: number
  examCount: number
  practiceCount: number
  vocabCount: number
  initialScore?: string
  currentScore?: string
  improvementPercent?: number
  learningStatus: 'active' | 'inactive' | 'completed' | 'on_hold'
  riskLevel: 'high' | 'medium' | 'low'
  department?: string
  cohortYear?: number
  lastActivityAt?: string
}

export interface StudentTestResultItem {
  id: number
  testType: 'diagnostic' | 'placement' | 'mock' | 'official'
  testPhase: 'entry' | 'midterm' | 'final'
  certType: 'ielts' | 'toeic'
  totalScore?: number
  bandScore?: number
  listeningScore?: number
  readingScore?: number
  writingScore?: number
  speakingScore?: number
  completedAt: string
  durationMinutes?: number
}

export interface StudentActivityItem {
  id: number
  actionType: string
  feature: string
  pagePath?: string
  createdAt: string
}

export interface StudentScoreHistoryItem {
  id: number
  label: string
  score: number
  certType: 'ielts' | 'toeic'
  testType: string
  testPhase: string
  completedAt: string
}

export interface StudentStudyStats {
  averageDailyMinutes: number
  totalSessions: number
  totalPageViews: number
  activeDays: number
  lastActivityAt?: string
}

export interface StudentDetail extends StudentDirectoryItem {
  phoneNumber?: string
  dateOfBirth?: string
  gender?: string
  address?: string
  nationality?: string
  major?: string
  classCode?: string
  programName?: string
  skillProgress: {
    listening: number
    reading: number
    writing: number
    speaking: number
  }
  testResults: StudentTestResultItem[]
  scoreHistory: StudentScoreHistoryItem[]
  recentActivities: StudentActivityItem[]
  studyStats: StudentStudyStats
  riskFactors?: string[]
  projectedCompletionDate?: string
}

export interface StudentDirectoryResponse {
  data: StudentDirectoryItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface StudentDirectoryFilters {
  search?: string
  certType?: 'ielts' | 'toeic'
  learningStatus?: 'active' | 'inactive' | 'completed' | 'on_hold'
  riskLevel?: 'high' | 'medium' | 'low'
  department?: string
  cohortYear?: number
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// API Functions
export async function getStudentDirectoryStats(): Promise<StudentDirectoryStats> {
  return apiFetch('/admin/students/directory/stats')
}

export async function getStudentDirectory(
  filters: StudentDirectoryFilters = {},
): Promise<StudentDirectoryResponse> {
  const params = new URLSearchParams()

  // Only append if value exists and is not empty string
  if (filters.search && filters.search.trim()) params.append('search', filters.search.trim())
  if (filters.certType) params.append('certType', filters.certType)
  if (filters.learningStatus) params.append('learningStatus', filters.learningStatus)
  if (filters.riskLevel) params.append('riskLevel', filters.riskLevel)
  if (filters.department && filters.department.trim()) params.append('department', filters.department.trim())
  // Only append numeric values if they exist and are valid numbers
  if (filters.cohortYear !== undefined && filters.cohortYear !== null && !isNaN(filters.cohortYear)) {
    params.append('cohortYear', String(filters.cohortYear))
  }
  if (filters.page !== undefined && filters.page !== null && !isNaN(filters.page) && filters.page > 0) {
    params.append('page', String(filters.page))
  }
  if (filters.limit !== undefined && filters.limit !== null && !isNaN(filters.limit) && filters.limit > 0) {
    params.append('limit', String(filters.limit))
  }
  if (filters.sortBy && filters.sortBy.trim()) params.append('sortBy', filters.sortBy.trim())
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

  const queryString = params.toString()
  const path = queryString ? `/admin/students/directory?${queryString}` : '/admin/students/directory'

  return apiFetch(path)
}

export async function getStudentDetail(studentId: number): Promise<StudentDetail> {
  return apiFetch(`/admin/students/directory/${studentId}`)
}
