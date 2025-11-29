import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProfileRedirect() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }

    // Redirect based on user role
    const role = user.role?.toLowerCase();
    
    switch (role) {
      case "student":
        navigate("/student/profile");
        break;
      case "teacher":
      case "instructor":
        navigate("/teacher/profile");
        break;
      case "parent":
        navigate("/parent/profile");
        break;
      case "admin":
        navigate("/admin/profile");
        break;
      default:
        // Default to student profile if role is unknown
        navigate("/student/profile");
    }
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
