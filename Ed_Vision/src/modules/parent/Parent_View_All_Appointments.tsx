import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/parent/Parent_card";
import { Button } from "@/components/ui/parent/Parent_button";

// Import assets from the parent folder
import iconBack from "@/assets/parent/iconBack1.svg";
import iconDashboard from "@/assets/parent/iconDashboard.svg";
import iconBooking from "@/assets/parent/iconBooking1.svg";
import iconSearch from "@/assets/parent/iconSearch.svg";
import iconSort from "@/assets/parent/iconSort.svg";
import iconGrid from "@/assets/parent/iconGrid.svg";
import iconClock from "@/assets/parent/iconClockColorOrange.svg";
import iconMeeting from "@/assets/parent/iconMeetingLikeCamera.svg";
import iconCalendar from "@/assets/parent/iconCalendar1.svg";
import iconTime from "@/assets/parent/iconTimeNoColor.svg";
import iconLocation from "@/assets/parent/iconLocationMetting.svg";
import iconPeople from "@/assets/parent/iconPeople.svg";
import iconLocationPin from "@/assets/parent/iconLocationPin.svg";
import iconCheck from "@/assets/parent/iconCheckBoiderGreen.svg";
import iconCheck2 from "@/assets/parent/iconCheckBoiderGreen2.svg";
import iconArrowDown from "@/assets/parent/iconArrowDown.svg";
import avatarJohnSmith from "@/assets/parent/avatarJohnSmith.png";
import Header from "../../components/layout/Header"
type Props = {
  // Add any props here if needed
}

