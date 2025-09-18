import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import BookAppointmentStepWrapper from "@/modules/parent/BookAppointmentStepWrapper";
import ParentDashboard from "@/modules/parent/ParentDashboard";
import AllAppointments from "@/modules/parent/Parent_View_All_Appointments";
import StudentDetails from "@/modules/parent/Parent_StudentDetails";

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
        
        {/* Route cho all appointments */}
        <Route path="/parent/appointments" element={<AllAppointments />} />
        
        {/* Route cho student details */}
        <Route path="/parent/student-details" element={<StudentDetails />} />
      </Routes>
    </Router>
  );
}

export default App
