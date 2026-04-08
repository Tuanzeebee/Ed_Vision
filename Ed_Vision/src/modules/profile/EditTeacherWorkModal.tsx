import { useState, useEffect } from "react";
import { buildUrl } from "@/services/api/config";
import { TokenManager } from "@/lib/tokenManager";
import { useTranslation } from 'react-i18next';

type WorkData = {
  employeeCode?: string | null;
  academicTitle?: string | null;
  position?: string | null;
  departmentId?: number | null;
  hireDate?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currentWork: WorkData;
  onSuccess: () => void;
};

export default function EditTeacherWorkModal({
  isOpen,
  onClose,
  currentWork,
  onSuccess,
}: Props) {
  const { t } = useTranslation('profile');
  const [formData, setFormData] = useState<WorkData>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{ department_id: number; name: string; code: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        employeeCode: currentWork.employeeCode || '',
        academicTitle: currentWork.academicTitle || '',
        position: currentWork.position || '',
        departmentId: currentWork.departmentId || null,
        hireDate: currentWork.hireDate || '',
      });
      setError(null);
      loadDepartments();
    }
  }, [isOpen, currentWork]);

  const loadDepartments = async () => {
    try {
      const token = TokenManager.getToken();
      if (!token) return;

      const res = await fetch(buildUrl('/profile/departments'), {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error('Error loading departments:', err);
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
        employee_code: formData.employeeCode || null,
        academic_title: formData.academicTitle || null,
        position: formData.position || null,
        department_id: formData.departmentId || null,
        hire_date: formData.hireDate || null,
      };

      console.log('Sending payload:', payload);

      const res = await fetch(buildUrl("/profile/instructor/work"), {
        method: "PUT",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || t('teacherWork.updateError', { status: res.status }));
      }

      const result = await res.json();
      console.log('Success result:', result);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating work info:', err);
      setError(err?.message || t('common.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('teacherWork.modalTitle')}</h2>
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
              {t('teacherWork.instructorCode')}
            </label>
            <input
              type="text"
              value={formData.employeeCode || ''}
              onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white !text-gray-900"
              placeholder={t('teacherWork.instructorCodePlaceholder', { defaultValue: 'Enter instructor code' })}
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('teacherWork.academicTitle', { defaultValue: 'Academic Title' })}
            </label>
            <input
              type="text"
              value={formData.academicTitle || ''}
              onChange={(e) => setFormData({ ...formData, academicTitle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white !text-gray-900"
              placeholder={t('teacherWork.academicTitlePlaceholder', { defaultValue: 'E.g., Master, PhD, Associate Professor' })}
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('teacherWork.position')}
            </label>
            <input
              type="text"
              value={formData.position || ''}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white !text-gray-900"
              placeholder={t('teacherWork.positionPlaceholder', { defaultValue: 'E.g., Lecturer, Department Head' })}
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('teacherWork.department')}
            </label>
            <select
              value={formData.departmentId || ''}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white !text-gray-900"
            >
              <option value="">{t('teacherWork.selectDepartment', { defaultValue: '-- Select department --' })}</option>
              {departments.map((dept) => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('teacherWork.hireDate', { defaultValue: 'Hire Date' })}
            </label>
            <input
              type="date"
              value={formData.hireDate || ''}
              onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              style={{ colorScheme: 'light' }}
            />
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
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
