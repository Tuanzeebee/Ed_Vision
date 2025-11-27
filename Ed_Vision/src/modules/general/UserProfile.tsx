import { type ReactNode } from "react";

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
};

export default function UserProfile({
  userData,
  additionalSections = [],
  onEditPersonalInfo,
}: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-4">
            <img
              src={userData.avatar}
              alt="User Avatar"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gray-200 shadow-sm object-cover"
            />
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {userData.name}
              </h1>
              {userData.age && (
                <p className="text-sm text-gray-500 mt-1">{userData.age} tuổi</p>
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
              <h3 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h3>
              {onEditPersonalInfo && (
                <button
                  onClick={onEditPersonalInfo}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <i className="fas fa-pencil-alt mr-2"></i>
                  Chỉnh sửa
                </button>
              )}
            </div>
            <div className="px-4 sm:px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Họ và tên
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {userData.personalInfo.fullName}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Ngày sinh
                  </label>
                  <p className="text-sm font-medium text-gray-900">
                    {userData.personalInfo.dateOfBirth}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Giới tính
                  </label>
                  <p className="text-sm font-medium text-gray-900">
                    {userData.personalInfo.gender}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Quốc tịch
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {userData.personalInfo.nationality}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Địa chỉ</label>
                <p className="text-sm font-medium text-gray-900">
                  {userData.personalInfo.address}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <p className="text-sm font-medium text-gray-900 flex items-center">
                  <i className="fas fa-envelope text-gray-400 mr-2"></i>
                  {userData.personalInfo.email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Số điện thoại
                </label>
                <p className="text-sm font-medium text-gray-900 flex items-center">
                  <i className="fas fa-phone text-gray-400 mr-2"></i>
                  {userData.personalInfo.phone}
                </p>
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
