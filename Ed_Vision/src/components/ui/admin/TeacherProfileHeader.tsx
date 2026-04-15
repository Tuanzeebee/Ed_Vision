import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import instructorService, { type Instructor } from "@/services/api/instructorService";

// Simple Card components
const Card = ({ children, className = ""}: { children: React.ReactNode; className?: string }) =>(
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>);

const CardContent = ({ children, className = ""}: { children: React.ReactNode; className?: string }) =>(
  <div className={className}>
    {children}
  </div>);

// Teacher data interface (derived from API Instructor data)
export interface TeacherData {
  id: string;
  employeeCode: string;
  name: string;
  position: string;
  department: string;
  specialization?: string;
  email: string;
  phone?: string;
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
  academicTitle?: string;
}

// Convert API Instructor to TeacherData
const mapInstructorToTeacherData = (instructor: Instructor): TeacherData => {
  const getQualityLevel = (advisingCount: number = 0) => {
    if (advisingCount >= 2) return "Tốt";
    if (advisingCount === 1) return "Khá";
    return "Trung bình";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Đang hoạt động";
      case "on_leave": return "Nghỉ phép";
      case "inactive": return "Không hoạt động";
      default: return status;
    }
  };

  const getGenderLabel = (gender?: string | null) => {
    if (!gender) return undefined;
    switch (gender.toLowerCase()) {
      case "male": return "Nam";
      case "female": return "Nữ";
      case "other": return "Khác";
      default: return gender;
    }
  };

  return {
    id: instructor.instructorId.toString(),
    employeeCode: instructor.employeeCode,
    name: instructor.profile?.fullName || 'N/A',
    position: instructor.position || instructor.academicTitle || 'Giảng viên',
    academicTitle: instructor.academicTitle,
    department: instructor.department?.departmentName || 'Chưa phân công',
    email: instructor.email,
    phone: undefined, // Phone is in Profile table but not exposed in API yet
    avatar: instructor.profile?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    status: getStatusLabel(instructor.status),
    onlineStatus: "Đang trực tuyến", // This could be computed from last_login_at
    rating: 4.8, // TODO: Get from actual reviews
    qualityLevel: getQualityLevel(instructor.advisingClassCount),
    totalReviews: 245, // TODO: Get from actual reviews
    dateOfBirth: instructor.profile?.dateOfBirth ? new Date(instructor.profile.dateOfBirth).toLocaleDateString('vi-VN') : undefined,
    gender: getGenderLabel(instructor.profile?.gender),
    address: instructor.profile?.address || undefined,
    description: `Giảng viên thuộc ${instructor.department?.departmentName || 'khoa'}.`
  };
};

type Props = {
  teacherData?: TeacherData;
  showActionButtons?: boolean;
  onTeacherDataChange?: (data: TeacherData) =>void;
}

export default function TeacherProfileHeader({ 
  teacherData: propTeacherData, 
  showActionButtons = true,
  onTeacherDataChange 
}: Props) {
  const { teacherId } = useParams();
  const [teacherData, setTeacherData] = useState<TeacherData | null>(propTeacherData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to store callback to avoid infinite loop
  const onTeacherDataChangeRef = useRef(onTeacherDataChange);
  onTeacherDataChangeRef.current = onTeacherDataChange;

  // Fetch teacher data from API
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (propTeacherData) {
        setTeacherData(propTeacherData);
        return;
      }

      if (!teacherId) return;

      try {
        setIsLoading(true);
        setError(null);
        const instructor = await instructorService.getInstructorById(Number(teacherId));
        const mappedData = mapInstructorToTeacherData(instructor);
        setTeacherData(mappedData);
        onTeacherDataChangeRef.current?.(mappedData);
      } catch (err) {
        console.error('Failed to fetch teacher data:', err);
        setError('Không thể tải thông tin giảng viên');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacherData();
  }, [propTeacherData, teacherId]);

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) =>(
      <i 
        key={i} 
        className="fas fa-star text-yellow-400"/>));
  };

  const handleActionClick = (action: string) => {
    console.log(`${action} clicked for teacher:`, teacherData?.id);
    // Implement action handlers here
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Đang tải thông tin giảng viên...</span>
          </div>
        </CardContent>
      </Card>);
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6">
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-600">
            <i className="fas fa-exclamation-circle mr-2"></i>
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>);
  }

  // No data state
  if (!teacherData) {
    return (
      <Card className="p-6">
        <CardContent>
          <div className="flex items-center justify-center py-8 text-gray-500">
            <span>Không tìm thấy thông tin giảng viên</span>
          </div>
        </CardContent>
      </Card>);
  }

  return (
    <Card className="p-6">
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Teacher Avatar */}
          <div className="flex-shrink-0">
            <img 
              src={teacherData.avatar} 
              alt={teacherData.name} 
              className="w-32 h-32 rounded-lg border-4 border-gray-200 object-cover"/>
          </div>
          
          {/* Teacher Info */}
          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {teacherData.academicTitle ? `${teacherData.academicTitle}. ` : ''}{teacherData.name}
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {teacherData.position}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">Mã GV: <span className="font-medium">{teacherData.employeeCode}</span>– {teacherData.department}
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
                      <span className="ml-2 text-sm text-gray-500">(dựa trên {teacherData.totalReviews} đánh giá)
                      </span>)}
                    {teacherData.qualityLevel && (
                      <span className="ml-2 text-sm font-medium text-green-600">({teacherData.qualityLevel})</span>)}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              {showActionButtons && (
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() =>handleActionClick('message')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center cursor-pointer">
                    <i className="fas fa-comment mr-1.5 text-xs"></i>Nhắn tin
                  </button>
                  <button 
                    onClick={() =>handleActionClick('call')}
                    className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center cursor-pointer">
                    <i className="fas fa-phone mr-1.5 text-xs"></i>Gọi điện
                  </button>
                  <button 
                    onClick={() =>handleActionClick('email')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center cursor-pointer">
                    <i className="fas fa-envelope mr-1.5 text-xs"></i>Email
                  </button>
                  <button 
                    onClick={() =>handleActionClick('edit')}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center cursor-pointer">
                    <i className="fas fa-edit mr-1.5 text-xs"></i>Chỉnh sửa
                  </button>
                </div>)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>);
}

// The TeacherData interface is already exported above