import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBreadcrumbConfig } from './breadcrumbConfig';

// Main hook to generate breadcrumbs
export function useBreadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  function generateBreadcrumbs(pathname: string): Array<{
    label: string;
    href?: string;
    icon?: React.ReactNode;
  }> {
    const breadcrumbs: Array<{
      label: string;
      href?: string;
      icon?: React.ReactNode;
    }> = [];
    
    const currentConfig = getBreadcrumbConfig(pathname);
    if (!currentConfig) {
      // Fallback breadcrumb
      return [
        { 
          label: t('admin:breadcrumb.home'), 
          href: '/admin/dashboard',
          icon: <i className="fas fa-home text-blue-600"></i>
        }
      ];
    }
    
    // Build breadcrumb chain by following parent relationships
    const visited = new Set<string>();
    let currentPath = pathname;
    
    while (currentPath && !visited.has(currentPath)) {
      visited.add(currentPath);
      const config = getBreadcrumbConfig(currentPath);
      
      if (!config) break;
      
      const breadcrumb: {
        label: string;
        href?: string;
        icon?: React.ReactNode;
      } = {
        label: t(config.config.labelKey)
      };
      
      // Add icon if specified
      if (config.config.icon) {
        breadcrumb.icon = <i className={config.config.icon}></i>;
      }
      
      // Add href for navigation (except for current page)
      if (currentPath !== pathname) {
        breadcrumb.href = currentPath;
      }
      
      breadcrumbs.unshift(breadcrumb);
      
      // Move to parent
      currentPath = config.config.parent || '';
    }
    
    return breadcrumbs;
  }
  
  const breadcrumbs = generateBreadcrumbs(location.pathname);
  
  const handleNavigate = (href: string) => {
    navigate(href);
  };
  
  return { breadcrumbs, handleNavigate };
}