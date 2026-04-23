import { Card, CardContent } from "@/components/ui/student/Student_card"
import { Button } from "@/components/ui/student/Student_button"
import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import toast, { Toaster } from "react-hot-toast"
import Header from "../../components/layout/Header"
import { useTranslation } from 'react-i18next'
import Footer from "../../components/layout/Footer"
import { useAuth } from "@/hooks/useAuth"
import { getStudentGPA, getStudentSurveyFactors } from "@/services/transcriptService"
import type { GPACalculationResult, StudentSurveyFactors, SurveyFactorsResponse } from "@/services/transcriptService"
// Import image assets
import iconInstructions from "@/assets/student/iconInstructions.svg"
import iconUpload from "@/assets/student/iconUploadBlue.svg"
import iconAdjust from "@/assets/student/iconAdjustbBlue.svg"
import iconUser from "@/assets/student/iconUser.svg"
import iconEdit from "@/assets/student/iconEdit.svg"
import iconGraduationCap from "@/assets/student/iconGraduationCap.svg"
import iconEditGreen from "@/assets/student/iconEditGreen.svg"
import iconBook from "@/assets/student/iconBook.svg"
import iconEditPurple from "@/assets/student/iconEditPurple.svg"
import iconCheck from "@/assets/student/iconCheck.svg"
import iconArrowRight from "@/assets/student/iconArrowRight.svg"
type Props = {
  // Add props here if needed in the future
}

