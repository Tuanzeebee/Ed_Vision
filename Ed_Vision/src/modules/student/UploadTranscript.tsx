import { Card, CardContent } from "@/components/ui/student/Student_card"
import { Button } from "@/components/ui/student/Student_button"
import { useNavigate } from "react-router-dom"
import { useState, useRef, useCallback } from "react"
import toast, { Toaster } from "react-hot-toast"
import Header from "../../components/layout/Header"
import { useTranslation } from 'react-i18next'
import Footer from "../../components/layout/Footer"
import { 
  uploadTranscriptFile, 
  isValidFileType, 
  isValidFileSize,
  formatFileSize 
} from "@/services/transcriptService"
import cacheService from "@/services/cacheService"

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const { t } = useTranslation('student')

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!isValidFileType(file)) {
      toast.error(t('upload.toastInvalidFileType'), {
        id: 'invalid-file-type'
      })
      return
    }

    // Validate file size
    if (!isValidFileSize(file)) {
      toast.error(t('upload.toastFileSizeExceeded'), {
        id: 'file-size-exceeded'
      })
      return
    }

    setSelectedFile(file)
    toast.success(t('upload.toastFileSelected', { name: file.name }), {
      id: 'file-selected'
    })
  }, [t])

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  // Upload file to backend
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      toast.error(t('upload.toastPleaseSelectFile'), {
        id: 'no-file-selected'
      })
      return
    }

    // Prevent multiple clicks
    if (isUploading) {
      console.log('Upload already in progress, ignoring click')
      return
    }

    setIsUploading(true)
    console.log('Starting upload for file:', selectedFile.name)

    try {
      // Use toast.promise to avoid duplicate toasts
      const response = await toast.promise(
        uploadTranscriptFile(selectedFile),
        {
          loading: t('upload.toastUploading'),
          success: (data) => {
            console.log('Upload response:', data)
            return t('upload.toastProcessing')
          },
          error: (err) => {
            console.error('Upload error:', err)
            if (err.response?.data?.message) {
              return t('upload.toastUploadFailedMessage', { message: err.response.data.message })
            } else if (err.message) {
              return t('upload.toastUploadFailedMessage', { message: err.message })
            }
            return t('upload.toastUploadFailedGeneric')
          },
        }
      )

      // Consider upload successful if at least one record was uploaded
      const hasSuccessfulRecords = response.data.successfulRecords > 0

      if (hasSuccessfulRecords) {
        console.log('Success! Processing results...')
        
        // Set flag in localStorage to allow access to Adjust Parameters page
        localStorage.setItem('transcript_uploaded', 'true')

        cacheService.clearByPrefix('gpa:')
        cacheService.clearByPrefix('semesterPlan:')
        cacheService.clearByPrefix('survey:')
        cacheService.clearByPrefix('transcript:')
        
        // Clear selected file IMMEDIATELY to prevent spam upload
        setSelectedFile(null)
        console.log('File state cleared')
        
        // Reset file input value to allow selecting file again
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
          console.log('File input reset')
        }

        // Show success message based on results
        if (response.data.failedRecords === 0) {
          toast.success(
            t('upload.toastAllRecordsUploaded', { count: response.data.successfulRecords }),
            { duration: 5000, id: 'upload-success' }
          )
        } else {
          toast.success(
            t('upload.toastPartialSuccess', { count: response.data.successfulRecords }),
            { duration: 5000, id: 'upload-partial-success' }
          )
          
          setTimeout(() => {
            toast.error(
              t('upload.toastPartialError', { count: response.data.failedRecords }),
              { duration: 6000, id: 'upload-partial-error' }
            )
          }, 500)
        }
        console.log('Success toasts displayed')

        // Navigate to next step after successful upload
        setTimeout(() => {
          console.log('Navigating to adjust parameters...')
          navigate('/student/adjust-parameters')
        }, 2000)
      } else {
        console.log('Upload completely failed:', response)
        toast.error(
          response.message || t('upload.toastUploadCompletelyFailed'),
          { id: 'upload-complete-fail' }
        )
      }
    } catch (error: any) {
      // Error toast already handled by toast.promise
      console.error('Caught error in handleUpload:', error)
    } finally {
      setIsUploading(false)
      console.log('Upload process completed, isUploading set to false')
    }
  }, [selectedFile, isUploading, t, navigate])

  // Handle cancel file selection
  const handleCancelFile = useCallback(() => {
    setSelectedFile(null)
    // Reset file input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.success(t('upload.toastFileCancelled'), {
      id: 'file-cancelled'
    })
  }, [t])

  // Open file dialog
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

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
                    <span className="text-gray-500 font-medium">{t('instructions.title')}</span>
                  </div>
                </button>
                <div className="bg-blue-50 border-b-2 border-blue-500 flex-1 max-w-sm">
                  <div className="flex items-center justify-center h-14 gap-3">
                    <img src={iconUpload} alt="" className="w-5 h-5" />
                    <span className="text-blue-600 font-medium">{t('upload.title')}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/student/adjust-parameters')}
                  className="flex-1 max-w-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center h-14 gap-3 relative">
                    <img src={iconAdjust} alt="" className="w-5 h-5" />
                    <span className="text-gray-400 font-medium">{t('adjust.tab')}</span>
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full absolute right-8">
                      Upload Required
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto p-6 space-y-6">
              {/* Header Section */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">{t('upload.title')}</h1>
                <p className="text-base text-gray-600">
                  {t('upload.subtitle')}
                </p>
                
                {/* Security Badge */}
                <div className="inline-flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                  <img src={iconSecurity} alt="" className="w-4 h-4" />
                  <span className="text-blue-800 text-sm font-medium">{t('upload.securityBadge')}</span>
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
                    <img src={iconCloudUpload} alt="" className="w-16 h-16" loading="lazy" />
                  </div>

                  {/* Upload Text */}
                  <div className="space-y-1">
                    {selectedFile ? (
                      <>
                        <h3 className="text-xl font-bold text-green-900">
                          File selected: {selectedFile.name}
                        </h3>
                        <p className="text-base text-green-700">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-gray-900">{t('upload.dropHere')}</h3>
                        <p className="text-base text-gray-600">
                          {t('upload.orClickToBrowse')}
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
                          {isUploading ? 'Uploading...' : t('upload.uploadNow')}
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
                      <img src={iconUploadButton} alt="" className="w-5 h-5 mr-2" loading="lazy" />
                      <span className="text-base font-bold">{t('upload.uploadYourTranscript')}</span>
                    </Button>
                  )}

                  {/* File Size Limit */}
                  <p className="text-xs text-gray-500">{t('upload.maxFileSize')}</p>
                </div>
              </div>

              {/* Supported File Formats */}
              <div className="space-y-3">
                <h2 className="text-base font-bold text-gray-900 text-center">{t('upload.supportedFormats')}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CSV Files */}
                  <Card className="border-2 border-blue-200">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <img src={iconCSV} alt="" className="w-4 h-4" loading="lazy" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{t('upload.csvFiles')}</h3>
                          <p className="text-xs text-gray-600">{t('upload.csvFormatLabel')}</p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 leading-4">{t('upload.csvDescription')}</p>
                      
                      <div className="flex items-center gap-2">
                        <img src={iconCheckBlue} alt="" className="w-3 h-3" loading="lazy" />
                        <span className="text-xs text-blue-600 font-medium">{t('upload.recommendedFormat')}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Excel Files */}
                  <Card className="border-2 border-green-200">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <img src={iconExcel} alt="" className="w-4 h-4" loading="lazy" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{t('upload.excelFiles')}</h3>
                          <p className="text-xs text-gray-600">{t('upload.excelFormatLabel')}</p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 leading-4">{t('upload.excelDescription')}</p>
                      
                      <div className="flex items-center gap-2">
                        <img src={iconCheckGreen} alt="" className="w-3 h-3" loading="lazy" />
                        <span className="text-xs text-green-600 font-medium">{t('upload.fullySupported')}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Required Information */}
              <Card className="bg-amber-50 border border-amber-200">
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <img src={iconWarning} alt="" className="w-4 h-4 mt-0.5" loading="lazy" />
                    <div className="space-y-2">
                      <h3 className="font-bold text-amber-800 text-sm">{t('upload.requiredInfo')}</h3>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <img src={iconCheckAmber} alt="" className="w-3 h-3" />
                          <span className="text-xs text-amber-700">{t('upload.courseCodes')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <img src={iconCheckAmber} alt="" className="w-3 h-3" />
                          <span className="text-xs text-amber-700">{t('upload.creditHours')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <img src={iconCheckAmber} alt="" className="w-3 h-3" />
                          <span className="text-xs text-amber-700">{t('upload.gradesGPA')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <img src={iconCheckAmber} alt="" className="w-3 h-3" />
                          <span className="text-xs text-amber-700">{t('upload.semesterInfo')}</span>
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
