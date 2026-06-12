"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onOpenChange, children, className }: DialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn("bg-card text-card-foreground w-full max-w-lg rounded-2xl shadow-xl relative p-6 border border-border max-h-[90vh] flex flex-col", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 p-1 hover:bg-muted"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("flex flex-col space-y-1.5 text-left mb-5", className)}>{children}</div>
}

export function DialogTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return <h2 className={cn("text-[18px] font-bold text-foreground m-0 leading-none tracking-tight", className)}>{children}</h2>
}

export function DialogFooter({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("flex justify-end gap-2 mt-6", className)}>{children}</div>
}
