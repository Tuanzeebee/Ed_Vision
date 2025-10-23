import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/parent/Parent_card"
import { Button } from "@/components/ui/parent/Parent_button"
import { Input } from "@/components/ui/parent/Parent_Input"
import { Select } from "@/components/ui/parent/Parent_Select"
import AppointmentHeader from "@/components/ui/parent/Parent_AppointmentHeader"
import ProgressStepper from "@/components/ui/parent/Parent_ProgressStepper"
import ContinueButton from "@/components/ui/parent/Parent_ContinueButton"

// Import SVG assets
import iconEducation from "@/assets/parent/iconUserstep5.svg"
import iconArrowLeft from "@/assets/parent/iconArrowLeft.svg"
import Header from "../../components/layout/Header"
type FormData = {
  meetingPurpose: string
  parentName: string
  relationshipToStudent: string
  phoneNumber: string
  emailAddress: string
  additionalNotes: string
  communicationMethod: string
}

type Props = {
  onBack?: () => void
  onContinue?: (data: FormData) => void
  onSaveDraft?: (data: FormData) => void
  onClose?: () => void
}

export default function BookAppointmentStep3({ onBack, onContinue, onSaveDraft, onClose }: Props) {
  const { t } = useTranslation(['parent', 'common'])
  const [formData, setFormData] = useState<FormData>({
    meetingPurpose: "",
    parentName: "",
    relationshipToStudent: "",
    phoneNumber: "",
    emailAddress: "",
    additionalNotes: "",
    communicationMethod: "email"
  })

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onContinue?.(formData)
  }

  const handleSaveDraft = () => {
    onSaveDraft?.(formData)
  }

  const handleContinue = () => {
    onContinue?.(formData)
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <Header />
      <AppointmentHeader onClose={onClose} />

      {/* Progress Stepper */}
      <ProgressStepper currentStep={3} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-16">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-8 space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900">{t('parent:bookAppointment.step3.title')}</h2>
              <p className="text-gray-600">{t('parent:bookAppointment.step3.subtitle')}</p>
            </div>

            {/* Selection Summary */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <h3 className="text-base font-medium text-blue-900">{t('parent:bookAppointment.step3.selectionSummary')}</h3>
              <div className="flex gap-4">
                <div className="flex-1 space-y-0.5">
                  <div className="text font-medium text-blue-700">{t('parent:bookAppointment.step3.meetingType')}</div>
                  <div className="text text-blue-800">{t('parent:bookAppointment.step2.meetingConfirmation')}</div>
                  <div className="text text-blue-600">{t('parent:bookAppointment.step2.meetingDetails', { duration: '30-60 minutes', location: 'School premises', adviser: 'Mr. Tuan (adviser)' })}</div>
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="text font-medium text-blue-700">{t('parent:bookAppointment.step3.dateTime')}</div>
                  <div className="text text-blue-800">{t('parent:bookAppointment.step2.selectedTimeDisplay', { dayOfWeek: 'Sunday', month: 'Dec', day: 15, year: 2024, time: '10:00 AM' })}</div>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img src={iconEducation} alt="" className="w-6 h-6 mr-3" />
                  <h3 className="text-base font-semibold text-green-900">{t('parent:bookAppointment.step3.studentInformation')}</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-green-200 rounded-lg p-4 min-h-[120px] relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">{t('parent:bookAppointment.step3.studentName')}</span>
                    <span className="text-gray-400 text-base">🔒</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">Emma Thompson</div>
                  <div className="text-xs text-green-600">{t('parent:bookAppointment.step3.verifiedFromRecords')}</div>
                </div>
                
                <div className="bg-white border border-green-200 rounded-lg p-4 min-h-[120px] relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">{t('parent:bookAppointment.step3.studentGrade')}</span>
                    <span className="text-gray-400 text-base">🔒</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">Grade K28 CMU TPM 5</div>
                  <div className="text-sm text-gray-600 mb-1">Mathematics Class</div>
                  <div className="text-xs text-green-600">{t('parent:bookAppointment.step3.enrollmentVerified')}</div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Parent/Guardian Information */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">{t('parent:bookAppointment.step3.parentGuardianInfo')}</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 w-full max-w-sm">
                    <label className="text-sm font-medium text-gray-700">{t('parent:bookAppointment.step3.yourName')} {t('parent:bookAppointment.step3.required')}</label>
                    <Input
                      placeholder={t('parent:bookAppointment.step3.yourNamePlaceholder')}
                      value={formData.parentName}
                      onChange={(e) => handleInputChange('parentName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2 w-full max-w-sm">
                    <label className="text-sm font-medium text-gray-700">{t('parent:bookAppointment.step3.relationshipToStudent')} {t('parent:bookAppointment.step3.required')}</label>
                    <Select
                      value={formData.relationshipToStudent}
                      onChange={(e) => handleInputChange('relationshipToStudent', e.target.value)}
                      required
                    >
                      <option value="">{t('parent:bookAppointment.step3.selectRelationship')}</option>
                      <option value="mother">{t('parent:bookAppointment.step3.mother')}</option>
                      <option value="father">{t('parent:bookAppointment.step3.father')}</option>
                      <option value="guardian">{t('parent:bookAppointment.step3.guardian')}</option>
                      <option value="other">{t('parent:bookAppointment.step3.other')}</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">{t('parent:bookAppointment.step3.contactInformation')}</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 w-full max-w-sm">
                    <label className="text-sm font-medium text-gray-700">{t('parent:bookAppointment.step3.phoneNumber')} {t('parent:bookAppointment.step3.required')}</label>
                    <Input
                      type="tel"
                      placeholder={t('parent:bookAppointment.step3.phoneNumberPlaceholder')}
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2 w-full max-w-sm">
                    <label className="text-sm font-medium text-gray-700">{t('parent:bookAppointment.step3.emailAddress')} {t('parent:bookAppointment.step3.required')}</label>
                    <Input
                      type="email"
                      placeholder={t('parent:bookAppointment.step3.emailAddressPlaceholder')}
                      value={formData.emailAddress}
                      onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-72 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="flex items-center text-gray-600"
            >
              <img src={iconArrowLeft} alt="" className="w-5 h-5 mr-2" />
              {t('parent:bookAppointment.step3.backToDateTime')}
            </Button>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleSaveDraft} className="text-gray-600">
                {t('parent:bookAppointment.step3.saveAsDraft')}
              </Button>
              <ContinueButton onClick={handleContinue}>
                {t('parent:bookAppointment.step3.continueToReview')}
              </ContinueButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}