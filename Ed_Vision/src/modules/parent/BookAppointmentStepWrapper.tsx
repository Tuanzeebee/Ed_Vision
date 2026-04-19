import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BookAppointmentFlow from "./BookAppointmentFlow";

// Component wrapper để extract step number từ URL
export default function BookAppointmentStepWrapper() {
  const { t } = useTranslation(['parent', 'common']);
  const { stepNumber } = useParams<{ stepNumber: string }>();
  const navigate = useNavigate();
  const step = stepNumber ? parseInt(stepNumber, 10) : 1;
  
  const handleAppointmentComplete = (data: any) => {
    console.log(t('parent:bookAppointment.consoleMessages.appointmentCompleted'), data)
    // Điều hướng về parent dashboard sau khi hoàn thành appointment
    navigate('/parent/dashboard')
  }

  const handleAppointmentCancel = () => {
    console.log(t('parent:bookAppointment.consoleMessages.appointmentCancelled'))
    // Điều hướng về parent dashboard khi hủy appointment
    navigate('/parent/dashboard')
  }

  return (
    <BookAppointmentFlow 
      onComplete={handleAppointmentComplete}
      onCancel={handleAppointmentCancel}
      initialStep={step}
    />);
}