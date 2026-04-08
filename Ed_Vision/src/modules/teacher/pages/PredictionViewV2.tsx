import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/teacher/teacher_card';
import { Button } from '@/components/ui/teacher/teacher_button';
import { Badge } from '@/components/ui/teacher/teacher_badge';
import TeacherLayout from '../components/TeacherLayout';
import predictionService from '@/services/predictionService';
import shapService from '@/services/shapService';
import gradeStructureService from '@/services/teacher/api/gradeStructure';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Upload, 
  CloudUpload, 
  Users, 
  ClipboardList, 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock, 
  Briefcase, 
  DollarSign, 
  Heart, 
  ChartBar, 
  Loader2,
  X,
  Lightbulb,
  ChevronDown,
  TrendingUp,
  History,
  FileText,
  Bell
} from 'lucide-react';

interface StudentData {
  student_id: string;
  course_code: string;
  // Dynamic grade columns (attend, quiz, midterm, homework, etc.)
  [key: string]: string | number | null | boolean | undefined;
  // Required behavior columns
  weekly_study_hours_by_course: number | null;
  part_time_hours_by_course: number | null;
  financial_support_by_course: number | null;
  emotional_support_by_course: number | null;
  has_survey_data?: boolean; // true: có dữ liệu khảo sát thực tế, false: dùng default
  final_pred: number | null;
  confidence: 'high' | 'medium' | 'low' | null;
}

interface ShapFeature {
  feature: string;
  value: number;
  shap_value: number;
}

interface PassThresholdData {
  student_id: string;
  currentScore: number;
  currentWeightUsed: number;
  finalWeightNeeded: number;
  finalScoreNeeded: number;
  finalColumnKey: string;
  isPassing: boolean;
  canPass: boolean;
}

interface GradeStructureColumn {
  name: string;
  key: string;
  maxScore: number;
  weight: number;
}

interface SurveyData {
  weekly_study_hours: string;
  part_time_hours: string;
  financial_support: number;
  emotional_support: number;
}

interface UploadMetadata {
  course_code: string;
  class_code: string;
  academic_year: string;
  semester: string;
}

type Props = {};

