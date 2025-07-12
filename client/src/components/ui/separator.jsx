import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Custom Separator component that doesn't rely on Radix UI
 * This is a simplified version that provides the same functionality
 */
const Separator = React.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => {
    const ariaProps = decorative
      ? { 'aria-hidden': true }
      : { 'role': 'separator' }

    return (
      <div
        ref={ref}
        {...ariaProps}
        data-orientation={orientation}
        className={cn(
          "shrink-0",
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className
        )}
        {...props}
      />
    )
  }
)

Separator.displayName = "Separator"

export { Separator }
