import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/parent/Parent_card"
import Header from "../../components/layout/Header"
// Import assets
import avatarJohnSmith from "@/assets/parent/avatarJohnSmithDetail.png"
import iconArrowLeft from "@/assets/parent/iconArrowLeft.svg"
import iconUser from "@/assets/parent/iconUserWhite.svg"
import iconChevronLeft from "@/assets/parent/iconChevronLeft.svg"
import iconChevronRight from "@/assets/parent/iconChevronRight.svg"
import iconNotification from "@/assets/parent/iconNotificationOrange.svg"
import iconWarning from "@/assets/parent/iconWarningRed.svg"
import iconTrophy from "@/assets/parent/iconCheckBoiderGreen.svg"
import iconCalendar from "@/assets/parent/iconCalendarBlue.svg"
import iconEmail from "@/assets/parent/iconEmail.svg"
import iconPhone from "@/assets/parent/iconPhoneGreen.svg"

type Props = {
  // props ở đây nếu cần
}

export default function StudentDetails({}: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      {/* Header */}
      <Header />
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-24">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                onClick={() => navigate('/parent/dashboard')}
              >
                <img src={iconArrowLeft} alt="Back" className="w-5 h-5" />
              </button>
              <div className="bg-blue-600 rounded-lg p-2 ml-3">
                <img src={iconUser} alt="Student" className="w-6 h-6" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">Student Information</h1>
                <p className="text-sm text-gray-500">Academic profile and progress overview</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="flex gap-6 max-w-7xl mx-auto">
          {/* Left Column */}
        <div className="flex-1 space-y-6">
          {/* Student Profile Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="relative">
                  <img 
                    src={avatarJohnSmith} 
                    alt="John Smith" 
                    className="w-24 h-24 rounded-full border-4 border-blue-100"
                  />
                </div>
                <div className="ml-6 flex-1">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">John Smith</h2>
                      <p className="text-lg text-gray-600">Student ID: STU2024001</p>
                      <div className="flex items-center mt-2">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          Year 3
                        </span>
                        <span className="ml-4 text-gray-600">Mathematics & Science Program</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">3.45</div>
                      <div className="text-sm text-gray-600">Current GPA</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">85%</div>
                      <div className="text-sm text-gray-600">Attendance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">48</div>
                      <div className="text-sm text-gray-600">Courses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">144/144</div>
                      <div className="text-sm text-gray-600">Credits</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Progress Table */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Course Progress</h3>
                <div className="flex gap-3">
                  <select className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm cursor-pointer hover:bg-gray-200 transition-colors">
                    <option>Semester 1, 2024-2025</option>
                    <option>Semester 2, 2024-2025</option>
                    <option>Semester 1, 2023-2024</option>
                    <option>Semester 2, 2023-2024</option>
                  </select>
                  <select className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm cursor-pointer hover:bg-gray-200 transition-colors">
                    <option>All Courses</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">Showing 1-10 of 48 courses</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Show:</span>
                  <select className="bg-gray-100 border border-gray-300 rounded px-3 py-1 cursor-pointer hover:bg-gray-200 transition-colors">
                    <option>10</option>
                  </select>
                  <span>per page</span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Course Name</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Credits</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Attendance</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Grade</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Points</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Course rows */}
                    <tr className="border-b border-gray-200">
                      <td className="py-6 px-4">
                        <div>
                          <div className="font-medium text-gray-900">Advanced Mathematics</div>
                          <div className="text-sm text-gray-600">MATH301</div>
                        </div>
                      </td>
                      <td className="text-center py-6 px-4">3</td>
                      <td className="text-center py-6 px-4">
                        <span className="text-lg font-semibold text-green-600">95%</span>
                      </td>
                      <td className="text-center py-6 px-4">
                        <span className="text-lg font-semibold text-green-600">A-</span>
                      </td>
                      <td className="text-center py-6 px-4 text-purple-600 font-medium">11.1</td>
                      <td className="text-center py-6 px-4">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Passed
                        </span>
                      </td>
                    </tr>

                    <tr className="border-b border-gray-200">
                      <td className="py-6 px-4">
                        <div>
                          <div className="font-medium text-gray-900">Physics Laboratory</div>
                          <div className="text-sm text-gray-600">PHYS201</div>
                        </div>
                      </td>
                      <td className="text-center py-6 px-4">2</td>
                      <td className="text-center py-6 px-4">
                        <span className="text-lg font-semibold text-blue-600">88%</span>
                      </td>
                      <td className="text-center py-6 px-4">
                        <span className="text-lg font-semibold text-blue-600">B+</span>
                      </td>
                      <td className="text-center py-6 px-4 text-purple-600 font-medium">6.6</td>
                      <td className="text-center py-6 px-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          In Progress
                        </span>
                      </td>
                    </tr>

                    <tr className="bg-red-50 border-b border-gray-200">
                      <td className="py-6 px-4">
                        <div>
                          <div className="font-medium text-gray-900">Chemistry Fundamentals</div>
                          <div className="text-sm text-gray-600">CHEM101</div>
                        </div>
                      </td>
                      <td className="text-center py-6 px-4">3</td>
                      <td className="text-center py-6 px-4">
                        <span className="text-lg font-semibold text-red-600">35%</span>
                      </td>
                      <td className="text-center py-6 px-4">
                        <span className="text-lg font-semibold text-red-600">F</span>
                      </td>
                      <td className="text-center py-6 px-4 text-red-600 font-medium">0.0</td>
                      <td className="text-center py-6 px-4">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                          Failed
                        </span>
                      </td>
                    </tr>

                    <tr className="border-b border-gray-200">
                      <td className="py-6 px-4">
                        <div>
                          <div className="font-medium text-gray-900">English Literature</div>
                          <div className="text-sm text-gray-600">ENG201</div>
                        </div>
                      </td>
                      <td className="text-center py-6 px-4">3</td>
                      <td className="text-center py-6 px-4">
                        <span className="text-lg font-semibold text-blue-600">92%</span>
                      </td>
                      <td className="text-center py-6 px-4">
                        <span className="text-lg font-semibold text-blue-600">A</span>
                      </td>
                      <td className="text-center py-6 px-4 text-purple-600 font-medium">12.0</td>
                      <td className="text-center py-6 px-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          In Progress
                        </span>
                      </td>
                    </tr>

                    <tr className="border-b border-gray-200">
                      <td className="py-6 px-4">
                        <div>
                          <div className="font-medium text-gray-900">Computer Science Basics</div>
                          <div className="text-sm text-gray-600">CS101</div>
                        </div>
                      </td>
                      <td className="text-center py-6 px-4">4</td>
                      <td className="text-center py-6 px-4">
                        <span className="text-lg font-semibold text-green-600">98%</span>
                      </td>
                      <td className="text-center py-6 px-4">
                        <span className="text-lg font-semibold text-green-600">A+</span>
                      </td>
                      <td className="text-center py-6 px-4 text-purple-600 font-medium">16.0</td>
                      <td className="text-center py-6 px-4">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Passed
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-500 opacity-50 cursor-not-allowed">
                  <img src={iconChevronLeft} alt="Previous" className="w-4 h-4" />
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  <button className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors">1</button>
                  <button className="bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">2</button>
                  <button className="bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">3</button>
                  <span className="px-3 py-2 text-gray-500">...</span>
                  <button className="bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">8</button>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
                  Next
                  <img src={iconChevronRight} alt="Next" className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Academic History */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Academic History by Semester</h3>
              
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Semester 1, 2024</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>GPA: 3.52</span>
                      <span>Credits: 18</span>
                      <span>Points: 63.36</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer hover:bg-green-100 transition-colors">
                      <div className="font-medium text-green-900">Advanced Mathematics</div>
                      <div className="text-sm text-green-700 mb-1">MATH301 • 3 Credits</div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">A-</span>
                        <span className="text-sm font-medium text-green-600">11.1 pts</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition-colors">
                      <div className="font-medium text-blue-900">Physics Laboratory</div>
                      <div className="text-sm text-blue-700 mb-1">PHYS201 • 2 Credits</div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-600">B+</span>
                        <span className="text-sm font-medium text-blue-600">6.6 pts</span>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition-colors">
                      <div className="font-medium text-red-900">Chemistry Fundamentals</div>
                      <div className="text-sm text-red-700 mb-1">CHEM101 • 3 Credits</div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-red-600">F</span>
                        <span className="text-sm font-medium text-red-600">0.0 pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="w-96 space-y-6">
          {/* GPA Status */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">GPA Status</h3>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-3xl font-bold text-blue-600">3.45</div>
                  <div className="text-lg font-medium text-green-600">Very Good</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Current Semester</div>
                  <div className="text-lg font-semibold text-gray-900">3.52</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-green-100 transition-colors">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="font-medium text-green-900">Excellent</span>
                  </div>
                  <span className="font-medium text-green-700">3.60 – 4.00</span>
                </div>

                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-blue-100 transition-colors">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                    <span className="font-medium text-blue-900">Very Good</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium ml-3">
                      Current
                    </span>
                  </div>
                  <span className="font-medium text-blue-700">3.20 – 3.59</span>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-700">Good</span>
                  </div>
                  <span className="text-gray-600">2.50 – 3.19</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <img src={iconNotification} alt="Notifications" className="w-5 h-5 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 cursor-pointer hover:bg-red-100 transition-colors">
                  <div className="flex items-start">
                    <img src={iconWarning} alt="Warning" className="w-5 h-5 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-red-900">Failed Subject Alert</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Chemistry Fundamentals (CHEM101) - Grade: F
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Retake required for graduation. Contact academic advisor.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors">
                  <div className="flex items-start">
                    <img src={iconTrophy} alt="Achievement" className="w-5 h-5 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-green-900">Achievement Unlocked</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Dean's List - Excellent Academic Performance
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Congratulations on maintaining high GPA!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors">
                  <div className="flex items-start">
                    <img src={iconCalendar} alt="Calendar" className="w-5 h-5 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-blue-900">Upcoming Exam</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Physics Laboratory - Final Exam
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        September 20, 2024 at 2:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contacts</h3>
              
              <div className="space-y-4">
                <div className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <img src={iconEmail} alt="Email" className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">Academic Advisor</div>
                    <div className="text-sm text-gray-600">Dr. Sarah Johnson</div>
                    <div className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">sarah.johnson@university.edu</div>
                  </div>
                </div>

                <div className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div className="bg-green-100 p-2 rounded-full">
                    <img src={iconPhone} alt="Phone" className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">Student Support</div>
                    <div className="text-sm text-gray-600">24/7 Helpline</div>
                    <div className="text-sm text-green-600 hover:text-green-800 cursor-pointer">+1 (555) 123-4567</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  )
}