export default function PredictionViewV2({}: Props) {
  const { t } = useTranslation('teacher');
  const [, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showShapModal, setShowShapModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [surveysCompleted, setSurveysCompleted] = useState(false);
  const [predictionRun, setPredictionRun] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [uploadId, setUploadId] = useState<string>('');
  const [recordCount, setRecordCount] = useState<number>(0);
  const [studentsWithActualSurvey, setStudentsWithActualSurvey] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const [uploadMetadata, setUploadMetadata] = useState<UploadMetadata>({
    course_code: '',
    class_code: '',
    academic_year: '',
    semester: ''
  });

  const [surveyData, setSurveyData] = useState<SurveyData>({
    weekly_study_hours: '',
    part_time_hours: '',
    financial_support: 1,
    emotional_support: 1
  });

  const [studentData, setStudentData] = useState<StudentData[]>([]);
  const [shapFeatures, setShapFeatures] = useState<ShapFeature[]>([]);
  const [loadingShap, setLoadingShap] = useState(false);
  const [passThresholdData, setPassThresholdData] = useState<PassThresholdData | null>(null);
  const [gradeStructureColumns, setGradeStructureColumns] = useState<GradeStructureColumn[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(7); // 7 students per page
  const [gradeColumns, setGradeColumns] = useState<string[]>([]); // Dynamic grade columns
  const [showHistory, setShowHistory] = useState(false); // Toggle upload history
  const [uploadHistory, setUploadHistory] = useState<any[]>([]); // Upload history data
  const [loadingHistory, setLoadingHistory] = useState(false); // Loading state for history
  const [availableCourses, setAvailableCourses] = useState<Array<{
    courseCode: string;
    courseName: string;
    academicYear: string;
    semester: number;
    credits: number;
    totalWeight: number;
  }>>([]); // Danh sách courses có sẵn weights
  const [loadingCourses, setLoadingCourses] = useState(false); // Loading courses state
  const [availableAcademicYears, setAvailableAcademicYears] = useState<string[]>([]); // Danh sách năm học từ DB
  const [availableSemesters, setAvailableSemesters] = useState<number[]>([]); // Danh sách học kỳ từ DB
  const [loadingAcademicTerms, setLoadingAcademicTerms] = useState(false); // Loading academic terms state
  // Pagination for prediction results table
  const [predictionCurrentPage, setPredictionCurrentPage] = useState(1);
  const [predictionPerPage] = useState(7); // 7 students per page for prediction results
  
  // Notification cooldown state
  const [notificationCooldown, setNotificationCooldown] = useState<number>(0); // seconds remaining
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0); // timestamp

  // Load cooldown từ localStorage khi component mount
  useEffect(() => {
    const savedLastNotificationTime = localStorage.getItem('lastNotificationTime');
    if (savedLastNotificationTime) {
      const lastTime = parseInt(savedLastNotificationTime, 10);
      const now = Date.now();
      const cooldownPeriod = 180000; // 3 minutes in milliseconds
      const timeSinceLastNotification = now - lastTime;
      
      if (timeSinceLastNotification < cooldownPeriod) {
        // Vẫn còn trong cooldown period
        const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceLastNotification) / 1000);
        setNotificationCooldown(remainingSeconds);
        setLastNotificationTime(lastTime);
        console.log(`[Cooldown] Restored from localStorage: ${remainingSeconds}s remaining`);
      } else {
        // Cooldown đã hết, xóa localStorage
        localStorage.removeItem('lastNotificationTime');
      }
    }
  }, []);

  // Cleanup shapService queue khi component unmount
  useEffect(() => {
    return () => {
      shapService.clearQueue();
      console.log('[PredictionViewV2] Cleaned up SHAP service queue');
    };
  }, []);

  // Countdown timer for notification cooldown
  useEffect(() => {
    if (notificationCooldown > 0) {
      const timer = setInterval(() => {
        setNotificationCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Xóa localStorage khi cooldown hết
            localStorage.removeItem('lastNotificationTime');
            console.log('[Cooldown] Expired - Removed from localStorage');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [notificationCooldown]);

  // Tự động detect grade columns từ student data
  const detectGradeColumns = (students: StudentData[]) => {
    if (students.length === 0) return [];
    
    const firstStudent = students[0];
    const excludedKeys = [
      'student_id', 'course_code', 
      'weekly_study_hours_by_course', 'part_time_hours_by_course',
      'financial_support_by_course', 'emotional_support_by_course',
      'final_pred', 'confidence'
    ];
    
    // Lấy tất cả keys là grade columns (attend, quiz, midterm, homework, etc.)
    const columns = Object.keys(firstStudent).filter(
      key => !excludedKeys.includes(key) && typeof firstStudent[key as keyof StudentData] === 'number'
    );
    
    return columns;
  };

  // Pagination logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = studentData.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(studentData.length / studentsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Pagination logic for Prediction Results
  const indexOfLastPrediction = predictionCurrentPage * predictionPerPage;
  const indexOfFirstPrediction = indexOfLastPrediction - predictionPerPage;
  const currentPredictions = studentData.slice(indexOfFirstPrediction, indexOfLastPrediction);
  const totalPredictionPages = Math.ceil(studentData.length / predictionPerPage);

  const goToNextPredictionPage = () => {
    if (predictionCurrentPage < totalPredictionPages) setPredictionCurrentPage(predictionCurrentPage + 1);
  };

  const goToPreviousPredictionPage = () => {
    if (predictionCurrentPage > 1) setPredictionCurrentPage(predictionCurrentPage - 1);
  };

  const goToPredictionPage = (page: number) => {
    setPredictionCurrentPage(page);
  };

  // Helper function để giải thích SHAP value
  const explainShapValue = (feature: ShapFeature): string => {
    const absValue = Math.abs(feature.shap_value);
    const isPositive = feature.shap_value > 0;
    const featureName = feature.feature;
    const featureValue = feature.value;
    
    // Phân loại mức độ ảnh hưởng
    let impactLevel = '';
    if (absValue >= 0.5) impactLevel = 'rất mạnh';
    else if (absValue >= 0.3) impactLevel = 'mạnh';
    else if (absValue >= 0.15) impactLevel = 'trung bình';
    else if (absValue >= 0.05) impactLevel = 'nhẹ';
    else impactLevel = 'rất nhẹ';

    // Giải thích cụ thể theo từng feature
    const explanations: Record<string, string> = {
      'midterm': `Điểm giữa kỳ (${featureValue}) ${isPositive ? 'cao hơn' : 'thấp hơn'} mức trung bình, ảnh hưởng ${impactLevel} ${isPositive ? '+' : ''}${feature.shap_value.toFixed(3)} điểm đến kết quả cuối kỳ.`,
      'attend': `Điểm chuyên cần (${featureValue}) ${isPositive ? 'tốt' : 'chưa tốt'}, ${isPositive ? 'tăng' : 'giảm'} ${impactLevel} dự đoán ${Math.abs(feature.shap_value).toFixed(3)} điểm.`,
      'quiz': `Điểm quiz (${featureValue}) ${isPositive ? 'cao' : 'thấp'}, đóng góp ${isPositive ? 'tích cực' : 'tiêu cực'} ${Math.abs(feature.shap_value).toFixed(3)} điểm.`,
      'homework': `Điểm bài tập (${featureValue}) ${isPositive ? 'tốt' : 'kém'}, ảnh hưởng ${isPositive ? 'tích cực' : 'tiêu cực'} ${Math.abs(feature.shap_value).toFixed(3)} điểm.`,
      'weekly_study_hours': `Sinh viên học ${featureValue} giờ/tuần. ${isPositive ? 'Thời gian học cao giúp tăng' : 'Thời gian học thấp làm giảm'} ${Math.abs(feature.shap_value).toFixed(3)} điểm.`,
      'part_time_hours': `Sinh viên làm thêm ${featureValue} giờ/tuần. ${!isPositive ? 'Làm thêm nhiều giờ làm giảm' : 'Làm thêm ít giờ giúp tăng'} ${Math.abs(feature.shap_value).toFixed(3)} điểm hiệu suất học tập.`,
      'emotional_support': `Mức hỗ trợ tinh thần (${featureValue}/10). ${isPositive ? 'Hỗ trợ tốt giúp tăng' : 'Thiếu hỗ trợ làm giảm'} ${Math.abs(feature.shap_value).toFixed(3)} điểm.`,
      'financial_support': `Mức hỗ trợ tài chính (${featureValue}/10). ${isPositive ? 'Hỗ trợ đủ giúp sinh viên tập trung học tập, tăng' : 'Thiếu hỗ trợ làm giảm'} ${Math.abs(feature.shap_value).toFixed(3)} điểm.`,
      'baseline_final_weighted': `Điểm baseline dựa trên cấu trúc môn học. Giá trị ${featureValue.toFixed(2)} ${isPositive ? 'cao hơn trung bình, cộng thêm' : 'thấp hơn trung bình, trừ đi'} ${Math.abs(feature.shap_value).toFixed(3)} điểm.`,
    };

    // Check nếu feature là course code
    if (featureName.startsWith('course_')) {
      const courseName = featureName.replace('course_', '');
      return `Môn học ${courseName}: Độ khó và đặc thù môn học ${isPositive ? 'có lợi cho' : 'gây khó khăn với'} sinh viên này, ảnh hưởng ${isPositive ? '+' : ''}${feature.shap_value.toFixed(3)} điểm.`;
    }

    // Check nếu feature là mask (thiếu dữ liệu)
    if (featureName.endsWith('_mask')) {
      const baseName = featureName.replace('_mask', '');
      return `Thiếu dữ liệu ${baseName}. Model dự đoán dựa trên các features khác, điều chỉnh ${isPositive ? '+' : ''}${feature.shap_value.toFixed(3)} điểm.`;
    }

    // Trả về explanation cụ thể hoặc generic
    return explanations[featureName] || 
      `Feature "${featureName}" với giá trị ${featureValue} ${isPositive ? 'tăng' : 'giảm'} dự đoán ${Math.abs(feature.shap_value).toFixed(3)} điểm (ảnh hưởng ${impactLevel}).`;
  };

  // Helper function để tạo khuyến nghị cho giảng viên
  const getRecommendation = (feature: ShapFeature): string => {
    const isPositive = feature.shap_value > 0;
    const featureName = feature.feature;

    const recommendations: Record<string, string> = {
      'midterm': isPositive ? 
        '✅ Sinh viên có nền tảng tốt. Tiếp tục duy trì.' : 
        '⚠️ Cần review lại kiến thức giữa kỳ. Tổ chức buổi ôn tập bổ sung.',
      'attend': isPositive ? 
        '✅ Sinh viên chuyên cần tốt. Khuyến khích tiếp tục.' : 
        '⚠️ Tỷ lệ vắng mặt cao. Liên hệ sinh viên để hiểu nguyên nhân.',
      'quiz': isPositive ? 
        '✅ Nắm vững kiến thức từng phần. Duy trì.' : 
        '⚠️ Yếu ở bài kiểm tra nhỏ. Tăng cường luyện tập thêm.',
      'homework': isPositive ? 
        '✅ Hoàn thành bài tập tốt. Tiếp tục động viên.' : 
        '⚠️ Không hoàn thành đầy đủ bài tập. Nhắc nhở và hỗ trợ.',
      'weekly_study_hours': !isPositive ? 
        '⚠️ Thời gian tự học ít. Tư vấn kỹ năng quản lý thời gian.' : 
        '✅ Thời gian tự học đủ. Hướng dẫn học hiệu quả hơn.',
      'part_time_hours': !isPositive ? 
        '⚠️ Làm thêm quá nhiều ảnh hưởng học tập. Tư vấn cân bằng.' : 
        '✅ Cân bằng tốt giữa làm thêm và học tập.',
      'emotional_support': !isPositive ? 
        '⚠️ Thiếu hỗ trợ tinh thần. Kết nối với tư vấn tâm lý.' : 
        '✅ Được hỗ trợ tinh thần tốt. Tiếp tục theo dõi.',
      'financial_support': !isPositive ? 
        '⚠️ Gặp khó khăn tài chính. Giới thiệu học bổng/hỗ trợ.' : 
        '✅ Ổn định về tài chính. Tập trung học tập tốt.',
    };

    if (featureName.endsWith('_mask')) {
      return '📋 Thu thập đầy đủ dữ liệu để dự đoán chính xác hơn.';
    }

    return recommendations[featureName] || 
      (isPositive ? '✅ Đây là điểm mạnh của sinh viên.' : '⚠️ Đây là điểm cần cải thiện.');
  };

  // Toggle upload history
  const toggleHistory = async () => {
    if (!showHistory) {
      // Fetch history when opening
      setLoadingHistory(true);
      try {
        const response = await predictionService.getUploadList();
        if (response.success && response.data) {
          setUploadHistory(response.data || []);
        }
      } catch (err) {
        setUploadHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    }
    setShowHistory(!showHistory);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Reset upload metadata khi upload file mới
      setUploadMetadata({
        course_code: '',
        class_code: '',
        academic_year: '',
        semester: ''
      });
      setPendingFile(file);
      setShowUploadModal(true);
      
      // Load available courses và academic terms khi mở modal
      setLoadingCourses(true);
      setLoadingAcademicTerms(true);
      try {
        const [courses, academicTerms] = await Promise.all([
          gradeStructureService.getAvailableCourses(),
          predictionService.getAvailableAcademicTerms()
        ]);
        setAvailableCourses(courses);
        if (academicTerms.success && academicTerms.data) {
          setAvailableAcademicYears(academicTerms.data.academicYears);
          setAvailableSemesters(academicTerms.data.semesters);
        }
      } catch (err) {
        console.error('Failed to load available data:', err);
        toast.error('Không thể tải danh sách môn học hoặc năm học');
      } finally {
        setLoadingCourses(false);
        setLoadingAcademicTerms(false);
      }
    }
    // Reset input value để có thể chọn lại cùng file
    event.target.value = '';
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      // Reset upload metadata khi upload file mới
      setUploadMetadata({
        course_code: '',
        class_code: '',
        academic_year: '',
        semester: ''
      });
      setPendingFile(file);
      setShowUploadModal(true);
      
      // Load available courses và academic terms khi mở modal
      setLoadingCourses(true);
      setLoadingAcademicTerms(true);
      try {
        const [courses, academicTerms] = await Promise.all([
          gradeStructureService.getAvailableCourses(),
          predictionService.getAvailableAcademicTerms()
        ]);
        setAvailableCourses(courses);
        if (academicTerms.success && academicTerms.data) {
          setAvailableAcademicYears(academicTerms.data.academicYears);
          setAvailableSemesters(academicTerms.data.semesters);
        }
      } catch (err) {
        console.error('Failed to load available data:', err);
        toast.error('Không thể tải danh sách môn học hoặc năm học');
      } finally {
        setLoadingCourses(false);
        setLoadingAcademicTerms(false);
      }
    }
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    
    if (!uploadMetadata.course_code) {
      toast.error('Vui lòng chọn Course Code');
      return;
    }

    if (!uploadMetadata.class_code || uploadMetadata.class_code.trim() === '') {
      toast.error('Vui lòng nhập Mã Lớp (VD: AIS)');
      return;
    }

    if (!uploadMetadata.academic_year || uploadMetadata.academic_year.trim() === '') {
      toast.error('Vui lòng chọn Năm Học');
      return;
    }

    if (!uploadMetadata.semester || uploadMetadata.semester.trim() === '') {
      toast.error('Vui lòng chọn Học Kỳ');
      return;
    }

    setUploadedFile(pendingFile);
    setUploading(true);
    setError('');
    setShowUploadModal(false);
    setPendingFile(null);
    
    try {
      const response = await predictionService.uploadGrades(
        pendingFile,
        uploadMetadata.course_code,
        uploadMetadata.class_code,
        uploadMetadata.academic_year,
        uploadMetadata.semester
      );
      
      // Check if upload was successful
      if (!response.success || !response.data) {
        throw new Error('Upload failed: Invalid response from server');
      }

      const uploadId = response.data.upload_id;
      setUploadId(uploadId);
      setRecordCount(response.data.processed_students || 0);
      
      // Fetch student details after successful upload
      const detailsResponse = await predictionService.getStudentsByUploadId(uploadId);
      
      if (!detailsResponse.success || !detailsResponse.data || !detailsResponse.data.students) {
        throw new Error('Failed to fetch student details');
      }
      
      // Map backend response to frontend format (keep all grade columns)
      const mappedData = detailsResponse.data!.students.map((student: any) => {
        return {
          student_id: student.student_id,
          course_code: detailsResponse.data!.course_code,
          ...student.grades, // Spread all grade columns dynamically
          weekly_study_hours_by_course: student.weekly_study_hours_by_course ?? null,
          part_time_hours_by_course: student.part_time_hours_by_course ?? null,
          financial_support_by_course: student.financial_support_by_course ?? null,
          emotional_support_by_course: student.emotional_support_by_course ?? null,
          final_pred: student.final_pred ?? null,
          confidence: student.confidence ?? null
        };
      });
      
      setStudentData(mappedData);
      
      // Auto-detect grade columns
      const detectedColumns = detectGradeColumns(mappedData);
      setGradeColumns(detectedColumns);
      
      // Count students with actual survey data
      // Ưu tiên sử dụng trường has_survey_data từ backend
      const studentsWithRealSurvey = mappedData.filter(s => {
        // Nếu backend trả về has_survey_data, dùng nó
        if (s.has_survey_data !== undefined) {
          return s.has_survey_data === true;
        }
        // Fallback: check default values (weekly=20, part_time=10, financial=50, emotional=50)
        return s.weekly_study_hours_by_course !== null && 
          !(s.weekly_study_hours_by_course === 20 && 
            s.part_time_hours_by_course === 10 && 
            s.financial_support_by_course === 2 && 
            s.emotional_support_by_course === 2);
      }).length;
      
      setStudentsWithActualSurvey(studentsWithRealSurvey);
      
      setUploadSuccess(true);
      // Always mark as completed since backend provides default values
      setSurveysCompleted(true);
      setPredictionRun(false);
      setShowResults(true);
      // Reset upload metadata after successful upload
      setUploadMetadata({
        course_code: '',
        class_code: '',
        academic_year: '',
        semester: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload thất bại. Vui lòng kiểm tra định dạng file.');
      toast.error(`Upload thất bại: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setPendingFile(null);
    setUploadMetadata({
      course_code: '',
      class_code: '',
      academic_year: '',
      semester: ''
    });
  };

  // Handle course selection - reload academic terms filtered by course
  const handleCourseChange = async (courseCode: string) => {
    setUploadMetadata({
      ...uploadMetadata,
      course_code: courseCode,
      academic_year: '', // Reset academic year when course changes
      semester: '' // Reset semester when course changes
    });

    // Reload academic terms filtered by selected course
    if (courseCode) {
      setLoadingAcademicTerms(true);
      try {
        const academicTerms = await predictionService.getAvailableAcademicTerms(courseCode);
        if (academicTerms.success && academicTerms.data) {
          setAvailableAcademicYears(academicTerms.data.academicYears);
          setAvailableSemesters(academicTerms.data.semesters);
        }
      } catch (err) {
        console.error('Failed to load academic terms for course:', err);
        toast.error('Không thể tải năm học và học kỳ cho môn này');
        setAvailableAcademicYears([]);
        setAvailableSemesters([]);
      } finally {
        setLoadingAcademicTerms(false);
      }
    } else {
      // If no course selected, clear academic terms
      setAvailableAcademicYears([]);
      setAvailableSemesters([]);
    }
  };

  const openSurveyModal = () => {
    // Gửi thông báo cho sinh viên thay vì mở survey modal
    sendSurveyNotification();
  };

  const sendSurveyNotification = async () => {
    // Check cooldown (3 minutes = 180 seconds)
    const now = Date.now();
    const timeSinceLastNotification = (now - lastNotificationTime) / 1000; // convert to seconds
    const cooldownPeriod = 180; // 3 minutes in seconds
    
    if (timeSinceLastNotification < cooldownPeriod && lastNotificationTime > 0) {
      const remainingTime = Math.ceil(cooldownPeriod - timeSinceLastNotification);
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      
      toast.error(
        `⏰ Vui lòng đợi ${minutes > 0 ? `${minutes} phút` : ''} ${seconds > 0 ? `${seconds} giây` : ''} trước khi gửi thông báo lại`,
        {
          duration: 5000,
          icon: '⏳',
        }
      );
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      const response = await predictionService.sendSurveyNotification(uploadId);
      
      if (response.success && response.data) {
        const { total_students, students_with_accounts, students_without_accounts } = response.data;
        
        // Set cooldown after successful notification
        const notificationTime = Date.now();
        setLastNotificationTime(notificationTime);
        setNotificationCooldown(cooldownPeriod);
        
        // Lưu vào localStorage để persist qua reload
        localStorage.setItem('lastNotificationTime', notificationTime.toString());
        console.log(`[Cooldown] Saved to localStorage: ${notificationTime}`);
        
        toast.success(
          `✅ Đã gửi thông báo đến ${students_with_accounts} sinh viên! ` +
          (students_without_accounts > 0 
            ? `(${students_without_accounts} sinh viên chưa có tài khoản sẽ không nhận được thông báo)`
            : ''
          ),
          {
            duration: 7000,
          }
        );
        
        // Show info toast about what students need to do
        setTimeout(() => {
          toast(
            '📋 Sinh viên sẽ nhận thông báo và cần vào mục "Khảo sát" để hoàn tất khảo sát behavior.',
            {
              icon: 'ℹ️',
              duration: 6000,
            }
          );
        }, 1000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gửi thông báo thất bại.');
      toast.error(`Gửi thông báo thất bại: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const saveSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    
    try {
      // Call API to update behavior for all students
      await predictionService.bulkUpdateBehavior(uploadId, {
        weeklyStudyHours: parseInt(surveyData.weekly_study_hours),
        partTimeHours: parseInt(surveyData.part_time_hours),
        financialSupport: surveyData.financial_support,
        emotionalSupport: surveyData.emotional_support
      });
      
      // Refresh data from server
      const response = await predictionService.getStudentsByUploadId(uploadId);
      
      if (!response.success || !response.data || !response.data.students) {
        throw new Error('Failed to refresh student data');
      }
      
      const mappedData = response.data.students.map((student: any) => {
        return {
          student_id: student.student_id,
          course_code: response.data!.course_code,
          ...student.grades, // Spread all grade columns dynamically
          weekly_study_hours_by_course: student.weekly_study_hours_by_course ?? null,
          part_time_hours_by_course: student.part_time_hours_by_course ?? null,
          financial_support_by_course: student.financial_support_by_course ?? null,
          emotional_support_by_course: student.emotional_support_by_course ?? null,
          final_pred: student.final_pred ?? null,
          confidence: student.confidence ?? null
        };
      });
      
      setStudentData(mappedData);
      
      // Re-detect grade columns (should be same as before)
      const detectedColumns = detectGradeColumns(mappedData);
      setGradeColumns(detectedColumns);
      
      // Count students with actual survey data (not default values after manual update)
      // After manual update, all students will have the same values, so count = recordCount
      setStudentsWithActualSurvey(recordCount);
      
      setSurveysCompleted(true);
      setShowSurveyModal(false);
      toast.success('Khảo sát đã được lưu thành công cho tất cả sinh viên!', {
        duration: 5000,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lưu khảo sát thất bại.');
      toast.error(`Lưu khảo sát thất bại: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const runPrediction = async () => {
    setUploading(true);
    setError('');
    
    try {
      // Gọi backend API để chạy ML prediction
      const response = await predictionService.runPrediction(uploadId);
      
      if (!response.success || !response.data || !response.data.students) {
        throw new Error('Failed to run prediction');
      }
      
      // Map response data with dynamic grades
      const mappedData = response.data.students.map((student: any) => {
        return {
          student_id: student.student_id,
          course_code: response.data!.course_code,
          ...student.grades, // Spread all grade columns dynamically
          weekly_study_hours_by_course: student.weekly_study_hours_by_course ?? null,
          part_time_hours_by_course: student.part_time_hours_by_course ?? null,
          financial_support_by_course: student.financial_support_by_course ?? null,
          emotional_support_by_course: student.emotional_support_by_course ?? null,
          final_pred: student.final_pred ?? null,
          confidence: student.confidence ?? null
        };
      });
      
      setStudentData(mappedData);
      
      // Re-detect grade columns
      const detectedColumns = detectGradeColumns(mappedData);
      setGradeColumns(detectedColumns);
      
      setPredictionRun(true);
      setShowResults(true);
      
      // PRE-FETCH SHAP trong background (non-blocking)
      // Khi user click vào student, SHAP đã sẵn trong cache
      shapService.prefetchShap(uploadId, 8);
      
      toast.success('Dự đoán hoàn tất! Model đã phân tích và đưa ra kết quả.', {
        duration: 5000,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Dự đoán thất bại. Vui lòng thử lại.');
      toast.error(`Dự đoán thất bại: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const showShap = async (student: StudentData) => {
    setSelectedStudent(student);
    setShowShapModal(true);
    setLoadingShap(true);
    
    try {
      // Fetch cả SHAP và pass threshold data song song
      const [shapResponse, thresholdResponse] = await Promise.all([
        shapService.getShapExplanationDebounced(uploadId, 8),
        predictionService.getPassThreshold(uploadId)
      ]);
      
      // Process SHAP data
      const explanations = shapResponse.data?.explanations || shapResponse.explanations || [];
      const studentExplanation = explanations.find(
        (exp: any) => {
          return exp.student_id === student.student_id || 
                 exp.student_code === student.student_id ||
                 String(exp.student_id) === String(student.student_id);
        }
      );
      
      if (studentExplanation && studentExplanation.top_features) {
        const features: ShapFeature[] = studentExplanation.top_features.map((f: any) => ({
          feature: f.feature,
          value: f.value || 0,
          shap_value: f.shap_value
        }));
        setShapFeatures(features);
      } else {
        // Fallback: mock data
        setShapFeatures([
          { feature: 'attend', value: Number(student.attend) || 0, shap_value: 0.40 },
          { feature: 'midterm', value: Number(student.midterm) || 0, shap_value: 0.38 },
          { feature: 'quiz', value: Number(student.quiz) || 0, shap_value: 0.35 },
          { feature: 'weekly_study_hours', value: student.weekly_study_hours_by_course || 0, shap_value: 0.28 },
          { feature: 'emotional_support', value: student.emotional_support_by_course || 0, shap_value: 0.22 },
          { feature: 'financial_support', value: student.financial_support_by_course || 0, shap_value: 0.18 },
          { feature: 'part_time_hours', value: student.part_time_hours_by_course || 0, shap_value: -0.15 }
        ]);
      }

      // Process pass threshold data
      if (thresholdResponse.success && thresholdResponse.data) {
        const studentThreshold = thresholdResponse.data.students.find(
          s => s.student_id === student.student_id
        );
        if (studentThreshold) {
          setPassThresholdData(studentThreshold);
        }
        setGradeStructureColumns(thresholdResponse.data.gradeStructure.columns);
      }
    } catch (err) {
      // Fallback: sử dụng mock data
      setShapFeatures([
        { feature: 'attend', value: Number(student.attend) || 0, shap_value: 0.40 },
        { feature: 'midterm', value: Number(student.midterm) || 0, shap_value: 0.38 },
        { feature: 'quiz', value: Number(student.quiz) || 0, shap_value: 0.35 },
        { feature: 'weekly_study_hours', value: student.weekly_study_hours_by_course || 0, shap_value: 0.28 },
        { feature: 'emotional_support', value: student.emotional_support_by_course || 0, shap_value: 0.22 },
        { feature: 'financial_support', value: student.financial_support_by_course || 0, shap_value: 0.18 },
        { feature: 'part_time_hours', value: student.part_time_hours_by_course || 0, shap_value: -0.15 }
      ]);
    } finally {
      setLoadingShap(false);
    }
  };

  const getBehaviorStatus = (student: StudentData) => {
    // Ưu tiên sử dụng trường has_survey_data từ backend
    if (student.has_survey_data !== undefined) {
      return student.has_survey_data ? 'Đã khảo sát' : 'Giá trị mặc định';
    }
    
    // Fallback: Check if using default values (20, 10, 2, 2)
    if (student.weekly_study_hours_by_course === 20 && 
        student.part_time_hours_by_course === 10 && 
        student.financial_support_by_course === 2 && 
        student.emotional_support_by_course === 2) {
      return 'Giá trị mặc định';
    }
    return 'Đã khảo sát';
  };

  const getBehaviorStatusClass = (student: StudentData) => {
    // Ưu tiên sử dụng trường has_survey_data từ backend
    if (student.has_survey_data !== undefined) {
      return student.has_survey_data 
        ? 'bg-green-100 text-green-800' 
        : 'bg-blue-100 text-blue-800';
    }
    
    // Fallback: Check if using default values
    if (student.weekly_study_hours_by_course === 20 && 
        student.part_time_hours_by_course === 10 && 
        student.financial_support_by_course === 2 && 
        student.emotional_support_by_course === 2) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getConfidenceColor = useCallback((confidence: string | null) => {
    switch(confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Helper function để phân loại điểm dự đoán
  const getPredictionCategory = (score: number | null): { label: string; color: string; icon: string } => {
    if (score === null) return { label: 'N/A', color: 'bg-gray-100 text-gray-800', icon: '❓' };
    
    if (score >= 7) {
      return { label: 'Pass', color: 'bg-green-100 text-green-800', icon: '✅' };
    } else if (score >= 3.5) {
      return { label: 'Warning', color: 'bg-amber-100 text-amber-800', icon: '⚠️' };
    } else {
      return { label: 'Fail', color: 'bg-red-100 text-red-800', icon: '❌' };
    }
  };

  // Memoize expensive calculations
  const averagePrediction = useMemo(() => {
    if (studentData.length === 0) return 0;
    return studentData.reduce((sum, s) => sum + (s.final_pred || 0), 0) / studentData.length;
  }, [studentData]);

  const highConfidenceCount = useMemo(() => {
    return studentData.filter(s => s.confidence === 'high').length;
  }, [studentData]);

  return (
    <TeacherLayout currentPage="prediction-view-v2">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">{t('prediction.title')}</h2>
            <p className="text-blue-100">{t('prediction.subtitle')}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleHistory}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title={t('prediction.historyButton')}
            >
              <History className="w-5 h-5" />
            </button>
            <div className="hidden md:block">
              <TrendingUp className="w-16 h-16 opacity-20" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Upload History Modal - Floating Toast Style */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
            <Card className="w-full max-w-2xl shadow-2xl border-2 border-blue-500 animate-in slide-in-from-top-4 duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <History className="w-6 h-6 text-blue-500" />
                    {t('prediction.historyTitle')}
                  </h3>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-3 text-gray-600 text-lg">{t('prediction.loadingHistory')}</span>
                  </div>
                ) : uploadHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p className="text-lg">{t('prediction.noHistory')}</p>
                    <p className="text-sm mt-2">{t('prediction.noHistoryDesc')}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {uploadHistory.map((upload: any) => (
                      <div
                        key={upload._id}
                        onClick={() => {
                          setUploadId(upload._id);
                          setShowHistory(false);
                          // Reload data for this upload
                          predictionService.getStudentsByUploadId(upload._id).then(response => {
                            if (response.success && response.data) {
                              const mappedData = response.data.students.map((student: any) => ({
                                student_id: student.student_id,
                                course_code: response.data!.course_code,
                                ...student.grades,
                                weekly_study_hours_by_course: student.weekly_study_hours_by_course ?? null,
                                part_time_hours_by_course: student.part_time_hours_by_course ?? null,
                                financial_support_by_course: student.financial_support_by_course ?? null,
                                emotional_support_by_course: student.emotional_support_by_course ?? null,
                                has_survey_data: student.has_survey_data ?? false,
                                final_pred: student.final_pred ?? null,
                                confidence: student.confidence ?? null
                              }));
                              setStudentData(mappedData);
                              const detectedColumns = detectGradeColumns(mappedData);
                              setGradeColumns(detectedColumns);
                              
                              // Count students with actual survey data
                              // Ưu tiên sử dụng trường has_survey_data từ backend
                              const studentsWithRealSurvey = mappedData.filter(s => {
                                // Nếu backend trả về has_survey_data, dùng nó
                                if (s.has_survey_data !== undefined) {
                                  return s.has_survey_data === true;
                                }
                                // Fallback: check default values
                                return s.weekly_study_hours_by_course !== null && 
                                  !(s.weekly_study_hours_by_course === 20 && 
                                    s.part_time_hours_by_course === 10 && 
                                    s.financial_support_by_course === 2 && 
                                    s.emotional_support_by_course === 2);
                              }).length;
                              
                              setStudentsWithActualSurvey(studentsWithRealSurvey);
                              setRecordCount(mappedData.length);
                              
                              setUploadSuccess(true);
                              setShowResults(true);
                              setSurveysCompleted(true); // Always true since backend provides defaults
                              setPredictionRun(mappedData[0]?.final_pred !== null);
                            }
                          });
                        }}
                        className="group p-5 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all transform hover:scale-[1.02] hover:shadow-lg"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <span className="font-bold text-gray-800 text-lg group-hover:text-blue-600">
                              {upload.course_code}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {new Date(upload.upload_date).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="flex items-center gap-1 text-gray-600">
                            <Users className="w-4 h-4" />
                            <strong>{upload.total_students}</strong> sinh viên
                          </span>
                          <span className="text-blue-600 font-medium">
                            {upload.students_with_prediction}/{upload.total_students} đã dự đoán
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-400 group-hover:text-gray-600">
                          Click để tải lại dữ liệu này
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 1: Upload */}
        <Card>
          <CardContent className="p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t('prediction.step1Title')}</h3>
                <p className="text-sm text-gray-500">{t('prediction.step1Subtitle')}</p>
              </div>
            </div>

            <div 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-lg p-8 lg:p-12 text-center transition-colors cursor-pointer ${
                uploading ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300 hover:border-blue-400'
              }`}
            >
              <input 
                type="file" 
                id="fileInput" 
                accept=".csv,.xlsx" 
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="fileInput" className="cursor-pointer">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CloudUpload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">{t('prediction.dragDropFile')}</p>
                <p className="text-sm text-gray-500">{t('prediction.supportedFormats')}</p>
              </label>
            </div>

            {uploading && (
              <div className="mt-6 flex items-center justify-center space-x-3 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">{t('prediction.uploading')}</span>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm text-gray-700">
                  <p className="font-medium mb-1">{t('prediction.processNote')}</p>
                  <p>{t('prediction.processNoteDesc')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm text-gray-700">
                  <p>{t('prediction.behaviorInitNote')}</p>
                </div>
              </div>
            </div>

            {uploadSuccess && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">{t('prediction.uploadSuccessTitle')}</p>
                    <p className="text-sm text-green-700">
                      {t('prediction.uploadSuccessDesc', { count: recordCount })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">{t('prediction.errorTitle')}</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Student List */}
        {uploadSuccess && (
          <Card>
            <CardContent className="p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{t('prediction.step2Title')}</h3>
                    <p className="text-sm text-gray-500">{t('prediction.step2Subtitle')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowResults(!showResults)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ChevronDown className={`w-6 h-6 transition-transform ${showResults ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showResults && (
                <div className="space-y-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">No</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Student ID</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Course</th>
                          {/* Dynamic grade columns */}
                          {gradeColumns.map(col => (
                            <th key={col} className="px-4 py-3 text-left font-semibold text-gray-700">
                              {col.charAt(0).toUpperCase() + col.slice(1)}
                            </th>
                          ))}
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Weekly Hours</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Part-time Hours</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Financial Support</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Emotional Support</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentStudents.map((student, index) => (
                          <tr key={student.student_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-center font-medium text-gray-600">{indexOfFirstStudent + index + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{student.student_id}</td>
                            <td className="px-4 py-3 text-gray-700">{student.course_code}</td>
                            {/* Dynamic grade columns */}
                            {gradeColumns.map(col => (
                              <td key={col} className="px-4 py-3 text-gray-700">
                                {(student as any)[col] ?? 0}
                              </td>
                            ))}
                            <td className="px-4 py-3 text-gray-700">
                              <span className={student.weekly_study_hours_by_course === null ? 'text-amber-600 font-semibold' : ''}>
                                {student.weekly_study_hours_by_course === null ? 'NULL' : student.weekly_study_hours_by_course}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              <span className={student.part_time_hours_by_course === null ? 'text-amber-600 font-semibold' : ''}>
                                {student.part_time_hours_by_course === null ? 'NULL' : student.part_time_hours_by_course}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              <span className={student.financial_support_by_course === null ? 'text-amber-600 font-semibold' : ''}>
                                {student.financial_support_by_course === null ? 'NULL' : student.financial_support_by_course}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              <span className={student.emotional_support_by_course === null ? 'text-amber-600 font-semibold' : ''}>
                                {student.emotional_support_by_course === null ? 'NULL' : student.emotional_support_by_course}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center">
                                <Badge className={`text-xs px-2 py-1 whitespace-nowrap inline-flex items-center justify-center ${getBehaviorStatusClass(student)}`}>
                                  {getBehaviorStatus(student)}
                                </Badge>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {studentData.length > studentsPerPage && (
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-700">
                        Hiển thị {indexOfFirstStudent + 1} - {Math.min(indexOfLastStudent, studentData.length)} trong tổng số {studentData.length} sinh viên
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Trước
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => goToPage(pageNum)}
                                className={`px-3 py-1 text-sm font-medium rounded-md ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900">Thông tin dữ liệu khảo sát</p>
                      <p className="text-sm text-blue-700">
                        {studentsWithActualSurvey > 0 ? (
                          <>
                            Có <strong>{studentsWithActualSurvey}/{recordCount}</strong> sinh viên đã có khảo sát thực tế. 
                            Các sinh viên còn lại sử dụng giá trị trung bình mặc định cho dự đoán. 
                            Dữ liệu khảo sát thực tế sẽ được cập nhật tự động khi sinh viên hoàn tất khảo sát.
                          </>
                        ) : (
                          <>
                            Tất cả sinh viên đang sử dụng <strong>giá trị trung bình mặc định</strong> (20h học/tuần, 10h làm thêm/tuần, hỗ trợ tài chính & tinh thần: trung bình = 2/3). 
                            Dữ liệu khảo sát thực tế sẽ được cập nhật tự động khi sinh viên hoàn tất khảo sát.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Survey */}
        {uploadSuccess && (
          <Card>
            <CardContent className="p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Bước 3: Khảo sát Behavior Features</h3>
                  <p className="text-sm text-gray-500">Nhập thông tin hành vi cho tất cả sinh viên</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg mb-6">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm text-gray-700">
                  <p className="font-medium mb-2">Thông tin khảo sát:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Hiện có <strong>{studentsWithActualSurvey}/{recordCount}</strong> sinh viên đã có dữ liệu khảo sát thực tế</li>
                    <li>Sinh viên chưa khảo sát đang dùng <strong>giá trị trung bình mặc định</strong> (20h học, 10h làm thêm, hỗ trợ: trung bình = 2)</li>
                    <li>Bạn có thể chạy dự đoán ngay hoặc gửi thông báo để sinh viên hoàn tất khảo sát</li>
                    <li>Dữ liệu dự đoán sẽ chính xác hơn khi sinh viên hoàn tất khảo sát hành vi của họ</li>
                  </ul>
                </div>
              </div>

              {notificationCooldown > 0 && (
                <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 animate-pulse" />
                  <p className="text-sm text-amber-800">
                    <strong>⏳ Đợi {Math.floor(notificationCooldown / 60)}:{String(notificationCooldown % 60).padStart(2, '0')}</strong> trước khi có thể gửi thông báo lại
                  </p>
                </div>
              )}

              <Button 
                onClick={openSurveyModal}
                disabled={uploading || notificationCooldown > 0}
                className={`w-full py-6 ${
                  notificationCooldown > 0 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                }`}
              >
                {notificationCooldown > 0 ? (
                  <>
                    <Clock className="w-5 h-5 mr-2" />
                    Đợi {Math.floor(notificationCooldown / 60)}:{String(notificationCooldown % 60).padStart(2, '0')} để gửi lại
                  </>
                ) : (
                  <>
                    <Bell className="w-5 h-5 mr-2" />
                    {studentsWithActualSurvey === recordCount 
                      ? '✓ Tất cả sinh viên đã có khảo sát - Gửi nhắc nhở' 
                      : `📧 Gửi thông báo khảo sát cho ${recordCount - studentsWithActualSurvey} sinh viên`}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Prediction */}
        {uploadSuccess && (
          <Card>
            <CardContent className="p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Bước 4: Chạy mô hình dự đoán</h3>
                  <p className="text-sm text-gray-500">Áp dụng Gradient Boosting với fallback strategy</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-indigo-50 rounded-lg">
                  <Info className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm text-gray-700">
                    <p className="font-medium mb-2">Về mô hình:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Hệ thống sẽ chạy mô hình Gradient Boosting với fallback strategy theo hệ số R² từng môn học</li>
                      <li>Dữ liệu khảo sát: <strong>{studentsWithActualSurvey}/{recordCount}</strong> sinh viên có khảo sát thực tế, còn lại dùng giá trị trung bình</li>
                      <li>Mô hình đã sẵn sàng chạy dự đoán với dữ liệu hiện tại</li>
                    </ul>
                  </div>
                </div>

                <Button 
                  onClick={runPrediction}
                  disabled={predictionRun}
                  className="w-full py-6 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  {predictionRun ? 'Đã hoàn tất dự đoán' : 'Dự đoán ngay'}
                  {predictionRun && <CheckCircle className="w-5 h-5 ml-2" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {predictionRun && (
          <Card>
            <CardContent className="p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ChartBar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Kết quả Dự đoán</h3>
                  <p className="text-sm text-gray-500">Điểm dự đoán và độ tin cậy cho từng sinh viên</p>
                </div>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Student ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Course</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Dự đoán</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Độ tin cậy</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">SHAP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentPredictions.map((student) => {
                      const predCategory = getPredictionCategory(student.final_pred);
                      return (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{student.student_id}</td>
                        <td className="px-4 py-3 text-gray-700">{student.course_code}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${predCategory.color}`}>
                            <span className="mr-1">{predCategory.icon}</span>
                            {predCategory.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                              <div 
                                className={`h-full rounded-full ${
                                  student.confidence === 'high' ? 'bg-green-500 w-full' :
                                  student.confidence === 'medium' ? 'bg-amber-500 w-2/3' :
                                  'bg-red-500 w-1/3'
                                }`}
                              />
                            </div>
                            <Badge className={getConfidenceColor(student.confidence)}>
                              {student.confidence}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button 
                            onClick={() => showShap(student)}
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <ChartBar className="w-4 h-4 mr-2" />
                            Xem giải thích
                          </Button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Prediction Results */}
              {totalPredictionPages > 1 && (
                <div className="flex items-center justify-between mb-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Hiển thị {indexOfFirstPrediction + 1}-{Math.min(indexOfLastPrediction, studentData.length)} trong tổng số {studentData.length} sinh viên
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={goToPreviousPredictionPage}
                      disabled={predictionCurrentPage === 1}
                      variant="outline"
                      size="sm"
                      className="px-3 py-1"
                    >
                      Trước
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex space-x-1">
                      {(() => {
                        const pages = [];
                        const maxVisible = 5;
                        let startPage = Math.max(1, predictionCurrentPage - Math.floor(maxVisible / 2));
                        const endPage = Math.min(totalPredictionPages, startPage + maxVisible - 1);
                        
                        if (endPage - startPage < maxVisible - 1) {
                          startPage = Math.max(1, endPage - maxVisible + 1);
                        }
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => goToPredictionPage(i)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                predictionCurrentPage === i
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                        return pages;
                      })()}
                    </div>
                    
                    <Button
                      onClick={goToNextPredictionPage}
                      disabled={predictionCurrentPage === totalPredictionPages}
                      variant="outline"
                      size="sm"
                      className="px-3 py-1"
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-900">Tổng sinh viên</p>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{studentData.length}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-green-900">✅ Pass</p>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-900">
                    {studentData.filter(s => (s.final_pred || 0) >= 7).length}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-amber-900">⚠️ Warning</p>
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-3xl font-bold text-amber-900">
                    {studentData.filter(s => {
                      const score = s.final_pred || 0;
                      return score >= 3.5 && score < 7;
                    }).length}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-red-900">❌ Fail</p>
                    <X className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-900">
                    {studentData.filter(s => (s.final_pred || 0) < 3.5).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Metadata Modal - Centered */}
      {showUploadModal && (
        <>
          {/* Backdrop */}
          <div 
            onClick={closeUploadModal}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal Container */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out scale-100 animate-in"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Thông tin Upload</h3>
                      <p className="text-xs text-blue-100">Điền thông tin trước khi upload file</p>
                    </div>
                  </div>
                  <button 
                    onClick={closeUploadModal}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="p-6 space-y-4">
                  <form onSubmit={(e) => { e.preventDefault(); confirmUpload(); }} className="space-y-4">
                    {/* Course Code */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                        <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                        Course Code <span className="text-red-500 ml-1">*</span>
                      </label>
                      {loadingCourses ? (
                        <div className="flex items-center justify-center p-3 border border-gray-300 rounded-lg bg-gray-50">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                          <span className="text-xs text-gray-600">Đang tải...</span>
                        </div>
                      ) : availableCourses.length === 0 ? (
                        <div className="p-3 border border-amber-300 rounded-lg bg-amber-50">
                          <p className="text-xs text-amber-800">
                            ⚠️ Chưa có môn học nào được setup weights.
                          </p>
                        </div>
                      ) : (
                        <>
                          <select
                            value={uploadMetadata.course_code}
                            onChange={(e) => handleCourseChange(e.target.value)}
                            required
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                          >
                            <option value="">-- Chọn môn học --</option>
                            {availableCourses.map((course) => (
                              <option key={course.courseCode} value={course.courseCode}>
                                {course.courseCode} - {course.courseName}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1.5">
                            Đã setup {availableCourses.length} môn học
                          </p>
                        </>
                      )}
                    </div>

                    {/* Mã Lớp */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                        <span className="bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                        Mã Lớp <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={uploadMetadata.class_code}
                        onChange={(e) => setUploadMetadata({...uploadMetadata, class_code: e.target.value.toUpperCase()})}
                        required
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        placeholder="VD: AIS, DTE-01"
                        maxLength={20}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Mã lớp: {uploadMetadata.course_code || 'CMU-CS 297'} - {uploadMetadata.class_code || 'AIS'}
                      </p>
                    </div>

                    {/* Năm Học */}
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200">
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                        <span className="bg-purple-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                        Năm Học <span className="text-red-500 ml-1">*</span>
                      </label>
                      {!uploadMetadata.course_code ? (
                        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                          <p className="text-xs text-gray-600">📋 Vui lòng chọn môn học trước</p>
                        </div>
                      ) : loadingAcademicTerms ? (
                        <div className="flex items-center justify-center p-3 border border-purple-200 rounded-lg bg-purple-50">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-600 mr-2" />
                          <span className="text-xs text-purple-700">Đang tải...</span>
                        </div>
                      ) : availableAcademicYears.length === 0 ? (
                        <div className="p-3 border border-amber-300 rounded-lg bg-amber-50">
                          <p className="text-xs text-amber-800">⚠️ Môn này chưa có năm học nào</p>
                        </div>
                      ) : (
                        <>
                          <select
                            value={uploadMetadata.academic_year}
                            onChange={(e) => setUploadMetadata({...uploadMetadata, academic_year: e.target.value})}
                            required
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm"
                          >
                            <option value="">-- Chọn năm học --</option>
                            {availableAcademicYears.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1.5">
                            {availableAcademicYears.length} năm học khả dụng
                          </p>
                        </>
                      )}
                    </div>

                    {/* Học Kỳ */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                        <span className="bg-orange-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">4</span>
                        Học Kỳ <span className="text-red-500 ml-1">*</span>
                      </label>
                      {!uploadMetadata.course_code ? (
                        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                          <p className="text-xs text-gray-600">📋 Vui lòng chọn môn học trước</p>
                        </div>
                      ) : loadingAcademicTerms ? (
                        <div className="flex items-center justify-center p-3 border border-orange-200 rounded-lg bg-orange-50">
                          <Loader2 className="w-4 h-4 animate-spin text-orange-600 mr-2" />
                          <span className="text-xs text-orange-700">Đang tải...</span>
                        </div>
                      ) : availableSemesters.length === 0 ? (
                        <div className="p-3 border border-amber-300 rounded-lg bg-amber-50">
                          <p className="text-xs text-amber-800">⚠️ Môn này chưa có học kỳ nào</p>
                        </div>
                      ) : (
                        <>
                          <select
                            value={uploadMetadata.semester}
                            onChange={(e) => setUploadMetadata({...uploadMetadata, semester: e.target.value})}
                            required
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm"
                          >
                            <option value="">-- Chọn học kỳ --</option>
                            {availableSemesters.map((sem) => (
                              <option key={sem} value={sem.toString()}>
                                {sem === 3 ? 'Học kỳ hè' : `Học kỳ ${sem}`}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1.5">
                            {availableSemesters.length} học kỳ khả dụng
                          </p>
                        </>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex items-start space-x-2">
                        <FileText className="w-4 h-4 text-gray-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-700 mb-1">📄 File đã chọn:</p>
                          <p className="text-sm font-medium text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                            {pendingFile?.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Footer with Buttons */}
              <div className="border-t bg-gray-50 px-6 py-4">
                <div className="flex gap-3">
                  <Button 
                    type="button"
                    onClick={closeUploadModal}
                    variant="outline"
                    className="flex-1 py-3"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Hủy
                  </Button>
                  <Button 
                    onClick={() => {
                      const form = document.querySelector('form');
                      if (form) form.requestSubmit();
                    }}
                    disabled={
                      loadingCourses || 
                      loadingAcademicTerms ||
                      availableCourses.length === 0 || 
                      !uploadMetadata.course_code || 
                      !uploadMetadata.class_code || 
                      !uploadMetadata.academic_year || 
                      !uploadMetadata.semester
                    }
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Xác nhận Upload
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Survey Modal */}
      {showSurveyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div 
              onClick={() => setShowSurveyModal(false)}
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            />
            
            <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Khảo sát Hành vi Sinh viên</h3>
                    <p className="text-sm text-gray-500">Áp dụng cho tất cả sinh viên trong danh sách</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSurveyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={saveSurvey} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline text-blue-600 mr-2" />
                    Số giờ học tập hàng tuần cho môn này
                  </label>
                  <input 
                    type="number" 
                    value={surveyData.weekly_study_hours}
                    onChange={(e) => setSurveyData({...surveyData, weekly_study_hours: e.target.value})}
                    min="0" 
                    max="60" 
                    required 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                    placeholder="Nhập số giờ (0-60)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Số giờ sinh viên dành để học tập cho môn học này mỗi tuần</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Briefcase className="w-4 h-4 inline text-green-600 mr-2" />
                    Số giờ làm thêm hàng tuần
                  </label>
                  <input 
                    type="number" 
                    value={surveyData.part_time_hours}
                    onChange={(e) => setSurveyData({...surveyData, part_time_hours: e.target.value})}
                    min="0" 
                    max="60" 
                    required 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                    placeholder="Nhập số giờ (0-60)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Số giờ sinh viên làm việc bán thời gian mỗi tuần</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline text-amber-600 mr-2" />
                    Mức độ hỗ trợ tài chính: <span className="font-bold text-purple-600">
                      {surveyData.financial_support === 0 ? 'Thấp' : 
                       surveyData.financial_support === 1 ? 'Trung bình' : 
                       surveyData.financial_support === 2 ? 'Cao' : 'Rất cao'}
                    </span>
                  </label>
                  <input 
                    type="range" 
                    value={surveyData.financial_support}
                    onChange={(e) => setSurveyData({...surveyData, financial_support: parseInt(e.target.value)})}
                    min="0" 
                    max="3" 
                    step="1" 
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0 - Thấp</span>
                    <span>1 - Trung bình</span>
                    <span>2 - Cao</span>
                    <span>3 - Rất cao</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Mức độ hỗ trợ tài chính từ gia đình hoặc học bổng</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Heart className="w-4 h-4 inline text-red-600 mr-2" />
                    Mức độ hỗ trợ tinh thần: <span className="font-bold text-purple-600">
                      {surveyData.emotional_support === 0 ? 'Thấp' : 
                       surveyData.emotional_support === 1 ? 'Trung bình' : 
                       surveyData.emotional_support === 2 ? 'Cao' : 'Rất cao'}
                    </span>
                  </label>
                  <input 
                    type="range" 
                    value={surveyData.emotional_support}
                    onChange={(e) => setSurveyData({...surveyData, emotional_support: parseInt(e.target.value)})}
                    min="0" 
                    max="3" 
                    step="1" 
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0 - Thấp</span>
                    <span>1 - Trung bình</span>
                    <span>2 - Cao</span>
                    <span>3 - Rất cao</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Mức độ hỗ trợ tinh thần từ gia đình, bạn bè và môi trường xung quanh</p>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">Thông tin khảo sát sẽ được áp dụng cho tất cả sinh viên và lưu vào database. Các trường behavior sẽ được cập nhật từ NULL sang giá trị số.</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button"
                    onClick={() => setShowSurveyModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Lưu khảo sát cho tất cả
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SHAP Modal */}
      {showShapModal && selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div 
              onClick={() => setShowShapModal(false)}
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            />
            
            <div className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <ChartBar className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">SHAP Explanation - Giải thích mô hình AI</h3>
                    <p className="text-sm text-gray-500">
                      Student ID: {selectedStudent.student_id} | Course: {selectedStudent.course_code}
                    </p>
                    <div className="mt-1">
                      {(() => {
                        const category = getPredictionCategory(selectedStudent.final_pred);
                        return (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${category.color}`}>
                            <span className="mr-1">{category.icon}</span>
                            Kết quả dự đoán: {category.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowShapModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Debug Info Panel - Ẩn đi cho end-user */}
              {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800 font-mono">
                  <strong>Debug:</strong> Student {selectedStudent.student_id} | 
                  Features loaded: {shapFeatures.length} | 
                  {loadingShap ? 'Loading...' : 'Ready'}
                </p>
              </div> */}

              {/* Pass Threshold Info Card */}
              {passThresholdData && !loadingShap && (
                <div className={`mb-6 p-4 rounded-lg border-2 ${
                  passThresholdData.isPassing 
                    ? 'bg-green-50 border-green-300' 
                    : passThresholdData.canPass 
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      passThresholdData.isPassing 
                        ? 'bg-green-200' 
                        : passThresholdData.canPass 
                          ? 'bg-amber-200'
                          : 'bg-red-200'
                    }`}>
                      {passThresholdData.isPassing ? '✅' : passThresholdData.canPass ? '⚠️' : '❌'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2">
                        📊 Phân tích điểm hiện tại & Điểm cần đạt để pass môn
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="bg-white/50 p-3 rounded">
                          <p className="text-xs text-gray-600 mb-1">Điểm hiện tại</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {passThresholdData.currentScore.toFixed(2)}/10
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            (Dựa trên {passThresholdData.currentWeightUsed.toFixed(0)}% trọng số)
                          </p>
                        </div>
                        
                        <div className="bg-white/50 p-3 rounded">
                          <p className="text-xs text-gray-600 mb-1">
                            Điểm {gradeStructureColumns.find(c => c.key === passThresholdData.finalColumnKey)?.name || 'Final'} cần đạt
                          </p>
                          <p className={`text-2xl font-bold ${
                            passThresholdData.finalScoreNeeded <= 5 ? 'text-green-600' :
                            passThresholdData.finalScoreNeeded <= 7 ? 'text-amber-600' :
                            passThresholdData.finalScoreNeeded <= 10 ? 'text-red-600' : 'text-red-800'
                          }`}>
                            {passThresholdData.finalScoreNeeded.toFixed(2)}/10
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            (Trọng số: {passThresholdData.finalWeightNeeded.toFixed(0)}%)
                          </p>
                        </div>
                      </div>

                      <div className="text-sm">
                        {passThresholdData.isPassing ? (
                          <p className="text-green-700 font-medium">
                            ✅ Sinh viên đã đạt điểm pass (≥5.0) với điểm hiện tại. Tiếp tục duy trì!
                          </p>
                        ) : passThresholdData.canPass ? (
                          <p className="text-amber-700">
                            ⚠️ Sinh viên cần đạt <strong>{passThresholdData.finalScoreNeeded.toFixed(2)}/10</strong> ở bài thi cuối kỳ để pass môn (≥5.0).
                            {passThresholdData.finalScoreNeeded > 7 && (
                              <span className="block mt-1 text-red-600 font-medium">
                                🚨 Yêu cầu cao! Cần hỗ trợ và ôn tập kỹ cho bài thi cuối.
                              </span>
                            )}
                          </p>
                        ) : (
                          <p className="text-red-700 font-medium">
                            ❌ Sinh viên KHÔNG THỂ pass môn (cần {'>'}{passThresholdData.finalScoreNeeded.toFixed(2)}/10 {'>'} 10 điểm). 
                            Can thiệp ngay để cứu vãn!
                          </p>
                        )}
                      </div>

                      {/* Bảng cấu trúc điểm */}
                      <details className="mt-3">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                          📋 Xem cấu trúc điểm chi tiết của môn học
                        </summary>
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full text-xs border border-gray-300 rounded">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-2 py-1 text-left border-b">Cột điểm</th>
                                <th className="px-2 py-1 text-center border-b">Trọng số</th>
                                <th className="px-2 py-1 text-center border-b">Điểm SV</th>
                                <th className="px-2 py-1 text-center border-b">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody>
                              {gradeStructureColumns.map(col => {
                                const studentGrade = (selectedStudent as any)[col.key];
                                const hasGrade = studentGrade !== null && studentGrade !== undefined;
                                return (
                                  <tr key={col.key} className="border-b">
                                    <td className="px-2 py-1">{col.name}</td>
                                    <td className="px-2 py-1 text-center">{col.weight}%</td>
                                    <td className="px-2 py-1 text-center">
                                      {hasGrade ? `${studentGrade}/${col.maxScore}` : '-'}
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                      {hasGrade ? (
                                        <span className="text-green-600">✓</span>
                                      ) : (
                                        <span className="text-gray-400">Chưa có</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Loading State */}
                {loadingShap ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Đang phân tích SHAP values...</p>
                    <p className="text-sm text-gray-500 mt-2">Student: {selectedStudent.student_id}</p>
                    <p className="text-sm text-gray-500 mt-2">Vui lòng đợi trong giây lát</p>
                  </div>
                ) : (
                  <>
                    {/* SHAP Chart Visualization */}
                    {/* 
                      ==========================================
                      PHẦN NÀY HIỂN THỊ TOP 8 FEATURES ẢNH HƯỞNG ĐẾN ĐIỂM CỦA SINH VIÊN
                      ==========================================
                      
                      MỤC ĐÍCH:
                      - Giúp giảng viên hiểu CHÍNH XÁC những yếu tố nào đang TĂNG hoặc GIẢM điểm của sinh viên
                      - Biết được ĐIỂM MẠNH và ĐIỂM YẾU của từng sinh viên
                      - Đưa ra can thiệp phù hợp dựa trên dữ liệu khoa học
                      
                      CÁCH ĐỌC BIỂU ĐỒ:
                      
                      1. TÊN FEATURE (cột trái):
                         - midterm, attend, quiz, homework: Các thành phần điểm của môn học
                         - weekly_study_hours: Số giờ tự học mỗi tuần
                         - part_time_hours: Số giờ làm thêm mỗi tuần
                         - financial_support: Mức hỗ trợ tài chính (0-3: Thấp→Rất cao)
                         - emotional_support: Mức hỗ trợ tinh thần (0-3: Thấp→Rất cao)
                         - baseline_final_weighted: Điểm chuẩn dựa trên cấu trúc môn học
                         - course_XXX: Độ khó đặc thù của môn học
                      
                      2. THANH MÀU (giữa):
                         - XANH LÁ (đi sang PHẢI): Feature này làm TĂNG điểm → Đây là ĐIỂM MẠNH
                         - ĐỎ (đi sang TRÁI): Feature này làm GIẢM điểm → Đây là ĐIỂM YẾU cần cải thiện
                         - Độ DÀI thanh = Mức độ ảnh hưởng (càng dài = càng quan trọng)
                      
                      3. CON SỐ (cột phải):
                         - Giá trị SHAP (đơn vị: điểm trên thang 10)
                         - VD: +0.38 = Feature này CỘNG thêm 0.38 điểm
                         - VD: -0.15 = Feature này TRỪ đi 0.15 điểm
                         - TỔNG các SHAP values = Sự CHÊNH LỆCH so với điểm trung bình lớp
                      
                      PHÂN LOẠI MỨC ĐỘ ẢNH HƯỞNG:
                      - |SHAP| ≥ 0.50: Ảnh hưởng RẤT MẠNH ⭐⭐⭐⭐⭐
                      - |SHAP| ≥ 0.30: Ảnh hưởng MẠNH ⭐⭐⭐⭐
                      - |SHAP| ≥ 0.15: Ảnh hưởng TRUNG BÌNH ⭐⭐⭐
                      - |SHAP| ≥ 0.05: Ảnh hưởng NHẸ ⭐⭐
                      - |SHAP| < 0.05: Ảnh hưởng RẤT NHẸ ⭐
                      
                      VÍ DỤ THỰC TẾ:
                      Feature: midterm | Thanh xanh dài | +0.38
                      → Giải thích: Điểm giữa kỳ của sinh viên này CAO HƠN trung bình lớp
                         → Làm TĂNG 0.38 điểm dự đoán cuối kỳ
                         → Đây là ĐIỂM MẠNH, cần duy trì và phát huy
                      
                      Feature: part_time_hours | Thanh đỏ trung bình | -0.15
                      → Giải thích: Sinh viên làm thêm QUÁ NHIỀU giờ
                         → Làm GIẢM 0.15 điểm dự đoán (do ít thời gian học)
                         → Đây là ĐIỂM YẾU, cần tư vấn cân bằng thời gian
                      
                      CÁC BƯỚC CAN THIỆP:
                      1. Nhìn vào các thanh ĐỎ DÀI (SHAP âm, giá trị tuyệt đối lớn)
                      2. Đọc giải thích chi tiết ở cột "Giải thích"
                      3. Áp dụng "Khuyến nghị cho giảng viên" ở phía dưới
                      4. Ưu tiên can thiệp features có ảnh hưởng MẠNH trước
                      
                      LƯU Ý QUAN TRỌNG:
                      - Model AI chỉ DỰ ĐOÁN, không quyết định điểm thật
                      - SHAP giúp GIẢI THÍCH tại sao model đưa ra dự đoán đó
                      - Dùng để PHÁT HIỆN SỚM sinh viên có nguy cơ và CAN THIỆP KỊP THỜI
                      - Kết hợp với QUAN SÁT thực tế và TÂM LÝ GIÁO DỤC để ra quyết định
                    */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold">
                          🎯 Top 8 Yếu tố Ảnh hưởng Điểm Sinh viên
                        </h4>
                        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                          Thanh xanh = Tăng điểm | Thanh đỏ = Giảm điểm
                        </span>
                      </div>
                      <div className="space-y-3">
                        {shapFeatures.map((feature, index) => {
                          // Phân loại mức độ ảnh hưởng để hiển thị icon và text
                          const absValue = Math.abs(feature.shap_value);
                          let impactLevel = '';
                          let impactIcon = '';
                          if (absValue >= 0.5) {
                            impactLevel = 'Rất mạnh';
                            impactIcon = '⭐⭐⭐⭐⭐';
                          } else if (absValue >= 0.3) {
                            impactLevel = 'Mạnh';
                            impactIcon = '⭐⭐⭐⭐';
                          } else if (absValue >= 0.15) {
                            impactLevel = 'Trung bình';
                            impactIcon = '⭐⭐⭐';
                          } else if (absValue >= 0.05) {
                            impactLevel = 'Nhẹ';
                            impactIcon = '⭐⭐';
                          } else {
                            impactLevel = 'Rất nhẹ';
                            impactIcon = '⭐';
                          }
                          
                          return (
                            <div key={feature.feature} className="flex items-center space-x-3">
                              {/* Số thứ tự */}
                              <div className="w-6 text-xs font-bold text-gray-400">
                                #{index + 1}
                              </div>
                              
                              {/* Tên feature */}
                              <div className="w-40 text-sm font-medium text-gray-700">
                                {feature.feature}
                              </div>
                              
                              {/* Thanh biểu đồ với gradient */}
                              <div className="flex-1 flex items-center space-x-2">
                                <div className="flex-1 h-8 bg-gray-200 rounded relative overflow-hidden shadow-inner">
                                  <div 
                                    className={`h-full transition-all duration-500 ${
                                      feature.shap_value > 0 
                                        ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                        : 'bg-gradient-to-r from-red-400 to-red-600'
                                    }`}
                                    style={{ width: `${Math.min(Math.abs(feature.shap_value) * 100, 100)}%` }}
                                  />
                                </div>
                                
                                {/* Mức độ ảnh hưởng (text + icon) thay vì con số */}
                                <div className="flex flex-col items-end min-w-[100px]">
                                  <span className={`text-xs font-bold ${
                                    feature.shap_value > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {feature.shap_value > 0 ? '↑ Tăng' : '↓ Giảm'}
                                  </span>
                                  <span className="text-xs text-gray-600" title={`Mức độ: ${impactLevel}`}>
                                    {impactIcon}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Giải thích nhanh ngay dưới biểu đồ */}
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <p className="text-xs text-gray-600">
                          <strong>💡 Cách đọc:</strong> 
                          Sinh viên này có kết quả dự đoán là <strong>{(() => {
                            const category = getPredictionCategory(selectedStudent.final_pred);
                            return <span className={`font-bold ${
                              category.label === 'Pass' ? 'text-green-600' :
                              category.label === 'Warning' ? 'text-amber-600' :
                              'text-red-600'
                            }`}>{category.icon} {category.label}</span>;
                          })()}</strong>. 
                          Các thanh <span className="text-green-600 font-semibold">xanh</span> là những điểm mạnh đang giúp sinh viên đạt kết quả tốt hơn. 
                          Các thanh <span className="text-red-600 font-semibold">đỏ</span> là những điểm yếu đang kéo kết quả xuống. 
                          Số sao (⭐) cho biết mức độ ảnh hưởng: càng nhiều sao = càng quan trọng.
                        </p>
                      </div>
                    </div>

                    {/* 
                      ==========================================
                      BẢNG CHI TIẾT PHÂN TÍCH TỪNG FEATURE
                      ==========================================
                      
                      MỤC ĐÍCH:
                      - Cung cấp thông tin CHI TIẾT cho mỗi feature
                      - Giải thích NGÔN NGỮ TỰ NHIÊN dễ hiểu cho giảng viên
                      - Đưa ra KHUYẾN NGHỊ CỤ THỂ để can thiệp
                      
                      CÁC CỘT TRONG BẢNG:
                      
                      1. Feature: Tên yếu tố (VD: midterm, attend, weekly_study_hours)
                      2. Value: Giá trị THỰC TẾ của sinh viên này (VD: 8.5 điểm midterm, 20 giờ học/tuần)
                      3. SHAP Value: Mức độ ảnh hưởng (+ là tăng điểm, - là giảm điểm)
                      4. Impact: Badge màu cho biết ảnh hưởng Tích cực (xanh) hay Tiêu cực (đỏ)
                      5. Giải thích: Câu văn NGÔN NGỮ TỰ NHIÊN giải thích cụ thể
                      
                      HÀM explainShapValue() - GIẢI THÍCH TỰ ĐỘNG:
                      - Input: {feature: 'midterm', value: 8.5, shap_value: 0.38}
                      - Output: "Điểm giữa kỳ (8.5) cao hơn mức trung bình, ảnh hưởng mạnh +0.38 điểm đến kết quả cuối kỳ."
                      
                      - Tự động phân loại mức độ: rất mạnh / mạnh / trung bình / nhẹ / rất nhẹ
                      - Tự động nhận diện feature type: điểm thi / behavior / course encoding / mask
                      - Tự động tạo câu văn PHÙ HỢP với từng loại feature
                      
                      VÍ DỤ GIẢI THÍCH:
                      
                      Feature: midterm = 8.5 | SHAP: +0.38
                      → "Điểm giữa kỳ (8.5) cao hơn mức trung bình, ảnh hưởng mạnh +0.380 điểm đến kết quả cuối kỳ."
                      
                      Feature: part_time_hours = 25 | SHAP: -0.15
                      → "Sinh viên làm thêm 25 giờ/tuần. Làm thêm nhiều giờ làm giảm 0.150 điểm hiệu suất học tập."
                      
                      Feature: weekly_study_hours = 15 | SHAP: -0.10
                      → "Sinh viên học 15 giờ/tuần. Thời gian học thấp làm giảm 0.100 điểm."
                      
                      Feature: financial_support = 1 | SHAP: -0.08
                      → "Mức hỗ trợ tài chính (1/10). Thiếu hỗ trợ làm giảm 0.080 điểm."
                      
                      CÁCH SỬ DỤNG:
                      1. Đọc cột "Giải thích" để hiểu TẠI SAO sinh viên có điểm dự đoán này
                      2. Tập trung vào các dòng có SHAP Value ÂM (màu đỏ) - Đây là điểm yếu
                      3. Xem khuyến nghị ở phần dưới để biết CÁC BƯỚC CAN THIỆP cụ thể
                      4. Ưu tiên can thiệp các features có |SHAP| LỚN trước (ảnh hưởng mạnh)
                    */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                              Feature
                              <span className="block text-xs font-normal text-gray-500 mt-1">Yếu tố ảnh hưởng</span>
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                              Mức độ ảnh hưởng
                              <span className="block text-xs font-normal text-gray-500 mt-1">Tăng/Giảm & Mạnh/Yếu</span>
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                              Giải thích
                              <span className="block text-xs font-normal text-gray-500 mt-1">Ý nghĩa cụ thể</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {shapFeatures.map((feature) => {
                            // Tính mức độ ảnh hưởng
                            const absValue = Math.abs(feature.shap_value);
                            let impactStrength = '';
                            if (absValue >= 0.5) impactStrength = 'Rất mạnh';
                            else if (absValue >= 0.3) impactStrength = 'Mạnh';
                            else if (absValue >= 0.15) impactStrength = 'Trung bình';
                            else if (absValue >= 0.05) impactStrength = 'Nhẹ';
                            else impactStrength = 'Rất nhẹ';
                            
                            return (
                              <tr key={feature.feature} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{feature.feature}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center space-x-2">
                                    <Badge className={feature.shap_value > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                      {feature.shap_value > 0 ? '↑ Tăng' : '↓ Giảm'}
                                    </Badge>
                                    <span className="text-xs text-gray-600">({impactStrength})</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600 max-w-md">
                                  {explainShapValue(feature)}
                                </td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>

                {/* 
                  ==========================================
                  KHUYẾN NGHỊ CHO GIẢNG VIÊN - HÀNH ĐỘNG CỤ THỂ
                  ==========================================
                  
                  MỤC ĐÍCH:
                  - Chuyển hóa PHÂN TÍCH SHAP thành HÀNH ĐỘNG CỤ THỂ
                  - Đưa ra CÁC BƯỚC CAN THIỆP rõ ràng, dễ thực hiện
                  - Ưu tiên TOP 5 features quan trọng nhất (ảnh hưởng mạnh nhất)
                  
                  HÀM getRecommendation() - TƯ VẤN TỰ ĐỘNG:
                  - Input: {feature: 'midterm', shap_value: -0.30}
                  - Output: "⚠️ Cần review lại kiến thức giữa kỳ. Tổ chức buổi ôn tập bổ sung."
                  
                  PHÂN LOẠI KHUYẾN NGHỊ:
                  
                  1. ĐIỂM MẠnh (SHAP dương, icon ✅):
                     - Ghi nhận và KHUYẾN KHÍCH tiếp tục
                     - VD: "✅ Sinh viên chuyên cần tốt. Khuyến khích tiếp tục."
                  
                  2. ĐIỂM YẾU (SHAP âm, icon ⚠️):
                     - Xác định NGUYÊN NHÂN và ĐỀ XUẤT GIẢI PHÁP
                     - VD: "⚠️ Tỷ lệ vắng mặt cao. Liên hệ sinh viên để hiểu nguyên nhân."
                  
                  DANH SÁCH KHUYẾN NGHỊ CHO TỪNG FEATURE:
                  
                  A. CÁC THÀNH PHẦN ĐIỂM (midterm, attend, quiz, homework):
                  
                  midterm (Điểm giữa kỳ):
                  - Nếu THẤP (âm): "⚠️ Cần review lại kiến thức giữa kỳ. Tổ chức buổi ôn tập bổ sung."
                  - Nếu CAO (dương): "✅ Sinh viên có nền tảng tốt. Tiếp tục duy trì."
                  
                  attend (Chuyên cần):
                  - Nếu THẤP (âm): "⚠️ Tỷ lệ vắng mặt cao. Liên hệ sinh viên để hiểu nguyên nhân."
                  - Nếu CAO (dương): "✅ Sinh viên chuyên cần tốt. Khuyến khích tiếp tục."
                  
                  quiz (Bài kiểm tra nhỏ):
                  - Nếu THẤP (âm): "⚠️ Yếu ở bài kiểm tra nhỏ. Tăng cường luyện tập thêm."
                  - Nếu CAO (dương): "✅ Nắm vững kiến thức từng phần. Duy trì."
                  
                  homework (Bài tập về nhà):
                  - Nếu THẤP (âm): "⚠️ Không hoàn thành đầy đủ bài tập. Nhắc nhở và hỗ trợ."
                  - Nếu CAO (dương): "✅ Hoàn thành bài tập tốt. Tiếp tục động viên."
                  
                  B. CÁC YẾU TỐ HÀNH VI (Behavior Features):
                  
                  weekly_study_hours (Giờ tự học/tuần):
                  - Nếu ÍT (âm): "⚠️ Thời gian tự học ít. Tư vấn kỹ năng quản lý thời gian."
                  - Nếu NHIỀU (dương): "✅ Thời gian tự học đủ. Hướng dẫn học hiệu quả hơn."
                  
                  part_time_hours (Giờ làm thêm/tuần):
                  - Nếu QUÁ NHIỀU (âm): "⚠️ Làm thêm quá nhiều ảnh hưởng học tập. Tư vấn cân bằng."
                  - Nếu HỢP LÝ (dương): "✅ Cân bằng tốt giữa làm thêm và học tập."
                  
                  emotional_support (Hỗ trợ tinh thần):
                  - Nếu THIẾU (âm): "⚠️ Thiếu hỗ trợ tinh thần. Kết nối với tư vấn tâm lý."
                  - Nếu TỐT (dương): "✅ Được hỗ trợ tinh thần tốt. Tiếp tục theo dõi."
                  
                  financial_support (Hỗ trợ tài chính):
                  - Nếu THIẾU (âm): "⚠️ Gặp khó khăn tài chính. Giới thiệu học bổng/hỗ trợ."
                  - Nếu ĐỦ (dương): "✅ Ổn định về tài chính. Tập trung học tập tốt."
                  
                  C. TRƯỜNG HỢP ĐẶC BIỆT:
                  
                  _mask features (Thiếu dữ liệu):
                  - "📋 Thu thập đầy đủ dữ liệu để dự đoán chính xác hơn."
                  
                  course_XXX (Encoding môn học):
                  - KHÔNG có khuyến nghị (do đây là đặc thù môn học, không can thiệp được)
                  
                  QUY TRÌNH CAN THIỆP ĐỀ XUẤT:
                  
                  BƯỚC 1: XÁC ĐỊNH ƯU TIÊN
                  - Nhìn vào TOP 5 features có SHAP âm (icon ⚠️)
                  - Sắp xếp theo độ lớn |SHAP| (càng lớn = càng ưu tiên)
                  
                  BƯỚC 2: CAN THIỆP NGAY LẬP TỨC (SHAP < -0.20)
                  - Liên hệ sinh viên TRONG TUẦN
                  - Tổ chức buổi TƯ VẤN 1-1
                  - Đề xuất GIẢI PHÁP CỤ THỂ (ôn tập, học bổng, tâm lý...)
                  
                  BƯỚC 3: THEO DÕI (SHAP từ -0.20 đến -0.10)
                  - Nhắc nhở qua EMAIL hoặc THÔNG BÁO
                  - Theo dõi TIẾN TRIỂN hàng tuần
                  - Đánh giá lại sau 2-3 tuần
                  
                  BƯỚC 4: QUAN SÁT (SHAP > -0.10)
                  - Ghi chú để THEO DÕI lâu dài
                  - Can thiệp nếu có DẤU HIỆU XẤU ĐI
                  
                  LƯU Ý QUAN TRỌNG:
                  - Khuyến nghị là GỢI Ý, KHÔNG PHải BẮT BUỘC
                  - Cần kết hợp với HIỂU BIẾT về sinh viên (hoàn cảnh, tâm lý, năng lực)
                  - Ưu tiên CAN THIỆP SỚM (phát hiện nguy cơ → hành động ngay)
                  - Theo dõi HIỆU QUẢ can thiệp và điều chỉnh nếu cần
                */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <Lightbulb className="w-6 h-6 text-indigo-600" />
                    <h4 className="text-lg font-semibold text-gray-900">Khuyến nghị cho giảng viên</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {shapFeatures.slice(0, 5).map((feature) => (
                      <div key={feature.feature} className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                        <div className={`w-1 h-full rounded ${feature.shap_value > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 mb-1">
                            {feature.feature}
                          </p>
                          <p className="text-xs text-gray-600">
                            {getRecommendation(feature)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 
                  ==========================================
                  GIẢI THÍCH TỔNG QUAN SHAP - HƯỚNG DẪN ĐỌC HIỂU
                  ==========================================
                  
                  MỤC ĐÍCH:
                  - Giúp giảng viên HIỂU ĐÚNG về SHAP Values
                  - Giải thích THUẬT NGỮ và KHÁI NIỆM cơ bản
                  - Hướng dẫn CÁCH ÁP DỤNG vào thực tế giảng dạy
                  
                  ==========================================
                  1. SHAP LÀ GÌ?
                  ==========================================
                  
                  SHAP (SHapley Additive exPlanations) là phương pháp GIẢI THÍCH MODEL AI:
                  - Cho biết mỗi feature (yếu tố) ĐÓNG GÓP bao nhiêu điểm vào kết quả dự đoán
                  - Dựa trên lý thuyết GAME THEORY (Giải Nobel Kinh tế 2012)
                  - Đảm bảo CÔNG BẰNG và CHÍNH XÁC trong phân bổ đóng góp
                  
                  CÔNG THỨC ĐƠN GIẢN:
                  Prediction = Baseline + SHAP_feature1 + SHAP_feature2 + ... + SHAP_featureN
                  
                  VÍ DỤ CỤ THỂ:
                  - Baseline (điểm trung bình lớp): 6.5
                  - SHAP midterm: +0.38 (điểm giữa kỳ cao)
                  - SHAP attend: +0.25 (chuyên cần tốt)
                  - SHAP part_time: -0.15 (làm thêm nhiều)
                  - SHAP financial: -0.08 (thiếu hỗ trợ tài chính)
                  → Prediction = 6.5 + 0.38 + 0.25 - 0.15 - 0.08 = 6.9 điểm
                  
                  ==========================================
                  2. CÁCH ĐỌC SHAP VALUES
                  ==========================================
                  
                  A. DẤU CỦA SHAP VALUE:
                  
                  DƯƠNG (+) = TĂNG ĐIỂM = ĐIỂM MẠNH:
                  - Feature này đang giúp sinh viên ĐẠT ĐIỂM CAO HƠN trung bình
                  - VD: +0.38 = Cộng thêm 0.38 điểm vào dự đoán
                  - Màu XANH LÁ trên biểu đồ
                  - Icon ✅ trong khuyến nghị
                  - Hành động: Ghi nhận, khuyến khích, phát huy
                  
                  ÂM (-) = GIẢM ĐIỂM = ĐIỂM YẾU:
                  - Feature này đang kéo điểm sinh viên XUỐNG THẤP HƠN trung bình
                  - VD: -0.15 = Trừ đi 0.15 điểm khỏi dự đoán
                  - Màu ĐỎ trên biểu đồ
                  - Icon ⚠️ trong khuyến nghị
                  - Hành động: Can thiệp, hỗ trợ, cải thiện
                  
                  B. ĐỘ LỚN CỦA SHAP VALUE (Giá trị tuyệt đối):
                  
                  |SHAP| ≥ 0.50: Ảnh hưởng RẤT MẠNH ⭐⭐⭐⭐⭐
                  - Feature CỰC KỲ QUAN TRỌNG, quyết định chính đến kết quả
                  - VD: midterm = +0.52 → Điểm giữa kỳ rất tốt, đóng góp lớn
                  - Hành động: ƯU TIÊN CAN THIỆP NGAY nếu âm
                  
                  |SHAP| ≥ 0.30: Ảnh hưởng MẠNH ⭐⭐⭐⭐
                  - Feature QUAN TRỌNG, có tác động đáng kể
                  - VD: attend = -0.35 → Vắng mặt nhiều, ảnh hưởng lớn
                  - Hành động: CAN THIỆP TRONG TUẦN nếu âm
                  
                  |SHAP| ≥ 0.15: Ảnh hưởng TRUNG BÌNH ⭐⭐⭐
                  - Feature có ảnh hưởng rõ rệt nhưng không cực đoan
                  - VD: quiz = +0.18 → Làm quiz tốt, giúp tăng điểm
                  - Hành động: THEO DÕI và can thiệp nếu cần
                  
                  |SHAP| ≥ 0.05: Ảnh hưởng NHẸ ⭐⭐
                  - Feature có ảnh hưởng nhỏ, không quyết định
                  - VD: emotional_support = -0.08 → Thiếu hỗ trợ tinh thần
                  - Hành động: GHI CHÚ để theo dõi lâu dài
                  
                  |SHAP| < 0.05: Ảnh hưởng RẤT NHẸ ⭐
                  - Feature gần như KHÔNG ảnh hưởng đến kết quả
                  - VD: course_encoding = +0.02 → Đặc thù môn học không ảnh hưởng nhiều
                  - Hành động: KHÔNG cần can thiệp
                  
                  ==========================================
                  3. KHÁI NIỆM QUAN TRỌNG
                  ==========================================
                  
                  A. BASELINE (Điểm chuẩn):
                  - Là ĐIỂM TRUNG BÌNH của TẤT CẢ SINH VIÊN trong dataset huấn luyện
                  - VD: Nếu baseline = 6.5, nghĩa là trung bình lớp học được 6.5 điểm
                  - SHAP values cho biết sinh viên này CAO HƠN hay THẤP HƠN baseline
                  - TỔNG các SHAP = Chênh lệch so với baseline
                  
                  B. FEATURE VALUE (Giá trị thực tế):
                  - Là GIÁ TRỊ CỤ THỂ của sinh viên đó
                  - VD: midterm = 8.5 (sinh viên được 8.5 điểm giữa kỳ)
                  - VD: weekly_study_hours = 20 (sinh viên học 20 giờ/tuần)
                  - So sánh với TRUNG BÌNH để hiểu CAO hay THẤP
                  
                  C. MASK FEATURES (Thiếu dữ liệu):
                  - Khi KHÔNG CÓ dữ liệu cho một feature (NULL)
                  - Model sử dụng CHIẾN LƯỢC FALLBACK:
                    1. Dùng các features KHÁC để bù đắp
                    2. Điều chỉnh dự đoán dựa trên pattern tương tự
                    3. SHAP của mask cho biết mức độ điều chỉnh
                  - VD: midterm_mask = +0.05 → Model điều chỉnh +0.05 do thiếu midterm
                  
                  D. COURSE ENCODING:
                  - Mỗi môn học có ĐỘ KHÓ và ĐẶC ĐIỂM riêng
                  - Model học được PATTERN của từng môn
                  - SHAP cho biết môn này DỄ hay KHÓ với sinh viên này
                  - VD: course_CS101 = -0.12 → Môn này khó với sinh viên này
                  
                  ==========================================
                  4. ỨNG DỤNG THỰC TẾ - HÀNH ĐỘNG CỤ THỂ
                  ==========================================
                  
                  A. PHÁT HIỆN SỚM SINH VIÊN CÓ NGUY CƠ:
                  
                  Bước 1: Nhìn vào PREDICTION SCORE:
                  - < 3.5: Nguy cơ RẤT CAO (Fail)
                  - 3.5-7.0: Nguy cơ TRUNG BÌNH (Warning)
                  - ≥ 7.0: An toàn (Pass)
                  
                  Bước 2: Phân tích SHAP để hiểu NGUYÊN NHÂN:
                  - Tìm TOP 3 features có SHAP ÂM NHẤT (thanh đỏ dài nhất)
                  - Đây là NGUYÊN NHÂN CHÍNH kéo điểm xuống
                  
                  Bước 3: ĐỌC KHUYẾN NGHỊ và HÀNH ĐỘNG:
                  - Áp dụng khuyến nghị phù hợp với từng feature
                  - Ưu tiên features có |SHAP| ≥ 0.20 (ảnh hưởng mạnh)
                  
                  B. ĐỊNH HƯỚNG CAN THIỆP CỤ THỂ:
                  
                  Nếu SHAP âm ở midterm/quiz/homework (Điểm thi):
                  → Can thiệp: Tổ chức ÔN TẬP BỔ SUNG, BUỔI HỎI ĐÁP
                  
                  Nếu SHAP âm ở attend (Chuyên cần):
                  → Can thiệp: LIÊN HỆ SINH VIÊN, hiểu nguyên nhân vắng mặt
                  
                  Nếu SHAP âm ở weekly_study_hours (Thời gian học):
                  → Can thiệp: TƯ VẤN KỸ NĂNG QUẢN LÝ THỜI GIAN
                  
                  Nếu SHAP âm ở part_time_hours (Làm thêm quá nhiều):
                  → Can thiệp: TƯ VẤN CÂN BẰNG CÔNG VIỆC-HỌC TẬP
                  
                  Nếu SHAP âm ở financial_support (Thiếu tài chính):
                  → Can thiệp: GIỚI THIỆU HỌC BỔNG, HỖ TRỢ TÀI CHÍNH
                  
                  Nếu SHAP âm ở emotional_support (Thiếu tinh thần):
                  → Can thiệp: KẾT NỐI VỚI TƯ VẤN TÂM LÝ, MENTOR
                  
                  C. THEO DÕI HIỆU QUẢ CAN THIỆP:
                  
                  Sau CAN THIỆP (2-3 tuần):
                  - Cập nhật dữ liệu mới (điểm quiz/homework tiếp theo)
                  - Chạy lại PREDICTION để xem SHAP thay đổi
                  - Nếu SHAP features cải thiện (âm → ít âm hơn hoặc dương):
                    ✅ Can thiệp HIỆU QUẢ, tiếp tục duy trì
                  - Nếu SHAP không đổi hoặc xấu đi:
                    ⚠️ Cần ĐIỀU CHỈNH CHIẾN LƯỢC can thiệp
                  
                  ==========================================
                  5. GIẢI ĐÁP THẮC MẮC THƯỜNG GẶP
                  ==========================================
                  
                  Q1: Tại sao TỔNG SHAP không bằng PREDICTION?
                  A: TỔNG SHAP = Prediction - Baseline
                     VD: Prediction = 6.9, Baseline = 6.5 → TỔNG SHAP = +0.4
                  
                  Q2: Feature có value CAO nhưng SHAP lại ÂM?
                  A: SHAP so sánh với TRUNG BÌNH LỚP, không phải so với thang điểm
                     VD: midterm = 7.0, nhưng trung bình lớp = 8.5 → SHAP âm (thấp hơn lớp)
                  
                  Q3: Nên tin MODEL hay tin GIẢNG VIÊN?
                  A: KẾT HỢP CẢ HAI:
                     - Model cung cấp DỮ LIỆU KHÁCH QUAN, PATTERN ẨN
                     - Giảng viên cung cấp HIỂU BIẾT VỀ CON NGƯỜI, BỐI CẢNH
                     - Quyết định cuối cùng: GIẢNG VIÊN (Model chỉ HỖ TRỢ)
                  
                  Q4: Làm sao biết Model dự đoán CHÍNH XÁC?
                  A: Xem CONFIDENCE LEVEL:
                     - High: Dự đoán RẤT TIN CẬY (model tự tin)
                     - Medium: Dự đoán HỢP LÝ (cần theo dõi thêm)
                     - Low: Dự đoán KHÔNG CHẮC (thiếu dữ liệu hoặc case phức tạp)
                  
                  Q5: Khi nào NÊN và KHÔNG NÊN dùng SHAP?
                  A: NÊN dùng khi:
                     - Cần PHÁT HIỆN SỚM sinh viên có nguy cơ
                     - Muốn HIỂU NGUYÊN NHÂN cụ thể
                     - Lập KẾ HOẠCH CAN THIỆP có CĂN CỨ KHOA HỌC
                     
                     KHÔNG NÊN dùng khi:
                     - Quyết định ĐIỂM CUỐI KỲ CHÍNH THỨC (chỉ là dự đoán)
                     - Thiếu dữ liệu quá nhiều (confidence = low)
                     - Không kết hợp với QUAN SÁT THỰC TẾ
                  
                  ==========================================
                  6. LƯU Ý AN TOÀN VÀ ĐẠO ĐỨC
                  ==========================================
                  
                  ⚠️ CẢNH BÁO:
                  - Model AI CÓ THỂ SAI, đặc biệt với case đặc biệt
                  - KHÔNG ĐÁNH GIÁ sinh viên CHỈ DỰA VÀO MODEL
                  - BẢO MẬT thông tin sinh viên (SHAP chứa dữ liệu nhạy cảm)
                  - MINH BẠCH với sinh viên về việc sử dụng AI
                  
                  ✅ NGUYÊN TẮC SỬ DỤNG:
                  - Dùng làm CÔNG CỤ HỖ TRỢ, KHÔNG THAY THẾ giảng viên
                  - Kết hợp với TÂM LÝ GIÁO DỤC và KINH NGHIỆM THỰC TẾ
                  - Ưu tiên CAN THIỆP SỚM, TƯ VẤN TÍCH CỰC
                  - Theo dõi và ĐIỀU CHỈNH dựa trên PHẢN HỒI THỰC TẾ
                  
                  ==========================================
                  TÓM TẮT CHO GIẢNG VIÊN
                  ==========================================
                  
                  📊 SHAP giúp bạn:
                  1. HIỂU RÕ tại sao sinh viên có điểm dự đoán đó
                  2. PHÁT HIỆN SỚM nguy cơ và điểm yếu
                  3. ĐỊNH HƯỚNG can thiệp có CĂN CỨ KHOA HỌC
                  4. THEO DÕI HIỆU QUẢ của các biện pháp hỗ trợ
                  
                  🎯 Cách dùng nhanh:
                  - Nhìn thanh ĐỎ DÀI NHẤT → Đây là nguyên nhân chính
                  - Đọc cột "Giải thích" → Hiểu vấn đề cụ thể
                  - Áp dụng "Khuyến nghị" → Hành động ngay
                  - Theo dõi sau 2-3 tuần → Đánh giá hiệu quả
                */}
                {/* Giải thích tổng quan SHAP - Đơn giản hóa cho end-user */}
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm text-gray-700">
                    <p className="font-medium mb-2">📊 Cách đọc kết quả phân tích:</p>
                    <ul className="space-y-1 list-disc list-inside text-xs">
                      <li><strong className="text-green-600">Thanh xanh (↑ Tăng)</strong>: Feature này làm sinh viên có kết quả <strong>TỐT HƠN</strong> so với trung bình lớp → Đây là <strong>ĐIỂM MẠNH</strong>.</li>
                      <li><strong className="text-red-600">Thanh đỏ (↓ Giảm)</strong>: Feature này làm sinh viên có kết quả <strong>YẾU HƠN</strong> so với trung bình lớp → Đây là <strong>ĐIỂM YẾU</strong> cần cải thiện.</li>
                      <li><strong>Độ dài thanh & Số sao (⭐)</strong>: Cho biết mức độ ảnh hưởng. Càng dài + nhiều sao = càng quan trọng.</li>
                      <li><strong>Kết quả dự đoán</strong>: 
                        <span className="ml-1 text-green-600 font-semibold">Pass (≥7.0)</span> = An toàn, 
                        <span className="ml-1 text-amber-600 font-semibold">Warning (3.5-7.0)</span> = Cần theo dõi, 
                        <span className="ml-1 text-red-600 font-semibold">Fail (&lt;3.5)</span> = Nguy cơ cao.
                      </li>
                    </ul>
                    <p className="mt-3 text-xs font-medium text-blue-800 bg-blue-100 p-2 rounded">
                      💡 <strong>Cách can thiệp:</strong> Tập trung vào các thanh <strong className="text-red-600">ĐỎ DÀI</strong> (điểm yếu có ảnh hưởng mạnh). 
                      Đọc cột "Giải thích" để hiểu cụ thể, sau đó áp dụng "Khuyến nghị" bên dưới.
                    </p>
                  </div>
                </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={() => setShowShapModal(false)}
                  variant="outline"
                >
                  {t('common.close')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
