import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '@/components/ui/admin/AdminLayout'
import {
  getStudentDirectoryStats,
  getStudentDirectory,
  type StudentDirectoryItem,
  type StudentDirectoryStats,
} from '@/services/admin/studentDirectoryService'

// Icon wrapper using Font Awesome
const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <i className={`fas ${name} ${className}`}></i>
)

// Simple Card component
const Card = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
    {children}
  </div>
)

// Helper to get initials from full name
const getInitials = (name: string): string => {
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Helper to get avatar color based on student id
const getAvatarColor = (id: number): string => {
  const colors = [
    'bg-blue-100 text-blue-600',
    'bg-purple-100 text-purple-600',
    'bg-pink-100 text-pink-600',
    'bg-green-100 text-green-600',
    'bg-indigo-100 text-indigo-600',
    'bg-teal-100 text-teal-600',
    'bg-orange-100 text-orange-600',
    'bg-cyan-100 text-cyan-600',
  ]
  return colors[id % colors.length]
}

// Helper to get certificate badge colors
const getCertificateColors = (certType: string | null) => {
  if (certType === 'ielts') {
    return { bgColor: 'bg-blue-100', textColor: 'text-blue-700' }
  }
  if (certType === 'toeic') {
    return { bgColor: 'bg-orange-100', textColor: 'text-orange-700' }
  }
  return { bgColor: 'bg-gray-100', textColor: 'text-gray-700' }
}

// Helper to get status config
const getStatusConfig = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'active':
      return {
        label: t('admin:studentDirectoryPage.statusActive'),
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        dotColor: 'bg-green-600',
      }
    case 'on_hold':
      return {
        label: t('admin:studentDirectoryPage.statusOnHold'),
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700',
        dotColor: 'bg-orange-600',
      }
    case 'completed':
      return {
        label: t('admin:studentDirectoryPage.statusCompleted'),
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        dotColor: 'bg-blue-600',
      }
    case 'inactive':
    default:
      return {
        label: t('admin:studentDirectoryPage.statusInactive'),
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        dotColor: 'bg-gray-600',
      }
  }
}

// Helper to get risk config
const getRiskConfig = (riskLevel: string, t: (key: string) => string) => {
  switch (riskLevel) {
    case 'high':
      return {
        level: t('admin:studentDirectoryPage.riskHigh'),
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
      }
    case 'medium':
      return {
        level: t('admin:studentDirectoryPage.riskMedium'),
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
      }
    case 'low':
    default:
      return {
        level: t('admin:studentDirectoryPage.riskLow'),
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
      }
  }
}

