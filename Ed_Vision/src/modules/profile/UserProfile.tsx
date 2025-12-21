import { type ReactNode } from "react";
import { useTranslation } from 'react-i18next';

type UserData = {
  name: string;
  age?: number;
  avatar: string;
  status: "active" | "inactive";
  statusLabel: string;
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    nationality: string;
    address: string;
    email: string;
    phone: string;
  };
};

type Props = {
  userData: UserData;
  additionalSections?: ReactNode[];
  onEditPersonalInfo?: () => void;
  onEditAvatar?: () => void;
};

export default function UserProfile({
  userData,
  additionalSections = [],
  onEditPersonalInfo,
  onEditAvatar,
}: Props) {
  const { t } = useTranslation('profile');
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-4">
            <div 
              className="relative group cursor-pointer"
              onClick={onEditAvatar}
            >
              <img
                src={userData.avatar}
                alt="User Avatar"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gray-200 shadow-sm object-cover group-hover:border-blue-500 transition-all"
              />
              {onEditAvatar && (
                <div 
                  className="absolute inset-0 rounded-full transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0)'}
                >
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {userData.name}
              </h1>
              {userData.age && (
                <p className="text-sm text-gray-500 mt-1">{userData.age} {t('common.yearsOld', { defaultValue: 'years old' })}</p>
              )}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                <i className="fas fa-circle text-green-500 mr-1.5" style={{ fontSize: "6px" }}></i>
                {userData.statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('personalInfo.title')}</h3>
              {onEditPersonalInfo && (
                <button
                  onClick={onEditPersonalInfo}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <i className="fas fa-pencil-alt mr-2"></i>
                  {t('common.edit')}
                </button>
              )}
            </div>
            <div className="px-4 sm:px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t('personalInfo.fullName')}
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {userData.personalInfo.fullName}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t('personalInfo.dateOfBirth')}
                  </label>
                  <p className="text-sm font-medium text-gray-900">
                    {userData.personalInfo.dateOfBirth}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t('personalInfo.gender')}
                  </label>
                  <p className="text-sm font-medium text-gray-900">
                    {userData.personalInfo.gender}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t('personalInfo.nationality', { defaultValue: 'Nationality' })}
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {userData.personalInfo.nationality}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('personalInfo.address')}</label>
                <p className="text-sm font-medium text-gray-900">
                  {userData.personalInfo.address}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('personalInfo.email')}</label>
                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <i className="fas fa-envelope text-gray-400 flex-shrink-0"></i>
                  <span className="break-all">{userData.personalInfo.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t('personalInfo.phone')}
                </label>
                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <i className="fas fa-phone text-gray-400 flex-shrink-0"></i>
                  <span>{userData.personalInfo.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Sections in Grid (first section) */}
          {additionalSections[0]}
        </div>

        {/* Remaining Additional Sections (full width) */}
        {additionalSections.slice(1).map((section, index) => (
          <div key={index} className="mt-6">
            {section}
          </div>
        ))}
      </div>
    </div>
  );
}
