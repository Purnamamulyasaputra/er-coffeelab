import * as React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap sm:flex-row sm:items-center sm:justify-between mb-5 gap-3", className)}>
      <div>
        <h2 className="text-xl sm:text-[24px] font-extrabold tracking-tight m-0 leading-tight">{title}</h2>
        {description && <p className="text-muted-foreground mt-1 text-[13px]">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