export default function AllAppointments({}: Props) {
  const { t } = useTranslation(['parent', 'common']);
  const navigate = useNavigate();
  
  return (
    <div className="bg-gray-50 min-h-screen w-full">
      {/* Header Section */}
      <Header />
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-24">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              {/* Back button */}
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                onClick={() => navigate('/parent/dashboard')}
              >
                <img src={iconBack} alt="Back" className="w-5 h-5" />
              </button>
              
              {/* App icon and title */}
              <div className="ml-3 flex items-center">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <img src={iconDashboard} alt="Dashboard" className="w-6 h-6" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-semibold text-gray-900">{t('parent:appointments.allAppointments')}</h1>
                  <p className="text-sm text-gray-500">{t('parent:appointments.subtitle')}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Book New Appointment Button */}
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                onClick={() => navigate('/parent/book-appointment')}
              >
                <img src={iconBooking} alt="Book" className="w-4 h-4" />
                {t('parent:appointments.bookNew')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Child Info Banner */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-24 py-3">
          <div className="flex items-center">
            <div 
              className="w-8 h-8 rounded-full border-2 border-blue-200 bg-cover bg-center"
              style={{ backgroundImage: `url(${avatarJohnSmith})` }}
            ></div>
            <div className="ml-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-900">John Smith</span>
                <span className="text-sm text-blue-700">{t('parent:appointments.childInfo', { year: '3', subjects: 'Mathematics & Science' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filter Section */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <img src={iconSearch} alt="Search" className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={t('parent:appointments.searchPlaceholder')}
                    className="block w-64 pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-400"
                  />
                </div>
                
                {/* Filter buttons */}
                <button className="px-5 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-200 cursor-pointer">
                  {t('parent:appointments.allStatus')}
                </button>
                <button className="px-5 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-200 cursor-pointer">
                  {t('parent:appointments.allTime')}
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t('parent:appointments.appointmentsFound', { count: 12 })}</span>
                <button className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <img src={iconSort} alt="Sort" className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <img src={iconGrid} alt="Grid view" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <img src={iconClock} alt="Clock" className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">{t('parent:appointments.upcomingCount', { count: 2 })}</h2>
          </div>
          
          {/* First Upcoming Appointment */}
          <Card className="mb-4">
            <CardContent className="p-6">
              <div className="flex justify-between">
                <div className="flex-1 pr-4">
                  {/* Appointment header */}
                  <div className="flex items-center mb-3">
                    <div className="bg-orange-100 p-3 rounded-full">
                      <img src={iconMeeting} alt="Meeting" className="w-6 h-6" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">{t('parent:appointments.meetingWith', { teacher: 'Dr. Brown' })}</h3>
                      <p className="text-sm text-gray-600">{t('parent:appointments.departments.mathematics')} • {t('parent:appointments.purposes.academicProgress')}</p>
                    </div>
                  </div>
                  
                  {/* Appointment details */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center">
                      <img src={iconCalendar} alt="Calendar" className="w-4 h-4 mr-2" />
                      <span className="text-sm text-gray-600">September 15, 2024</span>
                    </div>
                    <div className="flex items-center">
                      <img src={iconTime} alt="Time" className="w-4 h-4 mr-2" />
                      <span className="text-sm text-gray-600">10:00 AM - 10:30 AM</span>
                    </div>
                    <div className="flex items-center">
                      <img src={iconLocation} alt="Location" className="w-4 h-4 mr-2" />
                      <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                        {t('parent:appointments.meetingTypes.onlineMeeting')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Meeting info */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="font-bold text-sm text-orange-800 mb-1">
                      {t('parent:appointments.meetingInfo.meetingLink')} https://zoom.us/j/123456789
                    </p>
                    <p className="text-xs text-orange-700">
                      {t('parent:appointments.meetingInfo.reminderEmail')}
                    </p>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2">
                    {t('parent:appointments.actions.joinMeeting')}
                  </Button>
                  <Button variant="secondary" className="text-sm px-4 py-2">
                    {t('parent:appointments.actions.reschedule')}
                  </Button>
                  <button className="text-sm text-red-600 hover:text-red-700 px-4 py-2 cursor-pointer">
                    {t('parent:appointments.actions.cancel')}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Second Upcoming Appointment */}
          <Card className="mb-4">
            <CardContent className="p-6">
              <div className="flex justify-between">
                <div className="flex-1 pr-4">
                  {/* Appointment header */}
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <img src={iconPeople} alt="Conference" className="w-6 h-6" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">{t('parent:appointments.parentTeacherConference')}</h3>
                      <p className="text-sm text-gray-600">{t('parent:appointments.departments.general')} • {t('parent:appointments.purposes.multipleTeachers')}</p>
                    </div>
                  </div>
                  
                  {/* Appointment details */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center">
                      <img src={iconCalendar} alt="Calendar" className="w-4 h-4 mr-2" />
                      <span className="text-sm text-gray-600">September 22, 2024</span>
                    </div>
                    <div className="flex items-center">
                      <img src={iconTime} alt="Time" className="w-4 h-4 mr-2" />
                      <span className="text-sm text-gray-600">2:30 PM - 3:30 PM</span>
                    </div>
                    <div className="flex items-center">
                      <img src={iconLocationPin} alt="Location" className="w-4 h-4 mr-2" />
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        {t('parent:appointments.meetingTypes.inPersonMeeting')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Meeting info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="font-bold text-sm text-blue-800 mb-1">
                      {t('parent:appointments.meetingInfo.locationLabel')} {t('parent:appointments.meetingInfo.conferenceRoom')}
                    </p>
                    <p className="text-xs text-blue-700">
                      {t('parent:appointments.meetingInfo.arriveEarly')}
                    </p>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" className="text-sm px-4 py-2">
                    {t('parent:appointments.actions.viewDetails')}
                  </Button>
                  <Button variant="secondary" className="text-sm px-4 py-2">
                    {t('parent:appointments.actions.reschedule')}
                  </Button>
                  <button className="text-sm text-red-600 hover:text-red-700 px-4 py-2 cursor-pointer">
                    {t('parent:appointments.actions.cancel')}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Past Appointments Section */}
        <div>
          <div className="flex items-center mb-4">
            <img src={iconCheck} alt="Check" className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">{t('parent:appointments.pastCount', { count: 10 })}</h2>
          </div>
          
          {/* Past Appointment Example */}
          <Card className="mb-4 opacity-75">
            <CardContent className="p-6">
              <div className="flex justify-between">
                <div className="flex-1 pr-4">
                  {/* Appointment header */}
                  <div className="flex items-center mb-3">
                    <div className="bg-green-100 p-3 rounded-full">
                      <img src={iconCheck2} alt="Completed" className="w-6 h-6" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">{t('parent:appointments.meetingWith', { teacher: 'Prof. Johnson' })}</h3>
                      <p className="text-sm text-gray-600">{t('parent:appointments.departments.science')} • {t('parent:appointments.purposes.homeworkSupport')}</p>
                    </div>
                    <div className="ml-3">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        {t('parent:appointments.completed')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Appointment details */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center">
                      <img src={iconCalendar} alt="Calendar" className="w-4 h-4 mr-2" />
                      <span className="text-sm text-gray-600">August 28, 2024</span>
                    </div>
                    <div className="flex items-center">
                      <img src={iconTime} alt="Time" className="w-4 h-4 mr-2" />
                      <span className="text-sm text-gray-600">3:00 PM - 3:45 PM</span>
                    </div>
                    <div className="flex items-center">
                      <img src={iconLocationPin} alt="Location" className="w-4 h-4 mr-2" />
                      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                        {t('parent:appointments.meetingTypes.inPersonMeeting')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Meeting summary */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="font-bold text-sm text-green-800">
                      {t('parent:appointments.meetingInfo.meetingSummary')} Discussed John's progress in Chemistry. Recommended additional practice problems for better understanding.
                    </p>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" className="text-sm px-4 py-2">
                    {t('parent:appointments.actions.viewSummary')}
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2">
                    {t('parent:appointments.actions.bookFollowUp')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Show More Button */}
          <div className="flex justify-center">
            <button className="flex items-center gap-2 px-6 py-4 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer">
              <span>{t('parent:appointments.showMore', { count: 9 })}</span>
              <img src={iconArrowDown} alt="Arrow down" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}