import UserProfile from "./UserProfile";
import ParentOccupationInfo from "./ParentOccupationInfo";
import EditProfileModal from "./EditProfileModal";
import EditParentOccupationModal from "./EditParentOccupationModal";
import Header from "@/components/layout/Header";
import { useEffect, useState } from "react";
import { buildUrl } from "@/services/api/config";
import { TokenManager } from "@/lib/tokenManager";

type Props = {
  // Add any specific props if needed
};

export default function ParentProfilePage({}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [parent, setParent] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditOccupationModalOpen, setIsEditOccupationModalOpen] = useState(false);
  const [, setUploadingAvatar] = useState(false);

  const loadProfile = async () => {
    const endpoint = buildUrl("/profile/parent");
    try {
      setLoading(true);
      setError(null);

      const token = TokenManager.getToken();
      if (!token) {
        throw new Error("Vui lòng đăng nhập để xem hồ sơ");
      }

      const res = await fetch(endpoint, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        throw new Error(`Không thể tải dữ liệu hồ sơ (status: ${res.status})`);
      }

      const data = await res.json().catch(() => ({}));
      
      console.log('API Response:', data);
      setParent(data ?? null);
    } catch (err: any) {
      setError(err?.message ?? "Lỗi khi tải dữ liệu");
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
    // Refetch profile data without reload
    await refetchProfile();
  };

  const handleEditAvatar = () => {
    // Create hidden file input
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
          alert('Vui lòng đăng nhập');
          return;
        }

        // Upload avatar
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

        // Update profile with new avatar URL
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

        // Refetch profile to show new avatar
        await refetchProfile();
      } catch (error: any) {
        console.error('Error uploading avatar:', error);
        alert(error?.message || 'Có lỗi xảy ra khi tải ảnh lên');
      } finally {
        setUploadingAvatar(false);
      }
    };

    input.click();
  };

  const handleEditOccupationInfo = () => {
    setIsEditOccupationModalOpen(true);
  };

  const handleOccupationUpdateSuccess = async () => {
    // Refetch profile data without reload
    await refetchProfile();
  };

  // Helper function to format date to DD/MM/YYYY
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

  // Map API data to component props expected by UserProfile and children
  const profile = parent?.profile || {};
  console.log('Profile avatar URL:', profile.avatarUrl);
  
  // Convert relative avatar URL to full URL if needed
  const getFullAvatarUrl = (url: string | null | undefined): string => {
    if (!url) return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop";
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:3000${url}`;
  };
  
  const mappedUser = {
    name: profile.fullName || "Phụ huynh",
    age: undefined as number | undefined,
    avatar: getFullAvatarUrl(profile.avatarUrl),
    status: ("active" as "active" | "inactive"),
    statusLabel: "Hoạt động",
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

  const mappedOccupation = {
    relationshipType: parent?.relationshipType || "—",
    occupation: parent?.occupation || "—",
    workplace: parent?.workplace || "—",
  };

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

  const profileData = parent?.profile || {};

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
      <EditParentOccupationModal
        isOpen={isEditOccupationModalOpen}
        onClose={() => setIsEditOccupationModalOpen(false)}
        currentOccupation={{
          relationshipType: parent?.relationshipType,
          occupation: parent?.occupation,
          workplace: parent?.workplace,
        }}
        onSuccess={handleOccupationUpdateSuccess}
      />
      <UserProfile
        userData={mappedUser as any}
        onEditPersonalInfo={handleEditPersonalInfo}
        onEditAvatar={handleEditAvatar}
        additionalSections={[
          <ParentOccupationInfo key="occupation" occupationInfo={mappedOccupation as any} onEdit={handleEditOccupationInfo} />,
        ]}
      />
    </>
  );
}
