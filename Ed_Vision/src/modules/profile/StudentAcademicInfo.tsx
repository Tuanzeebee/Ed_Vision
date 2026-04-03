import { useTranslation } from 'react-i18next';

type AcademicInfo = {
  studentId: string;
  major: string;
  year: string;
  class: string;
  gpa?: number;
  credits?: number;
};

type Props = {
  academicInfo: AcademicInfo;
  onEdit?: () =>void;
};

export default function StudentAcademicInfo({ academicInfo, onEdit }: Props) {
  const { t } = useTranslation('profile');
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{t('studentAcademic.title')}</h3>
        {onEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
            <i className="fas fa-pencil-alt mr-2"></i>
            {t('common.edit')}
          </button>)}
      </div>
      <div className="px-4 sm:px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('studentAcademic.studentCode')}</label>
          <p className="text-sm font-medium text-gray-900">{academicInfo.studentId}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('studentAcademic.major')}</label>
          <p className="text-sm font-medium text-gray-900">{academicInfo.major || "—"}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('studentAcademic.cohortYear')}</label>
          <p className="text-sm font-medium text-gray-900">{academicInfo.year || "—"}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('studentAcademic.class')}</label>
          <p className="text-sm font-medium text-gray-900">{academicInfo.class || "—"}</p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {academicInfo.gpa !== undefined ? academicInfo.gpa.toFixed(2) : "—"}
              </p>
              <p className="text-xs text-gray-600 mt-1">{t('studentAcademic.currentGPA', { defaultValue: 'Current GPA'})}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{academicInfo.credits !== undefined ? academicInfo.credits : "—"}</p>
              <p className="text-xs text-gray-600 mt-1">{t('studentAcademic.accumulatedCredits', { defaultValue: 'Accumulated Credits'})}</p>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
