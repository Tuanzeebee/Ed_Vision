import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  ArrowRight,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  BookOpen,
  Target,
  Inbox,
  Calendar,
  CalendarClock,
  Layers,
  X,
} from 'lucide-react';
import { Sun, CloudSnow, SunMedium } from 'lucide-react';
import { Button } from '@/components/ui/teacher/teacher_button';
import { Card, CardContent } from '@/components/ui/teacher/teacher_card';
import { Input } from '@/components/ui/teacher/teacher_input';
import { Label } from '@/components/ui/teacher/teacher_label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/teacher/teacher_select';
import CustomSelect from '@/components/ui/teacher/teacher_custom_select';
import TeacherLayout from './components/TeacherLayout';
import { academicDataService, type AcademicYear, type Course } from '@/services/teacher/api/academicData';
import gradeStructureService, { type CreateGradeStructurePayload } from '@/services/teacher/api/gradeStructure';
import { useToast } from '@/lib/useToast';
import { ToastContainer } from '@/components/ui/Toast';

// CSS Animations
const styles = `
  @keyframes slideIn {
    from { 
      opacity: 0; 
      transform: translateX(-20px); 
    }
    to { 
      opacity: 1; 
      transform: translateX(0); 
    }
  }
  
  @keyframes fadeIn {
    from { 
      opacity: 0; 
      transform: translateY(10px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }

  .slide-in-animation {
    animation: slideIn 0.3s ease-out;
  }

  .fade-in-animation {
    animation: fadeIn 0.4s ease-out;
  }
`;

interface GradeColumn {
  id: number;
  name: string;       // Tên hiển thị (label)
  key: string;        // Key để gửi lên backend (attend, regular, practice, etc.)
  maxScore: number;
  weight: number;
  color: string;
}

interface AppState {
  year: string;
  semester: string;
  subject: string;
  columns: GradeColumn[];
}

const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'indigo', 'red', 'yellow'];

