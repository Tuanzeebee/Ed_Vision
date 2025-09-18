import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import BookAppointmentStepWrapper from "@/modules/parent/BookAppointmentStepWrapper";
import ParentDashboard from "@/modules/parent/ParentDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect từ /book-appointment đến step 1 */}
        <Route 
          path="/book-appointment" 
          element={<Navigate to="/book-appointment/step/1" replace />}
        />
        
        {/* Route cho các step cụ thể với URL parameter */}
        <Route 
          path="/book-appointment/step/:stepNumber" 
          element={<BookAppointmentStepWrapper />}
        />
        
        {/* Route cho dashboard */}
        <Route path="/" element={<ParentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App