export default function StudentDirectoryOverview() {
  const { t } = useTranslation(['admin', 'common'])
  const navigate = useNavigate()

  // State for stats
  const [stats, setStats] = useState<StudentDirectoryStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // State for students list
  const [students, setStudents] = useState<StudentDirectoryItem[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [certTypeFilter, setCertTypeFilter] = useState<'ielts' | 'toeic' | ''>('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'completed' | 'on_hold' | ''>('')
  const [riskFilter, setRiskFilter] = useState<'high' | 'medium' | 'low' | ''>('')

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true)
        const data = await getStudentDirectoryStats()
        setStats(data)
      } catch (err: any) {
        console.error('Failed to load stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Fetch students when filters or page change
  const fetchStudents = useCallback(async () => {
    try {
      setStudentsLoading(true)
      setError(null)

      const response = await getStudentDirectory({
        search: searchQuery || undefined,
        certType: certTypeFilter || undefined,
        learningStatus: statusFilter || undefined,
        riskLevel: riskFilter || undefined,
        page: pagination.page,
        limit: pagination.limit,
      })

      setStudents(response.data)
      setPagination(response.meta)
    } catch (err: any) {
      console.error('Failed to load students:', err)
      setError(err.message || t('admin:studentDirectoryPage.errorLoad'))
    } finally {
      setStudentsLoading(false)
    }
  }, [searchQuery, certTypeFilter, statusFilter, riskFilter, pagination.page, pagination.limit])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }))
      } else {
        fetchStudents()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, certTypeFilter, statusFilter, riskFilter])

  const handleStudentClick = (studentId: number) => {
    navigate(`/admin/students/${studentId}`)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  // Prepare stats data for display
  const statsData = stats
    ? [
        {
          title: t('admin:studentDirectoryPage.totalStudents'),
          value: stats.totalStudents.toLocaleString(),
          change: stats.totalChangePercent > 0 ? `+${stats.totalChangePercent}%` : `${stats.totalChangePercent}%`,
          changeLabel: t('admin:studentDirectoryPage.thisMonth'),
          icon: 'fa-users',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
        },
        {
          title: t('admin:studentDirectoryPage.ieltsSlashToeic'),
          value: `${stats.ieltsCount} / ${stats.toeicCount}`,
          change: null,
          changeLabel: null,
          icon: 'fa-graduation-cap',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
        },
        {
          title: t('admin:studentDirectoryPage.activeStudents'),
          value: stats.activeStudents.toLocaleString(),
          change: `~${stats.activePercent}%`,
          changeLabel: t('admin:studentDirectoryPage.totalLabel'),
          icon: 'fa-chart-line',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
        },
        {
          title: t('admin:studentDirectoryPage.needIntervention'),
          value: stats.atRiskCount.toString(),
          change: stats.atRiskHighCount > 0 ? `${stats.atRiskHighCount} ${t('admin:studentDirectoryPage.highRisk')}` : null,
          changeLabel: null,
          icon: 'fa-exclamation-circle',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          isAlert: true,
        },
      ]
    : []

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header with Search & Add Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin:studentDirectoryPage.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('admin:studentDirectoryPage.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Icon name="fa-search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder={t('admin:studentDirectoryPage.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors">
              <Icon name="fa-plus" className="text-xs" />
              {t('admin:studentDirectoryPage.addStudent')}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <Card
              key={index}
              className={`p-5 ${stat.isAlert ? 'border-l-4 border-l-red-500' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wide ${stat.isAlert ? 'text-red-600' : 'text-gray-500'}`}>
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  {stat.change && (
                    <p className={`text-xs mt-1 ${stat.isAlert ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                      {stat.change} {stat.changeLabel && <span className="text-gray-500">{stat.changeLabel}</span>}
                    </p>
                  )}
                </div>
                <div className={`p-2.5 ${stat.iconBg} ${stat.iconColor} rounded-lg`}>
                  <Icon name={stat.icon} className="text-lg" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters & Actions */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={certTypeFilter}
                onChange={(e) => setCertTypeFilter(e.target.value as 'ielts' | 'toeic' | '')}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">{t('admin:studentDirectoryPage.allCerts')}</option>
                <option value="ielts">IELTS</option>
                <option value="toeic">TOEIC</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'active' | 'inactive' | 'completed' | 'on_hold' | '')}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">{t('admin:studentDirectoryPage.allStatuses')}</option>
                <option value="active">{t('admin:studentDirectoryPage.statusActive')}</option>
                <option value="on_hold">{t('admin:studentDirectoryPage.statusOnHold')}</option>
                <option value="completed">{t('admin:studentDirectoryPage.statusCompleted')}</option>
                <option value="inactive">{t('admin:studentDirectoryPage.statusInactive')}</option>
              </select>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as 'high' | 'medium' | 'low' | '')}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">{t('admin:studentDirectoryPage.riskLevel')}</option>
                <option value="high">{t('admin:studentDirectoryPage.riskHigh')}</option>
                <option value="medium">{t('admin:studentDirectoryPage.riskMedium')}</option>
                <option value="low">{t('admin:studentDirectoryPage.riskLow')}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
                title={t('admin:studentDirectoryPage.exportTooltip')}
              >
                <Icon name="fa-download" className="text-sm" />
              </button>
              <button
                onClick={() => fetchStudents()}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
                title={t('admin:studentDirectoryPage.refreshTooltip')}
              >
                <Icon name="fa-sync-alt" className={`text-sm ${studentsLoading ? 'fa-spin' : ''}`} />
              </button>
            </div>
          </div>
        </Card>

        {/* Student Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin:studentDirectoryPage.colStudent')}</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin:studentDirectoryPage.colCertificate')}</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin:studentDirectoryPage.colProgress')}</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">{t('admin:studentDirectoryPage.colScore')}</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin:studentDirectoryPage.colStatus')}</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin:studentDirectoryPage.colRisk')}</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t('admin:studentDirectoryPage.colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentsLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <Icon name="fa-spinner" className="fa-spin text-2xl text-blue-600" />
                      <p className="text-sm text-gray-500 mt-2">{t('admin:studentDirectoryPage.loading')}</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <Icon name="fa-exclamation-triangle" className="text-2xl text-red-500" />
                      <p className="text-sm text-red-500 mt-2">{error}</p>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <Icon name="fa-inbox" className="text-2xl text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">{t('admin:studentDirectoryPage.noStudentFound')}</p>
                    </td>
                  </tr>
                ) : (
                  students.map((student: StudentDirectoryItem) => {
                    const certColors = getCertificateColors(student.certType)
                    const statusConfig = getStatusConfig(student.learningStatus, t)
                    const riskConfig = getRiskConfig(student.riskLevel, t)
                    return (
                      <tr
                        key={student.studentId}
                        onClick={() => handleStudentClick(student.studentId)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${getAvatarColor(student.studentId)} flex items-center justify-center font-semibold text-sm`}>
                              {getInitials(student.fullName)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {student.fullName}
                              </p>
                              <p className="text-xs text-gray-500">{t('admin:studentDirectoryPage.studentCode')}: {student.studentCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 ${certColors.bgColor} ${certColors.textColor} rounded-md text-xs font-medium`}>
                            {student.certificateName || t('admin:studentDirectoryPage.notRegistered')}
                          </span>
                        </td>
                        <td className="p-4 w-48">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all"
                                style={{ width: `${student.progressPercent}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700 w-8">{student.progressPercent}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs text-gray-400 line-through">{student.initialScore || '-'}</span>
                            <Icon name="fa-arrow-right" className="text-xs text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900">{student.currentScore || '-'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} text-xs font-medium`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}></span>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${riskConfig.bgColor} ${riskConfig.textColor} text-xs font-medium`}>
                            {riskConfig.level}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStudentClick(student.studentId)
                            }}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-400 hover:text-blue-600"
                            title={t('admin:studentDirectoryPage.viewDetail')}
                          >
                            <Icon name="fa-chevron-right" className="text-sm" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium">
              {studentsLoading ? (
                t('admin:studentDirectoryPage.loading')
              ) : (
                t('admin:studentDirectoryPage.showing', { from: students.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0, to: Math.min(pagination.page * pagination.limit, pagination.total), total: pagination.total })
              )}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPreviousPage || studentsLoading}
                className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 text-gray-500"
              >
                <Icon name="fa-chevron-left" className="text-xs" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      pagination.page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              {pagination.totalPages > 5 && (
                <>
                  <span className="px-1 text-gray-400">...</span>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      pagination.page === pagination.totalPages
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage || studentsLoading}
                className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 text-gray-500"
              >
                <Icon name="fa-chevron-right" className="text-xs" />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
