import { useTranslation } from 'react-i18next';
import iconCheck from "@/assets/parent/iconCheckBig.svg"
type StepStatus = 'completed'| 'current'| 'upcoming'
type Step = {
  id: number
  label: string
  status: StepStatus
}

type Props = {
  currentStep: number
  steps?: Step[]
}

export default function ProgressStepper({ 
  currentStep, 
  steps 
}: Props) {
  const { t } = useTranslation(['parent']);
  
  const defaultSteps: Step[] = [
    { id: 1, label: t('parent:ui.progressStepper.steps.meetingType'), status: 'completed'},
    { id: 2, label: t('parent:ui.progressStepper.steps.dateTime'), status: 'completed'},
    { id: 3, label: t('parent:ui.progressStepper.steps.details'), status: 'completed'},
    { id: 4, label: t('parent:ui.progressStepper.steps.confirmation'), status: 'current'}
  ];
  
  const stepsToUse = steps || defaultSteps;
  const getStepStatus = (stepId: number): StepStatus => {
    if (stepId < currentStep) return 'completed'
if (stepId === currentStep) return 'current'
return 'upcoming'}

  const getStepStyles = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-green-500',
          text: 'text-green-600',
          line: 'bg-green-500'}
      case 'current':
        return {
          circle: 'bg-blue-500',
          text: 'text-blue-600',
          line: 'bg-blue-500'}
      case 'upcoming':
        return {
          circle: 'bg-gray-200',
          text: 'text-gray-500',
          line: 'bg-gray-200'}
    }
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center">
          {stepsToUse.map((step, index) => {
            const status = getStepStatus(step.id)
            const styles = getStepStyles(status)
            const isLast = index === stepsToUse.length - 1
            
            return (
              <div key={step.id} className="flex items-center">
                {/* Step Circle and Label */}
                <div className="flex items-center">
                  <div className={`${styles.circle} rounded-full w-8 h-8 flex items-center justify-center`}>
                    {status === 'completed'? (
                      <img 
                        src={iconCheck} 
                        alt="Complete"className="w-4 h-4"style={{filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(7500%) hue-rotate(178deg) brightness(100%) contrast(100%)'}} 
                      />) : (
                      <span className={`text-sm font-medium ${status === 'current'? 'text-white': 'text-gray-500'}`}>
                        {step.id}
                      </span>)}
                  </div>
                  <span className={`ml-2 text-sm ${styles.text}`}>{step.label}</span>
                </div>
                
                {/* Connecting Line */}
                {!isLast && (
                  <div className={`w-16 h-0.5 mx-6 ${
                    step.id < currentStep ? 'bg-green-500': 
                    step.id === currentStep ? 'bg-blue-500': 
                    'bg-gray-200'}`}></div>)}
              </div>)
          })}
        </div>
      </div>
    </div>)
}