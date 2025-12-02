import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TeacherLayout from './components/TeacherLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/teacher/teacher_card'
import { Button } from '@/components/ui/teacher/teacher_button'
import { 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    Calendar, 
    Briefcase, 
    GraduationCap,
    Edit,
    Save,
    X,
    Camera
} from 'lucide-react'

interface TeacherProfile {
    id: string
    fullName: string
    email: string
    phone: string
    address: string
    dateOfBirth: string
    gender: string
    department: string
    position: string
    degree: string
    specialization: string
    yearsOfExperience: number
    avatar: string
    bio: string
}

export default function TeacherProfile() {
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = useState(false)
    const [profile, setProfile] = useState<TeacherProfile | null>(null)
    const [editedProfile, setEditedProfile] = useState<TeacherProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        try {
            setLoading(true)
            // TODO: Gọi API để lấy profile thật
            // const data = await teacherProfileAPI.getProfile()
            
            // Mock data
            const mockProfile: TeacherProfile = {
                id: 'T001',
                fullName: 'TS. Nguyễn Văn A',
                email: 'nguyenvana@university.edu.vn',
                phone: '0123456789',
                address: 'Số 144 Xuân Thủy, Cầu Giấy, Hà Nội',
                dateOfBirth: '1985-05-15',
                gender: 'Nam',
                department: 'Khoa Công nghệ Thông tin',
                position: 'Giảng viên chính',
                degree: 'Tiến sĩ',
                specialization: 'Trí tuệ nhân tạo, Machine Learning',
                yearsOfExperience: 10,
                avatar: 'https://i.pravatar.cc/300?img=12',
                bio: 'Giảng viên với hơn 10 năm kinh nghiệm giảng dạy và nghiên cứu trong lĩnh vực Trí tuệ nhân tạo và Machine Learning. Đã hướng dẫn hơn 50 sinh viên tốt nghiệp và xuất bản nhiều công trình nghiên cứu quốc tế.'
            }
            
            setProfile(mockProfile)
            setEditedProfile(mockProfile)
        } catch (error) {
            console.error('Error loading profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            // TODO: Gọi API để update profile
            // await teacherProfileAPI.updateProfile(editedProfile)
            
            setProfile(editedProfile)
            setIsEditing(false)
            alert('Cập nhật thông tin thành công!')
        } catch (error) {
            console.error('Error saving profile:', error)
            alert('Có lỗi xảy ra khi cập nhật thông tin!')
        }
    }

    const handleCancel = () => {
        setEditedProfile(profile)
        setIsEditing(false)
    }

    const handleChange = (field: keyof TeacherProfile, value: string | number) => {
        if (editedProfile) {
            setEditedProfile({
                ...editedProfile,
                [field]: value
            })
        }
    }

    if (loading) {
        return (
            <TeacherLayout currentPage="profile">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
                    </div>
                </div>
            </TeacherLayout>
        )
    }

    if (!profile) {
        return (
            <TeacherLayout currentPage="profile">
                <div className="text-center py-12">
                    <p className="text-gray-600">Không tìm thấy thông tin hồ sơ</p>
                </div>
            </TeacherLayout>
        )
    }

    return (
        <TeacherLayout currentPage="profile">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-lg mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Hồ sơ cá nhân</h2>
                        <p className="text-blue-100">Quản lý thông tin cá nhân của bạn</p>
                    </div>
                    {!isEditing ? (
                        <Button
                            onClick={() => setIsEditing(true)}
                            className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-all border border-white/30"
                        >
                            <Edit className="w-4 h-4" />
                            <span>Chỉnh sửa</span>
                        </Button>
                    ) : (
                        <div className="flex space-x-3">
                            <Button
                                onClick={handleSave}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
                            >
                                <Save className="w-4 h-4" />
                                <span>Lưu</span>
                            </Button>
                            <Button
                                onClick={handleCancel}
                                className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg flex items-center space-x-2 border border-white/30"
                            >
                                <X className="w-4 h-4" />
                                <span>Hủy</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Avatar và thông tin cơ bản */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-center">
                                <div className="relative inline-block mb-4">
                                    <img
                                        src={isEditing ? editedProfile?.avatar : profile.avatar}
                                        alt="Avatar"
                                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 mx-auto"
                                    />
                                    {isEditing && (
                                        <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                                            <Camera className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                    {isEditing ? editedProfile?.fullName : profile.fullName}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                    {isEditing ? editedProfile?.position : profile.position}
                                </p>
                                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {isEditing ? editedProfile?.degree : profile.degree}
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="space-y-3">
                                    <div className="flex items-center text-sm">
                                        <Briefcase className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-gray-600">Kinh nghiệm:</span>
                                        <span className="ml-auto font-semibold text-gray-900">
                                            {isEditing ? editedProfile?.yearsOfExperience : profile.yearsOfExperience} năm
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <GraduationCap className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-gray-600">Khoa:</span>
                                        <span className="ml-auto font-semibold text-gray-900 text-right">
                                            {isEditing ? editedProfile?.department : profile.department}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Thông tin chi tiết */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Thông tin cá nhân */}
                    <Card>
                        <CardHeader className="border-b border-gray-200">
                            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                                <User className="w-5 h-5 text-blue-600 mr-2" />
                                Thông tin cá nhân
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Họ và tên
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedProfile?.fullName}
                                            onChange={(e) => handleChange('fullName', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900 font-medium">{profile.fullName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ngày sinh
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            value={editedProfile?.dateOfBirth}
                                            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900 flex items-center">
                                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                            {new Date(profile.dateOfBirth).toLocaleDateString('vi-VN')}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Giới tính
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={editedProfile?.gender}
                                            onChange={(e) => handleChange('gender', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    ) : (
                                        <p className="text-gray-900">{profile.gender}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <p className="text-gray-900 flex items-center">
                                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                        {profile.email}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Số điện thoại
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            value={editedProfile?.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900 flex items-center">
                                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                            {profile.phone}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Địa chỉ
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedProfile?.address}
                                            onChange={(e) => handleChange('address', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900 flex items-center">
                                            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                            {profile.address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Thông tin nghề nghiệp */}
                    <Card>
                        <CardHeader className="border-b border-gray-200">
                            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                                <Briefcase className="w-5 h-5 text-blue-600 mr-2" />
                                Thông tin nghề nghiệp
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Khoa
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedProfile?.department}
                                            onChange={(e) => handleChange('department', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900 font-medium">{profile.department}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chức vụ
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedProfile?.position}
                                            onChange={(e) => handleChange('position', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900 font-medium">{profile.position}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Học vị
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={editedProfile?.degree}
                                            onChange={(e) => handleChange('degree', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="Cử nhân">Cử nhân</option>
                                            <option value="Thạc sĩ">Thạc sĩ</option>
                                            <option value="Tiến sĩ">Tiến sĩ</option>
                                            <option value="Giáo sư">Giáo sư</option>
                                        </select>
                                    ) : (
                                        <p className="text-gray-900 font-medium">{profile.degree}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Số năm kinh nghiệm
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={editedProfile?.yearsOfExperience}
                                            onChange={(e) => handleChange('yearsOfExperience', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900 font-medium">{profile.yearsOfExperience} năm</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chuyên môn
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedProfile?.specialization}
                                            onChange={(e) => handleChange('specialization', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900">{profile.specialization}</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Giới thiệu
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            value={editedProfile?.bio}
                                            onChange={(e) => handleChange('bio', e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        />
                                    ) : (
                                        <p className="text-gray-700 text-sm leading-relaxed">{profile.bio}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TeacherLayout>
    )
}
