import React from 'react'

interface DialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
  zIndex?: string
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, zIndex = 'z-50' }) => {
  if (!open) return null
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onOpenChange) {
      onOpenChange(false)
    }
  }
  
  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center`} onClick={handleBackdropClick}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" />
      {/* Dialog content */}
      <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export const DialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  // Check if className contains custom width/margin settings
  const hasCustomWidth = className.includes('w-[') || className.includes('max-w-')
  const defaultClasses = hasCustomWidth ? 'relative bg-white rounded-lg shadow-lg' : 'relative bg-white rounded-lg shadow-lg max-w-lg w-full mx-4'
  
  return (
    <div className={`${defaultClasses} ${className}`} {...props}>
      {children}
    </div>
  )
}

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-4 border-b ${className}`} {...props}>
      {children}
    </div>
  )
}

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => {
  return (
    <h2 className={`text-lg font-semibold ${className}`} {...props}>
      {children}
    </h2>
  )
}

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-6 py-4 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-3 ${className}`} {...props}>
      {children}
    </div>
  )
}
