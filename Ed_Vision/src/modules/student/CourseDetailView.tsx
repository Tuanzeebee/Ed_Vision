import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Import the professor image asset
import iconInstructions from "@/assets/student/iconInstructions.svg"
type Props = {};

interface LearningModule {
  id: number;
  title: string;
  status: "completed" | "in-progress" | "locked";
  progress: number;
  duration: string;
  activities: string[];
}

interface Assignment {
  title: string;
  description: string;
  dueDate: string;
  daysLeft: number;
  points: number;
  status: "in-progress" | "submitted" | "graded";
}

interface QuickAction {
  icon: string;
  label: string;
  variant: "primary" | "secondary";
}

interface Deadline {
  title: string;
  daysLeft: number;
  priority: "high" | "medium" | "low";
}

interface StudyResource {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
}

export default function CourseDetailView({}: Props) {
  // Sample data based on the Figma design
  const courseInfo = {
    code: "CS 301",
    title: "Data Structures",
    term: "Fall 2024",
    credits: 3,
    schedule: "Mon/Wed/Fri 10:00-11:00 AM"
  };

  const courseStats = {
    successPrediction: 95,
    modulesComplete: "12/16",
    predictionScore: 92
  };

  const courseDescription = "This course covers fundamental data structures including arrays, linked lists, stacks, queues, trees, and graphs. Students will learn to analyze algorithmic complexity and implement efficient data structures in various programming languages.";

  const learningModules: LearningModule[] = [
    {
      id: 1,
      title: "Module 1: Arrays & Dynamic Arrays",
      status: "completed",
      progress: 100,
      duration: "2 hours",
      activities: ["Video Lecture", "Practice Problems", "Quiz"]
    },
    {
      id: 2,
      title: "Module 2: Linked Lists",
      status: "completed",
      progress: 95,
      duration: "3 hours",
      activities: ["Video Lecture", "Coding Exercise", "Assignment"]
    },
    {
      id: 3,
      title: "Module 3: Stacks & Queues",
      status: "in-progress",
      progress: 60,
      duration: "2.5 hours",
      activities: ["Video Lecture", "Interactive Demo", "Lab Exercise"]
    },
    {
      id: 4,
      title: "Module 4: Trees & Binary Search Trees",
      status: "locked",
      progress: 0,
      duration: "Unlocks Nov 15",
      activities: ["Video Lecture", "Visualization Tool", "Project"]
    }
  ];

  const currentAssignment: Assignment = {
    title: "Assignment 3: Stack Implementation",
    description: "Implement a stack data structure with push, pop, and peek operations",
    dueDate: "Nov 20, 2024",
    daysLeft: 5,
    points: 25,
    status: "in-progress"
  };

  const quickActions: QuickAction[] = [
    { icon: "🎮", label: "Gamified Learning Path", variant: "primary" },
    { icon: "📅", label: "View Schedule", variant: "secondary" },
    { icon: "👥", label: "Study Group", variant: "secondary" },
    { icon: "❓", label: "Get Help", variant: "secondary" }
  ];

  const upcomingDeadlines: Deadline[] = [
    { title: "Assignment 3", daysLeft: 5, priority: "high" },
    { title: "Quiz 4: Trees", daysLeft: 8, priority: "medium" },
    { title: "Midterm Exam", daysLeft: 12, priority: "low" }
  ];

  const studyResources: StudyResource[] = [
    { title: "Textbook: Chapter 3", description: "Stacks and Queues", icon: "📖", iconColor: "text-blue-600" },
    { title: "Video Tutorial", description: "Stack Implementation", icon: "🎥", iconColor: "text-purple-600" },
    { title: "Code Examples", description: "GitHub Repository", icon: "💻", iconColor: "text-green-600" },
    { title: "Discussion Forum", description: "Ask questions & help others", icon: "💬", iconColor: "text-orange-600" }
  ];

  const instructor = {
    name: "Dr. Sarah Johnson",
    title: "Computer Science Professor",
    email: "sarah.johnson@university.edu",
    officeHours: "Tue/Thu 2-4 PM",
    office: "CS Building 204",
    avatar: iconInstructions
  };

  const ModuleCard = ({ module }: { module: LearningModule }) => {
    const getStatusIcon = (status: string) => {
      switch (status) {
        case "completed": return "✅";
        case "in-progress": return "▶️";
        case "locked": return "🔒";
        default: return "📝";
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "completed": return "bg-green-100 border-green-200";
        case "in-progress": return "bg-blue-50 border-blue-200";
        case "locked": return "bg-gray-100 border-gray-200 opacity-75";
        default: return "bg-gray-100 border-gray-200";
      }
    };

    const getProgressColor = (status: string) => {
      switch (status) {
        case "completed": return "bg-green-100 text-green-800";
        case "in-progress": return "bg-blue-100 text-blue-800";
        case "locked": return "bg-gray-100 text-gray-600";
        default: return "bg-gray-100 text-gray-600";
      }
    };

    const getActivityColor = (status: string, isFirst: boolean) => {
      if (status === "completed") return "bg-gray-100 text-gray-700";
      if (status === "in-progress" && isFirst) return "bg-blue-100 text-blue-700";
      if (status === "locked") return "bg-gray-100 text-gray-500";
      return "bg-gray-100 text-gray-700";
    };

    return (
      <Card className={`${getStatusColor(module.status)} border p-4`}>
        <CardContent className="p-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${module.status === "completed" ? "bg-green-100" : module.status === "in-progress" ? "bg-blue-100" : "bg-gray-100"}`}>
                <span className="text-lg">{getStatusIcon(module.status)}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{module.title}</h3>
                <p className="text-sm text-gray-600">
                  {module.status === "completed" ? "Completed" : 
                   module.status === "in-progress" ? "In Progress" : "Locked"} • {module.duration}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getProgressColor(module.status)}`}>
              {module.progress}%
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            {module.activities.map((activity, index) => (
              <span 
                key={index}
                className={`px-2 py-1 rounded text-xs ${getActivityColor(module.status, index === 0)}`}
              >
                {activity}
              </span>
            ))}
          </div>

          {module.status === "in-progress" ? (
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Continue Learning →
            </Button>
          ) : module.status === "completed" ? (
            <button className="w-full text-blue-600 text-sm font-medium hover:text-blue-700">
              Review Module →
            </button>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-red-400";
      case "medium": return "border-yellow-400";
      case "low": return "border-blue-400";
      default: return "border-gray-400";
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-20 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900">
                <span className="text-lg">←</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {courseInfo.code} - {courseInfo.title}
                </h1>
                <p className="text-gray-600">
                  {courseInfo.term} • {courseInfo.credits} Credits • {courseInfo.schedule}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                <span>🔖</span>
                Bookmark
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                <span>📤</span>
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Left Column */}
        <div className="flex-1 space-y-6">
          {/* Course Overview */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Course Overview</h2>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{courseStats.successPrediction}%</div>
                  <div className="text-sm text-gray-600">Success Prediction</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{courseStats.modulesComplete}</div>
                  <div className="text-sm text-gray-600">Modules Complete</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{courseStats.predictionScore}</div>
                  <div className="text-sm text-gray-600">Prediction Score</div>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed">{courseDescription}</p>
            </CardContent>
          </Card>

          {/* Learning Modules */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Learning Modules</h2>
              
              <div className="space-y-4">
                {learningModules.map((module) => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Assignment */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Current Assignment</h2>
              
              <Card className="bg-orange-50 border-orange-200 border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{currentAssignment.title}</h3>
                      <p className="text-gray-600 mb-2">{currentAssignment.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>📅 Due: {currentAssignment.dueDate}</span>
                        <span>⏱️ {currentAssignment.daysLeft} days left</span>
                        <span>🏆 {currentAssignment.points} points</span>
                      </div>
                    </div>
                    <div className="bg-orange-100 px-3 py-1 rounded-full text-sm font-medium text-orange-800">
                      In Progress
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2">
                      <span>💻</span>
                      Open in IDE
                    </Button>
                    <Button className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2">
                      <span>⬇️</span>
                      Download Starter Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    className={`w-full justify-start gap-3 ${
                      action.variant === "primary" 
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span>{action.icon}</span>
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming Deadlines</h3>
              
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className={`border-l-4 ${getPriorityColor(deadline.priority)} pl-4 py-2`}>
                    <div className="font-medium text-gray-900">{deadline.title}</div>
                    <div className="text-sm text-gray-600">Due in {deadline.daysLeft} days</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Study Resources */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Study Resources</h3>
              
              <div className="space-y-3">
                {studyResources.map((resource, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg ${resource.iconColor}`}>{resource.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{resource.title}</div>
                        <div className="text-sm text-gray-600">{resource.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Instructor */}
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Instructor</h3>
              
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={instructor.avatar} 
                  alt={instructor.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-gray-900">{instructor.name}</div>
                  <div className="text-sm text-gray-600">{instructor.title}</div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <span>📧</span>
                  {instructor.email}
                </div>
                <div className="flex items-center gap-2">
                  <span>🕐</span>
                  Office Hours: {instructor.officeHours}
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  Room: {instructor.office}
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Send Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}