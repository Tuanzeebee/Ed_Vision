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
  teacherId?: string; // Optional prop, fallback to useParams if not provided
  embedded?: boolean; // New prop to indicate if this is embedded in AccountDetailPage
}

export default function TeacherTabNavigation({ activeTab, onTabChange, teacherId: teacherIdProp, embedded = false }: Props) {
  const { teacherId: teacherIdParam } = useParams();
  const navigate = useNavigate();
  
  // Use prop if provided, otherwise fallback to URL param
  const teacherId = teacherIdProp || teacherIdParam;

  const handleTabClick = (tab: TeacherNavigationTab) => {
    if (embedded) {
      // If embedded (in AccountDetailPage), just call the callback without navigation
      onTabChange?.(tab.label);
    } else {
      // If standalone (old route), navigate to the appropriate route
      const targetPath = `/admin/teachers/${teacherId}${tab.path}`;
      navigate(targetPath);
      onTabChange?.(tab.label);
    }
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