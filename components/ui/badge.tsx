import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors",
        {
          "bg-primary/20 text-primary": variant === "default",
          "bg-secondary/20 text-secondary-foreground": variant === "secondary",
          "bg-destructive/20 text-destructive": variant === "destructive",
          "bg-success/20 text-success": variant === "success",
          "bg-warning/20 text-warning": variant === "warning",
          "border border-border text-foreground": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
