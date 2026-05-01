import { type KeyboardEvent } from 'react';

export interface Tab {
  key: string;
  label: string;
  icon?: string;
}

export interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  className?: string;
}

export default function TabNavigation({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = '' 
}: TabNavigationProps) {
  
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, tabKey: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTabChange(tabKey);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      role="tablist"
      aria-label="Account information tabs"
    >
      <div className="border-b border-gray-200">
        <nav className="flex flex-col sm:flex-row sm:space-x-8 px-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.key}-panel`}
                id={`${tab.key}-tab`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onTabChange(tab.key)}
                onKeyDown={(e) => handleKeyDown(e, tab.key)}
                className={`
                  flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium 
                  cursor-pointer transition-all duration-200 ease-in-out
                  w-full sm:w-auto justify-center sm:justify-start
                  min-h-[44px]
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.icon && <i className={tab.icon}></i>}
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
