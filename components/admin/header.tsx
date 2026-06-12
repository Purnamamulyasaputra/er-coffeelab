"use client"

import * as React from "react"
import { Menu, Sun, Moon, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  toggleSidebar: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  open?: boolean;
}

export function Header({ toggleSidebar, isDark, toggleTheme, open }: HeaderProps) {
  const [logoutOpen, setLogoutOpen] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const router = useRouter()
  const [currentBranch, setCurrentBranch] = React.useState("all")

  React.useEffect(() => {
    import("@/app/actions/branch").then(mod => {
      mod.getBranchCookie().then(val => {
        setCurrentBranch(val)
      })
    })
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleBranchChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBranch = e.target.value;
    setCurrentBranch(newBranch);
    const { setBranchCookie } = await import("@/app/actions/branch");
    await setBranchCookie(newBranch);
    router.refresh();
  };

  return (
    <>
      <div className="h-12 bg-card border-b border-border flex items-center px-4 gap-2.5 sticky top-0 z-40">
        {!open && (
          <button
            onClick={toggleSidebar}
            className="text-foreground hover:bg-muted p-1 rounded-md transition-colors cursor-pointer"
          >
            <Menu size={18} />
          </button>
        )}

        <div className="flex-1" />

        <select 
          value={currentBranch}
          onChange={handleBranchChange}
          className="px-2 py-1.5 rounded-lg border border-border bg-muted text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue cursor-pointer"
        >
          <option value="all">All Branches</option>
          <option value="1">CBD</option>
          <option value="2">GI</option>
          <option value="3">Kemang</option>
          <option value="4">BSD</option>
          <option value="5">Bandung</option>
        </select>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-muted text-foreground text-xs hover:bg-brand-blue/10 transition-colors cursor-pointer"
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
          <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
        </button>

        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs hover:bg-destructive/20 transition-colors cursor-pointer"
        >
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen} className="max-w-[320px] p-5">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={20} />
          </div>
          <h2 className="text-[16px] font-bold text-foreground mb-1.5">Logout?</h2>
          <div className="text-[12px] text-muted-foreground leading-relaxed mb-5 max-w-[240px] mx-auto">
            Apakah anda yakin ingin keluar?
          </div>
          <div className="flex w-full gap-2.5">
            <Button
              variant="outline"
              className="flex-1 h-9 text-[12px] font-semibold rounded-lg"
              onClick={() => setLogoutOpen(false)}
              disabled={isLoggingOut}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-9 text-[12px] font-semibold rounded-lg"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Proses..." : "Logout"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
