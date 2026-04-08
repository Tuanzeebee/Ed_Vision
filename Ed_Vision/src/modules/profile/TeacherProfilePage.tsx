import UserProfile from "./UserProfile";
import TeacherWorkInfo from "./TeacherWorkInfo";
import TeacherAdvisedClasses from "./TeacherAdvisedClasses";
import EditProfileModal from "./EditProfileModal";
import EditTeacherWorkModal from "./EditTeacherWorkModal";
import EditAdvisedClassesModal from "./EditAdvisedClassesModal";
import Header from "@/components/layout/Header";
import { useEffect, useState } from "react";
import { buildAssetUrl, buildUrl } from "@/services/api/config";
import { TokenManager } from "@/lib/tokenManager";
import { useTranslation } from 'react-i18next';

type Props = {
  // Add any specific props if needed
};

export default function TeacherProfilePage({}: Props) {
  const { t } = useTranslation('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [teacher, setTeacher] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditWorkModalOpen, setIsEditWorkModalOpen] = useState(false);
  const [isEditClassesModalOpen, setIsEditClassesModalOpen] = useState(false);
  const [, setUploadingAvatar] = useState(false);

  const loadProfile = async () => {
    const endpoint = buildUrl("/profile/instructor");
    try {
      setLoading(true);
      setError(null);

      const token = TokenManager.getToken();
      if (!token) {
        throw new Error(t('common.loginRequiredProfile'));
      }

      const res = await fetch(endpoint, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        throw new Error(t('common.loadError', { status: res.status }));
      }

      const data = await res.json().catch(() => ({}));
      
      console.log('API Response:', data);
      setTeacher(data ?? null);
    } catch (err: any) {
      setError(err?.message ?? t('common.dataLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const refetchProfile = async () => {
    await loadProfile();
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleEditPersonalInfo = () => {
    setIsEditModalOpen(true);
  };

  const handleProfileUpdateSuccess = async () => {
    await refetchProfile();
  };

  const handleEditAvatar = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setUploadingAvatar(true);
        const token = TokenManager.getToken();
        if (!token) {
          alert(t('common.loginRequired'));
          return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch(buildUrl('/profile/upload-avatar'), {
          method: 'POST',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Upload ảnh thất bại');
        }

        const { url } = await uploadRes.json();
        console.log('Uploaded avatar URL:', url);

        const updateRes = await fetch(buildUrl('/profile/me'), {
          method: 'PUT',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            avatar_url: url,
          }),
        });

        if (!updateRes.ok) {
          throw new Error('Cập nhật avatar thất bại');
        }

        // Update localStorage user object with new avatar
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userObj = JSON.parse(userStr);
            userObj.avatarUrl = url;
            userObj.avatar = url;
            userObj.avatar_url = url;
            localStorage.setItem('user', JSON.stringify(userObj));
          } catch (e) {
            console.error('Failed to update localStorage user', e);
          }
        }

        // Dispatch custom event to notify Header and other components
        window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { url } }));

        await refetchProfile();
      } catch (error: any) {
        console.error('Error uploading avatar:', error);
        alert(error?.message || t('common.uploadError'));
      } finally {
        setUploadingAvatar(false);
      }
    };

    input.click();
  };

  const handleEditWorkInfo = () => {
    setIsEditWorkModalOpen(true);
  };

  const handleWorkUpdateSuccess = async () => {
    await refetchProfile();
  };

  const handleEditClasses = () => {
    setIsEditClassesModalOpen(true);
  };

  const handleClassesUpdateSuccess = async () => {
    await refetchProfile();
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "—";
    }
  };

  const profile = teacher?.profile || {};
  console.log('Profile avatar URL:', profile.avatarUrl);
  
  const getFullAvatarUrl = (url: string | null | undefined): string => {
    if (!url) return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop";
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return buildAssetUrl(url);
  };
  
  const mappedUser = {
    name: profile.fullName || teacher?.employeeCode || t('teacherWork.title'),
    age: undefined as number | undefined,
    avatar: getFullAvatarUrl(profile.avatarUrl),
    status: (teacher?.status === "active" ? "active" : "inactive") as "active" | "inactive",
    statusLabel: teacher?.status === "active" ? t('teacherWork.activeStatus', { defaultValue: 'Active' }) : t('teacherWork.inactiveStatus', { defaultValue: 'Inactive' }),
    personalInfo: {
      fullName: profile.fullName || "",
      dateOfBirth: formatDate(profile.dateOfBirth),
      gender: profile.gender || "—",
      nationality: profile.nationality || "—",
      address: profile.address || "—",
      email: profile.email || "—",
      phone: profile.phoneNumber || "—",
    },
  };

  const mappedWorkInfo = {
    employeeCode: teacher?.employeeCode || "—",
    academicTitle: teacher?.academicTitle || "—",
    position: teacher?.position || "—",
    department: teacher?.departmentName || "—",
    hireDate: formatDate(teacher?.hireDate),
  };

  const mappedAdvisedClasses = (teacher?.advisedClasses || []).map((cls: any) => ({
    classId: cls.classId,
    classCode: cls.classCode,
    cohortYear: cls.cohortYear,
    studentCount: cls.studentCount || 0,
    assignedDate: formatDate(cls.assignedDate),
  }));

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center px-4 py-20 min-h-screen bg-gray-50">
          <div className="text-center text-gray-600">Đang tải hồ sơ...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center px-4 py-20 min-h-screen bg-gray-50">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </>
    );
  }

  const profileData = teacher?.profile || {};

  return (
    <>
      <Header />
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentProfile={{
          fullName: profileData.fullName,
          phoneNumber: profileData.phoneNumber,
          dateOfBirth: profileData.dateOfBirth,
          gender: profileData.gender,
          nationality: profileData.nationality,
          address: profileData.address,
          avatarUrl: profileData.avatarUrl,
        }}
        onSuccess={handleProfileUpdateSuccess}
      />
      <EditTeacherWorkModal
        isOpen={isEditWorkModalOpen}
        onClose={() => setIsEditWorkModalOpen(false)}
        currentWork={{
          employeeCode: teacher?.employeeCode,
          academicTitle: teacher?.academicTitle,
          position: teacher?.position,
          departmentId: teacher?.departmentId,
          hireDate: teacher?.hireDate,
        }}
        onSuccess={handleWorkUpdateSuccess}
      />
      <EditAdvisedClassesModal
        isOpen={isEditClassesModalOpen}
        onClose={() => setIsEditClassesModalOpen(false)}
        currentClasses={mappedAdvisedClasses}
        onSuccess={handleClassesUpdateSuccess}
      />
      <UserProfile
        userData={mappedUser as any}
        onEditPersonalInfo={handleEditPersonalInfo}
        onEditAvatar={handleEditAvatar}
        additionalSections={[
          <TeacherWorkInfo key="work" workInfo={mappedWorkInfo as any} onEdit={handleEditWorkInfo} />,
          <TeacherAdvisedClasses key="classes" advisedClasses={mappedAdvisedClasses} onEdit={handleEditClasses} />,
        ]}
      />
    </>
  );
}
