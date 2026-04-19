import { Card, CardContent } from "@/components/ui/parent/Parent_card"
import { Button } from "@/components/ui/parent/Parent_button"
import AppointmentHeader from "@/components/ui/parent/Parent_AppointmentHeader"
import ProgressStepper from "@/components/ui/parent/Parent_ProgressStepper"
import ContinueButton from "@/components/ui/parent/Parent_ContinueButton"
import { useState } from "react"
import { useTranslation } from "react-i18next"
// Import SVG icons
import iconCheck from "@/assets/parent/iconCheck.svg"
import iconChevronLeft from "@/assets/parent/iconChevronLeft.svg"
import iconChevronRight from "@/assets/parent/iconChevronRight.svg"
import iconArrowLeft from "@/assets/parent/iconArrowLeft.svg"
import iconInfo from "@/assets/parent/iconInfo.svg"
import iconEducation from "@/assets/parent/iconEducation.svg"
import Header from "../../components/layout/Header"
type Props = {
  onBack?: () =>void
  onContinue?: () =>void
  onClose?: () =>void
}

export default function BookAppointmentStep2({ onBack, onContinue, onClose }: Props) {
  const { t } = useTranslation(['parent', 'common'])
  const [selectedDate, setSelectedDate] = useState(15)
  const [selectedTime, setSelectedTime] = useState('10:00 AM')

  // Function to handle time selection and update all slots
  const handleTimeSelection = (time: string) => {
    setSelectedTime(time)
  }

  // Function to get slot status based on selected time
  const getSlotStatus = (time: string) => {
    if (time === selectedTime) return 'selected'
if (time === '2:00 PM') return 'booked'
// This slot is always booked
    return 'available'}

  const timeSlots = {
    morning: [
      { time: '9:00 AM'},
      { time: '9:30 AM'},
      { time: '10:00 AM'},
      { time: '10:30 AM'},
    ],
    afternoon: [
      { time: '1:00 PM'},
      { time: '1:30 PM'},
      { time: '2:00 PM'}, // This one is always booked
      { time: '2:30 PM'},
    ],
    evening: [
      { time: '4:00 PM'},
      { time: '4:30 PM'},
    ]
  }

  const calendar = [ 
    [],// Previous month days
    [1, 2, 3, 4, 5, 6, 7], // Next month days
  ]

  const isNextMonth = (day: number | null, weekIndex: number) => {
    return weekIndex === 5 && day !== null && day <= 4
  }

  const isPrevMonth = (day: number | null, weekIndex: number) => {
    return weekIndex === 0 && day === null
  }

  const isUnavailable = (day: number | null, weekIndex: number) => {
    if (day === null) return true
    if (isNextMonth(day, weekIndex) || isPrevMonth(day, weekIndex)) return true
    // Mark some specific dates as unavailable for demo purposes
    return day === 25 || day === 26 || day === 1 || day === 2
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <Header isParentMode={true} />
      <AppointmentHeader onClose={onClose} />

      {/* Progress Stepper */}
      <ProgressStepper currentStep={2} />

      {/* Main Content */}
      <div className="flex-1 flex justify-center py-8">
        <Card className="w-full max-w-4xl mx-4 border border-gray-200 shadow-lg rounded-xl">
          <CardContent className="p-8">
            {/* Meeting Type Confirmation */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full w-10 h-10 flex items-center justify-center mr-4">
                  <img src={iconEducation} alt="Education"className="w-5 h-5"style={{filter: 'brightness(0) saturate(100%) invert(48%) sepia(47%) saturate(2500%) hue-rotate(86deg) brightness(118%) contrast(119%)'}} />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 font-medium mb-1">{t('parent:bookAppointment.step2.meetingConfirmation')}</h3>
                  <p className="text-gray-600 text-sm">{t('parent:bookAppointment.step2.meetingDetails', { duration: '30-60 minutes', location: 'School premises', adviser: 'Mr. Tuan (adviser)'})}</p>
                </div>
                <img src={iconCheck} alt="Selected"className="w-5 h-5"style={{filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)'}} />
              </div>
            </div>

            {/* Select Date & Time Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('parent:bookAppointment.step2.title')}</h2>
              <p className="text-gray-600">{t('parent:bookAppointment.step2.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calendar Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('parent:bookAppointment.step2.chooseDate')}</h3>
                <Card className="p-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost"size="icon"className="hover:bg-gray-100 rounded-md p-2">
                      <img src={iconChevronLeft} alt={t('parent:bookAppointment.step2.previousMonth')} className="w-4 h-4"style={{filter: 'brightness(0) saturate(100%) invert(50%) sepia(0%) saturate(0%) hue-rotate(233deg) brightness(100%) contrast(92%)'}} />
                    </Button>
                    <h4 className="text-lg font-bold text-gray-900">December 2024</h4>
                    <Button variant="ghost"size="icon"className="hover:bg-gray-100 rounded-md p-2">
                      <img src={iconChevronRight} alt={t('parent:bookAppointment.step2.nextMonth')} className="w-4 h-4"style={{filter: 'brightness(0) saturate(100%) invert(50%) sepia(0%) saturate(0%) hue-rotate(233deg) brightness(100%) contrast(92%)'}} />
                    </Button>
                  </div>

                  {/* Calendar Days Header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(day =>(
                      <div key={day} className="p-2 text-center text-sm text-gray-500">
                        {t(`parent:bookAppointment.step2.daysOfWeek.${day}`)}
                      </div>))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {calendar.map((week, weekIndex) =>week.map((day, dayIndex) => {
                        const isSelected = day === selectedDate && !isNextMonth(day, weekIndex)
                        const isDisabled = isUnavailable(day, weekIndex)
                        const isNextMonthDay = isNextMonth(day, weekIndex)
                        
                        return (
                          <button
                            key={`${weekIndex}-${dayIndex}`}
                            onClick={() =>!isDisabled && !isNextMonthDay && setSelectedDate(day as number)}
                            className={`
                              p-2 text-center text-sm rounded-md transition-all duration-200 min-h-[40px] w-full font-medium border-2 relative overflow-hidden
                              ${isSelected 
                                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 shadow-lg': 'border-transparent bg-transparent'}
                              ${isDisabled && !isNextMonthDay 
                                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed': ''}
                              ${isNextMonthDay 
                                ? 'text-gray-300 cursor-not-allowed border-transparent bg-transparent': ''}
                              ${!isSelected && !isDisabled && !isNextMonthDay 
                                ? 'text-gray-900 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 hover:shadow-sm active:bg-blue-100': ''}
                            `}
                            disabled={isDisabled || isNextMonthDay}
                          >
                            {/* Background fill for selected state */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-blue-600 rounded-sm"></div>)}
                            <span className="relative z-10">{day}</span>
                          </button>)
                      })
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-600 border-2 border-blue-600 rounded-md mr-2"></div>
                      <span className="text-gray-600">{t('parent:bookAppointment.step2.selected')}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded-md mr-2"></div>
                      <span className="text-gray-600">{t('parent:bookAppointment.step2.unavailable')}</span>
                    </div>
                  </div>
                </Card>
                
                {/* Help Instructions Card */}
                <Card className="mt-4 border border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <img src={iconInfo} alt="Info"className="w-4 h-4"style={{filter: 'brightness(0) saturate(100%) invert(30%) sepia(98%) saturate(2085%) hue-rotate(213deg) brightness(96%) contrast(101%)'}} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          {t('parent:bookAppointment.step2.bookingInstructions')}
                        </h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>{t('parent:bookAppointment.step2.instructionSelectDate')}</p>
                          <p>{t('parent:bookAppointment.step2.instructionSelectTime')}</p>
                          <p>{t('parent:bookAppointment.step2.instructionLegend')}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Available Times Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('parent:bookAppointment.step2.availableTimes')}</h3>
                <p className="text-gray-600 text-sm mb-4">{t('parent:bookAppointment.step2.dateDisplay', { dayOfWeek: 'Sunday', month: 'December', day: 15, year: 2024 })}</p>

                <div className="space-y-6">
                  {/* Morning */}
                  <div>
                    <h4 className="text-gray-700 mb-3">{t('parent:bookAppointment.step2.morning')}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {timeSlots.morning.map((slot) => {
                        const status = getSlotStatus(slot.time)
                        return (
                          <Button
                            key={slot.time}
                            variant={status === 'selected'? "default": "outline"}
                            className={`
                              h-auto py-3 px-4 flex flex-col items-center transition-all duration-200 rounded-lg
                              ${status === 'selected'? 'bg-blue-50 border-2 border-blue-500 text-blue-700 shadow-lg': status === 'booked'? 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed': 'bg-white border border-gray-200 text-gray-900 shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-blue-50 backdrop-blur-sm'}
                            `}
                            onClick={() =>status === 'available'&& handleTimeSelection(slot.time)}
                            disabled={status === 'booked'}
                          >
                            <span className="font-medium">{slot.time}</span>
                            <span className={`text-xs ${status === 'selected'? 'text-blue-600': status === 'booked'? 'text-gray-400': 'text-gray-500'}`}>
                              {status === 'selected'? t('parent:bookAppointment.step2.selected') : status === 'booked'? t('parent:bookAppointment.step2.booked') : t('parent:bookAppointment.step2.available')}
                            </span>
                          </Button>)
                      })}
                    </div>
                  </div>

                  {/* Afternoon */}
                  <div>
                    <h4 className="text-gray-700 mb-3">{t('parent:bookAppointment.step2.afternoon')}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {timeSlots.afternoon.map((slot) => {
                        const status = getSlotStatus(slot.time)
                        return (
                          <Button
                            key={slot.time}
                            variant={status === 'selected'? "default": "outline"}
                            className={`
                              h-auto py-3 px-4 flex flex-col items-center transition-all duration-200 rounded-lg
                              ${status === 'selected'? 'bg-blue-50 border-2 border-blue-500 text-blue-700 shadow-lg': status === 'booked'? 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed': 'bg-white border border-gray-200 text-gray-900 shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-blue-50 backdrop-blur-sm'}
                            `}
                            onClick={() =>status === 'available'&& handleTimeSelection(slot.time)}
                            disabled={status === 'booked'}
                          >
                            <span className="font-medium">{slot.time}</span>
                            <span className={`text-xs ${status === 'selected'? 'text-blue-600': status === 'booked'? 'text-gray-400': 'text-gray-500'}`}>
                              {status === 'selected'? t('parent:bookAppointment.step2.selected') : status === 'booked'? t('parent:bookAppointment.step2.booked') : t('parent:bookAppointment.step2.available')}
                            </span>
                          </Button>)
                      })}
                    </div>
                  </div>

                  {/* Evening */}
                  <div>
                    <h4 className="text-gray-700 text-sm mb-3">{t('parent:bookAppointment.step2.evening')}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {timeSlots.evening.map((slot) => {
                        const status = getSlotStatus(slot.time)
                        return (
                          <Button
                            key={slot.time}
                            variant={status === 'selected'? "default": "outline"}
                            className={`
                              h-auto py-3 px-4 flex flex-col items-center transition-all duration-200 rounded-lg
                              ${status === 'selected'? 'bg-blue-50 border-2 border-blue-500 text-blue-700 shadow-lg': 'bg-white border border-gray-200 text-gray-900 shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-blue-50 backdrop-blur-sm'}
                            `}
                            onClick={() =>handleTimeSelection(slot.time)}
                          >
                            <span className="text-sm font-medium">{slot.time}</span>
                            <span className={`text-xs ${status === 'selected'? 'text-blue-600': 'text-gray-500'}`}>
                              {status === 'selected'? t('parent:bookAppointment.step2.selected') : '30 min'}
                            </span>
                          </Button>)
                      })}
                    </div>
                  </div>
                </div>

                {/* Selected Time Confirmation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <div className="flex items-center">
                    <img src={iconInfo} alt="Info"className="w-4 h-4 mr-3"style={{filter: 'brightness(0) saturate(100%) invert(30%) sepia(98%) saturate(2085%) hue-rotate(213deg) brightness(96%) contrast(101%)'}} />
                    <div>
                      <p className="text-gray-900 font-medium">{t('parent:bookAppointment.step2.selectedTime')}</p>
                      <p className="text-gray-600 text-sm">{t('parent:bookAppointment.step2.selectedTimeDisplay', { dayOfWeek: 'Sunday', month: 'Dec', day: 15, year: 2024, time: selectedTime })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="border-t border-gray-200 pt-6 mt-8 flex items-center justify-between">
              <Button variant="outline"onClick={onBack} className="flex items-center hover:bg-gray-50">
                <img src={iconArrowLeft} alt={t('parent:bookAppointment.back')} className="w-4 h-4 mr-2"style={{filter: 'brightness(0) saturate(100%) invert(45%) sepia(0%) saturate(0%) hue-rotate(233deg) brightness(100%) contrast(92%)'}} />
                {t('parent:bookAppointment.back')}
              </Button>
              
              <span className="text-sm text-gray-500">{t('parent:bookAppointment.progress', { current: 2, total: 4 })}</span>
              
              <ContinueButton onClick={onContinue}>
                {t('parent:bookAppointment.continue')}
              </ContinueButton>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-gray-500 text-sm">{t('parent:bookAppointment.needHelp')}</span>
              <Button variant="link"className="text-blue-600 text-sm ml-4 p-0">
                {t('parent:bookAppointment.contactSupport')}
              </Button>
            </div>
            
            <div className="flex items-center">
              <span className="text-gray-500 text-sm">{t('parent:bookAppointment.secureBooking')}</span>
              <img src={iconCheck} alt="Secure"className="w-4 h-4 ml-4"style={{filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)'}} />
            </div>
          </div>
        </div>
      </div>
    </div>)
}