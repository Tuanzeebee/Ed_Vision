import * as React from "react"
import { cn } from "@/lib/Parent_utils"
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-12 w-full rounded-lg border border-gray-300 bg-gray-100 px-5 py-3 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>)
  }
)
Select.displayName = "Select"
export { Select }