import { useState, useEffect } from 'react';
import { TokenManager } from '@/lib/tokenManager';
import { buildUrl } from '@/services/api/config';
import { useTranslation } from 'react-i18next';

type ProfileData = {
  fullName?: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () =>void;
  currentProfile: ProfileData;
  onSuccess: () =>void;
};

export default function EditProfileModal({ isOpen, onClose, currentProfile, onSuccess }: Props) {
  const { t } = useTranslation('profile');
  const [formData, setFormData] = useState<ProfileData>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: currentProfile.fullName || '',
        phoneNumber: currentProfile.phoneNumber || '',
        dateOfBirth: currentProfile.dateOfBirth ? currentProfile.dateOfBirth.split('T')[0] : '',
        gender: currentProfile.gender || '',
        nationality: currentProfile.nationality || '',
        address: currentProfile.address || '',
        avatarUrl: currentProfile.avatarUrl || '',
      });
      setError(null);
    }
  }, [isOpen, currentProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = TokenManager.getToken();
      if (!token) {
        throw new Error(t('common.loginRequired'));
      }

      const payload = {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber || null,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        nationality: formData.nationality || null,
        address: formData.address || null,
      };

      const res = await fetch(buildUrl('/profile/me'), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(t('common.updateError', { status: res.status }));
      }

      // Dispatch event to notify Header to refetch profile (especially if gender changed)
      // Pass gender in detail so Header can immediately update avatar without waiting for API
      window.dispatchEvent(new CustomEvent('avatar-updated', { 
        detail: { 
          gender: formData.gender,
          refetch: true // Signal to refetch full profile
        } 
      }));

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('EditProfileModal error:', err);
      setError(err?.message || t('common.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)'}}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('personalInfo.modalTitle')}</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
              <svg className="w-6 h-6"fill="none"stroke="currentColor"viewBox="0 0 24 24">
                <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>)}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('personalInfo.fullName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"required
              value={formData.fullName || ''}
              onChange={(e) =>setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white !text-gray-900"placeholder={t('personalInfo.fullNamePlaceholder', { defaultValue: 'Enter full name'})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('personalInfo.phone')}</label>
            <input
              type="tel"value={formData.phoneNumber || ''}
              onChange={(e) =>setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white !text-gray-900"placeholder={t('personalInfo.phonePlaceholder', { defaultValue: 'Enter phone number'})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700  mb-2">{t('personalInfo.dateOfBirth')}</label>
              <input
                type="date"value={formData.dateOfBirth || ''}
                onChange={(e) =>setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white  text-gray-900 !text-gray-900"style={{ colorScheme: 'light'}}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700  mb-2">{t('personalInfo.gender')}</label>
              <select
                value={formData.gender || ''}
                onChange={(e) =>setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white  text-gray-900 !text-gray-900">
                <option value="">{t('personalInfo.selectGender', { defaultValue: '-- Select --'})}</option>
                <option value="Nam">{t('personalInfo.male')}</option>
                <option value="Nữ">{t('personalInfo.female')}</option>
                <option value="Khác">{t('personalInfo.other')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700  mb-2">{t('personalInfo.nationality')}</label>
            <input
              type="text"value={formData.nationality || ''}
              onChange={(e) =>setFormData({ ...formData, nationality: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white  text-gray-900 !text-gray-900"placeholder={t('personalInfo.nationalityPlaceholder', { defaultValue: 'Enter nationality'})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700  mb-2">{t('personalInfo.address')}</label>
            <textarea
              rows={3}
              value={formData.address || ''}
              onChange={(e) =>setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white  text-gray-900 !text-gray-900"placeholder={t('personalInfo.addressPlaceholder', { defaultValue: 'Enter address'})}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50">
              {t('common.cancel')}
            </button>
            <button
              type="submit"disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition-all">
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>);
}

