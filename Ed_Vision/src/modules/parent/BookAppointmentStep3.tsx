import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/parent/Parent_card"
import { Button } from "@/components/ui/parent/Parent_button"
import { Input } from "@/components/ui/parent/Parent_Input"
import { Select } from "@/components/ui/parent/Parent_Select"
import { Textarea } from "@/components/ui/parent/Parent_Textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/parent/Parent_RadioGroup"
import AppointmentHeader from "@/components/ui/parent/Parent_AppointmentHeader"
import ProgressStepper from "@/components/ui/parent/ProgressStepper"
import ContinueButton from "@/components/ui/parent/Parent_ContinueButton"

// Import SVG assets
import iconEducation from "@/assets/parent/iconEducation.svg"
import iconInfo from "@/assets/parent/iconInfo.svg"
import iconArrowLeft from "@/assets/parent/iconArrowLeft.svg"

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
      <AppointmentHeader onClose={onClose} />

      {/* Progress Stepper */}
      <ProgressStepper currentStep={3} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-16">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-8 space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900">Meeting Details</h2>
              <p className="text-gray-600">Please provide additional information about your meeting</p>
            </div>

            {/* Selection Summary */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <h3 className="text-base font-medium text-blue-900">Your Selection Summary</h3>
              <div className="flex gap-4">
                <div className="flex-1 space-y-0.5">
                  <div className="text-sm font-medium text-blue-700">Meeting Type:</div>
                  <div className="text-sm text-blue-800">In-Person Meeting</div>
                  <div className="text-xs text-blue-600">30-60 minutes • School premises • Mr. Tuan (adviser)</div>
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="text-sm font-medium text-blue-700">Date & Time:</div>
                  <div className="text-sm text-blue-800">Sunday, Dec 15, 2024 at 10:00 AM</div>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img src={iconEducation} alt="" className="w-6 h-6 mr-3" />
                  <h3 className="text-base font-semibold text-green-900">Student Information</h3>
                </div>
                <div className="bg-green-100 px-2.5 py-0.5 rounded-full">
                  <span className="text-xs font-medium text-green-800">Auto-populated from Database</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-green-200 rounded-lg p-4 min-h-[120px] relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Student Name</span>
                    <span className="text-gray-400 text-base">🔒</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">Emma Thompson</div>
                  <div className="text-xs text-green-600">✓ Verified from student records</div>
                </div>
                
                <div className="bg-white border border-green-200 rounded-lg p-4 min-h-[120px] relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Student Grade/Class</span>
                    <span className="text-gray-400 text-base">🔒</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">Grade 7B</div>
                  <div className="text-sm text-gray-600 mb-1">Mathematics Class</div>
                  <div className="text-xs text-green-600">✓ Current enrollment verified</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <img src={iconInfo} alt="" className="w-3 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm font-bold text-blue-800 leading-5">
                    <p className="mb-1">Note: Student information is automatically retrieved from the school database. If any details appear</p>
                    <p>incorrect, please contact the school administration to update student records.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Meeting Purpose */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Meeting Purpose *</label>
                <Select 
                  value={formData.meetingPurpose}
                  onChange={(e) => handleInputChange('meetingPurpose', e.target.value)}
                  required
                >
                  <option value="">Select meeting purpose</option>
                  <option value="academic">Academic Performance</option>
                  <option value="behavior">Behavioral Concerns</option>
                  <option value="general">General Discussion</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              {/* Parent/Guardian Information */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">Parent/Guardian Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 w-full max-w-sm">
                    <label className="text-sm font-medium text-gray-700">Your Name *</label>
                    <Input
                      placeholder="Enter your full name"
                      value={formData.parentName}
                      onChange={(e) => handleInputChange('parentName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2 w-full max-w-sm">
                    <label className="text-sm font-medium text-gray-700">Relationship to Student *</label>
                    <Select
                      value={formData.relationshipToStudent}
                      onChange={(e) => handleInputChange('relationshipToStudent', e.target.value)}
                      required
                    >
                      <option value="">Select relationship</option>
                      <option value="mother">Mother</option>
                      <option value="father">Father</option>
                      <option value="guardian">Guardian</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">Contact Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 w-full max-w-sm">
                    <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2 w-full max-w-sm">
                    <label className="text-sm font-medium text-gray-700">Email Address *</label>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.emailAddress}
                      onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Additional Notes or Specific Topics</label>
                <Textarea
                  placeholder="Please describe any specific topics you'd like to discuss or additional information the lecturer should know..."
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  rows={4}
                />
                <p className="text-sm text-gray-500">Optional - This helps the lecturer prepare for your meeting</p>
              </div>

              {/* Communication Preferences */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Preferred Communication Method for Reminders</label>
                <RadioGroup value={formData.communicationMethod} onValueChange={(value) => handleInputChange('communicationMethod', value)}>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value="email" 
                      id="email"
                      checked={formData.communicationMethod === 'email'}
                      onChange={(e) => handleInputChange('communicationMethod', e.target.value)}
                    />
                    <label htmlFor="email" className="text-gray-700">Email notifications</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value="sms" 
                      id="sms"
                      checked={formData.communicationMethod === 'sms'}
                      onChange={(e) => handleInputChange('communicationMethod', e.target.value)}
                    />
                    <label htmlFor="sms" className="text-gray-700">SMS text messages</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value="both" 
                      id="both"
                      checked={formData.communicationMethod === 'both'}
                      onChange={(e) => handleInputChange('communicationMethod', e.target.value)}
                    />
                    <label htmlFor="both" className="text-gray-700">Both email and SMS</label>
                  </div>
                </RadioGroup>
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
              Back to Date & Time
            </Button>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleSaveDraft} className="text-gray-600">
                Save as Draft
              </Button>
              <ContinueButton onClick={handleContinue}>
                Continue to Review
              </ContinueButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}