import { useState, useEffect } from "react";
import { buildUrl } from "@/services/api/config";
import { TokenManager } from "@/lib/tokenManager";

type OccupationData = {
  relationshipType?: string | null;
  occupation?: string | null;
  workplace?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () =>void;
  currentOccupation: OccupationData;
  onSuccess: () =>void;
};

export default function EditParentOccupationModal({
  isOpen,
  onClose,
  currentOccupation,
  onSuccess,
}: Props) {
  const [formData, setFormData] = useState<OccupationData>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        relationshipType: currentOccupation.relationshipType || '',
        occupation: currentOccupation.occupation || '',
        workplace: currentOccupation.workplace || '',
      });
      setError(null);
    }
  }, [isOpen, currentOccupation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = TokenManager.getToken();
      if (!token) {
        throw new Error("Vui lòng đăng nhập");
      }

      const payload = {
        relationship_type: formData.relationshipType || null,
        occupation: formData.occupation || null,
        workplace: formData.workplace || null,
      };

      console.log('Sending payload:', payload);

      const res = await fetch(buildUrl("/profile/parent/occupation"), {
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
        const errorData = await res.json().catch(() =>({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || `Không thể cập nhật thông tin nghề nghiệp (status: ${res.status})`);
      }

      const result = await res.json();
      console.log('Success result:', result);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating occupation:', err);
      setError(err?.message || "Lỗi khi lưu thông tin");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)'}}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Chỉnh sửa thông tin nghề nghiệp</h2>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Quan hệ với học sinh
            </label>
            <input
              type="text"value={formData.relationshipType || ''}
              onChange={(e) =>setFormData({ ...formData, relationshipType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white !text-gray-900"placeholder="Ví dụ: Cha, Mẹ, Anh, Chị..."maxLength={32}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nghề nghiệp
            </label>
            <input
              type="text"value={formData.occupation || ''}
              onChange={(e) =>setFormData({ ...formData, occupation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white !text-gray-900"placeholder="Ví dụ: Giáo viên, Bác sĩ, Kỹ sư..."maxLength={120}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nơi làm việc
            </label>
            <input
              type="text"value={formData.workplace || ''}
              onChange={(e) =>setFormData({ ...formData, workplace: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white !text-gray-900"placeholder="Ví dụ: Công ty ABC, Bệnh viện XYZ..."maxLength={255}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50">Hủy
            </button>
            <button
              type="submit"disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition-all">
              {saving ? "Đang lưu...": "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
