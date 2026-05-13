import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '@/components/ui/admin/AdminLayout'
import {
  getStudentDetail,
  type StudentDetail,
  type StudentTestResultItem,
} from '@/services/admin/studentDirectoryService'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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

const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa có dữ liệu'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

const getScore = (test: StudentTestResultItem) => {
  if (test.bandScore !== undefined) return test.bandScore.toFixed(1)
  if (test.totalScore !== undefined) return test.totalScore.toString()
  return '-'
}

const getTestLabel = (test: StudentTestResultItem) => {
  const cert = test.certType.toUpperCase()
  const type = test.testType.charAt(0).toUpperCase() + test.testType.slice(1)
  return `${cert} ${type} - ${test.testPhase}`
}

const getTestStatus = (test: StudentTestResultItem) => {
  const score = test.bandScore ?? test.totalScore ?? 0
  const passed = test.certType === 'ielts' ? score >= 6.5 : score >= 750
  return passed
    ? { label: 'Đạt chuẩn', bgColor: 'bg-green-100', textColor: 'text-green-700' }
    : { label: 'Cần cải thiện', bgColor: 'bg-red-100', textColor: 'text-red-700' }
}

const clampPercent = (value?: number) => Math.max(0, Math.min(100, Math.round(value || 0)))

const getStatusLabel = (status?: StudentDetail['learningStatus']) => {
  switch (status) {
    case 'active':
      return 'Active'
    case 'completed':
      return 'Completed'
    case 'on_hold':
      return 'On hold'
    default:
      return 'Inactive'
  }
}

export default function StudentProfileDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const studentId = Number(id)
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudent = async () => {
      if (!Number.isInteger(studentId) || studentId <= 0) {
        setError('Mã sinh viên không hợp lệ')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await getStudentDetail(studentId)
        setStudent(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Không thể tải chi tiết sinh viên')
      } finally {
        setLoading(false)
      }
    }

    fetchStudent()
  }, [studentId])

  const skillProgressData = useMemo(() => {
    const progress = student?.skillProgress
    const ieltsSkills = [
      { name: 'Listening', percent: clampPercent(progress?.listening), color: 'bg-blue-600' },
      { name: 'Reading', percent: clampPercent(progress?.reading), color: 'bg-blue-600' },
      {
        name: 'Writing',
        percent: clampPercent(progress?.writing),
        color: clampPercent(progress?.writing) < 50 ? 'bg-red-500' : 'bg-blue-600',
        isWarning: clampPercent(progress?.writing) < 50,
      },
      { name: 'Speaking', percent: clampPercent(progress?.speaking), color: 'bg-blue-600' },
    ]

    if (student?.certType === 'toeic') {
      return ieltsSkills.slice(0, 2)
    }

    return ieltsSkills
  }, [student?.certType, student?.skillProgress])

  // Score History Chart data
  const scoreHistoryData = useMemo(
    () => ({
      labels: student?.scoreHistory?.length
        ? student.scoreHistory.map((item) => item.label)
        : ['Chưa có dữ liệu'],
      datasets: [
        {
          label: `Điểm ${student?.certType?.toUpperCase() || 'Mock Test'}`,
          data: student?.scoreHistory?.length
            ? student.scoreHistory.map((item) => item.score)
            : [0],
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    }),
    [student?.certType, student?.scoreHistory]
  )

  const scoreHistoryOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: false,
          min: student?.certType === 'toeic' ? 0 : 4,
          max: student?.certType === 'toeic' ? 990 : 9,
          grid: { borderDash: [2, 2], color: '#e2e8f0' },
          ticks: { color: '#64748b' },
        },
        x: {
          grid: { display: false },
          ticks: { color: '#64748b' },
        },
      },
    }),
    [student?.certType]
  )

  const riskMessage = useMemo(() => {
    if (!student?.riskFactors?.length) return null
    return `Cảnh báo: ${student.riskFactors.join(', ')}`
  }, [student?.riskFactors])

  const handleBack = () => {
    navigate('/admin/students')
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-10 text-center">
          <Icon name="fa-spinner" className="fa-spin text-3xl text-blue-600" />
          <p className="text-sm text-gray-500 mt-3">Đang tải chi tiết sinh viên...</p>
        </div>
      </AdminLayout>
    )
  }

  if (error || !student) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            title="Quay lại"
          >
            <Icon name="fa-arrow-left" className="text-lg" />
          </button>
          <Card className="p-10 text-center">
            <Icon name="fa-exclamation-triangle" className="text-3xl text-red-500" />
            <p className="text-sm text-red-500 mt-3">{error || 'Không tìm thấy sinh viên'}</p>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              title="Quay lại"
            >
              <Icon name="fa-arrow-left" className="text-lg" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chi tiết hồ sơ sinh viên</h1>
              <p className="text-sm text-gray-500 mt-0.5">MSSV: {student.studentCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Icon name="fa-search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Tìm kiếm MSSV..."
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <Icon name="fa-file-pdf" className="mr-2 text-xs" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Profile Header Card */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
              <img
                src={student.avatarUrl || `https://randomuser.me/api/portraits/men/${student.studentId % 100}.jpg`}
                className="w-24 h-24 rounded-full border-4 border-blue-50 shadow-md"
                alt={student.fullName}
              />
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${
                student.learningStatus === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {/* Student Info */}
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900">{student.fullName || 'Chưa cập nhật tên'}</h2>
                <p className="text-sm text-gray-500">MSSV: {student.studentCode}</p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-md uppercase">
                    {student.certType || 'Chưa đăng ký'}
                  </span>
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-md uppercase">
                    {getStatusLabel(student.learningStatus)}
                  </span>
                </div>
              </div>

              {/* Department Info */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Khoa / Khóa</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {student.department || student.programName || 'Chưa phân khoa'}
                    {student.cohortYear ? ` - Khóa ${student.cohortYear}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mt-4">Ngày học gần nhất</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formatDateTime(student.studyStats?.lastActivityAt || student.lastActivityAt)}
                  </p>
                </div>
              </div>

              {/* Stats & Warning */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Thời gian học TB</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {student.studyStats?.averageDailyMinutes || 0} phút / ngày
                  </p>
                </div>
                {riskMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <Icon name="fa-exclamation-circle" className="text-red-500 mt-0.5" />
                    <span className="text-xs text-red-600 font-medium">{riskMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Progress & Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Progress */}
          <Card className="p-6">
            <h4 className="font-bold text-gray-900 mb-6">Tiến độ khóa học</h4>
            <div className="space-y-5">
              {skillProgressData.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">{skill.name}</span>
                    <span className={`font-semibold ${skill.isWarning ? 'text-red-600' : 'text-gray-900'}`}>
                      {skill.percent}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`${skill.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${skill.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Score History Chart */}
          <Card className="lg:col-span-2 p-6">
            <h4 className="font-bold text-gray-900 mb-6">Biểu đồ tiến bộ</h4>
            <div className="h-64">
              <Line data={scoreHistoryData} options={scoreHistoryOptions} />
            </div>
          </Card>
        </div>

        {/* Recent Activity Table */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h4 className="font-bold text-gray-900">Lịch sử làm bài gần đây</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ngày thực hiện</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Loại bài</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Điểm số</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {student.testResults.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      Chưa có lịch sử làm bài
                    </td>
                  </tr>
                ) : (
                  student.testResults.map((test) => {
                    const status = getTestStatus(test)
                    return (
                      <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-700">{formatDate(test.completedAt)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{getTestLabel(test)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{getScore(test)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 ${status.bgColor} ${status.textColor} text-xs font-medium rounded-md`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium">
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
