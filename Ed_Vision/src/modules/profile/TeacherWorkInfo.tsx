import { useTranslation } from 'react-i18next';

type WorkInfo = {
  employeeCode: string;
  academicTitle: string;
  position: string;
  department: string;
  hireDate: string;
};

type Props = {
  workInfo: WorkInfo;
  onEdit?: () => void;
};

export default function TeacherWorkInfo({ workInfo, onEdit }: Props) {
  const { t, i18n } = useTranslation('profile');
  
  // Translate academic title based on Vietnamese keywords
  const translateAcademicTitle = (title: string) => {
    if (!title || title === '—') return title;
    const lowerTitle = title.toLowerCase();
    if (i18n.language === 'en') {
      if (lowerTitle.includes('thạc sĩ') || lowerTitle.includes('ths')) return title.replace(/thạc sĩ|ths/gi, 'Master');
      if (lowerTitle.includes('tiến sĩ') || lowerTitle.includes('ts')) return title.replace(/tiến sĩ|ts/gi, 'PhD');
      if (lowerTitle.includes('pgs')) return title.replace(/pgs/gi, 'Assoc. Prof.');
      if (lowerTitle.includes('gs')) return title.replace(/gs/gi, 'Professor');
    }
    return title;
  };
  
  // Translate position
  const translatePosition = (position: string) => {
    if (!position || position === '—') return position;
    if (i18n.language === 'en') {
      if (position.toLowerCase() === 'giảng viên') return 'Lecturer';
      if (position.toLowerCase().includes('trưởng khoa')) return 'Department Head';
      if (position.toLowerCase().includes('phó trưởng')) return 'Deputy Head';
    }
    return position;
  };
  
  // Translate department name
  const translateDepartment = (dept: string) => {
    if (!dept || dept === '—') return dept;
    if (i18n.language === 'en') {
      const deptMap: Record<string, string> = {
        'Trường Kinh tế và Kinh doanh': 'School of Economics and Business',
        'Trường Công nghệ': 'School of Technology',
        'Trường Công nghệ Thông tin': 'School of Information Technology',
        'Khoa Công nghệ Thông tin': 'Faculty of Information Technology',
        'Trường Đào Tạo Quốc Tế': 'School of International Education',
        'Trường Du lịch': 'School of Tourism',
        'Trường Khoa Học Máy Tính': 'School of Computer Science',
        'Trường Ngôn ngữ và Xã hội': 'School of Languages and Society',
        'Trường Y - Dược': 'School of Medicine and Pharmacy'
      };
      return deptMap[dept] || dept;
    }
    return dept;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{t('teacherWork.title')}</h3>
        {onEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <i className="fas fa-pencil-alt mr-2"></i>
            {t('common.edit')}
          </button>
        )}
      </div>
      <div className="px-4 sm:px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('teacherWork.instructorCode')}</label>
          <p className="text-sm font-medium text-gray-900">{workInfo.employeeCode}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('teacherWork.academicTitle', { defaultValue: 'Academic Title' })}</label>
          <p className="text-sm font-medium text-gray-900">{translateAcademicTitle(workInfo.academicTitle || "—")}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('teacherWork.position')}</label>
          <p className="text-sm font-medium text-gray-900">{translatePosition(workInfo.position || "—")}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('teacherWork.department')}</label>
          <p className="text-sm font-medium text-gray-900">{translateDepartment(workInfo.department || "—")}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('teacherWork.hireDate', { defaultValue: 'Hire Date' })}</label>
          <div className="flex items-center gap-2">
            <i className="fas fa-calendar text-gray-900"></i>
            <p className="text-sm font-medium text-gray-900">{workInfo.hireDate || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
