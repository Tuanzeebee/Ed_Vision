import { useTranslation } from 'react-i18next';

type OccupationInfo = {
  relationshipType: string;
  occupation: string;
  workplace: string;
};

type Props = {
  occupationInfo: OccupationInfo;
  onEdit?: () => void;
};

export default function ParentOccupationInfo({ occupationInfo, onEdit }: Props) {
  const { t } = useTranslation('profile');
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{t('parentOccupation.title')}</h3>
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
          <label className="block text-xs font-medium text-gray-500 mb-1">Quan hệ với học sinh</label>
          <p className="text-sm font-medium text-gray-900">{occupationInfo.relationshipType || "—"}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Nghề nghiệp</label>
          <p className="text-sm font-medium text-gray-900">{occupationInfo.occupation || "—"}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Nơi làm việc</label>
          <p className="text-sm font-medium text-gray-900">{occupationInfo.workplace || "—"}</p>
        </div>
      </div>
    </div>
  );
}
