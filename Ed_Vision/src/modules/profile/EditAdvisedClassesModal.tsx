import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { buildUrl } from "@/services/api/config";
import { TokenManager } from "@/lib/tokenManager";

type AdvisedClass = {
  classId: number;
  classCode: string;
  cohortYear: number;
  assignedDate: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currentClasses: AdvisedClass[];
  onSuccess: () => void;
};

export default function EditAdvisedClassesModal({
  isOpen,
  onClose,
  currentClasses,
  onSuccess,
}: Props) {
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<
    { classId: number; assignedDate: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const formatDateToInput = (dateString: string | null | undefined): string => {
    if (!dateString) return new Date().toISOString().split("T")[0];
    
    try {
      // Parse DD/MM/YYYY format if that's what we're getting
      if (dateString.includes("/")) {
        const [day, month, year] = dateString.split("/");
        const date = new Date(`${year}-${month}-${day}`);
        if (isNaN(date.getTime())) {
          return new Date().toISOString().split("T")[0];
        }
        return date.toISOString().split("T")[0];
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split("T")[0];
      }
      return date.toISOString().split("T")[0];
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Map current classes to selected format
      setSelectedClasses(
        currentClasses.map((c) => ({
          classId: c.classId,
          assignedDate: formatDateToInput(c.assignedDate),
        }))
      );
      loadAvailableClasses();
    }
  }, [isOpen, currentClasses]);

  const loadAvailableClasses = async () => {
    try {
      const token = TokenManager.getToken();
      if (!token) return;

      const res = await fetch(buildUrl("/profile/instructor/available-classes"), {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setAvailableClasses(data || []);
      }
    } catch (error) {
      console.error("Error loading available classes:", error);
    }
  };

  const handleAddClass = () => {
    setSelectedClasses([
      ...selectedClasses,
      {
        classId: 0,
        assignedDate: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const handleRemoveClass = (index: number) => {
    setSelectedClasses(selectedClasses.filter((_, i) => i !== index));
  };

  const handleClassChange = (index: number, classId: number) => {
    const newSelected = [...selectedClasses];
    newSelected[index].classId = classId;
    setSelectedClasses(newSelected);
  };

  const handleDateChange = (index: number, date: string) => {
    const newSelected = [...selectedClasses];
    newSelected[index].assignedDate = date;
    setSelectedClasses(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter only valid classes (classId > 0)
    const validClasses = selectedClasses.filter((c) => c.classId > 0);

    const payload = {
      classes: validClasses.map((c) => ({
        classId: c.classId,
        assignedDate: c.assignedDate,
      })),
    };

    console.log("Payload:", payload);

    try {
      setLoading(true);
      const token = TokenManager.getToken();
      if (!token) {
        alert("Vui lòng đăng nhập");
        return;
      }

      const res = await fetch(buildUrl("/profile/instructor/advised-classes"), {
        method: "PUT",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", res.status);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || "Cập nhật thất bại");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating advised classes:", error);
      alert(error?.message || "Có lỗi xảy ra khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header với gradient xanh lá */}
          <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 py-5 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <i className="fas fa-users text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Chỉnh sửa lớp cố vấn</h3>
                  <p className="text-sm text-green-100 mt-0.5">
                    Quản lý các lớp cố vấn của bạn
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {selectedClasses.map((selected, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Lớp <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selected.classId}
                          onChange={(e) =>
                            handleClassChange(index, parseInt(e.target.value))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                          required
                        >
                          <option value={0}>-- Chọn lớp --</option>
                          {availableClasses.map((cls) => (
                            <option key={cls.classId} value={cls.classId}>
                              {cls.classCode} - Khóa {cls.cohortYear}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Ngày bắt đầu <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={selected.assignedDate}
                          onChange={(e) => handleDateChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                          style={{ colorScheme: 'light' }}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveClass(index)}
                      className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa lớp này"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddClass}
              className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all"
            >
              <i className="fas fa-plus mr-2"></i>
              Thêm lớp cố vấn
            </button>

            {/* Footer buttons */}
            <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
