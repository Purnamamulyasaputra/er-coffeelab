import * as React from "react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string | number
  description?: string
  trend?: "up" | "down" | "neutral"
  icon?: React.ReactNode
  className?: string
  iconColor?: string
}

export function KPICard({ title, value, description, trend, icon, className, iconColor = "text-primary" }: KPICardProps) {
  // Extract just the color name for bg opacity if it's a standard tailwind text color
  const bgClass = iconColor.includes('primary') ? 'bg-primary/20' 
    : iconColor.includes('success') ? 'bg-success/20'
    : iconColor.includes('accent') ? 'bg-brand-blue/20'
    : iconColor.includes('cyan') ? 'bg-cyan-500/20'
    : iconColor.includes('destructive') ? 'bg-destructive/20'
    : 'bg-primary/20';

  return (
    <div className={cn("bg-card border border-border rounded-xl p-4 flex items-center gap-3 flex-1 min-w-[170px]", className)}>
      {icon && (
        <div className={`w-[42px] h-[42px] rounded-[10px] ${bgClass} flex items-center justify-center shrink-0`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
      )}
      <div>
        <div className="text-[12px] text-muted-foreground font-semibold">{title}</div>
        <div className="text-[20px] font-extrabold text-foreground">{value}</div>
        {description && (
          <div className="text-[11px] font-semibold text-success">{description}</div>
        )}
      </div>
    </div>
  )
}
