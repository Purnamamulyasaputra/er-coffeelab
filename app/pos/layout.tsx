"use client"

import * as React from "react"
import { POSNavbar } from "@/components/pos/pos-navbar"

export default function POSLayout({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // POS is always in dark mode to match Admin theme
    document.documentElement.classList.add("dark")
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <POSNavbar />
      <div className="flex-1 flex flex-col min-h-0 overflow-auto">
        {children}
      </div>
    </div>
  )
}
