import * as React from "react"
import { cn } from "../../../lib/utils"

interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onBack?: () => void
  label?: string
  variant?: 'default' | 'minimal' | 'outline' | 'ghost'
}

const BackButton = React.forwardRef<HTMLButtonElement, BackButtonProps>(
  ({ className, onBack, label = "Back", variant = "default", ...props }, ref) => {
    const handleClick = () => {
      if (onBack) {
        onBack()
      }
    }

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B4BDB] focus:ring-offset-2 rounded-lg cursor-pointer",
          variant === "default" && "text-gray-600 hover:text-gray-800 hover:bg-gray-50 px-3 py-2",
          variant === "minimal" && "text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-2 py-1",
          variant === "outline" && "bg-white border border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 px-4 py-2 hover:shadow-md",
          variant === "ghost" && "bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2",
          className
        )}
        {...props}
      >
        <span className="text-lg leading-none">‹</span>
        <span className="text-sm font-medium">{label}</span>
      </button>
    )
  }
)

BackButton.displayName = "BackButton"

export { BackButton }
export type { BackButtonProps }