import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import BookAppointmentStepWrapper from "@/modules/parent/BookAppointmentStepWrapper";
import ParentDashboard from "@/modules/parent/ParentDashboard";
import AllAppointments from "@/modules/parent/Parent_View_All_Appointments";
import StudentDetails from "@/modules/parent/Parent_StudentDetails";
import AccountManagement from "./modules/admin/AccountManagement";
import StudentManagementDashboard from "./modules/admin/StudentManagementDashboard";
import AdminOverviewDashboard from "./modules/admin/AdminOverviewDashboard";
import StudentDetail from "./modules/admin/StudentDetail";
import TeacherManagementDashboard from "./modules/admin/TeacherManagementDashboard";
import TeacherDetailProfile from "./modules/admin/TeacherDetailProfile";
import TeacherSubjects from "./modules/admin/TeacherSubjects";
import TeacherRatings from "./modules/admin/TeacherRatings";
import TeacherPerformance from "./modules/admin/TeacherPerformance";
import TeacherSchedule from "./modules/admin/TeacherSchedule";
import TeacherSupportHistory from "./modules/admin/TeacherSupportHistory";
import QuestionManagement from "./modules/admin/QuestionManagement";
import AddQuestion from "./modules/admin/AddQuestion";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect từ /book-appointment đến step 1 */}
        <Route 
          path="/parent/book-appointment" 
          element={<Navigate to="/parent/book-appointment/step/1" replace />}
        />
        
        {/* Route cho các step cụ thể với URL parameter */}
        <Route 
          path="/parent/book-appointment/step/:stepNumber" 
          element={<BookAppointmentStepWrapper />}
        />
        
        {/* Route cho dashboard */}
        <Route path="/parent/dashboard" element={<ParentDashboard />} />
        <Route path="/admin/dashboard" element={<AdminOverviewDashboard />} />
        <Route path="/admin/overview" element={<AdminOverviewDashboard />} />
        <Route path="/admin/student-management" element={<StudentManagementDashboard />} />
        <Route path="/admin/students" element={<StudentManagementDashboard />} />
        <Route path="/admin/students/:studentId" element={<StudentDetail />} />
        
        {/* Route cho quản lý giáo viên và khảo sát */}
        <Route path="/admin/teachers" element={<TeacherManagementDashboard />} />
        <Route path="/admin/teachers/:teacherId" element={<TeacherDetailProfile />} />
        <Route path="/admin/teachers/:teacherId/subjects" element={<TeacherSubjects />} />
        <Route path="/admin/teachers/:teacherId/ratings" element={<TeacherRatings />} />
        <Route path="/admin/teachers/:teacherId/performance" element={<TeacherPerformance />} />
        <Route path="/admin/teachers/:teacherId/schedule" element={<TeacherSchedule />} />
        <Route path="/admin/teachers/:teacherId/support-history" element={<TeacherSupportHistory />} />
        <Route path="/admin/classes" element={<QuestionManagement />} />
        <Route path="/admin/questions" element={<QuestionManagement />} />
        <Route path="/admin/questions/add" element={<AddQuestion />} />
        
        {/* Route cho báo cáo và phân tích */}
        <Route path="/admin/reports/learning" element={<div className="p-6"><h1 className="text-2xl font-bold">Báo cáo Học tập</h1><p>Trang này đang phát triển...</p></div>} />
        <Route path="/admin/analytics/performance" element={<div className="p-6"><h1 className="text-2xl font-bold">Phân tích Hiệu suất</h1><p>Trang này đang phát triển...</p></div>} />
        <Route path="/admin/ai-insights" element={<div className="p-6"><h1 className="text-2xl font-bold">AI Insights</h1><p>Trang này đang phát triển...</p></div>} />
        
        {/* Route cho quản lý hệ thống */}
        <Route path="/admin/notifications" element={<div className="p-6"><h1 className="text-2xl font-bold">Quản lý Thông báo</h1><p>Trang này đang phát triển...</p></div>} />
        <Route path="/admin/content-approval" element={<div className="p-6"><h1 className="text-2xl font-bold">Phê duyệt Nội dung</h1><p>Trang này đang phát triển...</p></div>} />
        <Route path="/admin/permissions" element={<div className="p-6"><h1 className="text-2xl font-bold">Phân quyền</h1><p>Trang này đang phát triển...</p></div>} />
        
        {/* Route cho all appointments */}
        <Route path="/parent/appointments" element={<AllAppointments />} />
        
        {/* Route cho account management */}
        <Route path="/admin/account-management" element={<AccountManagement />} />
        <Route path="/admin/users" element={<AccountManagement />} />
        
        {/* Route cho student details */}
        <Route path="/parent/student-details" element={<StudentDetails />} />
        
        {/* Route mặc định */}
        <Route path="/" element={<Navigate to="/admin/overview" replace />} />
      </Routes>
    </Router>
  );
}

export default App
