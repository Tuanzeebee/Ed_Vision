import { useState } from "react"
import { Card } from "@/components/ui/parent/Parent_card"
import { Button } from "@/components/ui/parent/Parent_button"
import AppointmentHeader from "@/components/ui/parent/Parent_AppointmentHeader"
import ProgressStepper from "@/components/ui/parent/Parent_ProgressStepper"
import ConfirmButton from "@/components/ui/parent/Parent_ConfirmButton"

// Import generated SVG assets for the component
import iconCalendar from "@/assets/parent/iconCalendar1.svg"
import iconPeople from "@/assets/parent/iconPeople1.svg"
import iconUser from "@/assets/parent/iconUser.svg"
import iconWarning from "@/assets/parent/iconWarning1.svg"
import iconArrowLeft from "@/assets/parent/iconArrowLeft1.svg"
import Header from "../../components/layout/Header"
type AppointmentData = {
  meetingType: string
  lecturer: string
  dateTime: string
  purpose: string
  studentName: string
  gradeClass: string
  parentName: string
  relationship: string
  phoneNumber: string
  emailAddress: string
  additionalNotes: string
  communicationPreference: string
}

type Props = {
  onBack?: () => void
  onSaveDraft?: () => void
  onConfirm?: () => void
  onClose?: () => void
  appointmentData?: AppointmentData
}

export default function BookAppointmentStep4({ 
  onBack, 
  onSaveDraft, 
  onConfirm,
  onClose,
  appointmentData = {
    meetingType: "In-Person Meeting",
    lecturer: "Mr. Tuan (Mathematics Adviser)",
    dateTime: "Sunday, December 15, 2024",
    purpose: "Academic Progress Discussion",
    studentName: "Emma Thompson",
    gradeClass: "Grade 7B - Mathematics Class",
    parentName: "Sarah Thompson",
    relationship: "Mother",
    phoneNumber: "+1 (555) 123-4567",
    emailAddress: "sarah.thompson@email.com",
    additionalNotes: "I would like to discuss Emma's recent math test performance and explore additional support options for homework. She seems to be struggling with algebra concepts and I want to understand how we can help her improve.",
    communicationPreference: "Both email and SMS"
  }
}: Props) {
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleConfirm = () => {
    if (agreedToTerms && onConfirm) {
      onConfirm()
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <Header />
      <AppointmentHeader onClose={onClose} />

      {/* Progress Stepper */}
      <ProgressStepper currentStep={4} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Confirm Your Appointment</h2>
              <p className="text-gray-600">Please review all details before confirming your meeting</p>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {/* Meeting Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <img src={iconCalendar} alt="" className="w-6 h-6 mr-3" />
                    <h3 className="text-lg font-semibold text-blue-900">Meeting Information</h3>
                  </div>
                  <Button variant="ghost" className="text-blue-600 text-sm">Edit</Button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-blue-700 mb-1">Meeting Type</p>
                      <p className="text-base font-semibold text-blue-900">{appointmentData.meetingType}</p>
                      <p className="text-sm text-blue-600">30-60 minutes • School premises</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-1">Date & Time</p>
                      <p className="text-base font-semibold text-blue-900">{appointmentData.dateTime}</p>
                      <p className="text-sm text-blue-600">10:00 AM - 11:00 AM</p>
                    </div>
                  </div>
                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-blue-700 mb-1">Lecturer</p>
                      <p className="text-base font-semibold text-blue-900">{appointmentData.lecturer}</p>
                      <p className="text-sm text-blue-600">Room 204, Mathematics Department</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-1">Meeting Purpose</p>
                      <p className="text-base font-semibold text-blue-900">{appointmentData.purpose}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <img src={iconPeople} alt="" className="w-6 h-6 mr-3" />
                    <h3 className="text-lg font-semibold text-green-900">Student Information</h3>
                  </div>
                  <div className="bg-green-100 px-3 py-1 rounded-full">
                    <span className="text-xs font-medium text-green-800">Verified</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Student Name</p>
                    <p className="text-base font-semibold text-green-900">{appointmentData.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Grade/Class</p>
                    <p className="text-base font-semibold text-green-900">{appointmentData.gradeClass}</p>
                  </div>
                </div>
              </div>

              {/* Parent/Guardian Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <img src={iconUser} alt="" className="w-6 h-6 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Parent/Guardian Information</h3>
                  </div>
                  <Button variant="ghost" className="text-gray-600 text-sm">Edit</Button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Name</p>
                      <p className="text-base font-semibold text-gray-900">{appointmentData.parentName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Phone Number</p>
                      <p className="text-base font-semibold text-gray-900">{appointmentData.phoneNumber}</p>
                    </div>
                  </div>
                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Relationship</p>
                      <p className="text-base font-semibold text-gray-900">{appointmentData.relationship}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Email Address</p>
                      <p className="text-base font-semibold text-gray-900">{appointmentData.emailAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Reminders */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <img src={iconWarning} alt="" className="w-5 h-5 mt-0.5 mr-2" />
                <div>
                  <p className="font-bold text-sm text-red-800 mb-2">Important Reminders:</p>
                  <ul className="space-y-1 text-sm text-red-800">
                    <li>• Please arrive 5 minutes early to allow time for check-in</li>
                    <li>• Bring any relevant documents or homework samples</li>
                    <li>• Cancellations must be made at least 24 hours in advance</li>
                    <li>• You will receive confirmation and reminder notifications</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-3 h-3 rounded border border-gray-400"
                />
                <div className="text-base text-gray-700 leading-6">
                  <p className="mb-2">
                    I confirm that all the information above is correct and I agree to the{" "}
                    <a href="#" className="text-blue-600 underline">meeting policies</a> and{" "}
                    <a href="#" className="text-blue-600 underline">terms of service</a>. I understand the cancellation policy and will arrive on time for my scheduled appointment.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-gray-600"
            >
              <img src={iconArrowLeft} alt="" className="w-5 h-5 mr-2" />
              Back to Details
            </Button>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={onSaveDraft}
                className="text-gray-600"
              >
                Save as Draft
              </Button>
              <ConfirmButton 
                onClick={handleConfirm}
                disabled={!agreedToTerms}
              >
                Confirm Appointment
              </ConfirmButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}