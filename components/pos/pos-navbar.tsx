"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock, CreditCard, Users, Monitor, Package, FileText, ClipboardList, UserCheck, RotateCcw, LayoutGrid, AlertTriangle, Menu, X } from "lucide-react"
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Reads branchId from the POS token cookie (client-side) and fetches branch name and user
function UserInfo() {
  const [branch, setBranch] = React.useState<string>("Branch")
  const [user, setUser] = React.useState<string>("Staff")

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(data => {
        if (data.branchName) setBranch(data.branchName)
        if (data.user) setUser(data.user)
      })
      .catch(() => {
        // Fallback or silent fail
      })
  }, [])

  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
      <span className="text-[11px] font-bold">{user} @ {branch}</span>
    </div>
  )
}

export function POSNavbar() {
  const pathname = usePathname()
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false); // Closed by default

  if (pathname === '/admin/pos') return null; // Don't show in admin embedded

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <>
      <div className="bg-[#0b0c16] border-b border-[#2a2d4a] px-3 py-2.5 flex items-center gap-2 overflow-hidden w-full">
        {/* Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className={`flex items-center justify-center shrink-0 w-9 h-9 rounded-full border transition-colors ${menuOpen ? 'bg-brand-blue text-white border-brand-blue' : 'bg-[#1c1f3a] border-[#2a2d4a] hover:bg-[#2a2d4a] text-[#8b8fa8] hover:text-white'}`}
        >
          {menuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* Expandable Links */}
        {menuOpen && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 max-w-[calc(100vw-240px)] animate-in fade-in slide-in-from-left-2 duration-200">
            <Link href="/pos" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors border shrink-0 ${pathname === '/pos' ? 'bg-brand-blue text-white border-brand-blue' : 'bg-[#1c1f3a] border-[#2a2d4a] hover:bg-[#2a2d4a] text-[#8b8fa8] hover:text-white'}`}>
              <LayoutGrid size={14} />
              <span className="text-[12px] font-bold">Terminal</span>
            </Link>

            <Link href="/admin/tables" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors border shrink-0 ${pathname.includes('/tables') ? 'bg-[#8b5cf6]/20 border-[#8b5cf6]/50 text-white' : 'bg-[#1c1f3a] border-[#2a2d4a] hover:bg-[#2a2d4a] text-[#8b8fa8] hover:text-white'}`}>
              <Users size={14} className={pathname.includes('/tables') ? "text-[#8b5cf6]" : ""} />
              <span className="text-[12px] font-bold">Tables</span>
            </Link>

            <Link href="/pos/shifts" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors border shrink-0 ${pathname.includes('/shifts') ? 'bg-brand-blue/20 border-brand-blue/50 text-white' : 'bg-[#1c1f3a] border-[#2a2d4a] hover:bg-[#2a2d4a] text-[#8b8fa8] hover:text-white'}`}>
              <Clock size={14} className={pathname.includes('/shifts') ? "text-brand-blue" : ""} />
              <span className="text-[12px] font-bold">Shifts</span>
            </Link>

            <Link href="/pos/cash" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors border shrink-0 ${pathname.includes('/cash') ? 'bg-success/20 border-success/50 text-white' : 'bg-[#1c1f3a] border-[#2a2d4a] hover:bg-[#2a2d4a] text-[#8b8fa8] hover:text-white'}`}>
              <CreditCard size={14} className={pathname.includes('/cash') ? "text-success" : ""} />
              <span className="text-[12px] font-bold">Cash</span>
            </Link>

            <Link href="/pos/kitchen" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors border shrink-0 ${pathname.includes('/kitchen') ? 'bg-[#f59e0b]/20 border-[#f59e0b]/50 text-white' : 'bg-[#1c1f3a] border-[#2a2d4a] hover:bg-[#2a2d4a] text-[#8b8fa8] hover:text-white'}`}>
              <Monitor size={14} className={pathname.includes('/kitchen') ? "text-[#f59e0b]" : ""} />
              <span className="text-[12px] font-bold">KDS</span>
            </Link>

            <Link href="/pos/inventory" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors border shrink-0 ${pathname.includes('/inventory') ? 'bg-cyan-500/20 border-cyan-500/50 text-white' : 'bg-[#1c1f3a] border-[#2a2d4a] hover:bg-[#2a2d4a] text-[#8b8fa8] hover:text-white'}`}>
              <Package size={14} className={pathname.includes('/inventory') ? "text-cyan-500" : ""} />
              <span className="text-[12px] font-bold">Inventory</span>
            </Link>

            <Link href="/pos/purchase-orders" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors border shrink-0 ${pathname.includes('/purchase-orders') ? 'bg-indigo-500/20 border-indigo-500/50 text-white' : 'bg-[#1c1f3a] border-[#2a2d4a] hover:bg-[#2a2d4a] text-[#8b8fa8] hover:text-white'}`}>
              <FileText size={14} className={pathname.includes('/purchase-orders') ? "text-indigo-500" : ""} />
              <span className="text-[12px] font-bold">PO</span>
            </Link>

            <Link href="/pos/stock-opname" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors border shrink-0 ${pathname.includes('/stock-opname') ? 'bg-pink-500/20 border-pink-500/50 text-white' : 'bg-[#1c1f3a] border-[#2a2d4a] hover:bg-[#2a2d4a] text-[#8b8fa8] hover:text-white'}`}>
              <ClipboardList size={14} className={pathname.includes('/stock-opname') ? "text-pink-500" : ""} />
              <span className="text-[12px] font-bold">Opname</span>
            </Link>

            <Link href="/pos/attendance" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors border shrink-0 ${pathname.includes('/attendance') ? 'bg-emerald-500/20 border-emerald-500/50 text-white' : 'bg-[#1c1f3a] border-[#2a2d4a] hover:bg-[#2a2d4a] text-[#8b8fa8] hover:text-white'}`}>
              <UserCheck size={14} className={pathname.includes('/attendance') ? "text-emerald-500" : ""} />
              <span className="text-[12px] font-bold">Attendance</span>
            </Link>

            <Link href="/pos/refunds" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors border shrink-0 ${pathname.includes('/refunds') ? 'bg-red-500/20 border-red-500/50 text-white' : 'bg-[#1c1f3a] border-[#2a2d4a] hover:bg-[#2a2d4a] text-[#8b8fa8] hover:text-white'}`}>
              <RotateCcw size={14} className={pathname.includes('/refunds') ? "text-red-500" : ""} />
              <span className="text-[12px] font-bold">Refund</span>
            </Link>
          </div>
        )}

        <div className="flex-1 min-w-[10px]" />

        {/* Branch badge — shows which branch is active */}
        <div className="flex items-center px-3 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 shrink-0">
          <UserInfo />
        </div>

        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors border bg-destructive/10 border-destructive/30 hover:bg-destructive/20 text-destructive font-bold text-[12px] cursor-pointer"
        >
          <span>Logout</span>
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
