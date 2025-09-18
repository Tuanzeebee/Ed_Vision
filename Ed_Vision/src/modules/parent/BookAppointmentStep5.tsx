import { useState } from "react"
import { Card, CardContent } from "@/components/ui/parent/Parent_card"
import { Button } from "@/components/ui/parent/Parent_button"

// Import generated SVG assets for the component
import iconCheck from "@/assets/parent/iconCheckBig.svg"
import iconClose from "@/assets/parent/iconCloseBig.svg"
import iconCheckCircle from "@/assets/parent/iconCheckCircle.svg"
import iconCalendar from "@/assets/parent/iconCalendarStep5.svg"
import iconLocation from "@/assets/parent/iconLocationstep5.svg"
import iconUser from "@/assets/parent/iconUserstep5.svg"
import iconPatient from "@/assets/parent/iconPatient.svg"
import iconDashboard from "@/assets/parent/iconDashboard.svg"
import iconPhone from "@/assets/parent/iconPhonestep5.svg"
import iconEmail from "@/assets/parent/iconEmail.svg"

type AppointmentData = {
  date: string
  time: string
  location: string
  meetingType: string
  doctor: string
  specialization: string
  purpose: string
  patientName: string
  confirmationNumber: string
}

type Props = {
  onBackToDashboard?: () => void
  onCallSupport?: () => void
  onEmailSupport?: () => void
  appointmentData?: AppointmentData
}

export default function BookAppointmentStep5({ 
  onBackToDashboard,
  onCallSupport,
  onEmailSupport,
  appointmentData = {
    date: "Monday, January 22, 2024",
    time: "2:30 PM - 3:30 PM",
    location: "Medical Center, Suite 305",
    meetingType: "In-Person Consultation",
    doctor: "Dr. Sarah Johnson (Cardiologist)",
    specialization: "General Health Consultation",
    purpose: "General Health Consultation",
    patientName: "Michael Davis",
    confirmationNumber: "#MED-2024-0122-047"
  }
}: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopyConfirmation = async () => {
    try {
      await navigator.clipboard.writeText(appointmentData.confirmationNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy confirmation number:', err)
    }
  }

  return (
    <div className="bg-green-50 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-green-600 rounded-lg p-2 mr-3">
                <img src={iconCheck} alt="" className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Appointment Confirmed</h1>
            </div>
            <Button variant="ghost" size="sm">
              <img src={iconClose} alt="" className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl space-y-12">
          
          {/* Success Message */}
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="bg-green-100 rounded-full p-6">
                <img src={iconCheckCircle} alt="" className="w-12 h-12" />
              </div>
            </div>
            
            {/* Success Text */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">
                Appointment Successfully Confirmed!
              </h2>
              <div className="text-lg text-gray-600 max-w-2xl mx-auto leading-7">
                <p>Your consultation with Dr. Sarah Johnson has been scheduled and confirmed.</p>
                <p>You will receive confirmation details via email and SMS shortly.</p>
              </div>
            </div>
          </div>

          {/* Appointment Details Card */}
          <Card className="bg-white rounded-xl border border-gray-200 shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Appointment Details</h3>
                  <div className="bg-green-100 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-green-800">Confirmed</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Date & Time */}
                    <div className="flex items-start">
                      <img src={iconCalendar} alt="" className="w-5 h-5 mt-1 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{appointmentData.date}</p>
                        <p className="text-gray-600">{appointmentData.time}</p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start">
                      <img src={iconLocation} alt="" className="w-5 h-5 mt-1 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{appointmentData.location}</p>
                        <p className="text-gray-600">{appointmentData.meetingType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Doctor */}
                    <div className="flex items-start">
                      <img src={iconUser} alt="" className="w-5 h-5 mt-1 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{appointmentData.doctor}</p>
                        <p className="text-gray-600">{appointmentData.purpose}</p>
                      </div>
                    </div>

                    {/* Patient */}
                    <div className="flex items-start">
                      <img src={iconPatient} alt="" className="w-5 h-5 mt-1 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{appointmentData.patientName}</p>
                        <p className="text-gray-600">Patient</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirmation Number */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Confirmation Number</p>
                        <p className="text-lg font-semibold text-gray-900">{appointmentData.confirmationNumber}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyConfirmation}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center">
            <Button
              onClick={onBackToDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              <img src={iconDashboard} alt="" className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Support Section */}
          <div className="text-center space-y-4">
            <p className="text-gray-600">Need help or have questions about your appointment?</p>
            <div className="flex items-center justify-center space-x-6">
              <Button
                variant="ghost"
                onClick={onCallSupport}
                className="text-blue-600 hover:text-blue-700 flex items-center"
              >
                <img src={iconPhone} alt="" className="w-4 h-4 mr-2" />
                Call (555) 987-6543
              </Button>
              <Button
                variant="ghost"
                onClick={onEmailSupport}
                className="text-blue-600 hover:text-blue-700 flex items-center"
              >
                <img src={iconEmail} alt="" className="w-4 h-4 mr-2" />
                Email Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}