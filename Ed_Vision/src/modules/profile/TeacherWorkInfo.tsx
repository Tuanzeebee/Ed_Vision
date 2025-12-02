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
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Thông tin công tác</h3>
        {onEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <i className="fas fa-pencil-alt mr-2"></i>
            Chỉnh sửa
          </button>
        )}
      </div>
      <div className="px-4 sm:px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Mã giảng viên</label>
          <p className="text-sm font-medium text-gray-900">{workInfo.employeeCode}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Học hàm/Học vị</label>
          <p className="text-sm font-medium text-gray-900">{workInfo.academicTitle || "—"}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Chức vụ</label>
          <p className="text-sm font-medium text-gray-900">{workInfo.position || "—"}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Khoa</label>
          <p className="text-sm font-medium text-gray-900">{workInfo.department || "—"}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Ngày bắt đầu công tác</label>
          <div className="flex items-center gap-2">
            <i className="fas fa-calendar text-gray-900"></i>
            <p className="text-sm font-medium text-gray-900">{workInfo.hireDate || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