export default function AdjustParameters({}: Props) {
  const [hasUploadedTranscript, setHasUploadedTranscript] = useState<boolean>(false)
  const [isCheckingTranscript, setIsCheckingTranscript] = useState<boolean>(true)
  const [gpaData, setGpaData] = useState<GPACalculationResult | null>(null)
  const [surveyData, setSurveyData] = useState<StudentSurveyFactors | null>(null)
  const [isLoadingGPA, setIsLoadingGPA] = useState<boolean>(false)
  const [isLoadingSurvey, setIsLoadingSurvey] = useState<boolean>(false)
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { t } = useTranslation('student')
  
  // Extract userId to prevent re-renders when user object reference changes
  const userId = user?.account_id || user?.id

  const TOTAL_CREDITS_FOR_GRADUATION = 144
  const gpaValue = gpaData?.currentGPA ?? 0
  const gpaSticky = useMemo(() => {
    const trend = gpaData?.gpaChange !== undefined ? ` (xu hướng ${gpaData.gpaChange >= 0 ? '+': ''}${gpaData.gpaChange.toFixed(2)} so với kỳ trước)` : ''
const note = gpaValue >= 3.8
      ? 'Siêu xuất sắc! Bạn là hình mẫu của nỗ lực! Duy trì thói quen học tập hiệu quả, thử chinh phục các học phần khó để tạo bứt phá. Chia sẻ kinh nghiệm với bạn bè để lan tỏa cảm hứng nhé!': gpaValue >= 3.6
      ? 'Xuất sắc! Tiếp tục bứt phá nhé! Giữ nhịp học đều, tối ưu thời gian cho môn trọng điểm và đặt mục tiêu tăng thêm 0.1–0.2 GPA kỳ tới. Bạn làm được!': gpaValue >= 3.2
      ? 'Giỏi! Giữ vững phong độ! Chủ động ôn tập theo tuần, luyện bài ở phần còn yếu và tổng kết sau mỗi buổi. Thêm chút kỷ luật là lên mức xuất sắc ngay!': gpaValue >= 2.8
      ? 'Khá tốt! Thêm chút kỷ luật là lên hạng! Lập kế hoạch 2–3 giờ/tuần cho môn khó, chia nhỏ mục tiêu và kiểm tra tiến độ mỗi tuần. Cứ đều đặn là vượt mốc 3.2 sớm thôi!': gpaValue >= 2.5
      ? 'Khá! Cố gắng thêm chút nữa là lên hạng! Tập trung củng cố nền tảng, hỏi giảng viên/kết nối bạn học khi vướng mắc. Đặt mục tiêu tăng 0.2 GPA kỳ tới nhé!': 'Bạn có thể làm tốt hơn! Lập kế hoạch nhỏ mỗi ngày  Bắt đầu bằng mục tiêu tăng 0.2 GPA kỳ tới, học đều, ngủ đủ và nhờ hỗ trợ khi cần. Từng bước nhỏ tạo khác biệt lớn!'
return `GPA hiện tại của bạn là ${gpaValue.toFixed(2)}${trend}! ${note}`
  }, [gpaData])
  const remainingCredits = useMemo(() =>gpaData ? Math.max(0, TOTAL_CREDITS_FOR_GRADUATION - gpaData.completedCredits) : TOTAL_CREDITS_FOR_GRADUATION, [gpaData])
  const creditsSticky = useMemo(() =>`Bạn còn ${remainingCredits} tín chỉ nữa là ra trường!  ${remainingCredits <= 20 ? 'Sắp chạm vạch đích rồi!': remainingCredits <= 40 ? 'Đã đi được hơn nửa chặng đường!': 'Đường xa cũng tới, cứ kiên trì nhé!'} Cố lên bạn ơi!`, [remainingCredits])
  const majorSticky = useMemo(() => {
    const m = (gpaData?.major || '').trim().toLowerCase()
    if (!m) return 'Chưa chọn ngành? Chọn nhanh để hệ thống gợi ý đúng sở trường nhé!'
if (m.includes('công nghệ phần mềm') || m.includes('software')) return 'Công nghệ phần mềm: nghề hot, lương mơ ước  nhưng tuyển dụng ngày càng khắt khe. Vững thuật toán, code sạch, teamwork tốt – cơ hội sẽ tự tìm đến!'
if (m.includes('khoa học máy tính') || m.includes('computer science')) return 'Khoa học máy tính: nền tảng như bê tông cốt thép. Thuật toán, cấu trúc dữ liệu, hệ điều hành – càng chắc tay, cánh cửa càng rộng!'
if (m.includes('hệ thống thông tin') || m.includes('information systems')) return 'Hệ thống thông tin: cầu nối giữa business và tech. Phân tích yêu cầu chuẩn, hiểu quy trình tốt – triển khai là mượt!'
if (m.includes('trí tuệ nhân tạo') || m.includes('ai')) return 'AI: mô hình mạnh nhưng dữ liệu phải sạch. Mỗi ngày một bài toán nhỏ, vài dòng code gọn – tiến bộ bền vững!'
if (m.includes('an toàn thông tin') || m.includes('security')) return 'An toàn thông tin: hacker nghỉ thì mình vẫn cảnh giác. Kỷ luật cao, kiến thức vững – bảo vệ hệ thống như bảo vệ nhà!'
if (m.includes('quản trị kinh doanh') || m.includes('business')) return 'Quản trị kinh doanh: vừa chiến lược vừa thực thi. Ra quyết định dựa trên dữ liệu – hiệu suất tăng thấy rõ!'
return `${gpaData?.major}: ngành hot đấy! Kiên trì, chắc nền tảng, luyện dự án thực tế – cơ hội sẽ đến!`
  }, [gpaData])

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        setIsLoadingGPA(true)
        setIsLoadingSurvey(true)
        if (!isAuthenticated || !userId) return
        const p1 = getStudentGPA(userId)
        const p2 = getStudentSurveyFactors(userId)
        const [r1, r2] = await Promise.allSettled([p1, p2])
        if (!active) return
        if (r1.status === 'fulfilled') {
          const g = r1.value as GPACalculationResult
          setGpaData(g)
          const uploaded = (g.totalCourses >0) || (g.totalCredits >0) || (g.completedCredits >0)
          setHasUploadedTranscript(uploaded)
          if (!uploaded) {
            toast.error(t('adjust.toastTranscriptRequired'), { duration: 4000, id: 'transcript-required'})
            setTimeout(() => { navigate('/student/upload-transcript') }, 3000)
          }
        }
        if (r2.status === 'fulfilled') {
          const response = r2.value as SurveyFactorsResponse
          if (response.success && response.data) setSurveyData(response.data)
        }
      } catch (error: any) {
        toast.error('Failed to load data', { id: 'adjust-fetch-error'})
      } finally {
        if (!active) return
        setIsLoadingGPA(false)
        setIsLoadingSurvey(false)
        setIsCheckingTranscript(false)
      }
    }
    if (isAuthenticated && userId) run()
    return () => { active = false }
  }, [isAuthenticated, userId])

  

  

  // Show loading while checking
  if (isCheckingTranscript) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('adjust.checkingStatus')}</p>
        </div>
      </div>)
  }

  // Block access if no transcript uploaded
  if (!hasUploadedTranscript) {
    return (
      <>
        {/* Toast Notifications */}
        <Toaster 
          position="top-center"toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              style: {
                background: '#10B981',
                color: '#ffffff',
              },
            },
            error: {
              style: {
                background: '#EF4444',
                color: '#ffffff',
              },
            },
          }}
        />
        <div className="bg-gray-50 min-h-screen">
          <Header />
          <div className="max-w-2xl mx-auto px-4 py-20 text-center">
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-red-600"fill="none"stroke="currentColor"viewBox="0 0 24 24">
                  <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Upload Required</h1>
              <p className="text-gray-600">You need to upload your transcript before accessing this page.
              </p>
              <p className="text-sm text-gray-500">Redirecting to upload page...
              </p>
            </div>
          </div>
          <Footer />
        </div>
      </>)
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Toast Notifications */}
      <Toaster 
        position="top-center"toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            style: {
              background: '#10B981',
              color: '#ffffff',
            },
          },
          error: {
            style: {
              background: '#EF4444',
              color: '#ffffff',
            },
          },
        }}
      />
      
      <Header />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardContent className="p-0">
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => {
                    navigate('/student/instructions')
                    window.scrollTo({ top: 0, behavior: 'smooth'})
                  }}
                  className="flex-1 max-w-sm hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-center h-14 gap-3">
                    <img src={iconInstructions} alt=""className="w-5 h-5"loading="lazy"/>
                    <span className="text-gray-500 font-medium">{t('instructions.title')}</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    navigate('/student/upload-transcript')
                    window.scrollTo({ top: 0, behavior: 'smooth'})
                  }}
                  className="flex-1 max-w-sm hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-center h-14 gap-3 relative">
                      <img src={iconUpload} alt=""className="w-5 h-5"loading="lazy"/>
                      <span className="text-gray-500 font-medium">{t('upload.title')}</span>
                      <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full absolute right-8">
                      {t('upload.completeBadge')}
                      </span>
                    </div>
                </button>
                <div className="bg-blue-50 border-b-2 border-blue-500 flex-1 max-w-sm">
                  <div className="flex items-center justify-center h-14 gap-3">
                    <img src={iconAdjust} alt=""className="w-5 h-5"loading="lazy"/>
                    <span className="text-blue-600 font-medium">{t('adjust.tab')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Header Section */}
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-gray-900">
                  {t('adjust.pageTitle')}
                </h1>
                <p className="text-lg text-gray-600 font-medium">
                  {t('adjust.headerSubtitle')}
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current GPA Card */}
                <Card className="border border-blue-200 rounded-xl relative group cursor-help">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-500 p-2 rounded-lg">
                          <img src={iconUser} alt=""className="w-5 h-5"loading="lazy"/>
                        </div>
                        <h3 className="font-semibold text-gray-900">{t('adjust.currentGPA')}</h3>
                      </div>
                      <Button variant="ghost"size="sm"className="p-1">
                        <img src={iconEdit} alt=""className="w-4 h-4"loading="lazy"/>
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {isLoadingGPA ? (
                        <div className="text-4xl font-semibold text-blue-600">
                          <div className="animate-pulse">{t('adjust.loading')}</div>
                        </div>) : (
                        <div className="text-4xl font-semibold text-blue-600">
                          {gpaData?.currentGPA ? gpaData.currentGPA.toFixed(2) : '0.00'}
                        </div>)}
                      <p className="text-sm text-blue-700 font-medium">{t('adjust.outOfScale')}</p>
                    </div>
                  </CardContent>
                  {!isLoadingGPA && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out group-hover:scale-105 z-20">
                      <div className="relative bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-400 rounded-lg shadow-2xl p-4">
                        <div className="relative text-gray-800 text-sm leading-relaxed font-medium">
                          {gpaSticky}
                        </div>
                        <div className="absolute -top-2 left-8 w-16 h-6 bg-yellow-300 opacity-40 transform rotate-[-5deg] rounded-sm"></div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-yellow-100"></div>
                        </div>
                      </div>
                    </div>)}
                </Card>

                {/* Major Card */}
                <Card className="border border-green-200 rounded-xl relative group cursor-help">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-500 p-2 rounded-lg">
                          <img src={iconGraduationCap} alt=""className="w-5 h-5"loading="lazy"/>
                        </div>
                        <h3 className="font-semibold text-gray-900">{t('adjust.major')}</h3>
                      </div>
                      <Button variant="ghost"size="sm"className="p-1">
                        <img src={iconEditGreen} alt=""className="w-4 h-4"loading="lazy"/>
                      </Button>
                    </div>
                    <div className="text-lg font-medium text-gray-900">
                      {isLoadingGPA ? (
                        <div className="animate-pulse">Loading...</div>) : (
                        gpaData?.major || 'Not specified')}
                    </div>
                  </CardContent>
                  {!isLoadingGPA && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out group-hover:scale-105 z-20">
                      <div className="relative bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-400 rounded-lg shadow-2xl p-4">
                        <div className="relative text-gray-800 text-sm leading-relaxed font-medium">
                          {majorSticky}
                        </div>
                        <div className="absolute -top-2 left-8 w-16 h-6 bg-yellow-300 opacity-40 transform rotate-[-5deg] rounded-sm"></div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-yellow-100"></div>
                        </div>
                      </div>
                    </div>)}
                </Card>

                {/* Credits Completed Card */}
                <Card className="border border-purple-200 rounded-xl relative group cursor-help">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-500 p-2 rounded-lg">
                          <img src={iconBook} alt=""className="w-5 h-5"loading="lazy"/>
                        </div>
                        <h3 className="font-semibold text-gray-900">{t('adjust.creditsCompleted')}</h3>
                      </div>
                      <Button variant="ghost"size="sm"className="p-1">
                        <img src={iconEditPurple} alt=""className="w-4 h-4"loading="lazy"/>
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {isLoadingGPA ? (
                        <div className="text-2xl font-semibold text-purple-600 animate-pulse">
                          {t('adjust.loading')}
                        </div>) : (
                        <>
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-semibold text-purple-600">
                              {gpaData?.completedCredits || 0}
                            </span>
                            <span className="text-lg text-purple-700 font-medium">/ 145
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="bg-purple-200 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full"style={{ 
                                  width: `${gpaData 
                                    ? ((gpaData.completedCredits / 145) * 100).toFixed(1) 
                                    : 0}%` 
                                }}
                              ></div>
                            </div>
                            <p className="text-sm text-purple-700 font-medium">
                              {gpaData 
                                ? t('adjust.percentComplete', { percent: ((gpaData.completedCredits / 145) * 100).toFixed(1) })
                                : t('adjust.percentComplete', { percent: '0'})
                              }
                            </p>
                          </div>
                        </>)}
                    </div>
                  </CardContent>
                  {!isLoadingGPA && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out group-hover:scale-105 z-20">
                      <div className="relative bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-400 rounded-lg shadow-2xl p-4">
                        <div className="relative text-gray-800 text-sm leading-relaxed font-medium">
                          {creditsSticky}
                        </div>
                        <div className="absolute -top-2 left-8 w-16 h-6 bg-yellow-300 opacity-40 transform rotate-[-5deg] rounded-sm"></div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-yellow-100"></div>
                        </div>
                      </div>
                    </div>)}
                </Card>
              </div>

              {/* Survey Factors Section */}
              <Card className="border border-gray-200 rounded-xl">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold text-gray-900">{t('adjust.surveyResults')}</h2>
                      <p className="text-sm text-gray-600 font-medium">
                        {t('adjust.surveySubtitle')}
                      </p>
                    </div>
                    {surveyData && (
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                          <img src={iconCheck} alt=""className="w-4 h-4"loading="lazy"/>
                          <span className="text-sm text-green-600 font-medium">{t('adjust.completed')}</span>
                        </div>)}
                  </div>

                  {isLoadingSurvey ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">{t('adjust.loadingSurvey')}</p>
                    </div>) : surveyData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Study Time */}
                      <Card className="border border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-500 p-2 rounded-lg">
                              <img src={iconBook} alt=""className="w-5 h-5"/>
                            </div>
                            <h3 className="font-semibold text-gray-900">{t('adjust.studyTime')}</h3>
                          </div>
                          <div className="text-3xl font-bold text-blue-600">
                            {surveyData.study_time_hours ?? 'N/A'}
                            {surveyData.study_time_hours && (
                              <span className="text-sm font-medium text-blue-700 ml-2">{t('adjust.hoursPerWeek')}</span>)}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Work Time */}
                      <Card className="border border-purple-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-purple-500 p-2 rounded-lg">
                              <svg className="w-5 h-5 text-white"fill="currentColor"viewBox="0 0 20 20">
                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                              </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900">{t('adjust.workTime')}</h3>
                          </div>
                          <div className="text-3xl font-bold text-purple-600">
                            {surveyData.work_time_hours ?? 'N/A'}
                            {(surveyData.work_time_hours !== null && surveyData.work_time_hours !== undefined) && (
                              <span className="text-sm font-medium text-purple-700 ml-2">{t('adjust.hoursPerWeek')}</span>)}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Financial Support */}
                      <Card className="border border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-green-500 p-2 rounded-lg">
                              <svg className="w-5 h-5 text-white"fill="currentColor"viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                                <path fillRule="evenodd"d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"clipRule="evenodd"/>
                              </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900">{t('adjust.financialSupport')}</h3>
                          </div>
                          <div className="text-3xl font-bold text-green-600">
                            {(() => {
                              const s = surveyData.financial_support_score;
                              if (s === null || s === undefined) return 'N/A';
                              const rounded = Math.round(s);
                              let text = '';
                              if (rounded === 0) text = 'Thấp';
                              else if (rounded === 1) text = 'Trung bình';
                              else if (rounded === 2) text = 'Cao';
                              else if (rounded >= 3) text = 'Rất cao';
                              
                              return (
                                <span>
                                  {s} <span className="text-lg text-green-700 font-medium">/ {text}</span></span>);
                            })()}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Mental Health */}
                      <Card className="border border-pink-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-pink-500 p-2 rounded-lg">
                              <svg className="w-5 h-5 text-white"fill="currentColor"viewBox="0 0 20 20">
                                <path fillRule="evenodd"d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"clipRule="evenodd"/>
                              </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900">{t('adjust.mentalHealth')}</h3>
                          </div>
                          <div className="text-3xl font-bold text-pink-600">
                            {(() => {
                              const s = surveyData.mental_health_score;
                              if (s === null || s === undefined) return 'N/A';
                              const rounded = Math.round(s);
                              let text = '';
                              if (rounded === 0) text = 'Thấp';
                              else if (rounded === 1) text = 'Trung bình';
                              else if (rounded === 2) text = 'Cao';
                              else if (rounded >= 3) text = 'Rất cao';
                              
                              return (
                                <span>
                                  {s} <span className="text-lg text-pink-700 font-medium">/ {text}</span></span>);
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </div>) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4"fill="none"stroke="currentColor"viewBox="0 0 24 24">
                        <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <p className="text-lg font-semibold text-gray-900 mb-2">{t('adjust.noSurveyTitle')}</p>
                      <p className="text-sm text-gray-600">{t('adjust.noSurveyDesc')}</p>
                    </div>)}

                  {surveyData && (
                    <p className="text-xs text-gray-500 text-center">
                      {t('adjust.lastUpdated')} {new Date(surveyData.updated_at).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </p>)}
                </CardContent>
              </Card>

              {/* Action Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={() => {
                    navigate('/student/academic-planning')
                    window.scrollTo({ top: 0, behavior: 'smooth'})
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl h-auto">
                  <img src={iconArrowRight} alt=""className="w-6 h-6 mr-3"loading="lazy"/>
                  <span className="text-lg font-semibold">{t('adjust.continueToPlanning')}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>)
}
