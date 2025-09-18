import { useParams } from "react-router-dom";
import BookAppointmentFlow from "./BookAppointmentFlow";

// Component wrapper để extract step number từ URL
export default function BookAppointmentStepWrapper() {
  const { stepNumber } = useParams<{ stepNumber: string }>();
  const step = stepNumber ? parseInt(stepNumber, 10) : 1;
  
  const handleAppointmentComplete = (data: any) => {
    console.log('Appointment completed:', data)
    alert('Appointment booked successfully!')
    // Có thể thêm logic redirect về dashboard hoặc success page
  }

  const handleAppointmentCancel = () => {
    console.log('Appointment cancelled')
    // Có thể thêm logic redirect về dashboard hoặc previous page
  }

  return (
    <BookAppointmentFlow 
      onComplete={handleAppointmentComplete}
      onCancel={handleAppointmentCancel}
      initialStep={step}
    />
  );
}