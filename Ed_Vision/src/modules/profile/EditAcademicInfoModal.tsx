import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TokenManager } from '@/lib/tokenManager';
import { buildUrl } from '@/services/api/config';

type AcademicData = {
  studentCode?: string | null;
  major?: string | null;
  cohortYear?: number | null;
  classCode?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currentAcademic: AcademicData;
  onSuccess: () => void;
};

export default function EditAcademicInfoModal({ isOpen, onClose, currentAcademic, onSuccess }: Props) {
  const { t } = useTranslation('profile');
  const [formData, setFormData] = useState<AcademicData>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<{ class_id: number; class_code: string; cohort_year: number }[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        studentCode: currentAcademic.studentCode || '',
        major: currentAcademic.major || '',
        cohortYear: currentAcademic.cohortYear || null,
        classCode: currentAcademic.classCode || '',
      });
      setError(null);
      loadClasses();
    }
  }, [isOpen, currentAcademic]);

  const loadClasses = async () => {
    try {
      const token = TokenManager.getToken();
      if (!token) return;

      const res = await fetch(buildUrl('/profile/classes'), {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

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
        student_code: formData.studentCode || null,
        major: formData.major || null,
        cohort_year: formData.cohortYear || null,
        class_code: formData.classCode || null,
      };

      const res = await fetch(buildUrl('/profile/academic'), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(t('studentAcademic.updateError', { status: res.status }));
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || t('common.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('studentAcademic.modalTitle')}</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('studentAcademic.studentCode')}
            </label>
            <input
              type="text"
              value={formData.studentCode || ''}
              onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white !text-gray-900"
              placeholder={t('studentAcademic.studentCodePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('studentAcademic.major')}
            </label>
            <input
              type="text"
              value={formData.major || ''}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white !text-gray-900"
              placeholder={t('studentAcademic.majorPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('studentAcademic.cohortYear')}
            </label>
            <input
              type="number"
              value={formData.cohortYear || ''}
              onChange={(e) => setFormData({ ...formData, cohortYear: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white !text-gray-900"
              placeholder={t('studentAcademic.cohortYearPlaceholder')}
              min="2000"
              max="2100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('studentAcademic.class')}
            </label>
            <select
              value={formData.classCode || ''}
              onChange={(e) => setFormData({ ...formData, classCode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white !text-gray-900"
            >
              <option value="">{t('studentAcademic.selectClass')}</option>
              {classes.map((cls) => (
                <option key={cls.class_id} value={cls.class_code}>
                  {cls.class_code} ({t('studentAcademic.cohortLabel')} {cls.cohort_year})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
