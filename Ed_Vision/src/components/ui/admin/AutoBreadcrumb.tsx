import { useBreadcrumbs } from '../../../lib/useBreadcrumbs';

// Component to render breadcrumbs automatically based on current route
export default function AutoBreadcrumb() {
  const { breadcrumbs, handleNavigate } = useBreadcrumbs();
  
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-2">
      <nav className="flex items-center space-x-2 text-xs">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <div key={index} className="flex items-center">
              {crumb.icon && <span className="mr-1.5 text-xs">{crumb.icon}</span>}
              {crumb.href && !isLast ? (
                <button
                  onClick={() => handleNavigate(crumb.href!)}
                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className={isLast ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                  {crumb.label}
                </span>
              )}
              {!isLast && <span className="mx-1.5 text-gray-400 text-xs">/</span>}
            </div>
          );
        })}
      </nav>
    </div>
  );
}