import { useState } from "react";
import RegistrationCodeModal from "@/components/ui/general/RegistrationCodeModal";

type Parent = {
  id: string;
  name: string;
  relationship: "father" | "mother" | "sibling" | "guardian";
  email: string;
  phone: string;
};

type Props = {
  linkedParents: Parent[];
  registrationCode?: string;
  onRegisterParent?: () => void;
};

const relationshipLabels: Record<string, string> = {
  father: "Cha",
  mother: "Mẹ",
  sibling: "Anh/Chị",
  guardian: "Giám hộ",
};

const relationshipColors: Record<string, { bg: string; text: string }> = {
  father: { bg: "bg-blue-100", text: "text-blue-800" },
  mother: { bg: "bg-pink-100", text: "text-pink-800" },
  sibling: { bg: "bg-purple-100", text: "text-purple-800" },
  guardian: { bg: "bg-green-100", text: "text-green-800" },
};

const relationshipAvatarColors: Record<string, { bg: string; text: string }> = {
  father: { bg: "bg-blue-100", text: "text-blue-600" },
  mother: { bg: "bg-pink-100", text: "text-pink-600" },
  sibling: { bg: "bg-purple-100", text: "text-purple-600" },
  guardian: { bg: "bg-green-100", text: "text-green-600" },
};

export default function StudentParentLinks({
  linkedParents,
  registrationCode = "PH2024-A7B3",
  onRegisterParent,
}: Props) {
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Phụ huynh liên kết</h3>
        </div>

        {/* Table View (Desktop) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Họ tên phụ huynh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quan hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số điện thoại
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {linkedParents.map((parent) => (
                <tr key={parent.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full ${relationshipAvatarColors[parent.relationship].bg} flex items-center justify-center`}
                      >
                        <i
                          className={`fas fa-user ${relationshipAvatarColors[parent.relationship].text}`}
                        ></i>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{parent.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${relationshipColors[parent.relationship].bg} ${relationshipColors[parent.relationship].text}`}
                    >
                      {relationshipLabels[parent.relationship]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <i className="fas fa-envelope text-gray-400 mr-2"></i>
                    {parent.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <i className="fas fa-phone text-gray-400 mr-2"></i>
                    {parent.phone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card View (Mobile) */}
        <div className="sm:hidden divide-y divide-gray-200">
          {linkedParents.map((parent) => (
            <div key={parent.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center mb-3">
                <div
                  className={`w-12 h-12 rounded-full ${relationshipAvatarColors[parent.relationship].bg} flex items-center justify-center`}
                >
                  <i
                    className={`fas fa-user ${relationshipAvatarColors[parent.relationship].text}`}
                  ></i>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{parent.name}</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${relationshipColors[parent.relationship].bg} ${relationshipColors[parent.relationship].text} mt-1`}
                  >
                    {relationshipLabels[parent.relationship]}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <i className="fas fa-envelope text-gray-400 mr-2 w-4"></i>
                  {parent.email}
                </p>
                <p>
                  <i className="fas fa-phone text-gray-400 mr-2 w-4"></i>
                  {parent.phone}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Add Parent Link */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => setIsCodeModalOpen(true)}
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <i className="fas fa-plus-circle mr-2"></i>
            Đăng ký tài khoản phụ huynh
          </button>
        </div>
      </div>

      {/* Registration Code Modal */}
      <RegistrationCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        registrationCode={registrationCode}
        onRegister={onRegisterParent}
      />
    </>
  );
}
