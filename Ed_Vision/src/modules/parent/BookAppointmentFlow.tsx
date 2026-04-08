import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import BookAppointmentStep1 from "./BookAppointmentStep1"
import BookAppointmentStep2 from "./BookAppointmentStep2" 
import BookAppointmentStep3 from "./BookAppointmentStep3"
import BookAppointmentStep4 from "./BookAppointmentStep4"
import BookAppointmentStep5 from "./BookAppointmentStep5"

type MeetingType = "in-person" | "video-call" | "phone-call"

type FormData = {
  meetingPurpose: string
  parentName: string
  relationshipToStudent: string
  phoneNumber: string
  emailAddress: string
  additionalNotes: string
  communicationMethod: string
}

type AppointmentFlowData = {
  // Step 1 data
  meetingType: MeetingType
  
  // Step 2 data (có thể được cập nhật từ component)
  selectedDate: string
  selectedTime: string
  
  // Step 3 data
  formData: FormData
  
  // Step 4 data (confirmation)
  confirmed: boolean
  
  // Step 5 data (result)
  confirmationNumber: string
}

type Props = {
  onComplete?: (data: AppointmentFlowData) => void
  onCancel?: () => void
  initialStep?: number
}

export default function BookAppointmentFlow({ 
  onComplete, 
  onCancel,
  initialStep = 1 
}: Props) {
  const { t } = useTranslation(['parent', 'common'])
  const navigate = useNavigate()
  const location = useLocation()
  
  // Extract current step from URL if available
  const getCurrentStepFromURL = () => {
    const pathParts = location.pathname.split('/')
    const stepIndex = pathParts.findIndex(part => part === 'step')
    if (stepIndex !== -1 && pathParts[stepIndex + 1]) {
      const stepNumber = parseInt(pathParts[stepIndex + 1], 10)
      return !isNaN(stepNumber) ? stepNumber : initialStep
    }
    return initialStep
  }

  const [currentStep, setCurrentStep] = useState(getCurrentStepFromURL)
  
  // Update URL when step changes
  const updateStep = (step: number) => {
    setCurrentStep(step)
    if (location.pathname.includes('/step/')) {
      navigate(`/parent/book-appointment/step/${step}`, { replace: true })
    }
  }

  // Sync with URL changes and redirect if needed
  useEffect(() => {
    const stepFromURL = getCurrentStepFromURL()
    if (stepFromURL !== currentStep) {
      setCurrentStep(stepFromURL)
    }
    
    // If URL doesn't have step parameter, redirect to step 1
    if (location.pathname === '/parent/book-appointment') {
      navigate('/parent/book-appointment/step/1', { replace: true })
    }
  }, [location.pathname, currentStep, navigate])

  const [flowData, setFlowData] = useState<AppointmentFlowData>({
    meetingType: "in-person",
    selectedDate: "Sunday, December 15, 2024",
    selectedTime: "10:00 AM",
    formData: {
      meetingPurpose: "",
      parentName: "",
      relationshipToStudent: "",
      phoneNumber: "",
      emailAddress: "",
      additionalNotes: "",
      communicationMethod: "email"
    },
    confirmed: false,
    confirmationNumber: ""
  })

  // Step 1: Meeting Type Selection
  const handleStep1Continue = (selectedType: MeetingType) => {
    setFlowData(prev => ({ ...prev, meetingType: selectedType }))
    updateStep(2)
  }

  // Step 2: Date & Time Selection
  const handleStep2Continue = () => {
    // Dữ liệu date/time đã được set mặc định, có thể cập nhật từ component nếu cần
    updateStep(3)
  }

  // Step 3: Details Form
  const handleStep3Continue = (formData: FormData) => {
    setFlowData(prev => ({ ...prev, formData }))
    updateStep(4)
  }

  // Step 3: Save Draft
  const handleStep3SaveDraft = (formData: FormData) => {
    setFlowData(prev => ({ ...prev, formData }))
    // Có thể thêm logic lưu draft vào localStorage
    localStorage.setItem('appointmentDraft', JSON.stringify({
      ...flowData,
      formData
    }))
    alert(t('parent:bookAppointment.draftSaved'))
  }

  // Step 4: Confirmation
  const handleStep4Confirm = () => {
    // Generate confirmation number
    const confirmationNumber = `#APT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    
    setFlowData(prev => ({ 
      ...prev, 
      confirmed: true,
      confirmationNumber 
    }))
    updateStep(5)
  }

  // Step 4: Save Draft
  const handleStep4SaveDraft = () => {
    localStorage.setItem('appointmentDraft', JSON.stringify(flowData))
    alert(t('parent:bookAppointment.draftSaved'))
  }

  // Navigation functions
  const goBack = () => {
    if (currentStep > 1) {
      updateStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    onCancel?.()
  }

  // Step 5: Complete flow
  const handleFlowComplete = () => {
    onComplete?.(flowData)
  }

  // Support functions for Step 5
  const handleCallSupport = () => {
    window.open('tel:+15559876543')
  }

  const handleEmailSupport = () => {
    window.open(`mailto:support@university.edu?subject=${t('parent:bookAppointment.supportEmail.subject')}`)
  }

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BookAppointmentStep1
            onContinue={handleStep1Continue}
            onBack={currentStep > 1 ? goBack : undefined}
            onClose={handleClose}
          />
        )
      
      case 2:
        return (
          <BookAppointmentStep2
            onContinue={handleStep2Continue}
            onBack={goBack}
            onClose={handleClose}
          />
        )
      
      case 3:
        return (
          <BookAppointmentStep3
            onContinue={handleStep3Continue}
            onSaveDraft={handleStep3SaveDraft}
            onBack={goBack}
            onClose={handleClose}
          />
        )
      
      case 4:
        return (
          <BookAppointmentStep4
            onConfirm={handleStep4Confirm}
            onSaveDraft={handleStep4SaveDraft}
            onBack={goBack}
            onClose={handleClose}
            appointmentData={{
              meetingType: flowData.meetingType === "in-person" ? t('parent:bookAppointment.meetingTypes.inPerson') : 
                          flowData.meetingType === "video-call" ? t('parent:bookAppointment.meetingTypes.videoCall') : t('parent:bookAppointment.meetingTypes.phoneCall'),
              lecturer: "Mr. Tuan (Mathematics Adviser)",
              dateTime: `${flowData.selectedDate} at ${flowData.selectedTime}`,
              purpose: flowData.formData.meetingPurpose || "General Discussion",
              studentName: "Emma Thompson",
              gradeClass: "Grade K28 CMU TPM 5",
              parentName: flowData.formData.parentName,
              relationship: flowData.formData.relationshipToStudent,
              phoneNumber: flowData.formData.phoneNumber,
              emailAddress: flowData.formData.emailAddress,
              additionalNotes: flowData.formData.additionalNotes,
              communicationPreference: flowData.formData.communicationMethod === "email" ? t('parent:bookAppointment.communications.email') :
                                      flowData.formData.communicationMethod === "sms" ? t('parent:bookAppointment.communications.sms') :
                                      t('parent:bookAppointment.communications.both')
            }}
          />
        )
      
      case 5:
        return (
          <BookAppointmentStep5
            onBackToDashboard={handleFlowComplete}
            onCallSupport={handleCallSupport}
            onEmailSupport={handleEmailSupport}
            appointmentData={{
              date: flowData.selectedDate,
              time: `${flowData.selectedTime} - ${getEndTime(flowData.selectedTime)}`,
              location: flowData.meetingType === "in-person" ? t('parent:bookAppointment.locations.schoolPremises') :
                       flowData.meetingType === "video-call" ? t('parent:bookAppointment.locations.videoCallLink') :
                       t('parent:bookAppointment.locations.phoneCall'),
              meetingType: flowData.meetingType === "in-person" ? t('parent:bookAppointment.meetingTypes.inPerson') : 
                          flowData.meetingType === "video-call" ? t('parent:bookAppointment.meetingTypes.videoCall') : t('parent:bookAppointment.meetingTypes.phoneCall'),
              doctor: "Mr. Tuan (Mathematics Adviser)",
              specialization: "Mathematics Department",
              purpose: flowData.formData.meetingPurpose || "General Discussion",
              patientName: "Emma Thompson",
              confirmationNumber: flowData.confirmationNumber
            }}
          />
        )
      
      default:
        return <div>{t('parent:bookAppointment.invalidStep')}</div>
    }
  }

  // Helper function to calculate end time
  const getEndTime = (startTime: string): string => {
    const [time, period] = startTime.split(' ')
    const [hours, minutes] = time.split(':').map(Number)
    
    let endHours = hours + 1 // Add 1 hour
    let endPeriod = period
    
    if (endHours === 12 && period === 'AM') {
      endPeriod = 'PM'
    } else if (endHours === 13 && period === 'PM') {
      endHours = 1
    } else if (endHours > 12) {
      endHours -= 12
    }
    
    return `${endHours}:${minutes.toString().padStart(2, '0')} ${endPeriod}`
  }

  return (
    <div className="appointment-flow">
      {renderCurrentStep()}
    </div>
  )
}