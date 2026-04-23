import { useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/student/Student_card";
import { Button } from "@/components/ui/student/Student_button";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import {
  getStudentGPA,
  getProjectedGPA,
  getPredictedGPA,
  getSemesterPlan,
  getPhysicalEducationGPA,
} from "@/services/transcriptService";
import type {
  GPACalculationResult,
  PredictedGPAResult,
  SemesterPlanGrouped,
  PhysicalEducationGPAResult,
} from "@/services/transcriptService";
import {
  GraduationCapIcon,
  GPAIcon,
  CreditsIcon,
  BrainIcon,
  TrendUpIcon,
  CalendarIcon,
} from "@/assets/student/icons";
import { useTranslation } from "react-i18next";

interface SemesterCourse {
  code: string;
  title: string;
  credits: number;
  schedule: string;
  aiScore: string;
  type: "core"| "specialization"| "elective";
  status: "current"| "planned";
}

interface SemesterData {
  season: string;
  year: string;
  status: "current"| "planned";
  workingHours: number;
  totalCredits: number;
  courses: SemesterCourse[];
}

type CourseRiskLevel = "high" | "medium" | "safe";
type PlanningRiskLevel = "high" | "medium" | "low";
type RiskIndicator = "high" | "medium" | "low" | "critical";

interface PlanningRiskState {
  level: PlanningRiskLevel;
  title: RiskIndicator;
  next: RiskIndicator;
  midterm: RiskIndicator;
}

const parseAiScore = (aiScoreText: string): number => {
  const match = aiScoreText.match(/\d+(?:\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : 0;
};

const getRiskFromScore = (score: number): CourseRiskLevel => {
  if (score >= 8) return "safe";
  if (score >= 6.5) return "medium";
  return "high";
};

const getRiskCardStyles = (riskLevel: CourseRiskLevel) => {
  if (riskLevel === "high") {
    return {
      container: "bg-red-50 border-red-300",
      tag: "bg-red-500 text-white",
      score: "text-red-700",
      button: "bg-red-600 hover:bg-red-700",
    };
  }

  if (riskLevel === "medium") {
    return {
      container: "bg-yellow-50 border-yellow-300",
      tag: "bg-yellow-400 text-yellow-900",
      score: "text-yellow-700",
      button: "bg-yellow-600 hover:bg-yellow-700",
    };
  }

  return {
    container: "bg-green-50 border-green-300",
    tag: "bg-green-500 text-white",
    score: "text-green-700",
    button: "bg-green-600 hover:bg-green-700",
  };
};

const getBadgeClassesByIndicator = (indicator: RiskIndicator): string => {
  if (indicator === "critical" || indicator === "high") {
    return "bg-red-100 text-red-800";
  }
  if (indicator === "medium") {
    return "bg-yellow-100 text-yellow-800";
  }
  return "bg-green-100 text-green-800";
};

export default function AcademicPlanningDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation("student");
  const [currentGpaData, setCurrentGpaData] = useState<GPACalculationResult | null>(null);
  const [projectedGpaData, setProjectedGpaData] = useState<GPACalculationResult | null>(null);
  const [predictedGpaData, setPredictedGpaData] = useState<PredictedGPAResult | null>(null);
  const [semesterPlanData, setSemesterPlanData] = useState<SemesterPlanGrouped | null>(null);
  const [physicalEdGpaData, setPhysicalEdGpaData] = useState<PhysicalEducationGPAResult | null>(null);
  const [isLoadingGPA, setIsLoadingGPA] = useState<boolean>(false);
  const [isLoadingSemesterPlan, setIsLoadingSemesterPlan] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setIsLoadingGPA(true);
        setIsLoadingSemesterPlan(true);

        if (!isAuthenticated || !user) {
          toast.error(t("planning.toastLoginRequired"), { id: "not-authenticated" });
          navigate("/login");
          return;
        }

        const accountId = user.account_id || user.id;
        if (!accountId) {
          toast.error(t("planning.toastAccountIdMissing"), { id: "account-id-missing" });
          return;
        }

        const p1 = getStudentGPA(accountId);
        const p2 = getProjectedGPA(accountId);
        const p3 = getPredictedGPA(accountId);
        const p4 = getPhysicalEducationGPA(accountId);
        const p5 = getSemesterPlan(accountId);
        const [r1, r2, r3, r4, r5] = await Promise.allSettled([p1, p2, p3, p4, p5]);

        if (!active) return;
        if (r1.status === "fulfilled") setCurrentGpaData(r1.value as GPACalculationResult);
        if (r2.status === "fulfilled") setProjectedGpaData(r2.value as GPACalculationResult);
        if (r3.status === "fulfilled") setPredictedGpaData(r3.value as PredictedGPAResult);
        if (r4.status === "fulfilled") setPhysicalEdGpaData(r4.value as PhysicalEducationGPAResult);
        if (r5.status === "fulfilled") setSemesterPlanData(r5.value as SemesterPlanGrouped);
      } catch {
        toast.error(t("planning.toastGpaFetchError"), { id: "gpa-fetch-error" });
      } finally {
        if (!active) return;
        setIsLoadingGPA(false);
        setIsLoadingSemesterPlan(false);
      }
    };

    if (isAuthenticated) run();
    return () => {
      active = false;
    };
  }, [isAuthenticated, user, navigate, t]);

  const TOTAL_CREDITS_FOR_GRADUATION = 144;

  const currentProgress = useMemo(
    () => ({
      percentage: currentGpaData
        ? (currentGpaData.completedCredits / TOTAL_CREDITS_FOR_GRADUATION) * 100
        : 72.5,
      creditsCompleted: currentGpaData?.completedCredits || 87,
      totalCredits: TOTAL_CREDITS_FOR_GRADUATION,
    }),
    [currentGpaData],
  );

  const graduationProgress = useMemo(
    () => ({
      percentage: projectedGpaData
        ? (projectedGpaData.totalCredits / TOTAL_CREDITS_FOR_GRADUATION) * 100
        : 72.5,
      creditsCompleted: projectedGpaData?.totalCredits || 87,
      totalCredits: TOTAL_CREDITS_FOR_GRADUATION,
      major: projectedGpaData?.major || t("planning.defaultMajorName"),
    }),
    [projectedGpaData, t],
  );

  const currentGPA = useMemo(
    () => ({
      value: currentGpaData?.currentGPA || 3.67,
      change:
        currentGpaData?.gpaChange !== undefined
          ? `${currentGpaData.gpaChange >= 0 ? "+" : ""}${currentGpaData.gpaChange.toFixed(2)} ${t("planning.fromLastSemester")}`
          : `+0.12 ${t("planning.fromLastSemester")}`,
    }),
    [currentGpaData, t],
  );

  const remainingCredits = useMemo(
    () => ({
      value: projectedGpaData ? TOTAL_CREDITS_FOR_GRADUATION - projectedGpaData.totalCredits : 33,
      totalCredits: TOTAL_CREDITS_FOR_GRADUATION,
    }),
    [projectedGpaData],
  );

  const aiScore = useMemo(
    () => ({
      value: predictedGpaData ? predictedGpaData.predictedGPA.toFixed(2) : "8.40",
      description:
        predictedGpaData && currentGpaData
          ? t("planning.predictedDeltaText", {
              delta: `${predictedGpaData.predictedGPA >= (currentGpaData?.currentGPA || 0) ? "+" : ""}${(
                predictedGpaData.predictedGPA - (currentGpaData?.currentGPA || 0)
              ).toFixed(2)}`,
              with: predictedGpaData.plannedCoursesWithPrediction,
              total: predictedGpaData.plannedCourses,
            })
          : predictedGpaData
            ? t("planning.coursesPredicted", {
                with: predictedGpaData.plannedCoursesWithPrediction,
                total: predictedGpaData.plannedCourses,
              })
            : t("planning.excellentOutlook"),
    }),
    [predictedGpaData, currentGpaData, t],
  );

  const physicalEducationGPA = useMemo(
    () => ({
      value: physicalEdGpaData ? physicalEdGpaData.averageGPA10.toFixed(1) : "0.0",
      isPassing: physicalEdGpaData?.isPassing || false,
      isEligible: physicalEdGpaData?.isEligible || false,
      totalCourses: physicalEdGpaData?.totalCourses || 0,
      description: physicalEdGpaData
        ? `${physicalEdGpaData.totalCourses}/3 ${t("planning.courses")} • ${physicalEdGpaData.isEligible ? t("planning.eligible") : t("planning.inProgress")}`
        : t("planning.noData"),
    }),
    [physicalEdGpaData, t],
  );

  const planningRisk = useMemo<PlanningRiskState>(() => {
    const predicted = predictedGpaData?.predictedGPA;
    if (predicted === undefined || Number.isNaN(predicted)) {
      return {
        level: "medium",
        title: "medium",
        next: "medium",
        midterm: "medium",
      };
    }

    if (predicted < 6.5) {
      return {
        level: "high",
        title: "high",
        next: "medium",
        midterm: "critical",
      };
    }

    if (predicted < 7.5) {
      return {
        level: "medium",
        title: "medium",
        next: "medium",
        midterm: "high",
      };
    }

    return {
      level: "low",
      title: "low",
      next: "low",
      midterm: "medium",
    };
  }, [predictedGpaData]);

  const planningRiskUi = useMemo(() => {
    if (planningRisk.level === "high") {
      return {
        banner: "bg-red-50 border-red-500",
        icon: "text-red-500",
        title: "text-red-900",
        subtitle: "text-red-700",
        heading: t("planning.riskBanner.highTitle"),
        body: t("planning.riskBanner.highBody"),
      };
    }

    if (planningRisk.level === "medium") {
      return {
        banner: "bg-yellow-50 border-yellow-500",
        icon: "text-yellow-500",
        title: "text-yellow-900",
        subtitle: "text-yellow-700",
        heading: t("planning.riskBanner.mediumTitle"),
        body: t("planning.riskBanner.mediumBody"),
      };
    }

    return {
      banner: "bg-green-50 border-green-500",
      icon: "text-green-500",
      title: "text-green-900",
      subtitle: "text-green-700",
      heading: t("planning.riskBanner.lowTitle"),
      body: t("planning.riskBanner.lowBody"),
    };
  }, [planningRisk.level, t]);

  const scenarioData = useMemo(() => {
    const predicted = predictedGpaData?.predictedGPA ?? 8.4;
    const clamp = (value: number) => Math.max(0, Math.min(10, value)).toFixed(1);

    return [
      { label: t("planning.scenario.studyIncrease"), gpa: clamp(predicted + 0.3) },
      { label: t("planning.scenario.workDecrease"), gpa: clamp(predicted + 0.5) },
      { label: t("planning.scenario.optimizeCore"), gpa: clamp(predicted + 0.4) },
    ];
  }, [predictedGpaData, t]);

  const studyHours = semesterPlanData?.student_info.study_time_hours || 10;

  const translateSeason = (season: string) => {
    const s = (season || "").toLowerCase();
    if (s.includes("fall")) return t("planning.seasonFall");
    if (s.includes("spring")) return t("planning.seasonSpring");
    if (s.includes("summer")) return t("planning.seasonSummer");
    if (s.includes("winter")) return t("planning.seasonWinter");
    return season;
  };

  const StatCard = ({
    icon,
    value,
    subtitle,
    additional,
    colorScheme,
    isLoading,
    tooltip,
  }: {
    icon: ReactNode;
    value: string;
    subtitle: string;
    additional?: string;
    colorScheme: "blue"| "green"| "purple"| "orange";
    isLoading?: boolean;
    tooltip?: string;
  }) => {
    const colorClasses = {
      blue: {
        border: "border-blue-200",
        iconBg: "bg-blue-500",
        badge: "bg-blue-200 text-blue-800",
        valueText: "text-blue-600",
        subtitleText: "text-blue-700",
        additionalText: "text-blue-600",
      },
      green: {
        border: "border-green-200",
        iconBg: "bg-green-500",
        badge: "bg-green-200 text-green-800",
        valueText: "text-green-600",
        subtitleText: "text-green-700",
        additionalText: "text-green-600",
      },
      purple: {
        border: "border-purple-200",
        iconBg: "bg-purple-500",
        badge: "bg-purple-200 text-purple-800",
        valueText: "text-purple-600",
        subtitleText: "text-purple-700",
        additionalText: "text-purple-600",
      },
      orange: {
        border: "border-orange-200",
        iconBg: "bg-orange-500",
        badge: "bg-orange-200 text-orange-800",
        valueText: "text-orange-600",
        subtitleText: "text-orange-700",
        additionalText: "text-orange-600",
      },
    };

    const colors = colorClasses[colorScheme];

    return (
      <Card className={`${colors.border} border relative group cursor-help rounded-xl shadow-sm`} title={tooltip}>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className={`${colors.iconBg} p-2 rounded-lg text-white`}>{icon}</div>
                {colorScheme !== "blue" && (
                  <div className={`${colors.badge} px-3 py-1 rounded-full text-xs font-medium`}>
                    {colorScheme === "green"
                      ? t("planning.badgeCurrent")
                      : colorScheme === "purple"
                        ? t("planning.badgeRemaining")
                        : t("planning.badgePredicted")}
                  </div>
                )}
              </div>

              <div className={`text-3xl font-bold ${colors.valueText} mb-1`}>{value}</div>
              <div className={`text-sm ${colors.subtitleText} mb-2`}>{subtitle}</div>

              {additional && (
                <div className={`text-xs ${colors.additionalText} flex items-center gap-1`}>
                  <TrendUpIcon />
                  {additional}
                </div>)}
            </>)}
        </CardContent>

        {tooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out group-hover:scale-105 z-20 pointer-events-none">
            <div className="relative bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-400 rounded-lg shadow-2xl p-4 transform rotate-[-0.5deg]">
              <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-200 opacity-50 rounded-bl-3xl"></div>

              <div className="relative text-gray-800 text-sm leading-relaxed font-medium">{tooltip}</div>

              <div className="absolute -top-2 left-8 w-16 h-6 bg-yellow-300 opacity-40 transform rotate-[-5deg] rounded-sm"></div>

              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-yellow-100"></div>
              </div>
            </div>
          </div>)}
      </Card>);
  };

  const SemesterCourseCard = ({ course }: { course: SemesterCourse }) => {
    const isCurrentSemester = course.status === "current";
    const scoreValue = parseAiScore(course.aiScore);
    const riskLevel = getRiskFromScore(scoreValue);
    const riskStyles = getRiskCardStyles(riskLevel);

    const handleLearnClick = () => {
      navigate("/student/course-overview");
    };

    const riskTagLabel =
      riskLevel === "high"
        ? t("planning.riskTag.high")
        : riskLevel === "medium"
          ? t("planning.riskTag.medium")
          : t("planning.riskTag.safe");

    const actionLabel = isCurrentSemester
      ? riskLevel === "high"
        ? t("planning.courseAction.urgent")
        : riskLevel === "medium"
          ? t("planning.courseAction.intervention")
          : t("planning.courseAction.maintain")
      : t("planning.courseAction.simulate");

    const projectedRiskText =
      riskLevel === "high"
        ? t("planning.riskIndicator.high")
        : riskLevel === "medium"
          ? t("planning.riskIndicator.medium")
          : t("planning.riskIndicator.low");

    return (
      <Card
        className={`border rounded-xl shadow-sm relative overflow-hidden ${
          isCurrentSemester ? riskStyles.container : "bg-white border-gray-200"
        }`}
      >
        <CardContent className="p-4">
          {isCurrentSemester && (
            <div className={`absolute top-0 right-0 ${riskStyles.tag} text-[10px] font-bold px-2 py-1 rounded-bl-xl`}>
              {riskTagLabel}
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{course.code}</h4>
            <span
              className={`px-2 py-1 rounded text-xs text-gray-600 ${
                isCurrentSemester ? "mt-3 bg-white border border-gray-200" : "bg-gray-100"
              }`}
            >
              {course.credits} {t("planning.creditsLabel")}
            </span>
          </div>

          <p
            className="text-gray-700 text-sm mb-3 min-h-[2.5rem] leading-5"
            title={course.title}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {course.title}
          </p>

          <div className="flex items-center justify-between mb-3">
            {course.schedule ? (
              <span className="text-xs text-gray-600">{course.schedule}</span>
            ) : (
              <span className="text-xs text-gray-400">{t("planning.tbd")}</span>
            )}

            {isCurrentSemester ? (
              <span className={`text-xs font-bold ${riskStyles.score}`}>
                {t("planning.aiScoreLabel", { score: course.aiScore })}
              </span>
            ) : (
              <span className="text-xs text-gray-600 font-medium">
                {t("planning.projectedRiskLabel")} {" "}
                <span
                  className={
                    riskLevel === "high"
                      ? "text-red-600"
                      : riskLevel === "medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                  }
                >
                  {projectedRiskText}
                </span>
              </span>
            )}
          </div>

          {isCurrentSemester ? (
            <Button className={`w-full ${riskStyles.button} text-white text-xs h-8`} size="sm" onClick={handleLearnClick}>
              {actionLabel}
            </Button>
          ) : (
            <Button variant="secondary" className="w-full text-xs h-8 text-gray-700" size="sm" onClick={handleLearnClick}>
              {actionLabel}
            </Button>
          )}
        </CardContent>
      </Card>);
  };

  const SemesterSection = ({ semester }: { semester: SemesterData }) => {
    const isCurrentSemester = semester.status === "current";
    const iconBg = isCurrentSemester ? "bg-blue-600" : "bg-gray-600";
    const badgeColor = isCurrentSemester ? "bg-blue-100 text-blue-800" : "bg-gray-200 text-gray-800";
    const semesterTitle = `${translateSeason(semester.season)} ${semester.year} ${
      isCurrentSemester ? t("planning.semesterTitle.current") : t("planning.semesterTitle.planned")
    }`;

    return (
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 mb-6 rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className={`${iconBg} p-3 rounded-xl text-white text-xl flex items-center justify-center w-12 h-12 shadow-sm`}>
                {isCurrentSemester ? <CalendarIcon /> : "🔮"}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{semesterTitle}</h3>
                <p className="text-sm text-gray-600">
                  {isCurrentSemester ? t("planning.currentSemester") : t("planning.planned")} • {semester.workingHours}{" "}
                  {t("planning.hoursPerWeekWorking")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`${badgeColor} px-3 py-1 rounded-full text-xs font-medium`}>
                {isCurrentSemester ? t("planning.inProgress") : t("planning.simulated")}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {semester.totalCredits} {t("planning.creditsLabel")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {semester.courses.map((course, index) => (
              <SemesterCourseCard key={`${course.code}-${index}`} course={course} />
            ))}
          </div>
        </CardContent>
      </Card>);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#363636",
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
          success: {
            style: {
              background: "#10B981",
              color: "#ffffff",
            },
          },
          error: {
            style: {
              background: "#EF4444",
              color: "#ffffff",
            },
          },
        }}
      />

      <Header />

      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/student/adjust-parameters")}
                className="bg-gray-600 hover:bg-gray-700 text-white px-5 text-sm"
              >
                {t("planning.back")}
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("planning.title")}</h1>
                <p className="text-gray-600">{t("planning.subtitle")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-green-50 px-4 py-2 rounded-full flex items-center gap-2 border border-green-200">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 text-sm font-medium">{t("planning.planGenerated")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-green-200 border rounded-xl shadow-sm">
              <CardContent className="p-6">
                {isLoadingGPA ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t("planning.loadingData")}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-500 p-3 rounded-xl text-white">
                          <GraduationCapIcon />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-green-900">{t("planning.currentProgress")}</h3>
                          <p className="text-sm text-green-700">{currentGpaData?.major || t("planning.majorFallback")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{currentProgress.percentage.toFixed(1)}%</div>
                        <div className="text-sm text-green-700">{t("planning.complete")}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-800">{t("planning.creditsCompleted")}</span>
                        <span className="text-green-900">
                          {currentProgress.creditsCompleted} / {currentProgress.totalCredits}
                        </span>
                      </div>

                      <div className="w-full bg-green-100 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all duration-700"
                          style={{ width: `${currentProgress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </>)}
              </CardContent>
            </Card>

            <Card className="border-blue-200 border rounded-xl shadow-sm">
              <CardContent className="p-6">
                {isLoadingGPA ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t("planning.loadingData")}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-500 p-3 rounded-xl text-white">
                          <GraduationCapIcon />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-blue-900">{t("planning.projectedProgress")}</h3>
                          <p className="text-sm text-blue-700">{graduationProgress.major}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{graduationProgress.percentage.toFixed(1)}%</div>
                        <div className="text-sm text-blue-700">{t("planning.complete")}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-800">{t("planning.totalCreditsWithPrediction")}</span>
                        <span className="text-blue-900">
                          {graduationProgress.creditsCompleted} / {graduationProgress.totalCredits}
                        </span>
                      </div>

                      <div className="w-full bg-blue-100 rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all duration-700"
                          style={{ width: `${graduationProgress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </>)}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
              icon={<GPAIcon />}
              value={currentGPA.value.toString()}
              subtitle={t("planning.cumulativeGPA")}
              additional={currentGPA.change}
              colorScheme="green"
              isLoading={isLoadingGPA}
              tooltip={`GPA hiện tại của bạn là ${currentGPA.value.toString()}! ${
                currentGPA.value >= 3.6
                  ? "🌟 Xuất sắc! Bạn đang là học sinh xuất sắc!"
                  : currentGPA.value >= 3.2
                    ? "Danh Hiệu giỏi! Tiếp tục phát huy!"
                    : currentGPA.value >= 2.5
                      ? "💪 Khá! Cố gắng hơn nữa nhé!"
                      : "Hãy cố gắng học tập chăm chỉ hơn!"
              } Hãy duy trì và nâng cao thành tích học tập của mình nhé!`}
            />

            <StatCard
              icon={<CreditsIcon />}
              value={`${remainingCredits.value}/${remainingCredits.totalCredits}`}
              subtitle={t("planning.creditsToGraduatePrediction")}
              colorScheme="purple"
              isLoading={isLoadingGPA}
              tooltip={`Bạn còn ${remainingCredits.value} tín chỉ nữa là ra trường! 🎓 ${
                remainingCredits.value <= 20
                  ? "Sắp đến đích rồi!"
                  : remainingCredits.value <= 40
                    ? "Đã đi được hơn nửa chặng đường!"
                    : "Hành trình còn dài, hãy kiên trì!"
              } Cố lên, thành công đang ở phía trước!`}
            />

            <StatCard
              icon={<BrainIcon />}
              value={aiScore.value}
              subtitle={t("planning.predictedGPA")}
              additional={aiScore.description}
              colorScheme="orange"isLoading={isLoadingGPA}
              tooltip="Dự đoán GPA chỉ là mô phỏng dựa trên dữ liệu và mô hình AI! Kết quả thực tế có thể khác nhau tùy thuộc vào nỗ lực của bạn. Cố lên học cùng mình nhé, bạn có thể làm được tốt hơn con số này! "/>

            <Card
              className="border-blue-200 border relative group cursor-help rounded-xl shadow-sm"
              title="Điểm Giáo dục thể chất rất quan trọng cho sức khỏe của bạn!"
            >
              <CardContent className="p-6">
                {isLoadingGPA ? (
                  <div className="text-center py-4">
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-blue-500 p-2 rounded-lg text-white">
                        <GPAIcon />
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          physicalEducationGPA.isPassing
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-red-100 text-red-800 border border-red-300"
                        }`}
                      >
                        {physicalEducationGPA.isPassing
                          ? `✓ ${t("planning.passLabel")}`
                          : `✗ ${t("planning.failLabel")}`}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <div className="text-3xl font-bold text-blue-600">{physicalEducationGPA.value}</div>
                      <div className="text-sm text-blue-500">/10</div>
                    </div>
                    <div className="text-sm text-blue-700 mb-2">{t("planning.physicalEducationGPA")}</div>
                    {physicalEducationGPA.description && (
                      <div className="text-xs text-blue-600 flex items-center gap-1">
                        <TrendUpIcon />
                        {physicalEducationGPA.description}
                      </div>)}
                  </>)}
              </CardContent>

              {!isLoadingGPA && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out group-hover:scale-105 z-20 pointer-events-none">
                  <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-400 rounded-lg shadow-2xl p-4 transform rotate-[0.5deg]">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-200 opacity-50 rounded-bl-3xl"></div>

                    <div className="relative text-gray-800 text-sm leading-relaxed font-medium">
                      {`⚽ Điểm Giáo dục thể chất của bạn là ${physicalEducationGPA.value}/10! ${
                        physicalEducationGPA.isPassing ? "Bạn đã đạt yêu cầu!" : "⚠️ Cần cải thiện!"
                      } Cố lên vận động thể thao nhiều hơn nhé! 🏃‍♂️ Thể dục thể thao không chỉ giúp rèn luyện thân thể mà còn giúp tinh thần minh mẫn hơn đấy! 💪🧠`}
                    </div>

                    <div className="absolute -top-2 left-8 w-16 h-6 bg-blue-300 opacity-40 transform rotate-[-5deg] rounded-sm"></div>

                    <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                      <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-blue-100"></div>
                    </div>
                  </div>
                </div>)}
            </Card>
          </div>
        </div>

        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="bg-blue-50 border-b-2 border-blue-500 py-4 px-8 text-center">
              <span className="text-blue-600 font-medium">{t("planning.semesterPlan")}</span>
            </div>
          </div>

          <CardContent className="p-8">
            {isLoadingSemesterPlan ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{t("planning.loadingSemesterPlan")}</p>
              </div>
            ) : semesterPlanData && semesterPlanData.semesters.length > 0 ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("planning.recommendedSemesterPlan")}</h2>
                  <p className="text-gray-600">
                    {t("planning.recommendedSubtitle", {
                      hours: semesterPlanData.student_info.study_time_hours || "N/A",
                    })}
                  </p>
                </div>

                <div className={`border-l-4 rounded-r-xl p-4 mb-8 shadow-sm flex items-start gap-3 ${planningRiskUi.banner}`}>
                  <div className={`text-xl mt-0.5 ${planningRiskUi.icon}`}>⚠️</div>
                  <div>
                    <h3 className={`font-bold text-sm ${planningRiskUi.title}`}>{planningRiskUi.heading}</h3>
                    <p className={`text-sm mt-1 ${planningRiskUi.subtitle}`}>{planningRiskUi.body}</p>
                  </div>
                </div>

                <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("planning.strategy.title")}</h2>
                    <p className="text-gray-500 text-sm">
                      {t("planning.strategy.subtitle", { hours: studyHours })}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-full flex items-center gap-2">
                    <span className="text-blue-500">🎯</span>
                    <span className="text-blue-800 text-sm font-medium">
                      {t("planning.strategy.predictionConfidence")} <strong>{predictedGpaData ? "82%" : t("planning.notAvailable")}</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-gray-500">⏳</span>
                      <h3 className="font-bold text-gray-900 text-sm">{t("planning.strategy.riskTimeline")}</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{t("planning.strategy.currentStatus")}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getBadgeClassesByIndicator(planningRisk.title)}`}>
                          {t(`planning.riskIndicator.${planningRisk.title}`)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{t("planning.strategy.next4Weeks")}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getBadgeClassesByIndicator(planningRisk.next)}`}>
                          {t(`planning.riskIndicator.${planningRisk.next}`)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{t("planning.strategy.midtermProjection")}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getBadgeClassesByIndicator(planningRisk.midterm)}`}>
                          {t(`planning.riskIndicator.${planningRisk.midterm}`)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-gray-500">🔍</span>
                      <h3 className="font-bold text-gray-900 text-sm">{t("planning.strategy.whyTitle")}</h3>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-red-500 mt-0.5">•</span>
                        {planningRisk.level === "high"
                          ? t("planning.strategy.whyLowCoreScores")
                          : t("planning.strategy.whyHeavyCoreLoad")}
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        {t("planning.strategy.whyStudyTime", { hours: studyHours })}
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-red-500 mt-0.5">•</span>
                        {t("planning.strategy.whyRemainingCredits", { credits: remainingCredits.value })}
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-gray-500">💡</span>
                      <h3 className="font-bold text-gray-900 text-sm">{t("planning.strategy.suggestedActions")}</h3>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-0.5">✓</span>
                        {t("planning.strategy.actionPrioritizeCore")}
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-0.5">✓</span>
                        {t("planning.strategy.actionIncreaseStudy")}
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-0.5">✓</span>
                        {t("planning.strategy.actionBalanceCourses")}
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-gray-500">🎛️</span>
                      <h3 className="font-bold text-gray-900 text-sm">{t("planning.scenario.title")}</h3>
                    </div>
                    <div className="space-y-2">
                      {scenarioData.map((scenario) => (
                        <button
                          key={scenario.label}
                          type="button"
                          className="w-full flex justify-between items-center p-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded transition-colors text-left group"
                        >
                          <span className="text-xs text-gray-600 group-hover:text-blue-700">{scenario.label}</span>
                          <span className="text-xs font-bold text-green-600">{t("planning.scenario.gpaUp", { gpa: scenario.gpa })}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {semesterPlanData.semesters.map((semester, index) => (
                    <SemesterSection
                      key={`${semester.season}-${semester.year}-${index}`}
                      semester={{
                        season: semester.season,
                        year: semester.year,
                        status: index === 0 ? "current": "planned",
                        workingHours: semesterPlanData.student_info.study_time_hours || 10,
                        totalCredits: semester.total_credits,
                        courses: semester.courses.map((course) => ({
                          code: course.course_code,
                          title: course.course_name,
                          credits: course.credits_unit,
                          schedule: "",
                          aiScore: `${course.predicted_gpa.toFixed(1)}/10`,
                          type: "core" as const,
                          status: index === 0 ? ("current" as const) : ("planned" as const),
                        })),
                      }}
                    />
                  ))}
                </div>
              </>) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-2">{t("planning.noSemesterPlan")}</p>
                <p className="text-sm text-gray-500">{t("planning.noSemesterPlanHint")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
