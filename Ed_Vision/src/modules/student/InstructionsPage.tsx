import { Card, CardContent } from "@/components/ui/student/Student_card"
import { Button } from "@/components/ui/student/Student_button"
import { useNavigate } from "react-router-dom"
import { useTranslation } from 'react-i18next'
import Header from "../../components/layout/Header"
import Footer from "../../components/layout/Footer"

// Import image assets
import imgUploadTranscript from "@/assets/student/imgUploadTranscript.png"
import imgVerifyInformation from "@/assets/student/step1.png"
import imgSetGoals from "@/assets/student/step3.png"
import imgConfigureSchedule from "@/assets/student/step4.png"
import imgReviewRequirements from "@/assets/student/step5.png"
import imgGeneratePlan from "@/assets/student/step6.png"
import imgTrackProgress from "@/assets/student/step7.png"
import iconInstructions from "@/assets/student/iconInstructions.svg"
import iconUpload from "@/assets/student/iconUpload.svg"
import iconAdjust from "@/assets/student/iconAdjust.svg"
import iconStart from "@/assets/student/iconStart.svg"

type Props = {
  // Add props here if needed in the future
}

interface StepData {
  id: string
  number: string
  title: string
  description: string
  image: string
  bgColor: string
  stepColor: string
}

export default function InstructionsPage({}: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation('student')

  const steps: StepData[] = [
    {
      id: "step1",
      number: "1",
      title: t('instructions.step1Title'),
      description: t('instructions.step1Description'),
      image: imgUploadTranscript,
      bgColor: "bg-blue-500",
      stepColor: "text-blue-600"
    },
    {
      id: "step2", 
      number: "2",
      title: t('instructions.step2Title'),
      description: t('instructions.step2Description'),
      image: imgVerifyInformation,
      bgColor: "bg-green-500",
      stepColor: "text-green-600"
    },
    {
      id: "step3",
      number: "3", 
      title: t('instructions.step3Title'),
      description: t('instructions.step3Description'),
      image: imgSetGoals,
      bgColor: "bg-purple-500",
      stepColor: "text-purple-600"
    },
    {
      id: "step4",
      number: "4",
      title: t('instructions.step4Title'),
      description: t('instructions.step4Description'),
      image: imgConfigureSchedule,
      bgColor: "bg-orange-500",
      stepColor: "text-orange-600"
    },
    {
      id: "step5",
      number: "5",
      title: t('instructions.step5Title'),
      description: t('instructions.step5Description'),
      image: imgReviewRequirements,
      bgColor: "bg-red-500", 
      stepColor: "text-red-600"
    },
    {
      id: "step6",
      number: "6",
      title: t('instructions.step6Title'),
      description: t('instructions.step6Description'),
      image: imgGeneratePlan,
      bgColor: "bg-teal-500",
      stepColor: "text-teal-600"
    },
    {
      id: "step7",
      number: "7",
      title: t('instructions.step7Title'),
      description: t('instructions.step7Description'),
      image: imgTrackProgress,
      bgColor: "bg-indigo-500",
      stepColor: "text-indigo-600"
    }
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardContent className="p-0">
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <div className="bg-blue-50 border-b-2 border-blue-500 flex-1 max-w-sm">
                  <div className="flex items-center justify-center h-14 gap-3">
                    <img src={iconInstructions} alt="" className="w-5 h-5" />
                    <span className="text-blue-600 font-medium">{t('instructions.tabInstructions')}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigate('/student/upload-transcript')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="flex-1 max-w-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center h-14 gap-3">
                    <img src={iconUpload} alt="" className="w-5 h-5" />
                    <span className="text-gray-500 font-medium">{t('instructions.tabUpload')}</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    navigate('/student/adjust-parameters')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="flex-1 max-w-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center h-14 gap-3 relative">
                    <img src={iconAdjust} alt="" className="w-5 h-5" />
                    <span className="text-gray-400 font-medium">{t('instructions.tabAdjust')}</span>
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full absolute right-8">
                      {t('instructions.uploadRequired')}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Header Section */}
              <div className="text-center space-y-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('instructions.pageTitle')}
                </h1>
                <p className="text-base text-gray-600">
                  {t('instructions.pageDescription')}
                </p>
              </div>

              {/* Steps Grid */}
              <div className="space-y-8">
                {/* Row 1 - Steps 1, 2, 3 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {steps.slice(0, 3).map((step) => (
                    <Card key={step.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <CardContent className="p-6 space-y-4">
                        {/* Image */}
                        <div className="h-40 bg-gray-50 rounded-lg overflow-hidden">
                          <img 
                            src={step.image} 
                            alt={step.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Step Number */}
                        <div className="flex justify-center">
                          <div className={`${step.bgColor} w-8 h-8 rounded-full flex items-center justify-center`}>
                            <span className="text-white font-bold text-sm">{step.number}</span>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="text-center space-y-2">
                          <h3 className="font-bold text-lg text-gray-900">{step.title}</h3>
                          <p className="text-sm text-gray-600 leading-5">
                            {step.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Row 2 - Steps 4, 5, 6 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {steps.slice(3, 6).map((step) => (
                    <Card key={step.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <CardContent className="p-6 space-y-4">
                        {/* Image */}
                        <div className="h-40 bg-gray-50 rounded-lg overflow-hidden">
                          <img 
                            src={step.image} 
                            alt={step.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Step Number */}
                        <div className="flex justify-center">
                          <div className={`${step.bgColor} w-8 h-8 rounded-full flex items-center justify-center`}>
                            <span className="text-white font-bold text-sm">{step.number}</span>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="text-center space-y-2">
                          <h3 className="font-bold text-lg text-gray-900">{step.title}</h3>
                          <p className="text-sm text-gray-600 leading-5">
                            {step.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Row 3 - Step 7 (centered) */}
                <div className="flex justify-center">
                  <div className="w-full max-w-sm">
                    <Card className="border border-gray-200 rounded-xl overflow-hidden">
                      <CardContent className="p-6 space-y-4">
                        {/* Image */}
                        <div className="h-40 bg-gray-50 rounded-lg overflow-hidden">
                          <img 
                            src={steps[6].image} 
                            alt={steps[6].title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Step Number */}
                        <div className="flex justify-center">
                          <div className={`${steps[6].bgColor} w-8 h-8 rounded-full flex items-center justify-center`}>
                            <span className="text-white font-bold text-sm">{steps[6].number}</span>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="text-center space-y-2">
                          <h3 className="font-bold text-lg text-gray-900">{steps[6].title}</h3>
                          <p className="text-sm text-gray-600 leading-5">
                            {steps[6].description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="text-center space-y-3 pt-4">
                <Button 
                  onClick={() => {
                    navigate('/student/upload-transcript')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg h-auto inline-flex items-center gap-3"
                >
                  <img src={iconStart} alt="" className="w-5 h-5" />
                  <span className="text-lg font-bold">{t('instructions.startButton')}</span>
                </Button>
                <p className="text-sm text-gray-500">
                  {t('instructions.startDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  )
}