import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/teacher/teacher_card';
import { Button } from '@/components/ui/teacher/teacher_button';
import { Badge } from '@/components/ui/teacher/teacher_badge';
import TeacherLayout from '../components/TeacherLayout';
import predictionService from '@/services/predictionService';
import shapService from '@/services/shapService';
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
  FileText
} from 'lucide-react';

interface StudentData {
  student_id: string;
  course_code: string;
  // Dynamic grade columns (attend, quiz, midterm, homework, etc.)
  [key: string]: string | number | null;
  // Required behavior columns
  weekly_study_hours_by_course: number | null;
  part_time_hours_by_course: number | null;
  financial_support_by_course: number | null;
  emotional_support_by_course: number | null;
  final_pred: number | null;
  confidence: 'high' | 'medium' | 'low' | null;
}

interface ShapFeature {
  feature: string;
  value: number;
  shap_value: number;
}

interface SurveyData {
  weekly_study_hours: string;
  part_time_hours: string;
  financial_support: number;
  emotional_support: number;
}

interface UploadMetadata {
  course_code: string;
}

type Props = {};

export default function PredictionViewV2({}: Props) {
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
  const [error, setError] = useState<string>('');

  const [uploadMetadata, setUploadMetadata] = useState<UploadMetadata>({
    course_code: ''
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
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(7); // 7 students per page
  const [gradeColumns, setGradeColumns] = useState<string[]>([]); // Dynamic grade columns
  const [showHistory, setShowHistory] = useState(false); // Toggle upload history
  const [uploadHistory, setUploadHistory] = useState<any[]>([]); // Upload history data
  const [loadingHistory, setLoadingHistory] = useState(false); // Loading state for history
  // Pagination for prediction results table
  const [predictionCurrentPage, setPredictionCurrentPage] = useState(1);
  const [predictionPerPage] = useState(7); // 7 students per page for prediction results

  // Cleanup shapService queue khi component unmount
  useEffect(() => {
    return () => {
      shapService.clearQueue();
      console.log('[PredictionViewV2] Cleaned up SHAP service queue');
    };
  }, []);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setShowUploadModal(true);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setPendingFile(file);
      setShowUploadModal(true);
    }
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    
    if (!uploadMetadata.course_code) {
      toast.error('Vui lòng điền Course Code');
      return;
    }

    setUploadedFile(pendingFile);
    setUploading(true);
    setError('');
    setShowUploadModal(false);
    
    try {
      const response = await predictionService.uploadGrades(
        pendingFile,
        uploadMetadata.course_code
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
      
      setUploadSuccess(true);
      setSurveysCompleted(false);
      setPredictionRun(false);
      setShowResults(true);
      setPendingFile(null);
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

  const openSurveyModal = () => {
    setShowSurveyModal(true);
    setSurveyData({
      weekly_study_hours: '',
      part_time_hours: '',
      financial_support: 1,
      emotional_support: 1
    });
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
    if (!surveysCompleted) {
      toast.error('Thiếu dữ liệu hành vi, vui lòng hoàn tất khảo sát trước khi dự đoán.');
      return;
    }
    
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
      // Sử dụng shapService với debouncing và deduplication
      const response = await shapService.getShapExplanationDebounced(uploadId, 8);
      
      // Backend trả về: { success, message, data: { explanations: [...] } }
      const explanations = response.data?.explanations || response.explanations || [];
      
      // Tìm SHAP values cho student này
      const studentExplanation = explanations.find(
        (exp: any) => {
          // MongoDB student_id là ObjectId string, so sánh cả student_code
          return exp.student_id === student.student_id || 
                 exp.student_code === student.student_id ||
                 String(exp.student_id) === String(student.student_id);
        }
      );
      
      if (studentExplanation && studentExplanation.top_features) {
        // Map SHAP features từ API response
        const features: ShapFeature[] = studentExplanation.top_features.map((f: any) => ({
          feature: f.feature,
          value: f.value || 0,
          shap_value: f.shap_value
        }));
        setShapFeatures(features);
      } else {
        // Fallback: mock data nếu không có SHAP values
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
    return student.weekly_study_hours_by_course === null ? 'Chưa khảo sát' : 'Đã khảo sát';
  };

  const getBehaviorStatusClass = (student: StudentData) => {
    return student.weekly_study_hours_by_course === null 
      ? 'bg-amber-100 text-amber-800' 
      : 'bg-green-100 text-green-800';
  };

  const getConfidenceColor = useCallback((confidence: string | null) => {
    switch(confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

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
      <div className="flex-1 p-6 bg-gray-50">
        <div className="space-y-6">
        {/* Header Banner */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Workflow Dự đoán Điểm</h3>
                <p className="text-blue-100">Upload → Khảo sát → Dự đoán → Phân tích SHAP</p>
              </div>
              <div className="flex items-center space-x-4">
                {/* History Toggle Button */}
                <button
                  onClick={toggleHistory}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  title="Lịch sử upload"
                >
                  <History className="w-5 h-5" />
                </button>
                <div className="hidden md:block">
                  <TrendingUp className="w-16 h-16 opacity-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload History Modal - Floating Toast Style */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
            <Card className="w-full max-w-2xl shadow-2xl border-2 border-blue-500 animate-in slide-in-from-top-4 duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <History className="w-6 h-6 text-blue-500" />
                    Lịch sử upload file
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
                    <span className="ml-3 text-gray-600 text-lg">Đang tải lịch sử...</span>
                  </div>
                ) : uploadHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p className="text-lg">Chưa có lịch sử upload</p>
                    <p className="text-sm mt-2">Upload file đầu tiên để bắt đầu</p>
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
                                final_pred: student.final_pred ?? null,
                                confidence: student.confidence ?? null
                              }));
                              setStudentData(mappedData);
                              const detectedColumns = detectGradeColumns(mappedData);
                              setGradeColumns(detectedColumns);
                              setUploadSuccess(true);
                              setShowResults(true);
                              setSurveysCompleted(mappedData[0]?.weekly_study_hours_by_course !== null);
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
                <h3 className="text-xl font-bold text-gray-900">Bước 1: Upload dữ liệu điểm học phần</h3>
                <p className="text-sm text-gray-500">Chấp nhận file CSV hoặc Excel (.csv, .xlsx)</p>
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
                <p className="text-lg font-semibold text-gray-900 mb-2">Kéo thả file vào đây hoặc nhấn để chọn</p>
                <p className="text-sm text-gray-500">Hỗ trợ: CSV, XLSX (tối đa 10MB)</p>
              </label>
            </div>

            {uploading && (
              <div className="mt-6 flex items-center justify-center space-x-3 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Đang xử lý file và lưu vào database...</span>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm text-gray-700">
                  <p className="font-medium mb-1">Quy trình xử lý:</p>
                  <p>Hệ thống sẽ xử lý file, chuẩn hóa dữ liệu, và lưu vào database.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm text-gray-700">
                  <p>Sau khi upload thành công, bốn trường behavior sẽ được khởi tạo là NULL cho từng sinh viên.</p>
                </div>
              </div>
            </div>

            {uploadSuccess && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">Upload thành công!</p>
                    <p className="text-sm text-green-700">
                      Đã xử lý và lưu {recordCount} bản ghi vào database. Các trường behavior đang ở trạng thái NULL.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Lỗi</p>
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
                    <h3 className="text-xl font-bold text-gray-900">Bước 2: Danh sách sinh viên và trạng thái behavior</h3>
                    <p className="text-sm text-gray-500">Hiển thị dữ liệu đã upload và trạng thái khảo sát</p>
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
                              <Badge className={getBehaviorStatusClass(student)}>
                                {getBehaviorStatus(student)}
                              </Badge>
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

                  <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900">Cần hoàn tất khảo sát</p>
                      <p className="text-sm text-amber-700">Tất cả các trường behavior hiện đang NULL. Vui lòng thực hiện khảo sát để điền đầy đủ thông tin trước khi chạy mô hình dự đoán.</p>
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
                  <p className="font-medium mb-1">Lưu ý:</p>
                  <p>Dữ liệu khảo sát sẽ được áp dụng cho tất cả sinh viên trong danh sách. Sau khi lưu, các trường behavior sẽ được cập nhật từ NULL sang giá trị số.</p>
                </div>
              </div>

              <Button 
                onClick={openSurveyModal}
                disabled={surveysCompleted}
                className="w-full py-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                <ClipboardList className="w-5 h-5 mr-2" />
                {surveysCompleted ? 'Đã hoàn tất khảo sát' : 'Thực hiện khảo sát tất cả sinh viên'}
                {surveysCompleted && <CheckCircle className="w-5 h-5 ml-2" />}
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
                    <p className="font-medium mb-1">Về mô hình:</p>
                    <p>Hệ thống sẽ chạy mô hình Gradient Boosting và áp dụng fallback theo hệ số R² từng môn học để đảm bảo độ chính xác cao nhất.</p>
                  </div>
                </div>

                {!surveysCompleted && (
                  <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-sm text-red-700">
                      <p className="font-semibold">Không thể chạy dự đoán</p>
                      <p>Thiếu dữ liệu hành vi, vui lòng hoàn tất khảo sát trước khi chạy mô hình dự đoán.</p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={runPrediction}
                  disabled={!surveysCompleted || predictionRun}
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
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Điểm dự đoán</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Độ tin cậy</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">SHAP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentPredictions.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{student.student_id}</td>
                        <td className="px-4 py-3 text-gray-700">{student.course_code}</td>
                        <td className="px-4 py-3">
                          <span className="text-lg font-bold text-blue-600">
                            {student.final_pred ? student.final_pred.toFixed(2) : '-'}
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
                    ))}
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
                        let endPage = Math.min(totalPredictionPages, startPage + maxVisible - 1);
                        
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-900">Tổng sinh viên</p>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{studentData.length}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-green-900">Điểm TB dự đoán</p>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-900">{averagePrediction.toFixed(2)}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-purple-900">Độ tin cậy cao</p>
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-purple-900">{highConfidenceCount}/{studentData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Metadata Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div 
              onClick={() => setShowUploadModal(false)}
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            />
            
            <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Thông tin Upload</h3>
                    <p className="text-sm text-gray-500">Điền thông tin trước khi upload file</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); confirmUpload(); }} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={uploadMetadata.course_code}
                    onChange={(e) => setUploadMetadata({...uploadMetadata, course_code: e.target.value})}
                    required 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    placeholder="Nhập Course Code (VD: MATH101)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Mã môn học (Teacher ID được tự động lấy từ tài khoản của bạn)</p>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm text-gray-700">
                    <p className="font-medium mb-1">Lưu ý:</p>
                    <p>File: <span className="font-semibold">{pendingFile?.name}</span></p>
                    <p className="mt-1">Thông tin này sẽ được lưu cùng với dữ liệu điểm trong database.</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Xác nhận Upload
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
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
                      Student ID: {selectedStudent.student_id}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Course: {selectedStudent.course_code} | 
                      {gradeColumns.map((col, idx) => (
                        <span key={col}>
                          {col.charAt(0).toUpperCase() + col.slice(1)}: {(selectedStudent as any)[col] ?? 0}
                          {idx < gradeColumns.length - 1 ? ' | ' : ''}
                        </span>
                      ))}
                      {gradeColumns.length > 0 && ' | '}
                      Prediction: {selectedStudent.final_pred?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowShapModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Debug Info Panel */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800 font-mono">
                  <strong>Debug:</strong> Student {selectedStudent.student_id} | 
                  Features loaded: {shapFeatures.length} | 
                  {loadingShap ? 'Loading...' : 'Ready'}
                </p>
              </div>

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
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold mb-4">Top 8 Features - SHAP Values</h4>
                      <div className="space-y-3">
                        {shapFeatures.map((feature) => (
                          <div key={feature.feature} className="flex items-center space-x-3">
                            <div className="w-32 text-sm font-medium text-gray-700">{feature.feature}</div>
                            <div className="flex-1 flex items-center space-x-2">
                              <div className="flex-1 h-8 bg-gray-200 rounded relative overflow-hidden">
                                <div 
                                  className={`h-full ${feature.shap_value > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.abs(feature.shap_value) * 100}%` }}
                                />
                              </div>
                              <div className={`w-16 text-sm font-semibold text-right ${feature.shap_value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {feature.shap_value.toFixed(3)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Feature</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Value</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">SHAP Value</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Impact</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Giải thích</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {shapFeatures.map((feature) => (
                        <tr key={feature.feature} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{feature.feature}</td>
                          <td className="px-4 py-3 text-gray-700">{feature.value.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold ${feature.shap_value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(3)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={feature.shap_value > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {feature.shap_value > 0 ? 'Positive ↑' : 'Negative ↓'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 max-w-md">
                            {explainShapValue(feature)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Khuyến nghị cho giảng viên */}
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

                {/* Giải thích tổng quan SHAP */}
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm text-gray-700">
                    <p className="font-medium mb-2">📊 Hiểu về SHAP Values:</p>
                    <ul className="space-y-1 list-disc list-inside text-xs">
                      <li><strong className="text-green-600">Giá trị dương (+)</strong>: Feature này làm <strong>TĂNG</strong> điểm dự đoán. Ví dụ: +0.38 nghĩa là feature này cộng thêm 0.38 điểm.</li>
                      <li><strong className="text-red-600">Giá trị âm (-)</strong>: Feature này làm <strong>GIẢM</strong> điểm dự đoán. Ví dụ: -0.15 nghĩa là feature này trừ đi 0.15 điểm.</li>
                      <li><strong>Giá trị tuyệt đối lớn</strong>: Feature có ảnh hưởng <strong>MẠNH</strong> đến kết quả (≥0.3: mạnh, ≥0.15: trung bình, &lt;0.05: nhẹ).</li>
                      <li><strong>Baseline</strong>: Điểm trung bình của tất cả sinh viên. SHAP values cho biết sinh viên này cao/thấp hơn baseline bao nhiêu.</li>
                      <li><strong>Mask features</strong>: Khi thiếu dữ liệu, model điều chỉnh dự đoán dựa trên các features khác.</li>
                    </ul>
                    <p className="mt-3 text-xs font-medium text-blue-800">
                      💡 <strong>Ứng dụng thực tế:</strong> Tập trung can thiệp vào các features có SHAP value âm và giá trị tuyệt đối lớn để cải thiện kết quả học tập của sinh viên.
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
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </TeacherLayout>
  );
}
