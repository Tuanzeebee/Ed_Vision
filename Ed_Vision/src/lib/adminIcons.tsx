import type { IconKey } from "./adminMenuConfig";

// Icon components mapping
export const iconComponents = {
  home: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-home ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  cog: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-cogs ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  users: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-users-cog ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  student: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-user-graduate ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  teacher: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-chalkboard-teacher ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  poll: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-poll ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  chart: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-chart-line ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  bar: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-chart-bar ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  line: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-chart-line ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  robot: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-robot ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  server: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-server ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  bell: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-bell ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  check: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-check-circle ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  shield: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-user-shield ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  certificate: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-certificate ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  activity: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-chart-line ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  studentMenu: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-user-graduate ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
  award: ({ isActive = false }: { isActive?: boolean }) => 
    <i className={`fas fa-trophy ${isActive ? 'text-blue-600': 'text-gray-400'}`}></i>,
} as const;

// Helper để get icon component
export function getIconComponent(iconKey: IconKey) {
  return iconComponents[iconKey] || iconComponents.home;
}