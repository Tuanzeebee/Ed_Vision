import { useState } from "react";
import { TokenManager } from "@/lib/tokenManager";
import { useTranslation } from 'react-i18next';
import { buildUrl } from "@/services/api/config";

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
  parent: "Phụ huynh",
  // Support Vietnamese labels directly
  "Cha": "Cha",
  "Bố": "Bố",
  "Mẹ": "Mẹ",
  "Anh/Chị": "Anh/Chị",
  "Giám hộ": "Giám hộ",
};

const relationshipColors: Record<string, { bg: string; text: string }> = {
  father: { bg: "bg-blue-100", text: "text-blue-800" },
  mother: { bg: "bg-pink-100", text: "text-pink-800" },
  sibling: { bg: "bg-purple-100", text: "text-purple-800" },
  guardian: { bg: "bg-green-100", text: "text-green-800" },
  parent: { bg: "bg-gray-100", text: "text-gray-800" },
  // Support Vietnamese labels
  "Cha": { bg: "bg-blue-100", text: "text-blue-800" },
  "Bố": { bg: "bg-blue-100", text: "text-blue-800" },
  "Mẹ": { bg: "bg-pink-100", text: "text-pink-800" },
  "Anh/Chị": { bg: "bg-purple-100", text: "text-purple-800" },
  "Giám hộ": { bg: "bg-green-100", text: "text-green-800" },
};

const relationshipAvatarColors: Record<string, { bg: string; text: string }> = {
  father: { bg: "bg-blue-100", text: "text-blue-600" },
  mother: { bg: "bg-pink-100", text: "text-pink-600" },
  sibling: { bg: "bg-purple-100", text: "text-purple-600" },
  guardian: { bg: "bg-green-100", text: "text-green-600" },
  parent: { bg: "bg-gray-100", text: "text-gray-600" },
  // Support Vietnamese labels
  "Cha": { bg: "bg-blue-100", text: "text-blue-600" },
  "Bố": { bg: "bg-blue-100", text: "text-blue-600" },
  "Mẹ": { bg: "bg-pink-100", text: "text-pink-600" },
  "Anh/Chị": { bg: "bg-purple-100", text: "text-purple-600" },
  "Giám hộ": { bg: "bg-green-100", text: "text-green-600" },
};

export default function StudentParentLinks({
  linkedParents,
  registrationCode: _registrationCode = "PH2024-A7B3",
  onRegisterParent: _onRegisterParent,
}: Props) {
  const { t } = useTranslation('profile');
  const [_isCodeModalOpen, _setIsCodeModalOpen] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const handleRegisterParent = async () => {
    try {
      setIsGeneratingLink(true);
      
      // Call API to generate or get existing link code
      const token = TokenManager.getToken();
      if (!token) {
        alert(t('common.loginRequired'));
        return;
      }

      const response = await fetch(buildUrl('/profile/generate-parent-link'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP ${response.status}`;
        console.error('API Error:', errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Generate parent link response:', data);
      const linkCode = data.linkCode;

      if (!linkCode) {
        throw new Error(t('studentParentLinks.linkError'));
      }

      // Redirect to register page with the link code
      window.location.href = `/auth/register?linkCode=${linkCode}`;
    } catch (error: any) {
      console.error('Error generating parent link:', error);
      alert(error.message || t('studentParentLinks.linkError'));
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('studentParentLinks.title')}</h3>
        </div>

        {/* Table View (Desktop) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('studentParentLinks.parentName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('studentParentLinks.relationship')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('studentParentLinks.parentEmail')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('studentParentLinks.parentPhone')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {linkedParents.map((parent) => {
                const avatarColor = relationshipAvatarColors[parent.relationship] || relationshipAvatarColors.parent;
                const badgeColor = relationshipColors[parent.relationship] || relationshipColors.parent;
                const label = relationshipLabels[parent.relationship] || parent.relationship || "Phụ huynh";
                
                return (
                  <tr key={parent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full ${avatarColor.bg} flex items-center justify-center`}
                        >
                          <i
                            className={`fas fa-user ${avatarColor.text}`}
                          ></i>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{parent.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor.bg} ${badgeColor.text}`}
                      >
                        {label}
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
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Card View (Mobile) */}
        <div className="sm:hidden divide-y divide-gray-200">
          {linkedParents.map((parent) => {
            const avatarColor = relationshipAvatarColors[parent.relationship] || relationshipAvatarColors.parent;
            const badgeColor = relationshipColors[parent.relationship] || relationshipColors.parent;
            const label = relationshipLabels[parent.relationship] || parent.relationship || "Phụ huynh";
            
            return (
              <div key={parent.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center mb-3">
                  <div
                    className={`w-12 h-12 rounded-full ${avatarColor.bg} flex items-center justify-center`}
                  >
                    <i
                      className={`fas fa-user ${avatarColor.text}`}
                    ></i>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{parent.name}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor.bg} ${badgeColor.text} mt-1`}
                    >
                      {label}
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
            );
          })}
        </div>

        {/* Add Parent Link */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleRegisterParent}
            disabled={isGeneratingLink}
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGeneratingLink ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                {t('studentParentLinks.generating')}
              </>
            ) : (
              <>
                <i className="fas fa-plus-circle mr-2"></i>
                {t('studentParentLinks.generateCode')}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
