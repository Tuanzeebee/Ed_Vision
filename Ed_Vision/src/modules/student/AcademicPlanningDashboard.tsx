// import { useState } from "react"; // Unused for now
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/student/Student_card";
import { Button } from "@/components/ui/student/Student_button";
import Header from "../../components/layout/Header"
import Footer from "../../components/layout/Footer"
import { useAuth } from "@/hooks/useAuth";
import { getStudentGPA, getProjectedGPA, getPredictedGPA, getSemesterPlan, getPhysicalEducationGPA } from "@/services/transcriptService";
import type { GPACalculationResult, PredictedGPAResult, SemesterPlanGrouped, PhysicalEducationGPAResult } from "@/services/transcriptService";
import { 
  GraduationCapIcon,
  GPAIcon,
  CreditsIcon,
  BrainIcon,
  TrendUpIcon,
  CalendarIcon
} from "@/assets/student/icons";
import { useTranslation } from 'react-i18next'

// type Props = {}; // Unused for now

interface CourseCard {
  code: string;
  title: string;
  credits: number;
  schedule: string;
  aiScore: string;
  type: "core" | "specialization" | "elective";
  status: "current" | "planned";
}

interface SemesterData {
  season: string;
  year: string;
  status: "current" | "planned";
  workingHours: number;
  totalCredits: number;
  courses: CourseCard[];
}

