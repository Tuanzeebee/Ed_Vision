import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// Simple Card components
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

// Teacher data interface
export interface TeacherData {
  id: string;
  name: string;
  position: string;
  department: string;
  specialization?: string;
  email: string;
  phone: string;
  avatar: string;
  status: string;
  onlineStatus: string;
  rating: number;
  qualityLevel?: string;
  totalReviews?: number;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  description?: string;
}

// Default teacher data (in practice, this would come from API)
const getDefaultTeacherData = (teacherId?: string): TeacherData => ({
  id: teacherId || "GV123",
  name: "TS. Tô Minh Vương",
  position: "Tiến sĩ",
  department: "Công nghệ Thông tin",
  specialization: "Kỹ thuật phần mềm",
  email: "vuongdeptrai@dtu.edu.vn",
  phone: "0368182380",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  status: "Đang hoạt động",
  onlineStatus: "Đang trực tuyến",
  rating: 4.8,
  qualityLevel: "Tốt",
  totalReviews: 245,
  dateOfBirth: "01/01/1936",
  gender: "Nam",
  address: "36 Hoa Thanh Quế",
  description: "Giảng viên có hơn 15 năm kinh nghiệm giảng dạy trong lĩnh vực Công nghệ Thông tin. Đã công bố hơn 50 công trình nghiên cứu khoa học, hướng dẫn nhiều nghiên cứu sinh và tham gia các dự án nghiên cứu cấp Bộ."
});

type Props = {
  teacherData?: TeacherData;
  showActionButtons?: boolean;
  onTeacherDataChange?: (data: TeacherData) => void;
}

export default function TeacherProfileHeader({ 
  teacherData: propTeacherData, 
  showActionButtons = true,
  onTeacherDataChange 
}: Props) {
  const { teacherId } = useParams();
  const [teacherData, setTeacherData] = useState<TeacherData>(() => 
    propTeacherData || getDefaultTeacherData(teacherId)
  );

  // Update teacher data when props change or teacherId changes
  useEffect(() => {
    if (propTeacherData) {
      setTeacherData(propTeacherData);
    } else if (teacherId && teacherId !== teacherData.id) {
      // In practice, fetch teacher data from API based on teacherId
      const newData = getDefaultTeacherData(teacherId);
      setTeacherData(newData);
      onTeacherDataChange?.(newData);
    }
  }, [propTeacherData, teacherId, teacherData.id, onTeacherDataChange]);

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <i 
        key={i} 
        className="fas fa-star text-yellow-400"
      />
    ));
  };

  const handleActionClick = (action: string) => {
    console.log(`${action} clicked for teacher:`, teacherData.id);
    // Implement action handlers here
  };

  return (
    <Card className="p-6">
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Teacher Avatar */}
          <div className="flex-shrink-0">
            <img 
              src={teacherData.avatar} 
              alt={teacherData.name} 
              className="w-32 h-32 rounded-lg border-4 border-gray-200 object-cover"
            />
          </div>
          
          {/* Teacher Info */}
          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-800">{teacherData.name}</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {teacherData.position}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">
                  Mã GV: <span className="font-medium">{teacherData.id}</span> – Khoa {teacherData.department}
                </p>
                <div className="flex items-center gap-4 mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                    {teacherData.onlineStatus}
                  </span>
                  <div className="flex items-center">
                    <div className="flex mr-2">
                      {renderStars()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{teacherData.rating}/5.0</span>
                    {teacherData.totalReviews && (
                      <span className="ml-2 text-sm text-gray-500">
                        (dựa trên {teacherData.totalReviews} đánh giá)
                      </span>
                    )}
                    {teacherData.qualityLevel && (
                      <span className="ml-2 text-sm font-medium text-green-600">({teacherData.qualityLevel})</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              {showActionButtons && (
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => handleActionClick('message')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center cursor-pointer"
                  >
                    <i className="fas fa-comment mr-1.5 text-xs"></i>
                    Nhắn tin
                  </button>
                  <button 
                    onClick={() => handleActionClick('call')}
                    className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center cursor-pointer"
                  >
                    <i className="fas fa-phone mr-1.5 text-xs"></i>
                    Gọi điện
                  </button>
                  <button 
                    onClick={() => handleActionClick('email')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center cursor-pointer"
                  >
                    <i className="fas fa-envelope mr-1.5 text-xs"></i>
                    Email
                  </button>
                  <button 
                    onClick={() => handleActionClick('edit')}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center cursor-pointer"
                  >
                    <i className="fas fa-edit mr-1.5 text-xs"></i>
                    Chỉnh sửa
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// The TeacherData interface is already exported above