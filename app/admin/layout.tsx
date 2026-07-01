"use client"

import * as React from "react"
import { Sidebar } from "@/components/admin/sidebar"
import { Header } from "@/components/admin/header"
import { TabSessionSync } from "@/components/admin/TabSessionSync"
import { usePathname, useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true)
  const [isMobile, setIsMobile] = React.useState(false)
  const [isDark, setIsDark] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [session, setSession] = React.useState<{role: string, name: string, email: string, dineinEnabled?: boolean, hasActiveShift?: boolean} | null>(null)

  React.useEffect(() => {
    const abortController = new AbortController()
    
    fetch('/api/auth/session', { signal: abortController.signal })
      .then(r => r.json())
      .then(sess => {
        setSession(sess)
        if (sess?.role === 'EMPLOYEE' && sess?.hasActiveShift === false && !pathname.startsWith('/admin/shifts')) {
          toast("Anda harus membuka shift terlebih dahulu", "error")
          router.push('/admin/shifts')
        }
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          console.error("Session sync error:", e)
        }
      })
      
    return () => {
      abortController.abort()
    }
  }, [pathname, router, toast])

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
      <TabSessionSync />
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
        dineinEnabled={session?.dineinEnabled}
        hasActiveShift={session?.hasActiveShift}
      />
      
      <div className="flex-1 flex flex-col min-w-0 print:w-full print:m-0 print:p-0">
        <Header 
          toggleSidebar={() => setOpen(!open)} 
          isDark={isDark} 
          toggleTheme={() => setIsDark(!isDark)} 
          open={open}
          role={session?.role}
          hasActiveShift={session?.hasActiveShift}
        />
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto print:p-0 print:m-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  )
}
