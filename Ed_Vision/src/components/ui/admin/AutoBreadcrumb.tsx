import { useBreadcrumbs } from '../../../lib/useBreadcrumbs';

// Component to render breadcrumbs automatically based on current route
export default function AutoBreadcrumb() {
  const { breadcrumbs, handleNavigate } = useBreadcrumbs();
  
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <nav className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <div key={index} className="flex items-center">
              {crumb.icon && <span className="mr-2">{crumb.icon}</span>}
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
              {!isLast && <span className="mx-2 text-gray-400">/</span>}
            </div>
          );
        })}
      </nav>
    </div>
  );
}