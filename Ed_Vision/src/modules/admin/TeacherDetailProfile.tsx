import AdminLayout from "@/components/ui/admin/AdminLayout";
import TeacherProfileHeader, { type TeacherData } from "@/components/ui/admin/TeacherProfileHeader";
import TeacherTabNavigation from "@/components/ui/admin/TeacherTabNavigation";
import { useState } from "react";
import { useParams } from "react-router-dom";

// Simple Card components for content sections
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>
    {children}
  </div>
);

// Achievements data
const achievements = [
  {
    icon: "fas fa-medal",
    color: "text-yellow-500",
    text: "Giải thưởng Giảng viên xuất sắc năm 2023"
  },
  {
    icon: "fas fa-file-alt",
    color: "text-blue-500",
    text: "Hơn 50 công trình nghiên cứu công bố"
  },
  {
    icon: "fas fa-project-diagram",
    color: "text-green-500",
    text: "Chủ nhiệm 5 đề tài nghiên cứu cấp Bộ"
  }
];

// Recent activities data
const recentActivities = [
  {
    icon: "fas fa-calendar-check",
    color: "text-blue-500",
    title: "Tham gia hội thảo AI & ML",
    date: "15/11/2024"
  },
  {
    icon: "fas fa-user-graduate",
    color: "text-purple-500",
    title: "Hướng dẫn 12 sinh viên làm đồ án tốt nghiệp",
    date: null
  },
  {
    icon: "fas fa-star",
    color: "text-yellow-500",
    title: "Đánh giá 8 bài báo khoa học quốc tế",
    date: null
  }
];

export default function TeacherDetailProfile() {
  const { teacherId } = useParams();
  const [activeTab, setActiveTab] = useState("Thông tin cá nhân");
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);

  // In thực tế, sẽ fetch data dựa trên teacherId
  console.log("Teacher ID from URL:", teacherId);

  const handleTeacherDataChange = (data: TeacherData) => {
    setTeacherData(data);
  };

  const handleTabChange = (tabLabel: string) => {
    setActiveTab(tabLabel);
  };


  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Teacher Profile Header */}
        <TeacherProfileHeader 
          onTeacherDataChange={handleTeacherDataChange}
        />

        {/* Navigation Tabs */}
        <TeacherTabNavigation 
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Content Grid - Show content with fallback data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Information */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="p-6">
              <CardContent>
                <h3 className="text-xl font-bold text-gray-800 mb-6">Thông tin cơ bản</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Họ và tên</label>
                    <p className="text-lg font-semibold text-gray-800">{teacherData?.name?.replace('TS. ', '') || 'Tô Minh Vương'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <p className="text-lg text-blue-600">{teacherData?.email || 'vuongdeptrai@dtu.edu.vn'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Số điện thoại</label>
                    <p className="text-lg text-gray-800">{teacherData?.phone || '0368182380'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Khoa/Bộ môn</label>
                    <p className="text-lg text-gray-800">{teacherData?.department || 'Công nghệ Thông tin'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Chuyên ngành</label>
                    <p className="text-lg text-gray-800">{teacherData?.specialization || 'Kỹ thuật phần mềm'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Mô tả</label>
                    <p className="text-gray-700 leading-relaxed">{teacherData?.description || 'Giảng viên có hơn 15 năm kinh nghiệm giảng dạy trong lĩnh vực Công nghệ Thông tin.'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Info, Achievements, Activities */}
          <div className="space-y-6">
            {/* Detailed Information */}
            <Card className="p-6">
              <CardContent>
                <h3 className="text-xl font-bold text-gray-800 mb-6">Thông tin chi tiết</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Ngày sinh</label>
                    <p className="text-gray-800">{teacherData?.dateOfBirth || '01/01/1936'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Giới tính</label>
                    <p className="text-gray-800">{teacherData?.gender || 'Nam'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Địa chỉ</label>
                    <p className="text-gray-800">{teacherData?.address || '108 Đống Đa, TP Đà Nẵng'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Học hàm/học vị</label>
                    <p className="text-gray-800">{teacherData?.position || 'Tiến sĩ'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Trạng thái</label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                      {teacherData?.status || 'Đang hoạt động'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Outstanding Achievements */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                <i className="fas fa-trophy mr-2"></i>
                Thành tích nổi bật
              </h3>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start">
                    <i className={`${achievement.icon} ${achievement.color} mt-1 mr-3`}></i>
                    <p className="text-blue-700">{achievement.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-green-50 rounded-lg border border-green-200 p-6">
              <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                <i className="fas fa-clock mr-2"></i>
                Hoạt động gần đây
              </h3>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start">
                    <i className={`${activity.icon} ${activity.color} mt-1 mr-3`}></i>
                    <div>
                      <p className="text-green-700 font-medium">{activity.title}</p>
                      {activity.date && (
                        <p className="text-green-600 text-sm">{activity.date}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}