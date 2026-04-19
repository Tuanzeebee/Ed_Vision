import { useNavigate, useParams } from "react-router-dom";
import { teacherNavigationTabs, type TeacherNavigationTab } from "./teacherNavigationConfig";

// Simple Card components
const Card = ({ children, className = ""}: { children: React.ReactNode; className?: string }) =>(
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>);

type Props = {
  activeTab: string;
  onTabChange?: (tabLabel: string) =>void;
}

export default function TeacherTabNavigation({ activeTab, onTabChange }: Props) {
  const { teacherId } = useParams();
  const navigate = useNavigate();

  const handleTabClick = (tab: TeacherNavigationTab) => {
    const targetPath = `/admin/teachers/${teacherId}${tab.path}`;
    
    // Navigate to the appropriate route
    navigate(targetPath);
    
    // Call callback if provided
    onTabChange?.(tab.label);
  };

  const isTabActive = (tab: TeacherNavigationTab) => {
    // Check by path segment or by label
    const pathSegment = tab.path.replace('/', '') || 'profile';
    return activeTab === pathSegment || activeTab === tab.label;
  };

  return (
    <Card>
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6"aria-label="Tabs">
          {teacherNavigationTabs.map((tab, index) =>(
            <button
              key={index}
              onClick={() =>handleTabClick(tab)}
              className={`border-b-2 py-4 px-1 text-sm font-medium cursor-pointer transition-colors ${
                isTabActive(tab)
                  ? 'border-blue-500 text-blue-600': 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {tab.label}
            </button>))}
        </nav>
      </div>
    </Card>);
}