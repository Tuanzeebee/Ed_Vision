import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/Teacher_utils';

interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: CustomSelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
}

// CSS for custom select styling
const selectStyles = `
  .custom-select-wrapper {
    position: relative;
    width: 100%;
  }

  .custom-select-wrapper select {
    cursor: pointer;
    background-image: none;
  }

  .custom-select-wrapper select:hover {
    border-color: #9CA3AF !important;
  }

  .custom-select-wrapper select:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Style for dropdown options */
  .custom-select-wrapper select option {
    padding: 12px 16px;
    background-color: white;
    color: #1F2937;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .custom-select-wrapper select option:hover {
    background-color: #EFF6FF;
    color: #2563EB;
  }

  .custom-select-wrapper select option:checked {
    background-color: #DBEAFE;
    color: #1D4ED8;
    font-weight: 600;
  }

  .custom-select-wrapper select option:disabled {
    color: #9CA3AF;
    font-weight: 400;
  }

  /* Better focus state */
  .custom-select-wrapper select:focus option:checked {
    background: linear-gradient(to right, #DBEAFE, #BFDBFE);
  }

  /* Smooth scroll for long lists */
  .custom-select-wrapper select {
    scrollbar-width: thin;
    scrollbar-color: #BFDBFE #F3F4F6;
  }

  .custom-select-wrapper select::-webkit-scrollbar {
    width: 8px;
  }

  .custom-select-wrapper select::-webkit-scrollbar-track {
    background: #F3F4F6;
    border-radius: 4px;
  }

  .custom-select-wrapper select::-webkit-scrollbar-thumb {
    background: #BFDBFE;
    border-radius: 4px;
  }

  .custom-select-wrapper select::-webkit-scrollbar-thumb:hover {
    background: #93C5FD;
  }
`;

export const CustomSelect = React.forwardRef<HTMLSelectElement, CustomSelectProps>(
  (
    {
      options,
      placeholder = 'Chọn...',
      icon,
      label,
      required = false,
      error,
      helpText,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <>
        <style>{selectStyles}</style>
        <div className="space-y-3">
          {/* Label */}
          {label && (
            <label className="text-sm font-semibold text-gray-700 flex items-center">
              {icon && <span className="mr-2">{icon}</span>}
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}

          {/* Select Wrapper */}
          <div className="custom-select-wrapper">
            <select
              ref={ref}
              className={cn(
                'w-full bg-gray-50 border-2 rounded-xl px-5 py-4 text-gray-900',
                'appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'outline-none text-base font-medium transition-all hover:border-gray-400',
                error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300',
                className
              )}
              {...props}
            >
              {/* Placeholder option */}
              <option value="" disabled>
                -- {placeholder} --
              </option>

              {/* Options */}
              {options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>

            {/* Chevron Icon */}
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>

          {/* Help Text or Error */}
          {helpText && !error && (
            <p className="text-sm text-gray-500">{helpText}</p>
          )}
          {error && (
            <p className="text-sm text-red-600 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </p>
          )}
        </div>
      </>
    );
  }
);

CustomSelect.displayName = 'CustomSelect';

export default CustomSelect;
