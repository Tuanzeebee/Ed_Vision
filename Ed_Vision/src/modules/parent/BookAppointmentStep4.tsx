import { useState } from "react"
import { useTranslation } from "react-i18next"
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
    gradeClass: "Grade K28 CMU TPM 5",
    parentName: "Sarah Thompson",
    relationship: "Mother",
    phoneNumber: "+1 (555) 123-4567",
    emailAddress: "sarah.thompson@email.com",
    additionalNotes: "I would like to discuss Emma's recent math test performance and explore additional support options for homework. She seems to be struggling with algebra concepts and I want to understand how we can help her improve.",
    communicationPreference: "Both email and SMS"
  }
}: Props) {
  const { t } = useTranslation(['parent', 'common'])
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('parent:bookAppointment.step4.title')}</h2>
              <p className="text-gray-600">{t('parent:bookAppointment.step4.subtitle')}</p>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {/* Meeting Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <img src={iconCalendar} alt="" className="w-6 h-6 mr-3" />
                    <h3 className="text-lg font-semibold text-blue-900">{t('parent:bookAppointment.step4.meetingInformation')}</h3>
                  </div>
                  <Button variant="ghost" className="text-blue-600 text-sm">{t('parent:bookAppointment.step4.edit')}</Button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-blue-700 mb-1">{t('parent:bookAppointment.step4.meetingType')}</p>
                      <p className="text-base font-semibold text-blue-900">{appointmentData.meetingType}</p>
                      <p className="text-sm text-blue-600">{t('parent:bookAppointment.step4.duration')} • {t('parent:bookAppointment.step4.location')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-1">{t('parent:bookAppointment.step4.dateTime')}</p>
                      <p className="text-base font-semibold text-blue-900">{appointmentData.dateTime}</p>
                      <p className="text-sm text-blue-600">{t('parent:bookAppointment.step4.timeSlot')}</p>
                    </div>
                  </div>
                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-blue-700 mb-1">{t('parent:bookAppointment.step4.lecturer')}</p>
                      <p className="text-base font-semibold text-blue-900">{appointmentData.lecturer}</p>
                      <p className="text-sm text-blue-600">{t('parent:bookAppointment.step4.room')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-1">{t('parent:bookAppointment.step4.meetingPurpose')}</p>
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
                    <h3 className="text-lg font-semibold text-green-900">{t('parent:bookAppointment.step4.studentInformation')}</h3>
                  </div>
                  <div className="bg-green-100 px-3 py-1 rounded-full">
                    <span className="text-xs font-medium text-green-800">{t('parent:bookAppointment.step4.verified')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">{t('parent:bookAppointment.step4.studentName')}</p>
                    <p className="text-base font-semibold text-green-900">{appointmentData.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">{t('parent:bookAppointment.step4.gradeClass')}</p>
                    <p className="text-base font-semibold text-green-900">{appointmentData.gradeClass}</p>
                  </div>
                </div>
              </div>

              {/* Parent/Guardian Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <img src={iconUser} alt="" className="w-6 h-6 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">{t('parent:bookAppointment.step4.parentGuardianInformation')}</h3>
                  </div>
                  <Button variant="ghost" className="text-gray-600 text-sm">{t('parent:bookAppointment.step4.edit')}</Button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">{t('parent:bookAppointment.step4.name')}</p>
                      <p className="text-base font-semibold text-gray-900">{appointmentData.parentName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">{t('parent:bookAppointment.step4.phoneNumber')}</p>
                      <p className="text-base font-semibold text-gray-900">{appointmentData.phoneNumber}</p>
                    </div>
                  </div>
                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">{t('parent:bookAppointment.step4.relationship')}</p>
                      <p className="text-base font-semibold text-gray-900">{appointmentData.relationship}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">{t('parent:bookAppointment.step4.emailAddress')}</p>
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
                  <p className="font-bold text-sm text-red-800 mb-2">{t('parent:bookAppointment.step4.importantReminders')}</p>
                  <ul className="space-y-1 text-sm text-red-800">
                    <li>• {t('parent:bookAppointment.step4.reminder1')}</li>
                    <li>• {t('parent:bookAppointment.step4.reminder2')}</li>
                    <li>• {t('parent:bookAppointment.step4.reminder3')}</li>
                    <li>• {t('parent:bookAppointment.step4.reminder4')}</li>
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
                    {t('parent:bookAppointment.step4.termsAgreement')}{" "}
                    <a href="#" className="text-blue-600 underline">{t('parent:bookAppointment.step4.meetingPolicies')}</a> {t('parent:bookAppointment.step4.and')}{" "}
                    <a href="#" className="text-blue-600 underline">{t('parent:bookAppointment.step4.termsOfService')}</a>{t('parent:bookAppointment.step4.termsDescription')}
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
              {t('parent:bookAppointment.step4.backToDetails')}
            </Button>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={onSaveDraft}
                className="text-gray-600"
              >
                {t('parent:bookAppointment.step4.saveAsDraft')}
              </Button>
              <ConfirmButton 
                onClick={handleConfirm}
                disabled={!agreedToTerms}
              >
                {t('parent:bookAppointment.step4.confirmAppointment')}
              </ConfirmButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}