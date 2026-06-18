import * as React from "react"
import { cn, formatStatus } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "cool"
}

function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const formattedChildren = typeof children === "string" ? formatStatus(children) : children;
  
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wider whitespace-nowrap transition-colors",
        {
          "bg-primary/20 text-primary": variant === "default",
          "bg-secondary/20 text-secondary-foreground": variant === "secondary",
          "bg-destructive/20 text-destructive": variant === "destructive",
          "bg-success/20 text-success": variant === "success",
          "bg-warning/20 text-warning": variant === "warning",
          "border border-border text-foreground": variant === "outline",
          "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]": variant === "cool",
        },
        className
      )}
      {...props}
    >
      {formattedChildren}
    </div>
  )
}

export { Badge }
