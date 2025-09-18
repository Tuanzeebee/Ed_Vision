import React from 'react'

// Import the SVG asset
import confirmIcon from "@/assets/parent/confirmIcon.svg"

interface ConfirmButtonProps {
  onClick?: () => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export default function ConfirmButton({ 
  onClick, 
  disabled = false, 
  className = "",
  children = "Confirm Appointment"
}: ConfirmButtonProps) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        box-border content-stretch flex items-center justify-start px-8 py-3 
        relative rounded-lg transition-all duration-200 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg active:scale-95'}
        ${className}
      `}
      style={{
        backgroundColor: disabled ? '#9CA3AF' : '#16A34A',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        ...(!disabled && {
          ':hover': {
            backgroundColor: '#047857'
          }
        })
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#047857'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#059669'
        }
      }}
    >
      <div className="box-border content-stretch flex flex-col h-5 items-start justify-start pl-0 pr-2 py-0 relative shrink-0 w-7">
        <div className="content-stretch flex flex-col items-start justify-center overflow-clip relative shrink-0 size-5">
          <div className="relative shrink-0 size-5">
            <img 
              alt="Confirm" 
              className="block max-w-none size-full" 
              src={confirmIcon}
              style={{
                filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(7500%) hue-rotate(178deg) brightness(100%) contrast(100%)'
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col font-medium h-6 justify-center leading-none not-italic relative shrink-0 text-base text-center text-white">
        <span className="leading-6">{children}</span>
      </div>
    </button>
  )
}