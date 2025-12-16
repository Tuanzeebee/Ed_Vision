import { Card, CardContent } from "@/components/ui/student/Student_card"
import { Button } from "@/components/ui/student/Student_button"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import toast, { Toaster } from "react-hot-toast"
import Header from "../../components/layout/Header"
import Footer from "../../components/layout/Footer"

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
import iconSemester from "@/assets/student/iconSemester.svg"
import iconFullProgram from "@/assets/student/iconFullProgram.svg"
import iconCheck from "@/assets/student/iconCheck.svg"
import iconCalendar from "@/assets/student/iconCalendar.svg"
import iconSun from "@/assets/student/iconSun.svg"
import iconArrowRight from "@/assets/student/iconArrowRight.svg"

type Props = {
  // Add props here if needed in the future
}

interface SemesterData {
  id: string
  title: string
  dates: string
  status: string
  statusColor: string
  borderColor: string
  iconBg: string
  textColor: string
  workingHours: string
  icon: string
}

export default function AdjustParameters({}: Props) {
  const [activeView, setActiveView] = useState<'semester' | 'fullProgram'>('semester')
  const [hasUploadedTranscript, setHasUploadedTranscript] = useState<boolean>(false)
  const [isCheckingTranscript, setIsCheckingTranscript] = useState<boolean>(true)
  const navigate = useNavigate()
  const { t } = useTranslation('student')

  // Check if user has uploaded transcript
  useEffect(() => {
    const checkTranscriptStatus = () => {
      // Check localStorage for upload success flag
      const uploadSuccess = localStorage.getItem('transcript_uploaded')
      
      if (uploadSuccess === 'true') {
        setHasUploadedTranscript(true)
      } else {
        setHasUploadedTranscript(false)
        // Show warning and redirect after 3 seconds
        toast.error('Please upload your transcript first!', { duration: 4000 })
        
        setTimeout(() => {
          navigate('/student/upload-transcript')
        }, 3000)
      }
      
      setIsCheckingTranscript(false)
    }

    checkTranscriptStatus()
  }, [navigate])

  // Show loading while checking
  if (isCheckingTranscript) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('adjust.checkingStatus')}</p>
        </div>
      </div>
    )
  }

  // Block access if no transcript uploaded
  if (!hasUploadedTranscript) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Toaster position="top-center" />
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('adjust.uploadRequired')}</h1>
            <p className="text-gray-600">
              {t('adjust.needUpload')}
            </p>
            <p className="text-sm text-gray-500">
              {t('adjust.redirecting')}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const semesters: SemesterData[] = [
    {
      id: "fall2023",
      title: "Fall 2023",
      dates: "Aug 28 - Dec 15, 2023",
      status: "Completed",
      statusColor: "bg-blue-200 text-blue-800",
      borderColor: "border-blue-200",
      iconBg: "bg-blue-500",
      textColor: "text-blue-900",
      workingHours: "5",
      icon: iconCalendar
    },
    {
      id: "spring2024",
      title: "Spring 2024", 
      dates: "Jan 16 - May 10, 2024",
      status: "Completed",
      statusColor: "bg-green-200 text-green-800",
      borderColor: "border-green-200",
      iconBg: "bg-green-500",
      textColor: "text-green-900",
      workingHours: "8",
      icon: iconCalendar
    },
    {
      id: "summer2024",
      title: "Summer 2024",
      dates: "May 20 - Aug 9, 2024", 
      status: "Completed",
      statusColor: "bg-yellow-200 text-yellow-800",
      borderColor: "border-yellow-200",
      iconBg: "bg-yellow-500",
      textColor: "text-yellow-900",
      workingHours: "15",
      icon: iconSun
    },
    {
      id: "fall2024",
      title: "Fall 2024",
      dates: "Aug 26 - Dec 13, 2024",
      status: "Current",
      statusColor: "bg-purple-200 text-purple-800",
      borderColor: "border-purple-200", 
      iconBg: "bg-purple-500",
      textColor: "text-purple-900",
      workingHours: "10",
      icon: iconCalendar
    },
    {
      id: "spring2025",
      title: "Spring 2025",
      dates: "Jan 14 - May 8, 2025",
      status: "Upcoming",
      statusColor: "bg-red-200 text-red-800",
      borderColor: "border-red-200",
      iconBg: "bg-red-500", 
      textColor: "text-red-900",
      workingHours: "12",
      icon: iconCalendar
    },
    {
      id: "summer2025",
      title: "Summer 2025",
      dates: "May 19 - Aug 8, 2025",
      status: "Upcoming",
      statusColor: "bg-indigo-200 text-indigo-800",
      borderColor: "border-indigo-200",
      iconBg: "bg-indigo-500",
      textColor: "text-indigo-900", 
      workingHours: "20",
      icon: iconSun
    },
    {
      id: "fall2025",
      title: "Fall 2025",
      dates: "Aug 25 - Dec 12, 2025",
      status: "Planned",
      statusColor: "bg-teal-200 text-teal-800",
      borderColor: "border-teal-200",
      iconBg: "bg-teal-500",
      textColor: "text-teal-900",
      workingHours: "8",
      icon: iconCalendar
    },
    {
      id: "spring2026",
      title: "Spring 2026",
      dates: "Jan 12 - May 6, 2026",
      status: "Planned", 
      statusColor: "bg-pink-200 text-pink-800",
      borderColor: "border-pink-200",
      iconBg: "bg-pink-500",
      textColor: "text-pink-900",
      workingHours: "5",
      icon: iconCalendar
    }
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Toast Notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
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
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="flex-1 max-w-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center h-14 gap-3">
                    <img src={iconInstructions} alt="" className="w-5 h-5" />
                    <span className="text-gray-500 font-medium">{t('instructions.tabInstructions')}</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    navigate('/student/upload-transcript')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="flex-1 max-w-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center h-14 gap-3 relative">
                    <img src={iconUpload} alt="" className="w-5 h-5" />
                    <span className="text-gray-500 font-medium">{t('instructions.tabUpload')}</span>
                    <span className="bg-green-100 text-green-600 text-[10px] px-1.5 py-0.5 rounded-full absolute -right-2 top-2">
                      {t('upload.complete')}
                    </span>
                  </div>
                </button>
                <div className="bg-blue-50 border-b-2 border-blue-500 flex-1 max-w-sm">
                  <div className="flex items-center justify-center h-14 gap-3">
                    <img src={iconAdjust} alt="" className="w-5 h-5" />
                    <span className="text-blue-600 font-medium">{t('instructions.tabAdjust')}</span>
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
                  {t('adjust.pageDescription')}
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current GPA Card */}
                <Card className="border border-blue-200 rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-500 p-2 rounded-lg">
                          <img src={iconUser} alt="" className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{t('adjust.currentGPA')}</h3>
                      </div>
                      <Button variant="ghost" size="sm" className="p-1">
                        <img src={iconEdit} alt="" className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <div className="text-4xl font-semibold text-blue-600">3.67</div>
                      <p className="text-sm text-blue-700 font-medium">{t('adjust.gpaScale')}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Major Card */}
                <Card className="border border-green-200 rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-500 p-2 rounded-lg">
                          <img src={iconGraduationCap} alt="" className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{t('adjust.major')}</h3>
                      </div>
                      <Button variant="ghost" size="sm" className="p-1">
                        <img src={iconEditGreen} alt="" className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-lg font-medium text-gray-900">
                      Computer Science
                    </div>
                  </CardContent>
                </Card>

                {/* Credits Completed Card */}
                <Card className="border border-purple-200 rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-500 p-2 rounded-lg">
                          <img src={iconBook} alt="" className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{t('adjust.creditsCompleted')}</h3>
                      </div>
                      <Button variant="ghost" size="sm" className="p-1">
                        <img src={iconEditPurple} alt="" className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-semibold text-purple-600">87</span>
                        <span className="text-lg text-purple-700 font-medium">/ 120</span>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-purple-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '72.5%' }}></div>
                        </div>
                        <p className="text-sm text-purple-700 font-medium">72.5% {t('adjust.percentComplete')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* View Toggle */}
              <div className="bg-gray-50 p-1 rounded-xl flex">
                <Button 
                  variant={activeView === 'semester' ? 'default' : 'ghost'} 
                  className={`flex-1 ${activeView === 'semester' ? 'bg-white shadow-sm text-blue-600 hover:bg-white' : 'text-gray-600'}`}
                  onClick={() => setActiveView('semester')}
                >
                  <img src={iconSemester} alt="" className="w-5 h-5 mr-3" />
                  {t('adjust.bySemester')}
                </Button>
                <Button 
                  variant={activeView === 'fullProgram' ? 'default' : 'ghost'} 
                  className={`flex-1 ${activeView === 'fullProgram' ? 'bg-white shadow-sm text-blue-600 hover:bg-white' : 'text-gray-600'}`}
                  onClick={() => setActiveView('fullProgram')}
                >
                  <img src={iconFullProgram} alt="" className="w-5 h-5 mr-3" />
                  {t('adjust.fullProgram')}
                </Button>
              </div>

              {/* Conditional Content Based on Active View */}
              {activeView === 'semester' ? (
                // Semester Planning Options
                <Card className="border border-gray-200 rounded-xl">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-gray-900">{t('adjust.semesterPlanning')}</h2>
                        <p className="text-sm text-gray-600 font-medium">{t('adjust.academicPeriods')}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                        <img src={iconCheck} alt="" className="w-4 h-4" />
                        <span className="text-sm text-green-600 font-medium">{t('adjust.autoLoaded')}</span>
                      </div>
                    </div>

                    {/* Semester Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {semesters.map((semester) => (
                        <Card key={semester.id} className={`${semester.borderColor} border rounded-xl`}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`${semester.iconBg} p-1.5 rounded-lg`}>
                                  <img src={semester.icon} alt="" className="w-4 h-4" />
                                </div>
                                <h3 className={`font-semibold ${semester.textColor}`}>
                                  {semester.title}
                                </h3>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${semester.statusColor}`}>
                                {semester.status}
                              </span>
                            </div>
                            
                            <p className={`text-sm font-medium ${semester.textColor.replace('900', '700')}`}>
                              {semester.dates}
                            </p>
                            
                            <div className="space-y-2">
                              <label className={`text-xs font-medium ${semester.textColor}`}>
                                {t('adjust.workingHours')}
                              </label>
                              <div className="flex items-center gap-2">
                                <input 
                                  defaultValue={semester.workingHours}
                                  className={`flex-1 text-sm px-2 py-1 border rounded-lg ${semester.borderColor.replace('200', '300')}`}
                                />
                                <span className={`text-xs font-medium ${semester.textColor.replace('900', '700')}`}>
                                  hrs/week
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Full Program View
                <Card className="border border-gray-200 rounded-xl">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-gray-900">{t('adjust.fullProgramOverview')}</h2>
                        <p className="text-sm text-gray-600 font-medium">{t('adjust.programSummary')}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                        <img src={iconCheck} alt="" className="w-4 h-4" />
                        <span className="text-sm text-green-600 font-medium">FULL</span>
                      </div>
                    </div>

                    {/* Full Program Card */}
                    <Card className="border border-blue-200 rounded-xl">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-500 p-2 rounded-lg">
                              <img src={iconFullProgram} alt="" className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-semibold text-blue-900">
                              Computer Science Degree Program
                            </h3>
                          </div>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-200 text-green-800">
                            Completed
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-blue-900">
                            {t('adjust.workingHours')}
                          </label>
                          <div className="flex items-center gap-2">
                            <input 
                              defaultValue="5"
                              className="flex-1 text-lg px-3 py-2 border border-blue-300 rounded-lg"
                            />
                            <span className="text-sm font-medium text-blue-700">
                              {t('adjust.hrsWeek')}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl h-auto"
                >
                  <img src={iconCheck} alt="" className="w-6 h-6 mr-3" />
                  <span className="text-lg font-semibold">{t('adjust.confirmChanges')}</span>
                </Button>
                <Button 
                  onClick={() => {
                    navigate('/student/academic-planning')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-8 py-3 rounded-xl h-auto"
                >
                  <img src={iconArrowRight} alt="" className="w-6 h-6 mr-3" />
                  <span className="text-lg font-semibold">{t('adjust.continuePlanning')}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  )
}