export default function AcademicPlanningDashboard() {
  // const [activeTab, setActiveTab] = useState("semester-plan"); // Unused for now
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation('student')
  const [currentGpaData, setCurrentGpaData] = useState<GPACalculationResult | null>(null); // Current GPA (completed only)
  const [projectedGpaData, setProjectedGpaData] = useState<GPACalculationResult | null>(null); // Projected GPA (completed + planned)
  const [predictedGpaData, setPredictedGpaData] = useState<PredictedGPAResult | null>(null);
  const [semesterPlanData, setSemesterPlanData] = useState<SemesterPlanGrouped | null>(null);
  const [physicalEdGpaData, setPhysicalEdGpaData] = useState<PhysicalEducationGPAResult | null>(null);
  const [isLoadingGPA, setIsLoadingGPA] = useState<boolean>(false);
  const [isLoadingSemesterPlan, setIsLoadingSemesterPlan] = useState<boolean>(false);

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        setIsLoadingGPA(true)
        setIsLoadingSemesterPlan(true)
        if (!isAuthenticated || !user) {
          toast.error(t('planning.toastLoginRequired'), { id: 'not-authenticated' })
          navigate('/login')
          return
        }
        const accountId = user.account_id || user.id
        if (!accountId) {
          toast.error(t('planning.toastAccountIdMissing'), { id: 'account-id-missing' })
          return
        }
        const p1 = getStudentGPA(accountId)
        const p2 = getProjectedGPA(accountId)
        const p3 = getPredictedGPA(accountId)
        const p4 = getPhysicalEducationGPA(accountId)
        const p5 = getSemesterPlan(accountId)
        const [r1, r2, r3, r4, r5] = await Promise.allSettled([p1, p2, p3, p4, p5])
        if (!active) return
        if (r1.status === 'fulfilled') setCurrentGpaData(r1.value as GPACalculationResult)
        if (r2.status === 'fulfilled') setProjectedGpaData(r2.value as GPACalculationResult)
        if (r3.status === 'fulfilled') setPredictedGpaData(r3.value as PredictedGPAResult)
        if (r4.status === 'fulfilled') setPhysicalEdGpaData(r4.value as PhysicalEducationGPAResult)
        if (r5.status === 'fulfilled') setSemesterPlanData(r5.value as SemesterPlanGrouped)
      } catch (error: any) {
        toast.error(t('planning.toastGpaFetchError'), { id: 'gpa-fetch-error' })
      } finally {
        if (!active) return
        setIsLoadingGPA(false)
        setIsLoadingSemesterPlan(false)
      }
    }
    if (isAuthenticated) run()
    return () => { active = false }
  }, [isAuthenticated, user, navigate, t])

  // Sample data based on the Figma design - Updated with real data
  const TOTAL_CREDITS_FOR_GRADUATION = 145;
  
  // Current GPA & Credits (completed only) - dùng currentGpaData
  const currentProgress = useMemo(() => ({
    percentage: currentGpaData ? ((currentGpaData.completedCredits / TOTAL_CREDITS_FOR_GRADUATION) * 100) : 72.5,
    creditsCompleted: currentGpaData?.completedCredits || 87,
    totalCredits: TOTAL_CREDITS_FOR_GRADUATION,
  }), [currentGpaData])

  // Projected Progress (completed + planned) - dùng projectedGpaData
  const graduationProgress = useMemo(() => ({
    percentage: projectedGpaData ? ((projectedGpaData.totalCredits / TOTAL_CREDITS_FOR_GRADUATION) * 100) : 72.5,
    creditsCompleted: projectedGpaData?.totalCredits || 87,
    totalCredits: TOTAL_CREDITS_FOR_GRADUATION,
    major: projectedGpaData?.major || "Computer Science Major",
    expectedGraduation: "Spring 2026"
  }), [projectedGpaData])

  const currentGPA = useMemo(() => ({
    value: currentGpaData?.currentGPA || 3.67,
    change: currentGpaData?.gpaChange !== undefined
      ? `${currentGpaData.gpaChange >= 0 ? '+' : ''}${currentGpaData.gpaChange.toFixed(2)} ${t('planning.fromLastSemester')}`
      : `+0.12 ${t('planning.fromLastSemester')}`
  }), [currentGpaData, t])

  const remainingCredits = useMemo(() => ({
    value: projectedGpaData ? (TOTAL_CREDITS_FOR_GRADUATION - projectedGpaData.totalCredits) : 33,
    totalCredits: TOTAL_CREDITS_FOR_GRADUATION,
  }), [projectedGpaData])

  // AI Score - dựa trên predicted GPA
  const aiScore = useMemo(() => ({
    value: predictedGpaData ? predictedGpaData.predictedGPA.toFixed(2) : "8.40",
    description: predictedGpaData && currentGpaData
      ? t('planning.predictedDeltaText', {
          delta: `${predictedGpaData.predictedGPA >= (currentGpaData?.currentGPA || 0) ? '+' : ''}${(predictedGpaData.predictedGPA - (currentGpaData?.currentGPA || 0)).toFixed(2)}`,
          with: predictedGpaData.plannedCoursesWithPrediction,
          total: predictedGpaData.plannedCourses
        })
      : predictedGpaData 
        ? t('planning.coursesPredicted', {
            with: predictedGpaData.plannedCoursesWithPrediction,
            total: predictedGpaData.plannedCourses
          })
        : t('planning.excellentOutlook'),
    raw: predictedGpaData?.predictedGPA || 0
  }), [predictedGpaData, currentGpaData, t])


  // Physical Education GPA - điểm trung bình các môn DEM
  const physicalEducationGPA = useMemo(() => ({
    value: physicalEdGpaData ? physicalEdGpaData.averageGPA10.toFixed(1) : "0.0",
    isPassing: physicalEdGpaData?.isPassing || false,
    totalCourses: physicalEdGpaData?.totalCourses || 0,
    isEligible: physicalEdGpaData?.isEligible || false,
    description: physicalEdGpaData 
      ? `${physicalEdGpaData.totalCourses}/3 ${t('planning.courses')} • ${physicalEdGpaData.isEligible ? t('planning.eligible') : t('planning.inProgress')}`
      : t('planning.noData'),
  }), [physicalEdGpaData, t])

  const translateSeason = (season: string) => {
    const s = (season || '').toLowerCase();
    if (s.includes('fall')) return t('planning.seasonFall');
    if (s.includes('spring')) return t('planning.seasonSpring');
    if (s.includes('summer')) return t('planning.seasonSummer');
    if (s.includes('winter')) return t('planning.seasonWinter');
    return season;
  };

  const semesterData: SemesterData[] = [
    {
      season: "Fall",
      year: "2024",
      status: "current",
      workingHours: 10,
      totalCredits: 15,
      courses: [
        {
          code: "CS 3310",
          title: "Data Structures & Algorithms",
          credits: 3,
          schedule: "MWF 10:00-10:50",
          aiScore: "8.2/9",
          type: "core",
          status: "current"
        },
        {
          code: "CS 3320",
          title: "Software Engineering",
          credits: 4,
          schedule: "TTh 2:00-3:50",
          aiScore: "7.8/9",
          type: "core",
          status: "current"
        },
        {
          code: "MATH 3350",
          title: "Discrete Mathematics",
          credits: 3,
          schedule: "MWF 1:00-1:50",
          aiScore: "7.5/9",
          type: "core",
          status: "current"
        },
        {
          code: "ENGL 3010",
          title: "Technical Writing",
          credits: 3,
          schedule: "TTh 11:00-12:15",
          aiScore: "8.7/9",
          type: "elective",
          status: "current"
        },
        {
          code: "PHIL 2100",
          title: "Ethics in Technology",
          credits: 2,
          schedule: "W 6:00-7:50",
          aiScore: "8.9/9",
          type: "elective",
          status: "current"
        }
      ]
    },
    {
      season: "Spring",
      year: "2025",
      status: "planned",
      workingHours: 12,
      totalCredits: 16,
      courses: [
        {
          code: "CS 4410",
          title: "Database Systems",
          credits: 4,
          schedule: "",
          aiScore: "8.5/9",
          type: "core",
          status: "planned"
        },
        {
          code: "CS 4420",
          title: "Computer Networks",
          credits: 3,
          schedule: "",
          aiScore: "7.9/9",
          type: "core",
          status: "planned"
        },
        {
          code: "CS 4350",
          title: "Web Development",
          credits: 3,
          schedule: "",
          aiScore: "8.8/9",
          type: "specialization",
          status: "planned"
        },
        {
          code: "STAT 3100",
          title: "Statistics for CS",
          credits: 3,
          schedule: "",
          aiScore: "7.6/9",
          type: "core",
          status: "planned"
        },
        {
          code: "ECON 2010",
          title: "Microeconomics",
          credits: 3,
          schedule: "",
          aiScore: "8.1/9",
          type: "elective",
          status: "planned"
        }
      ]
    }
  ];

  const StatCard = ({ 
    icon, 
    value, 
    subtitle, 
    additional, 
    colorScheme,
    isLoading,
    tooltip 
  }: {
    icon: React.ReactNode;
    value: string;
    subtitle: string;
    additional?: string;
    colorScheme: "blue" | "green" | "purple" | "orange";
    isLoading?: boolean;
    tooltip?: string;
  }) => {
    const colorClasses = {
      blue: {
        border: "border-blue-200",
        background: "bg-blue-500",
        iconBg: "bg-blue-500",
        badge: "bg-blue-200 text-blue-800",
        valueText: "text-blue-600",
        titleText: "text-blue-900",
        subtitleText: "text-blue-700",
        additionalText: "text-blue-600"
      },
      green: {
        border: "border-green-200",
        background: "bg-green-500",
        iconBg: "bg-green-500",
        badge: "bg-green-200 text-green-800",
        valueText: "text-green-600",
        titleText: "text-green-900",
        subtitleText: "text-green-700",
        additionalText: "text-green-600"
      },
      purple: {
        border: "border-purple-200",
        background: "bg-purple-500",
        iconBg: "bg-purple-500",
        badge: "bg-purple-200 text-purple-800",
        valueText: "text-purple-600",
        titleText: "text-purple-900",
        subtitleText: "text-purple-700",
        additionalText: "text-purple-600"
      },
      orange: {
        border: "border-orange-200",
        background: "bg-orange-500",
        iconBg: "bg-orange-500",
        badge: "bg-orange-200 text-orange-800",
        valueText: "text-orange-600",
        titleText: "text-orange-900",
        subtitleText: "text-orange-700",
        additionalText: "text-orange-600"
      }
    };

    const colors = colorClasses[colorScheme];

    return (
      <Card className={`${colors.border} border relative group cursor-help`} title={tooltip}>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className={`${colors.iconBg} p-2 rounded-lg text-white`}>
                  {icon}
                </div>
                {colorScheme !== "blue" && (
                  <div className={`${colors.badge} px-3 py-1 rounded-full text-xs font-medium`}>
                    {colorScheme === "green" ? t('planning.badgeCurrent') : 
                     colorScheme === "purple" ? t('planning.badgeRemaining') : t('planning.badgePredicted')}
                  </div>
                )}
              </div>
              <div className={`text-3xl font-bold ${colors.valueText} mb-1`}>
                {value}
              </div>
              <div className={`text-sm ${colors.subtitleText} mb-2`}>
                {subtitle}
              </div>
              {additional && (
                <div className={`text-xs ${colors.additionalText} flex items-center gap-1`}>
                  <TrendUpIcon />
                  {additional}
                </div>
              )}
            </>
          )}
        </CardContent>
        
        {/* Tooltip Panel */}
        {tooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out group-hover:scale-105 z-20">
            <div className="relative bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-400 rounded-lg shadow-2xl p-4 transform rotate-[-0.5deg]">
              {/* Sticky note header */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-200 opacity-50 rounded-bl-3xl"></div>
              
              {/* Content */}
              <div className="relative text-gray-800 text-sm leading-relaxed font-medium">
                {tooltip}
              </div>
              
              {/* Decorative tape effect */}
              <div className="absolute -top-2 left-8 w-16 h-6 bg-yellow-300 opacity-40 transform rotate-[-5deg] rounded-sm"></div>
              
              {/* Arrow pointing down - sticky note style */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-yellow-100"></div>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  };

  const CourseCard = ({ course }: { course: CourseCard }) => {
    const isCurrentSemester = course.status === "current";
    const borderColor = isCurrentSemester ? "border-blue-200" : "border-green-200";
    const buttonColor = isCurrentSemester ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700";
    
    const handleLearnClick = () => {
      navigate(`/student/course-detail`);
    };
    
    const getTypeLabel = (type: string) => {
      switch (type) {
        case "core": return "Core Requirement";
        case "specialization": return "Specialization";
        case "elective": return "Elective";
        default: return type;
      }
    };

    const getTypeColor = (type: string) => {
      switch (type) {
        case "core": return isCurrentSemester ? "text-blue-600" : "text-green-600";
        case "specialization": return isCurrentSemester ? "text-blue-600" : "text-green-600";
        case "elective": return isCurrentSemester ? "text-blue-600" : "text-green-600";
        default: return "text-gray-600";
      }
    };

    return (
      <Card className={`${borderColor} border bg-white`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{course.code}</h4>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
              {course.credits} {t('planning.creditsLabel')}
            </span>
          </div>
          
          <p className="text-gray-700 text-sm mb-3">{course.title}</p>
          
          <div className="flex items-center justify-between mb-3">
            {course.schedule ? (
              <span className="text-xs text-blue-600">{course.schedule}</span>
            ) : (
              <span className="text-xs text-gray-500"></span>
            )}
            <span className="text-xs text-orange-600">{course.aiScore}</span>
          </div>
          
          <Button 
            className={`w-full ${buttonColor} text-white text-xs h-8`}
            size="sm"
            onClick={handleLearnClick}
          >
            {t('planning.learnButton')}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const SemesterSection = ({ semester }: { semester: SemesterData }) => {
    const isCurrentSemester = semester.status === "current";
    const gradientClass = isCurrentSemester 
      ? "bg-gradient-to-r from-blue-50 to-blue-100" 
      : "bg-gradient-to-r from-green-50 to-green-100";
    const borderColor = isCurrentSemester ? "border-blue-200" : "border-green-200";
    const iconBg = isCurrentSemester ? "bg-blue-500" : "bg-green-500";
    const titleColor = isCurrentSemester ? "text-blue-900" : "text-green-900";
    const subtitleColor = isCurrentSemester ? "text-blue-700" : "text-green-700";
    const badgeColor = isCurrentSemester ? "bg-blue-200 text-blue-800" : "bg-green-200 text-green-800";
    const creditsColor = isCurrentSemester ? "text-blue-900" : "text-green-900";

    return (
      <Card className={`${gradientClass} ${borderColor} border mb-6`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`${iconBg} p-3 rounded-xl text-white`}>
                <CalendarIcon />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${titleColor}`}>
                  {translateSeason(semester.season)} {semester.year}
                </h3>
                <p className={`text-sm ${subtitleColor}`}>
                  {isCurrentSemester ? t('planning.currentSemester') : t('planning.planned')} • {semester.workingHours} {t('planning.hoursPerWeekWorking')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`${badgeColor} px-3 py-1 rounded-full text-xs font-medium`}>
                {isCurrentSemester ? t('planning.inProgress') : t('planning.recommended')}
              </span>
              <span className={`text-sm font-medium ${creditsColor}`}>
                {semester.totalCredits} {t('planning.creditsLabel')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {semester.courses.map((course, index) => (
              <CourseCard key={`${course.code}-${index}`} course={course} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-28 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => navigate('/student/adjust-parameters')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-5"
              >
                {t('planning.back')}
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('planning.title')}</h1>
                <p className="text-gray-600">{t('planning.subtitle')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-green-50 px-3 py-1 rounded-full flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-green-600 text-sm font-medium">{t('planning.planGenerated')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Statistics Cards */}
        <div className="space-y-6 mb-8">
          {/* First row - 2 Progress Cards (Current & Projected) */}
          <div className="grid grid-cols-2 gap-6">
            {/* Current Progress Card (Completed Only) */}
            <Card className="border-green-200 border">
              <CardContent className="p-6">
                {isLoadingGPA ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('planning.loadingData')}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-500 p-3 rounded-xl text-white">
                          <GraduationCapIcon />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-green-900">{t('planning.currentProgress')}</h3>
                          <p className="text-sm text-green-700">{currentGpaData?.major || "Major"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {currentProgress.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-green-700">{t('planning.complete')}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-800">{t('planning.creditsCompleted')}</span>
                        <span className="text-green-900">{currentProgress.creditsCompleted} / {currentProgress.totalCredits}</span>
                      </div>
                      
                      <div className="w-full bg-green-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full" 
                          style={{ width: `${currentProgress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Projected Progress Card (Completed + Planned) */}
            <Card className="border-blue-200 border">
              <CardContent className="p-6">
                {isLoadingGPA ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('planning.loadingData')}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-500 p-3 rounded-xl text-white">
                          <GraduationCapIcon />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-blue-900">{t('planning.projectedProgress')}</h3>
                          <p className="text-sm text-blue-700">{graduationProgress.major}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {graduationProgress.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-blue-700">{t('planning.complete')}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-800">{t('planning.totalCreditsWithPrediction')}</span>
                        <span className="text-blue-900">{graduationProgress.creditsCompleted} / {graduationProgress.totalCredits}</span>
                      </div>
                      
                      <div className="w-full bg-blue-200 rounded-full h-3">
                      <div 
                          className="bg-blue-500 h-3 rounded-full" 
                          style={{ width: `${graduationProgress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Second row - 4 stat cards */}
          <div className="grid grid-cols-4 gap-6">
            <StatCard
              icon={<GPAIcon />}
              value={currentGPA.value.toString()}
              subtitle={t('planning.cumulativeGPA')}
              additional={currentGPA.change}
              colorScheme="green"
              isLoading={isLoadingGPA}
              tooltip={`GPA hiện tại của bạn là ${currentGPA.value.toString()}! ${currentGPA.value >= 3.6 ? '🌟 Xuất sắc! Bạn đang là học sinh xuất sắc!' : currentGPA.value >= 3.2 ? 'Danh Hiệu giỏi! Tiếp tục phát huy!' : currentGPA.value >= 2.5 ? '💪 Khá! Cố gắng hơn nữa nhé!' : 'Hãy cố gắng học tập chăm chỉ hơn!'} Hãy duy trì và nâng cao thành tích học tập của mình nhé!`}
            />

            <StatCard
              icon={<CreditsIcon />}
              value={`${remainingCredits.value}/${remainingCredits.totalCredits}`}
              subtitle={t('planning.creditsToGraduatePrediction')}
              colorScheme="purple"
              isLoading={isLoadingGPA}
              tooltip={`Bạn còn ${remainingCredits.value} tín chỉ nữa là ra trường! 🎓 ${remainingCredits.value <= 20 ? 'Sắp đến đích rồi!' : remainingCredits.value <= 40 ? 'Đã đi được hơn nửa chặng đường!' : 'Hành trình còn dài, hãy kiên trì!'} Cố lên, thành công đang ở phía trước!`}
            />

            <StatCard
              icon={<BrainIcon />}
              value={aiScore.value}
              subtitle={t('planning.predictedGPA')}
              additional={aiScore.description}
              colorScheme="orange"
              isLoading={isLoadingGPA}
              tooltip="Dự đoán GPA chỉ là mô phỏng dựa trên dữ liệu và mô hình AI! Kết quả thực tế có thể khác nhau tùy thuộc vào nỗ lực của bạn. Cố lên học cùng mình nhé, bạn có thể làm được tốt hơn con số này! 💪"
            />

            {/* Physical Education GPA Card with Pass/Fail Badge */}
            <Card className="border-blue-200 border relative group cursor-help" title="Điểm Giáo dục thể chất rất quan trọng cho sức khỏe của bạn!">
              <CardContent className="p-6">
                {isLoadingGPA ? (
                  <div className="text-center py-4">
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-blue-500 p-2 rounded-lg text-white">
                        <GPAIcon />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        physicalEducationGPA.isPassing 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {physicalEducationGPA.isPassing ? `✓ ${t('planning.passLabel')}` : `✗ ${t('planning.failLabel')}`}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <div className="text-3xl font-bold text-blue-600">
                        {physicalEducationGPA.value}
                      </div>
                      <div className="text-sm text-blue-500">/10</div>
                    </div>
                    <div className="text-sm text-blue-700 mb-2">
                      {t('planning.physicalEducationGPA')}
                    </div>
                    {physicalEducationGPA.description && (
                      <div className="text-xs text-blue-600 flex items-center gap-1">
                        <TrendUpIcon />
                        {physicalEducationGPA.description}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              
              {/* Tooltip for Physical Education */}
              {!isLoadingGPA && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out group-hover:scale-105 z-20">
                  <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-400 rounded-lg shadow-2xl p-4 transform rotate-[0.5deg]">
                    {/* Sticky note header */}
                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-200 opacity-50 rounded-bl-3xl"></div>
                    
                    {/* Content */}
                    <div className="relative text-gray-800 text-sm leading-relaxed font-medium">
                      {`⚽ Điểm Giáo dục thể chất của bạn là ${physicalEducationGPA.value}/10! ${physicalEducationGPA.isPassing ? 'Bạn đã đạt yêu cầu!' : '⚠️ Cần cải thiện!'} Cố lên vận động thể thao nhiều hơn nhé! 🏃‍♂️ Thể dục thể thao không chỉ giúp rèn luyện thân thể mà còn giúp tinh thần minh mẫn hơn đấy! 💪🧠`}
                    </div>
                    
                    {/* Decorative tape effect */}
                    <div className="absolute -top-2 left-8 w-16 h-6 bg-blue-300 opacity-40 transform rotate-[-5deg] rounded-sm"></div>
                    
                    {/* Arrow pointing down - sticky note style */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                      <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-blue-100"></div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Semester Plan Section */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200">
            <div className="bg-blue-50 border-b-2 border-blue-500 py-4 px-18 text-center">
              <span className="text-blue-600 font-medium">{t('planning.semesterPlan')}</span>
            </div>
          </div>
          
          <CardContent className="p-8">
            {isLoadingSemesterPlan ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{t('planning.loadingSemesterPlan')}</p>
              </div>
            ) : semesterPlanData && semesterPlanData.semesters.length > 0 ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('planning.recommendedSemesterPlan')}</h2>
                  <p className="text-gray-600">
                    {t('planning.recommendedSubtitle', { hours: semesterPlanData.student_info.study_time_hours || 'N/A' })}
                  </p>
                </div>

                <div className="space-y-6">
                  {semesterPlanData.semesters.map((semester, index) => (
                    <SemesterSection 
                      key={`${semester.season}-${semester.year}-${index}`} 
                      semester={{
                        season: semester.season,
                        year: semester.year,
                        status: index === 0 ? "current" : "planned",
                        workingHours: semesterPlanData.student_info.study_time_hours || 10,
                        totalCredits: semester.total_credits,
                        courses: semester.courses.map(course => ({
                          code: course.course_code,
                          title: course.course_name,
                          credits: course.credits_unit,
                          schedule: "",
                          aiScore: `${course.predicted_gpa.toFixed(1)}/10`,
                          type: "core" as const,
                          status: index === 0 ? "current" as const : "planned" as const,
                        }))
                      }} 
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-2">{t('planning.noSemesterPlan')}</p>
                <p className="text-sm text-gray-500">{t('planning.noSemesterPlanHint')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
