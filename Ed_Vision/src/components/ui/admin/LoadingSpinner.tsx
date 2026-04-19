import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm'| 'md'| 'lg';
  position?: 'center'| 'top'| 'custom';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps>= ({ 
  text = "Đang tải...", 
  size = 'md',
  position = 'center',
  className = ""}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-4', 
    lg: 'h-16 w-16 border-4'};

  const positionClasses = {
    center: 'absolute inset-0 flex items-center justify-center z-50',
    top: 'absolute top-16 left-1/2 transform -translate-x-1/2 z-50',
    custom: className
  };

  const containerClass = position === 'custom'? className : positionClasses[position];

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center space-y-2">
        <div className={`animate-spin rounded-full border-blue-600 border-t-transparent ${sizeClasses[size]}`}></div>
        {text && (
          <span className="text-base text-gray-700">{text}</span>)}
      </div>
    </div>);
};

export default LoadingSpinner;