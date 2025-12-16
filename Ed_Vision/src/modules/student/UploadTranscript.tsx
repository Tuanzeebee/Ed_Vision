import { Card, CardContent } from "@/components/ui/student/Student_card"
import { Button } from "@/components/ui/student/Student_button"
import { useNavigate } from "react-router-dom"
import { useState, useRef } from "react"
import { useTranslation } from 'react-i18next'
import toast, { Toaster } from "react-hot-toast"
import Header from "../../components/layout/Header"
import Footer from "../../components/layout/Footer"
import { 
  uploadTranscriptFile, 
  isValidFileType, 
  isValidFileSize,
  formatFileSize 
} from "@/services/transcriptService"

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
  const { t } = useTranslation('student')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Handle file selection
  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!isValidFileType(file)) {
      toast.error('Invalid file format. Please upload a CSV or Excel file.')
      return
    }

    // Validate file size
    if (!isValidFileSize(file)) {
      toast.error('File size exceeds 10MB limit. Please upload a smaller file.')
      return
    }

    setSelectedFile(file)
    toast.success(`File selected: ${file.name}`)
  }

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Upload file to backend
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first.')
      return
    }

    setIsUploading(true)
    const loadingToast = toast.loading('Uploading transcript...')

    try {
      const response = await uploadTranscriptFile(selectedFile)

      console.log('Upload response:', response)
      toast.dismiss(loadingToast)

      // Consider upload successful if at least one record was uploaded
      const hasSuccessfulRecords = response.data.successfulRecords > 0

      if (hasSuccessfulRecords) {
        console.log('Success! Clearing file...')
        
        // Set flag in localStorage to allow access to Adjust Parameters page
        localStorage.setItem('transcript_uploaded', 'true')
        
        // Clear selected file IMMEDIATELY to prevent spam upload
        setSelectedFile(null)
        console.log('File state cleared')
        // Reset file input value to allow selecting file again
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
          console.log('File input reset')
        }

        // Show success message
        if (response.data.failedRecords === 0) {
          toast.success(
            `Successfully uploaded all ${response.data.successfulRecords} records!`,
            { duration: 5000 }
          )
        } else {
          toast.success(
            `Successfully uploaded ${response.data.successfulRecords} records`,
            { duration: 5000 }
          )
          
          // Show error warning after a short delay to ensure success toast is visible
          setTimeout(() => {
            toast.error(
              `${response.data.failedRecords} records failed to upload`,
              { duration: 6000 }
            )
          }, 500)
        }
        console.log('Toast displayed')

        // Navigate to next step after successful upload
        setTimeout(() => {
          navigate('/student/adjust-parameters')
        }, 2000)
      } else {
        console.log('Upload completely failed:', response)
        toast.error(response.message || 'Upload failed. All records have errors.')
      }
    } catch (error: any) {
      toast.dismiss(loadingToast)
      console.error('Upload error:', error)
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else if (error.message) {
        toast.error(`Upload failed: ${error.message}`)
      } else {
        toast.error('Upload failed. Please check your connection and try again.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Handle cancel file selection
  const handleCancelFile = () => {
    setSelectedFile(null)
    // Reset file input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.success('File selection cancelled')
  }

  // Open file dialog
  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Toast Notifications Container */}
      <Toaster 
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 80,
        }}
        toastOptions={{
          // Default options
          className: '',
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '500px',
          },
          // Success toast styling
          success: {
            duration: 5000,
            style: {
              background: '#10B981',
              color: '#ffffff',
              border: '2px solid #059669',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#10B981',
            },
          },
          // Error toast styling
          error: {
            duration: 8000,
            style: {
              background: '#EF4444',
              color: '#ffffff',
              border: '2px solid #DC2626',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#EF4444',
            },
          },
          // Loading toast styling
          loading: {
            style: {
              background: '#3B82F6',
              color: '#ffffff',
              border: '2px solid #2563EB',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#3B82F6',
            },
          },
        }}
      />
      
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
                    <span className="text-gray-500 font-medium">{t('instructions.tabInstructions')}</span>
                  </div>
                </button>
                <div className="bg-blue-50 border-b-2 border-blue-500 flex-1 max-w-sm">
                  <div className="flex items-center justify-center h-14 gap-3">
                    <img src={iconUpload} alt="" className="w-5 h-5" />
                    <span className="text-blue-600 font-medium">{t('instructions.tabUpload')}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/student/adjust-parameters')}
                  className="flex-1 max-w-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center h-14 gap-3 relative">
                    <img src={iconAdjust} alt="" className="w-5 h-5" />
                    <span className="text-gray-400 font-medium">{t('instructions.tabAdjust')}</span>
                    <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full absolute -right-2 top-2">
                      {t('instructions.uploadRequired')}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto p-6 space-y-6">
              {/* Header Section */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('upload.pageTitle')}
                </h1>
                <p className="text-base text-gray-600">
                  {t('upload.pageDescription')}
                </p>
                
                {/* Security Badge */}
                <div className="inline-flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                  <img src={iconSecurity} alt="" className="w-4 h-4" />
                  <span className="text-blue-800 text-sm font-medium">
                    {t('upload.securityBadge')}
                  </span>
                </div>
              </div>

              {/* Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 transition-colors ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : selectedFile 
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-white'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="text-center space-y-4">
                  {/* Cloud Upload Icon */}
                  <div className="flex justify-center">
                    <img src={iconCloudUpload} alt="" className="w-16 h-16" />
                  </div>

                  {/* Upload Text */}
                  <div className="space-y-1">
                    {selectedFile ? (
                      <>
                        <h3 className="text-xl font-bold text-green-900">
                          {t('upload.fileSelected')}: {selectedFile.name}
                        </h3>
                        <p className="text-base text-green-700">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-gray-900">
                          {t('upload.dropZoneTitle')}
                        </h3>
                        <p className="text-base text-gray-600">
                          {t('upload.dropZoneDescription')}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {/* Upload Button */}
                  {selectedFile ? (
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="text-base font-bold">
                          {isUploading ? t('upload.uploading') : t('upload.uploadNow')}
                        </span>
                      </Button>
                      <Button 
                        onClick={handleCancelFile}
                        disabled={isUploading}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg h-auto disabled:opacity-50"
                      >
                        <span className="text-base font-bold">
                          {t('upload.cancel')}
                        </span>
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleBrowseClick}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg h-auto"
                    >
                      <img src={iconUploadButton} alt="" className="w-5 h-5 mr-2" />
                      <span className="text-base font-bold">
                        {t('upload.uploadButton')}
                      </span>
                    </Button>
                  )}

                  {/* File Size Limit */}
                  <p className="text-xs text-gray-500">
                    {t('upload.maxFileSize')}
                  </p>
                </div>
              </div>

              {/* Supported File Formats */}
              <div className="space-y-3">
                <h2 className="text-base font-bold text-gray-900 text-center">
                  {t('upload.supportedFormats')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CSV Files */}
                  <Card className="border-2 border-blue-200">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <img src={iconCSV} alt="" className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{t('upload.csvFiles')}</h3>
                          <p className="text-xs text-gray-600">{t('upload.csvFormat')}</p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 leading-4">
                        {t('upload.csvDescription')}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <img src={iconCheckBlue} alt="" className="w-3 h-3" />
                        <span className="text-xs text-blue-600 font-medium">
                          {t('upload.csvRecommended')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Excel Files */}
                  <Card className="border-2 border-green-200">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <img src={iconExcel} alt="" className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{t('upload.excelFiles')}</h3>
                          <p className="text-xs text-gray-600">{t('upload.excelFormat')}</p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 leading-4">
                        {t('upload.excelDescription')}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <img src={iconCheckGreen} alt="" className="w-3 h-3" />
                        <span className="text-xs text-green-600 font-medium">
                          {t('upload.excelSupported')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Required Information */}
              <Card className="bg-amber-50 border border-amber-200">
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <img src={iconWarning} alt="" className="w-4 h-4 mt-0.5" />
                    <div className="space-y-2">
                      <h3 className="font-bold text-amber-800 text-sm">
                        {t('upload.requiredInfo')}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <img src={iconCheckAmber} alt="" className="w-3 h-3" />
                          <span className="text-xs text-amber-700">
                            {t('upload.courseCodes')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <img src={iconCheckAmber} alt="" className="w-3 h-3" />
                          <span className="text-xs text-amber-700">
                            {t('upload.creditHours')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <img src={iconCheckAmber} alt="" className="w-3 h-3" />
                          <span className="text-xs text-amber-700">
                            {t('upload.grades')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <img src={iconCheckAmber} alt="" className="w-3 h-3" />
                          <span className="text-xs text-amber-700">
                            {t('upload.semesterInfo')}
                          </span>
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