import React from "react"
import { useTranslation } from 'react-i18next';
import iconArrowRight from "@/assets/parent/iconArrowRight.svg"
type Props = {
  onClick?: () =>void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export default function ContinueButton({ 
  onClick, 
  disabled = false, 
  className = "", 
  children 
}: Props) {
  const { t } = useTranslation(['parent']);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? '#9CA3AF': '#1E293B',
        color: '#FFFFFF'}}
      className={`
        text-white text-base font-normal
        flex items-center justify-start
        px-6 py-3 rounded-lg
        transition-colors duration-200
        hover:opacity-90
        cursor-pointer
        ${disabled ? 'cursor-not-allowed': ''}
        ${className}
      `}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#334155';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#1E293B';
        }
      }}
    >
      <div className="flex items-center justify-center mr-2">
        <span className="leading-6">{children || t('parent:ui.continueButton.continue')}</span>
      </div>
      <div className="flex items-center justify-center">
        <img src={iconArrowRight} alt=""className="w-3.5 h-4"/>
      </div>
    </button>)
}