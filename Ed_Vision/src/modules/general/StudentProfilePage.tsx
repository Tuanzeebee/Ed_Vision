import UserProfile from "./UserProfile";
import StudentAcademicInfo from "./StudentAcademicInfo";
import StudentParentLinks from "./StudentParentLinks";
import Header from "@/components/layout/Header";

type Props = {
  // Add any specific props if needed
};

export default function StudentProfilePage({}: Props) {
  // Sample data - replace with real data from API/props
  const studentData = {
    name: "Nguyễn Văn An",
    age: 18,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    status: "active" as const,
    statusLabel: "Đang học",
    personalInfo: {
      fullName: "Nguyễn Văn An",
      dateOfBirth: "15/03/2006",
      gender: "Nam",
      nationality: "Việt Nam",
      address: "123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh",
      email: "nguyenvanan@edvision.edu.vn",
      phone: "0901234567",
    },
  };

  const academicInfo = {
    studentId: "SV2024001",
    major: "Công nghệ thông tin",
    year: "2024",
    class: "CNTT-K47A",
    gpa: 3.75,
    credits: 120,
  };

  const linkedParents = [
    {
      id: "1",
      name: "Nguyễn Văn Bình",
      relationship: "father" as const,
      email: "nguyenvanbinh@gmail.com",
      phone: "0912345678",
    },
    {
      id: "2",
      name: "Trần Thị Lan",
      relationship: "mother" as const,
      email: "tranthilan@gmail.com",
      phone: "0923456789",
    },
  ];

  const handleEditPersonalInfo = () => {
    console.log("Edit personal info");
  };

  const handleEditAcademicInfo = () => {
    console.log("Edit academic info");
  };

  const handleRegisterParent = () => {
    console.log("Register parent");
  };

  return (
    <>
      <Header />
      <UserProfile
        userData={studentData}
        onEditPersonalInfo={handleEditPersonalInfo}
        additionalSections={[
          <StudentAcademicInfo
            key="academic"
            academicInfo={academicInfo}
            onEdit={handleEditAcademicInfo}
          />,
          <StudentParentLinks
            key="parents"
            linkedParents={linkedParents}
            registrationCode="PH2024-A7B3"
            onRegisterParent={handleRegisterParent}
          />,
        ]}
      />
    </>
  );
}
