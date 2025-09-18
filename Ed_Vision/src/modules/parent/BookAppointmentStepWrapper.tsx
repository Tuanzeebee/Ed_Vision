import { useParams, useNavigate } from "react-router-dom";
import BookAppointmentFlow from "./BookAppointmentFlow";

// Component wrapper để extract step number từ URL
export default function BookAppointmentStepWrapper() {
  const { stepNumber } = useParams<{ stepNumber: string }>();
  const navigate = useNavigate();
  const step = stepNumber ? parseInt(stepNumber, 10) : 1;
  
  const handleAppointmentComplete = (data: any) => {
    console.log('Appointment completed:', data)
    // Điều hướng về parent dashboard sau khi hoàn thành appointment
    navigate('/parent/dashboard')
  }

  const handleAppointmentCancel = () => {
    console.log('Appointment cancelled')
    // Điều hướng về parent dashboard khi hủy appointment
    navigate('/parent/dashboard')
  }

  return (
    <BookAppointmentFlow 
      onComplete={handleAppointmentComplete}
      onCancel={handleAppointmentCancel}
      initialStep={step}
    />
  );
}