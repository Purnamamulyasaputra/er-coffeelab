"use client"

import * as React from "react"
import { Sidebar } from "@/components/admin/sidebar"
import { Header } from "@/components/admin/header"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true)
  const [isMobile, setIsMobile] = React.useState(false)
  const [isDark, setIsDark] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [session, setSession] = React.useState<{role: string, name: string, email: string} | null>(null)

  React.useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(setSession)
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setOpen(false)
      else setOpen(true)
    }
    // eslint-disable-next-line
    handleResize()
    window.addEventListener("resize", handleResize)
    
    // Default to light mode (removed localStorage check as per request)
    // eslint-disable-next-line
    setMounted(true)
    
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    if (isDark) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [isDark, mounted])

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      {isMobile && open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={() => setOpen(false)} 
        />
      )}
      
      <Sidebar 
        open={open} 
        setOpen={setOpen} 
        isMobile={isMobile} 
        role={session?.role}
        userName={session?.name}
        userEmail={session?.email}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          toggleSidebar={() => setOpen(!open)} 
          isDark={isDark} 
          toggleTheme={() => setIsDark(!isDark)} 
          open={open}
          role={session?.role}
        />
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
