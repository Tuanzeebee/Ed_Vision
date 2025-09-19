import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "../../components/layout/Header"
import Footer from "../../components/layout/Footer"
import { 
  GraduationCapIcon,
  GPAIcon,
  CreditsIcon,
  AIScoreIcon,
  TrendUpIcon,
  CalendarIcon
} from "@/assets/student/icons";

type Props = {};

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

export default function AcademicPlanningDashboard({}: Props) {
  const [activeTab, setActiveTab] = useState("semester-plan");
  const navigate = useNavigate();

  // Sample data based on the Figma design
  const graduationProgress = {
    percentage: 72.5,
    creditsCompleted: 87,
    totalCredits: 120,
    major: "Computer Science Major",
    expectedGraduation: "Spring 2026"
  };

  const currentGPA = {
    value: 3.67,
    change: "+0.12 this semester"
  };

  const remainingCredits = {
    value: 33,
    semestersLeft: "3 semesters left"
  };

  const aiScore = {
    value: "8.4/9",
    description: "Excellent outlook"
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
    colorScheme 
  }: {
    icon: React.ReactNode;
    value: string;
    subtitle: string;
    additional?: string;
    colorScheme: "blue" | "green" | "purple" | "orange";
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
      <Card className={`${colors.border} border`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`${colors.iconBg} p-2 rounded-lg text-white`}>
              {icon}
            </div>
            {colorScheme !== "blue" && (
              <div className={`${colors.badge} px-3 py-1 rounded-full text-xs font-medium`}>
                {colorScheme === "green" ? "Current" : 
                 colorScheme === "purple" ? "Remaining" : "AI Score"}
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
        </CardContent>
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
              {course.credits} Credits
            </span>
          </div>
          
          <p className="text-gray-700 text-sm mb-3">{course.title}</p>
          
          <div className="flex items-center justify-between mb-3">
            {course.schedule ? (
              <span className="text-xs text-blue-600">{course.schedule}</span>
            ) : (
              <span className={`text-xs ${getTypeColor(course.type)}`}>
                {getTypeLabel(course.type)}
              </span>
            )}
            <span className="text-xs text-orange-600">{course.aiScore}</span>
          </div>
          
          <Button 
            className={`w-full ${buttonColor} text-white text-xs h-8`}
            size="sm"
            onClick={handleLearnClick}
          >
            Learn
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
                  {semester.season} {semester.year}
                </h3>
                <p className={`text-sm ${subtitleColor}`}>
                  {isCurrentSemester ? "Current Semester" : "Planned"} • {semester.workingHours} hrs/week working
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`${badgeColor} px-3 py-1 rounded-full text-xs font-medium`}>
                {isCurrentSemester ? "In Progress" : "Recommended"}
              </span>
              <span className={`text-sm font-medium ${creditsColor}`}>
                {semester.totalCredits} Credits
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
        <Header />
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-28 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Academic Planning Dashboard
              </h1>
              <p className="text-gray-600">
                Your personalized academic roadmap to graduation
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-green-50 px-3 py-1 rounded-full flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-green-600 text-sm font-medium">Plan Generated</span>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-5">
                Export Plan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="col-span-2">
            <Card className="border-blue-200 border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-500 p-3 rounded-xl text-white">
                      <GraduationCapIcon />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-900">Graduation Progress</h3>
                      <p className="text-sm text-blue-700">{graduationProgress.major}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{graduationProgress.percentage}%</div>
                    <div className="text-sm text-blue-700">Complete</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-800">Credits Completed</span>
                    <span className="text-blue-900">{graduationProgress.creditsCompleted} / {graduationProgress.totalCredits}</span>
                  </div>
                  
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full" 
                      style={{ width: `${graduationProgress.percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Expected Graduation</span>
                    <span className="text-blue-900">{graduationProgress.expectedGraduation}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <StatCard
            icon={<GPAIcon />}
            value={currentGPA.value.toString()}
            subtitle="Cumulative GPA"
            additional={currentGPA.change}
            colorScheme="green"
          />

          <StatCard
            icon={<CreditsIcon />}
            value={remainingCredits.value.toString()}
            subtitle="Credits to Graduate"
            additional={remainingCredits.semestersLeft}
            colorScheme="purple"
          />

          <StatCard
            icon={<AIScoreIcon />}
            value={aiScore.value}
            subtitle="Success Prediction"
            additional={aiScore.description}
            colorScheme="orange"
          />
        </div>

        {/* Semester Plan Section */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200">
            <div className="bg-blue-50 border-b-2 border-blue-500 py-4 px-18 text-center">
              <span className="text-blue-600 font-medium">Semester Plan</span>
            </div>
          </div>
          
          <CardContent className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Recommended Semester Plan
              </h2>
              <p className="text-gray-600">
                Based on your working hours, GPA goals, and course prerequisites
              </p>
            </div>

            <div className="space-y-6">
              {semesterData.map((semester) => (
                <SemesterSection key={`${semester.season}-${semester.year}`} semester={semester} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}