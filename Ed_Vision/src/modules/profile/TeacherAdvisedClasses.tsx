type AdvisedClass = {
  classId: number;
  classCode: string;
  cohortYear: number;
  studentCount: number;
  assignedDate: string;
};

type Props = {
  advisedClasses: AdvisedClass[];
  onEdit?: () => void;
};

export default function TeacherAdvisedClasses({ advisedClasses, onEdit }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Lớp cố vấn</h3>
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
      <div className="px-4 sm:px-6 py-5">
        {advisedClasses.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-users text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500">Chưa được phân công lớp cố vấn</p>
          </div>
        ) : (
          <div className="space-y-4">
            {advisedClasses.map((cls) => (
              <div
                key={cls.classId}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base font-semibold text-gray-900">
                        {cls.classCode}
                      </h4>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Khóa {cls.cohortYear}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-users text-gray-400 w-4"></i>
                        <span>{cls.studentCount} sinh viên</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-calendar text-gray-400 w-4"></i>
                        <span>Bắt đầu: {cls.assignedDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