export default function SettingGradeTable() {
  const { t } = useTranslation('teacher');
  const { toasts, hideToast, success, error, warning, info } = useToast();
  
  // Predefined grade columns with their corresponding keys
  const predefinedColumns = [
    { label: t('settingGradeTable.attendance'), key: 'attend' },
    { label: t('settingGradeTable.regular'), key: 'regular' },
    { label: t('settingGradeTable.practice'), key: 'practice' },
    { label: t('settingGradeTable.quiz'), key: 'quiz' },
    { label: t('settingGradeTable.final'), key: 'final' },
    { label: t('settingGradeTable.midterm'), key: 'midterm' },
    { label: t('settingGradeTable.homework'), key: 'homework' },
    { label: t('settingGradeTable.speechDiscussion'), key: 'speech_and_discussion' },
    { label: t('settingGradeTable.groupProject'), key: 'group_project' },
    { label: t('settingGradeTable.individualProject'), key: 'individual_project' },
    { label: t('settingGradeTable.essay'), key: 'essay' },
  ];
  
  const [currentStep, setCurrentStep] = useState(1);
  const [appState, setAppState] = useState<AppState>({
    year: '',
    semester: '',
    subject: '',
    columns: [],
  });

  // Data từ API
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableSemesters, setAvailableSemesters] = useState<number[]>([]);

  // Load dữ liệu khi component mount
  useEffect(() => {
    loadData();
  }, []);

  // Cập nhật available semesters khi chọn năm học
  useEffect(() => {
    if (appState.year) {
      const selectedYear = academicYears.find(y => y.academic_year === appState.year);
      setAvailableSemesters(selectedYear?.available_semesters || []);
      
      // Reset semester nếu không có trong danh sách
      if (appState.semester && selectedYear) {
        const semesterNum = appState.semester === 'Kỳ 1' ? 1 : appState.semester === 'Kỳ 2' ? 2 : 3;
        if (!selectedYear.available_semesters.includes(semesterNum)) {
          setAppState({ ...appState, semester: '' });
        }
      }
    } else {
      setAvailableSemesters([]);
    }
  }, [appState.year, academicYears]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [yearsData, coursesData] = await Promise.all([
        academicDataService.getAcademicYears(),
        academicDataService.getCourses(),
      ]);

      setAcademicYears(yearsData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [newColumn, setNewColumn] = useState({
    select: '',
    custom: '',
    maxScore: 10,
    weight: 10,
  });

  const [editPanel, setEditPanel] = useState({
    open: false,
    columnId: null as number | null,
    name: '',
    maxScore: 10,
    weight: 10,
  });

  const [deletePanel, setDeletePanel] = useState({
    open: false,
    columnId: null as number | null,
    columnName: '',
  });

  const [confirmPanel, setConfirmPanel] = useState({
    open: false,
    message: '',
    onConfirm: (() => {}) as () => void,
  });

  const handleSemesterSelect = (semester: string) => {
    setAppState({ ...appState, semester });
  };

  const checkStep1Complete = () => {
    return appState.year && appState.semester && appState.subject;
  };

  const goToStep2 = () => {
    if (checkStep1Complete()) {
      setCurrentStep(2);
    }
  };

  const addColumn = () => {
    // Nếu chọn custom thì lấy giá trị từ input, ngược lại lấy từ predefined
    const isCustom = newColumn.select === 'custom';
    const selectedColumn = predefinedColumns.find(col => col.key === newColumn.select);

    let name: string;
    let key: string;

    if (isCustom) {
      name = newColumn.custom;
      key = newColumn.custom.toLowerCase().replace(/\s+/g, '_'); // Tạo key từ tên custom
    } else {
      if (!selectedColumn) {
        warning('Vui lòng chọn loại cột điểm!');
        return;
      }
      name = selectedColumn.label;
      key = selectedColumn.key;
    }

    if (!name || name === '') {
      warning(t('settingGradeTable.enterColumnName'));
      return;
    }

    // Validation: Trọng số của 1 cột không được vượt quá 65%
    if (newColumn.weight > 65) {
      error(t('settingGradeTable.weightExceeded'));
      return;
    }

    // Validation: Tổng trọng số không được vượt quá 100%
    const currentTotal = appState.columns.reduce((sum, col) => sum + col.weight, 0);
    const newTotal = currentTotal + newColumn.weight;
    
    if (newTotal > 100) {
      const message = t('settingGradeTable.totalWeightExceeded', { 
        current: currentTotal, 
        adding: newColumn.weight, 
        total: newTotal 
      }) + t('settingGradeTable.continueAnyway');
      
      // Show confirmation panel
      setConfirmPanel({
        open: true,
        message: message + '\n\nBạn có muốn tiếp tục không?',
        onConfirm: () => {
          performAddColumn(name, key);
          setConfirmPanel({ open: false, message: '', onConfirm: () => {} });
        },
      });
      return;
    }

    performAddColumn(name, key);
  };

  const performAddColumn = (name: string, key: string) => {
    const column: GradeColumn = {
      id: Date.now(),
      name,
      key,
      maxScore: newColumn.maxScore,
      weight: newColumn.weight,
      color: colors[appState.columns.length % colors.length],
    };

    setAppState({
      ...appState,
      columns: [...appState.columns, column],
    });

    setNewColumn({
      select: '',
      custom: '',
      maxScore: 10,
      weight: 10,
    });

    success(t('settingGradeTable.columnAddedSuccess'));
  };

  const editColumn = (id: number) => {
    const column = appState.columns.find(c => c.id === id);
    if (!column) return;

    setEditPanel({
      open: true,
      columnId: id,
      name: column.name,
      maxScore: column.maxScore,
      weight: column.weight,
    });
  };

  const saveEdit = () => {
    // Validation: Trọng số của 1 cột không được vượt quá 65%
    if (editPanel.weight > 65) {
      error(t('settingGradeTable.weightExceeded'));
      return;
    }

    // Validation: Tổng trọng số không được vượt quá 100%
    const currentColumn = appState.columns.find(col => col.id === editPanel.columnId);
    if (!currentColumn) return;

    // Tính tổng trọng số của các cột khác (không tính cột đang edit)
    const otherColumnsTotal = appState.columns
      .filter(col => col.id !== editPanel.columnId)
      .reduce((sum, col) => sum + col.weight, 0);
    
    const newTotal = otherColumnsTotal + editPanel.weight;
    
    if (newTotal > 100) {
      const message = t('settingGradeTable.totalWeightExceeded', { 
        current: otherColumnsTotal, 
        adding: editPanel.weight, 
        total: newTotal 
      }) + t('settingGradeTable.continueAnyway');
      
      setConfirmPanel({
        open: true,
        message: message + '\n\nBạn có muốn tiếp tục không?',
        onConfirm: () => {
          performSaveEdit();
          setConfirmPanel({ open: false, message: '', onConfirm: () => {} });
        },
      });
      return;
    }

    performSaveEdit();
  };

  const performSaveEdit = () => {
    // Cập nhật key khi tên thay đổi (cho custom columns)
    const updatedColumns = appState.columns.map(col => {
      if (col.id === editPanel.columnId) {
        // Tìm xem có phải predefined column không
        const isPredefined = predefinedColumns.some(pc => pc.key === col.key);
        
        return {
          ...col,
          name: editPanel.name,
          maxScore: editPanel.maxScore,
          weight: editPanel.weight,
          // Chỉ update key nếu là custom column
          key: isPredefined ? col.key : editPanel.name.toLowerCase().replace(/\s+/g, '_'),
        };
      }
      return col;
    });

    setAppState({ ...appState, columns: updatedColumns });
    setEditPanel({ open: false, columnId: null, name: '', maxScore: 10, weight: 10 });
    success(t('settingGradeTable.columnUpdatedSuccess'));
  };

  const deleteColumn = (id: number) => {
    const column = appState.columns.find(c => c.id === id);
    if (!column) return;

    setDeletePanel({
      open: true,
      columnId: id,
      columnName: column.name,
    });
  };

  const confirmDelete = () => {
    setAppState({
      ...appState,
      columns: appState.columns.filter(c => c.id !== deletePanel.columnId),
    });
    setDeletePanel({ open: false, columnId: null, columnName: '' });
    success(t('settingGradeTable.columnDeletedSuccess'));
  };

  const finishSetup = () => {
    if (appState.columns.length === 0) {
      warning(t('settingGradeTable.addAtLeastOneColumn'));
      return;
    }

    const totalWeight = appState.columns.reduce((sum, col) => sum + col.weight, 0);
    if (totalWeight !== 100) {
      setConfirmPanel({
        open: true,
        message: t('settingGradeTable.totalWeightWarning', { total: totalWeight }) + t('settingGradeTable.continueAnyway'),
        onConfirm: () => {
          saveGradeStructure();
          setConfirmPanel({ open: false, message: '', onConfirm: () => {} });
        },
      });
      return;
    }

    saveGradeStructure();
  };

  const saveGradeStructure = async () => {
    try {
      // Lấy thông tin môn học từ danh sách courses
      const selectedCourse = courses.find(c => c.code === appState.subject);
      if (!selectedCourse) {
        error(t('settingGradeTable.courseNotFound'));
        return;
      }

      // Chuyển đổi semester string sang number
      const semesterNum = appState.semester === 'Kỳ 1' ? 1 : appState.semester === 'Kỳ 2' ? 2 : 3;

      // Chuẩn bị payload
      const payload: CreateGradeStructurePayload = {
        academicYear: appState.year,
        semester: semesterNum,
        courseCode: selectedCourse.code,
        courseName: selectedCourse.name,
        credits: selectedCourse.credits,
        columns: appState.columns.map(col => ({
          name: col.name,
          key: col.key,
          maxScore: col.maxScore,
          weight: col.weight,
          color: col.color,
        })),
      };

      // Gọi API để lưu
      const response = await gradeStructureService.createGradeStructure(payload);
      
      if (response.success) {
        success(t('settingGradeTable.setupSuccess'));
        setCurrentStep(3);
      } else {
        error(t('settingGradeTable.cannotSaveStructure'));
      }
    } catch (err: any) {
      error(err.message || t('settingGradeTable.savingError'));
      console.error('Error saving grade structure:', err);
    }
  };

  const usePrediction = () => {
    // TODO: Redirect to AI prediction page
    alert('Chuyển đến trang dự đoán AI...');
    // Example: navigate('/teacher/prediction-view');
  };

  const skipPrediction = () => {
    // TODO: Redirect to grade management or dashboard
    alert('Đã hoàn tất thiết lập bảng điểm!');
    // Example: navigate('/teacher/grade-management');
  };

  const totalWeight = appState.columns.reduce((sum, col) => sum + col.weight, 0);
  const remainingWeight = 100 - totalWeight;

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600', badge: 'bg-blue-500' },
      green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-600', badge: 'bg-green-500' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600', badge: 'bg-purple-500' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-600', badge: 'bg-orange-500' },
      pink: { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-600', badge: 'bg-pink-500' },
      indigo: { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-600', badge: 'bg-indigo-500' },
      red: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-600', badge: 'bg-red-500' },
      yellow: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-600', badge: 'bg-yellow-500' },
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <TeacherLayout currentPage="setting-grade-table">
      <style>{styles}</style>
      
      {/* Header */}
      {currentStep <= 2 && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl shadow-lg mb-6">
          <h2 className="text-3xl font-bold mb-2">
            {currentStep === 1 ? t('settingGradeTable.title') : t('settingGradeTable.structureSubtitle').replace('Thêm và quản lý các cột điểm cho môn học', 'Cấu Trúc Điểm')}
          </h2>
          <p className="text-indigo-100">
            {currentStep === 1
              ? t('settingGradeTable.subtitle')
              : t('settingGradeTable.structureSubtitle')}
          </p>
        </div>
      )}

      {/* Progress Stepper */}
      {currentStep <= 2 && (
        <Card className="p-4 mb-6 border border-gray-100 rounded-lg">
          <CardContent className="p-0">
            <div className="flex items-center justify-between max-w-xl mx-auto">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    currentStep > 1
                      ? 'bg-green-500 text-white'
                      : currentStep === 1
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <p
                  className={`mt-1.5 text-xs font-semibold ${
                    currentStep > 1
                      ? 'text-green-600'
                      : currentStep === 1
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                >
                  {t('settingGradeTable.step1')}
                </p>
              </div>

              <div className="flex-1 h-0.5 bg-gray-200 mx-3 relative">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: currentStep > 1 ? '100%' : '0%' }}
                />
              </div>

              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    currentStep === 2
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  2
                </div>
                <p
                  className={`mt-1.5 text-xs font-semibold ${
                    currentStep === 2 ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {t('settingGradeTable.step2')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 1: Course Selection */}
      {currentStep === 1 && (
        <Card className="p-6 fade-in-animation border border-gray-100 rounded-xl mb-6">
          <CardContent className="p-0">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('settingGradeTable.step1')}</h3>
                <p className="text-gray-500">{t('settingGradeTable.subtitle')}</p>
              </div>

              <div className="space-y-5">
                {/* Loading state */}
                {loading && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-500">{t('settingGradeTable.loading')}</p>
                  </div>
                )}

                {!loading && (
                  <>
                    {/* Năm giảng dạy */}
                    <CustomSelect
                      label={t('settingGradeTable.academicYear')}
                      placeholder={t('settingGradeTable.academicYearPlaceholder')}
                      icon={<Calendar className="w-4 h-4 text-blue-600" />}
                      required
                      value={appState.year}
                      onChange={(e) => setAppState({ ...appState, year: e.target.value, semester: '' })}
                      options={academicYears.map(year => ({
                        value: year.academic_year,
                        label: year.academic_year,
                      }))}
                    />

                    {/* Kỳ học */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center">
                        <CalendarClock className="w-4 h-4 mr-2 text-blue-600" />
                        {t('settingGradeTable.semester')}
                        <span className="text-red-500 ml-1">{t('settingGradeTable.semesterRequired')}</span>
                      </Label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: 'Kỳ 1', icon: Sun, semesterNum: 1, labelKey: 'semester1' },
                          { value: 'Kỳ 2', icon: CloudSnow, semesterNum: 2, labelKey: 'semester2' },
                          { value: 'Kỳ Hè', icon: SunMedium, semesterNum: 3, labelKey: 'summerSemester' }
                        ].map((sem) => {
                          const IconComponent = sem.icon;
                          const isAvailable = !appState.year || availableSemesters.includes(sem.semesterNum);
                          const isSelected = appState.semester === sem.value;
                          
                          return (
                            <button
                              key={sem.value}
                              type="button"
                              onClick={() => isAvailable && handleSemesterSelect(sem.value)}
                              disabled={!isAvailable}
                              className={`border-2 rounded-xl px-6 py-4 text-center transition-all group ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50'
                                  : isAvailable
                                  ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                                  : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <div className="flex flex-col items-center space-y-2">
                                <IconComponent 
                                  className={`w-8 h-8 ${
                                    isSelected
                                      ? 'text-blue-600'
                                      : isAvailable
                                      ? 'text-gray-400 group-hover:text-blue-600'
                                      : 'text-gray-300'
                                  }`}
                                />
                                <span className={`font-semibold ${
                                  isSelected
                                    ? 'text-blue-600'
                                    : isAvailable
                                    ? 'text-gray-700'
                                    : 'text-gray-400'
                                }`}>
                                  {t(`settingGradeTable.${sem.labelKey}`)}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {appState.year && availableSemesters.length === 0 && (
                        <p className="text-sm text-amber-600 mt-2">
                          {t('settingGradeTable.noSemestersAvailable')}
                        </p>
                      )}
                    </div>

                    {/* Môn học */}
                    <CustomSelect
                      label={t('settingGradeTable.subject')}
                      placeholder={t('settingGradeTable.subjectPlaceholder')}
                      icon={<BookOpen className="w-4 h-4 text-blue-600" />}
                      required
                      value={appState.subject}
                      onChange={(e) => setAppState({ ...appState, subject: e.target.value })}
                      options={courses.map(course => ({
                        value: course.code,
                        label: course.displayName,
                      }))}
                    />
                  </>
                )}

                {/* Summary Card */}
                {checkStep1Complete() && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-blue-900 mb-2">{t('settingGradeTable.selectedInfo')}</p>
                        <div className="space-y-1 text-sm text-blue-800">
                          <p><strong>{t('settingGradeTable.academicYearLabel')}</strong> <span>{appState.year}</span></p>
                          <p><strong>{t('settingGradeTable.semesterLabel')}</strong> <span>{appState.semester}</span></p>
                          <p><strong>{t('settingGradeTable.subjectLabel')}</strong> <span>{appState.subject}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={goToStep2}
                    disabled={!checkStep1Complete()}
                    className={`px-8 py-3 rounded-xl font-semibold flex items-center space-x-2 shadow-lg transition-all ${
                      checkStep1Complete()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span>{t('settingGradeTable.continue')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Grade Structure */}
      {currentStep === 2 && (
        <Card className="p-6 fade-in-animation border border-gray-100 rounded-xl mb-6">
          <CardContent className="p-0 space-y-5">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                {t('settingGradeTable.back')}
              </Button>
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  {t('settingGradeTable.courseInfo')}
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{t('settingGradeTable.yearLabel')}</p>
                    <p className="font-bold text-gray-900">{appState.year}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{t('settingGradeTable.semesterInfo')}</p>
                    <p className="font-bold text-gray-900">{appState.semester}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{t('settingGradeTable.subjectInfo')}</p>
                    <p className="font-bold text-gray-900">{appState.subject}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{t('settingGradeTable.gradeColumnCount')}</p>
                    <p className="text-2xl font-bold text-blue-600">{appState.columns.length}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{t('settingGradeTable.totalWeight')}</p>
                    <p className="text-2xl font-bold text-green-600">{totalWeight}%</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{t('settingGradeTable.remaining')}</p>
                    <p
                      className={`text-2xl font-bold ${
                        remainingWeight === 0
                          ? 'text-green-600'
                          : remainingWeight < 0
                          ? 'text-red-600'
                          : 'text-orange-600'
                      }`}
                    >
                      {remainingWeight}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ClipboardList className="w-5 h-5 mr-2 text-blue-600" />
                {t('settingGradeTable.gradeColumnList')}
              </h4>

              <div className="space-y-3">
                {appState.columns.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Inbox className="w-12 h-12 mx-auto mb-2" />
                    <p>{t('settingGradeTable.noColumnsYet')}</p>
                  </div>
                ) : (
                  appState.columns.map((col, index) => {
                    const colorClasses = getColorClasses(col.color);
                    return (
                      <div
                        key={col.id}
                        className={`${colorClasses.bg} border-l-4 ${colorClasses.border} rounded-lg p-5 flex items-center justify-between group hover:shadow-md transition-all slide-in-animation`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`w-10 h-10 ${colorClasses.badge} text-white rounded-full flex items-center justify-center font-bold`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h5 className={`font-bold text-lg ${colorClasses.text}`}>{col.name}</h5>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-600">
                                <span className="font-semibold">{t('settingGradeTable.maxScoreLabel')}:</span> {col.maxScore}
                              </span>
                              <span className="text-sm text-gray-600">
                                <span className="font-semibold">{t('settingGradeTable.weightLabel')}:</span> {col.weight}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editColumn(col.id)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-200"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteColumn(col.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <Card className="border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30 transition-all">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-600" />
                  {t('settingGradeTable.addNewColumn')}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2">{t('settingGradeTable.columnName')}</Label>
                    <Select
                      value={newColumn.select}
                      onValueChange={(value: string) => setNewColumn({ ...newColumn, select: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('settingGradeTable.selectOrEnter')} />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedColumns.map((col) => (
                          <SelectItem key={col.key} value={col.key}>
                            {col.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">{t('settingGradeTable.customColumn')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {newColumn.select === 'custom' && (
                      <Input
                        className="mt-2"
                        placeholder={t('settingGradeTable.enterColumnName')}
                        value={newColumn.custom}
                        onChange={(e) => setNewColumn({ ...newColumn, custom: e.target.value })}
                      />
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2">{t('settingGradeTable.maxScore')}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={newColumn.maxScore}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setNewColumn({ ...newColumn, maxScore: Math.min(value, 10) });
                      }}
                      className="font-bold text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('settingGradeTable.maxScoreLimit')}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2">{t('settingGradeTable.weight')}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="65"
                      value={newColumn.weight}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setNewColumn({ ...newColumn, weight: Math.min(value, 65) });
                      }}
                      className="font-bold text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('settingGradeTable.weightLimit')}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={addColumn} className="font-semibold">
                    <Plus className="w-5 h-5 mr-2" />
                    {t('settingGradeTable.addColumn')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end items-center pt-6 mt-6 border-t border-gray-200">
              <Button onClick={finishSetup} className="bg-green-600 hover:bg-green-700 px-8 py-3 font-semibold">
                <Check className="w-5 h-5 mr-2" />
                {t('settingGradeTable.finishSetup')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: AI Prediction Prompt */}
      {currentStep === 3 && (
        <div className="max-w-5xl mx-auto w-full space-y-5 fade-in-animation">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-6 py-3 rounded-full font-semibold shadow-lg">
              <Check className="w-5 h-5" />
              <span>{t('settingGradeTable.setupSuccessTitle')}</span>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white shadow-2xl border-0 rounded-xl">
            <CardContent className="p-10 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 right-10">
                  <Sparkles className="w-32 h-32 animate-pulse" />
                </div>
              </div>

              <div className="relative z-10 text-center space-y-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-10 h-10" />
                </div>

                <div>
                  <h2 className="text-4xl font-bold mb-3">{t('settingGradeTable.aiPredictionPrompt')}</h2>
                  <p className="text-xl text-indigo-100">
                    {t('settingGradeTable.aiPredictionDesc')}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <Target className="w-8 h-8 mx-auto mb-3" />
                    <h4 className="font-bold mb-2">{t('settingGradeTable.highAccuracy')}</h4>
                    <p className="text-sm text-indigo-100">{t('settingGradeTable.accuracyDesc')}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <TrendingUp className="w-8 h-8 mx-auto mb-3" />
                    <h4 className="font-bold mb-2">{t('settingGradeTable.trendAnalysis')}</h4>
                    <p className="text-sm text-indigo-100">{t('settingGradeTable.trendAnalysisDesc')}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <Sparkles className="w-8 h-8 mx-auto mb-3" />
                    <h4 className="font-bold mb-2">{t('settingGradeTable.timeSaving')}</h4>
                    <p className="text-sm text-indigo-100">{t('settingGradeTable.timeSavingDesc')}</p>
                  </div>
                </div>

                <div className="flex justify-center space-x-4 pt-4">
                  <Button
                    onClick={usePrediction}
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg font-bold shadow-xl"
                  >
                    <Sparkles className="w-6 h-6 mr-2" />
                    {t('settingGradeTable.useAIPrediction')}
                  </Button>
                  <Button
                    onClick={skipPrediction}
                    size="lg"
                    variant="outline"
                    className="bg-white/10 text-white hover:bg-white/20 border-white/30 px-8 py-6 text-lg font-semibold backdrop-blur"
                  >
                    {t('settingGradeTable.skip')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-600 mb-1">{t('settingGradeTable.courseLabel')}</p>
                <p className="font-bold text-gray-900">{appState.subject}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 text-center">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-gray-600 mb-1">{t('settingGradeTable.gradeColumnCount')}</p>
                <p className="font-bold text-gray-900">{appState.columns.length} {t('settingGradeTable.gradeColumns')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-gray-600 mb-1">{t('settingGradeTable.totalWeightLabel')}</p>
                <p className="font-bold text-gray-900">{totalWeight}%</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={hideToast} />

      {/* Edit Panel */}
      {editPanel.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t('settingGradeTable.editColumnTitle')}</h3>
              </div>
              <button
                onClick={() => setEditPanel({ open: false, columnId: null, name: '', maxScore: 10, weight: 10 })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2">{t('settingGradeTable.columnNameLabel')}</Label>
                <Input
                  value={editPanel.name}
                  onChange={(e) => setEditPanel({ ...editPanel, name: e.target.value })}
                  className="font-medium"
                  placeholder={t('settingGradeTable.columnNamePlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2">{t('settingGradeTable.maxScoreLabel')}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={editPanel.maxScore}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setEditPanel({ ...editPanel, maxScore: Math.min(value, 10) });
                    }}
                    className="font-bold text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('settingGradeTable.maxScoreHelper')}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2">{t('settingGradeTable.weightLabel')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="65"
                    value={editPanel.weight}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setEditPanel({ ...editPanel, weight: Math.min(value, 65) });
                    }}
                    className="font-bold text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('settingGradeTable.weightHelper')}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditPanel({ open: false, columnId: null, name: '', maxScore: 10, weight: 10 })}
              >
                {t('settingGradeTable.cancel')}
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={saveEdit}>
                <Check className="w-4 h-4 mr-2" />
                {t('settingGradeTable.saveChanges')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Panel */}
      {deletePanel.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('settingGradeTable.confirmDelete')}</h3>
              <p className="text-gray-600 mb-2">
                {t('settingGradeTable.deleteMessage', { columnName: deletePanel.columnName })}
              </p>
              <p className="text-sm text-red-600 font-medium"> {t('settingGradeTable.deleteWarning')}</p>
            </div>

            <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeletePanel({ open: false, columnId: null, columnName: '' })}
              >
                {t('settingGradeTable.cancel')}
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                {t('settingGradeTable.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Panel */}
      {confirmPanel.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('settingGradeTable.confirm')}</h3>
              <p className="text-gray-600 whitespace-pre-line">{confirmPanel.message}</p>
            </div>

            <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmPanel({ open: false, message: '', onConfirm: () => {} })}
              >
                {t('settingGradeTable.cancel')}
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={confirmPanel.onConfirm}>
                <Check className="w-4 h-4 mr-2" />
                {t('settingGradeTable.continue')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
