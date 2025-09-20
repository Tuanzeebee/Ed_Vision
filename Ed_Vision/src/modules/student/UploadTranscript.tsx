import { Card, CardContent } from "@/components/ui/student/Student_card"
import { Button } from "@/components/ui/student/Student_button"
import { useNavigate } from "react-router-dom"
import Header from "../../components/layout/Header"
import Footer from "../../components/layout/Footer"

// Import image assets
import iconInstructions from "@/assets/student/iconInstructions.svg"
import iconUpload from "@/assets/student/iconUploadBlue.svg"
import iconAdjust from "@/assets/student/iconAdjust.svg"
import iconSecurity from "@/assets/student/iconSecurity.svg"
import iconCloudUpload from "@/assets/student/iconCloudUpload.svg"
import iconUploadButton from "@/assets/student/iconUploadButton.svg"
import iconCSV from "@/assets/student/iconCSV.svg"
import iconCheckBlue from "@/assets/student/iconCheckBlue.svg"
import iconExcel from "@/assets/student/iconExcel.svg"
import iconCheckGreen from "@/assets/student/iconCheckGreen.svg"
import iconWarning from "@/assets/student/iconWarning.svg"
import iconCheckAmber from "@/assets/student/iconCheckAmber.svg"

type Props = {
  // Add props here if needed in the future
}

export default function UploadTranscript({}: Props) {
  const navigate = useNavigate()

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
                <button
                  onClick={() => navigate('/student/instructions')}
                  className="flex-1 max-w-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center h-14 gap-3">
                    <img src={iconInstructions} alt="" className="w-5 h-5" />
                    <span className="text-gray-500 font-medium">Instructions</span>
                  </div>
                </button>
                <div className="bg-blue-50 border-b-2 border-blue-500 flex-1 max-w-sm">
                  <div className="flex items-center justify-center h-14 gap-3">
                    <img src={iconUpload} alt="" className="w-5 h-5" />
                    <span className="text-blue-600 font-medium">Upload Transcript</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/student/adjust-parameters')}
                  className="flex-1 max-w-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center h-14 gap-3 relative">
                    <img src={iconAdjust} alt="" className="w-5 h-5" />
                    <span className="text-gray-400 font-medium">Adjust Parameters</span>
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full absolute right-8">
                      Upload Required
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto p-8 space-y-8">
              {/* Header Section */}
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  Upload Your Academic Transcript
                </h1>
                <p className="text-lg text-gray-600 font-medium">
                  Select your transcript file to begin personalized academic planning
                </p>
                
                {/* Security Badge */}
                <div className="inline-flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                  <img src={iconSecurity} alt="" className="w-4 h-4" />
                  <span className="text-blue-800 text-sm font-medium">
                    Your data is secure and private
                  </span>
                </div>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-16">
                <div className="text-center space-y-6">
                  {/* Cloud Upload Icon */}
                  <div className="flex justify-center">
                    <img src={iconCloudUpload} alt="" className="w-20 h-20" />
                  </div>

                  {/* Upload Text */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Drop your transcript file here
                    </h3>
                    <p className="text-lg text-gray-600 font-medium">
                      or click to browse and select from your device
                    </p>
                  </div>

                  {/* Upload Button */}
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg h-auto">
                    <img src={iconUploadButton} alt="" className="w-5 h-5 mr-3" />
                    <span className="text-lg font-bold">
                      Upload your transcript
                    </span>
                  </Button>

                  {/* File Size Limit */}
                  <p className="text-sm text-gray-500 font-medium">
                    Maximum file size: 10MB
                  </p>
                </div>
              </div>

              {/* Supported File Formats */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 text-center">
                  Supported File Formats
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CSV Files */}
                  <Card className="border-2 border-blue-200">
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <img src={iconCSV} alt="" className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">CSV Files</h3>
                          <p className="text-sm text-gray-600">.csv format</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 leading-5">
                        Comma-separated values format exported from your student portal or registrar system.
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <img src={iconCheckBlue} alt="" className="w-3 h-3" />
                        <span className="text-xs text-blue-600 font-medium">
                          Recommended format
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Excel Files */}
                  <Card className="border-2 border-green-200">
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <img src={iconExcel} alt="" className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Excel Files</h3>
                          <p className="text-sm text-gray-600">.xlsx, .xls format</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 leading-5">
                        Microsoft Excel spreadsheet format with your course data and grades.
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <img src={iconCheckGreen} alt="" className="w-3 h-3" />
                        <span className="text-xs text-green-600 font-medium">
                          Fully supported
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Required Information */}
              <Card className="bg-amber-50 border border-amber-200">
                <CardContent className="p-6">
                  <div className="flex gap-3">
                    <img src={iconWarning} alt="" className="w-5 h-5 mt-0.5" />
                    <div className="space-y-2">
                      <h3 className="font-bold text-amber-800">
                        Required Information in Your Transcript
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <img src={iconCheckAmber} alt="" className="w-3 h-3" />
                            <span className="text-sm text-amber-700 font-medium">
                              Course names and codes
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={iconCheckAmber} alt="" className="w-3 h-3" />
                            <span className="text-sm text-amber-700 font-medium">
                              Credit hours per course
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <img src={iconCheckAmber} alt="" className="w-3 h-3" />
                            <span className="text-sm text-amber-700 font-medium">
                              Letter grades or GPA
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={iconCheckAmber} alt="" className="w-3 h-3" />
                            <span className="text-sm text-amber-700 font-medium">
                              Semester/term information
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  )
}