"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Coffee, Home, Package, Monitor, ShoppingCart, Folder, MapPin,
  Clipboard, Clock, DollarSign, Users, Calendar, RotateCcw,
  Tag, FileText, Target, Star, Bell, CreditCard, TrendingUp,
  Settings, Eye, Circle, X, Grid
} from "lucide-react"

const GR = [
  { label: "OVERVIEW", items: [{ id: "dashboard", icon: Home, label: "Dashboard", href: "/admin/dashboard" }] },
  {
    label: "OPERATIONS", items: [
      { id: "orders", icon: Package, label: "Orders", href: "/admin/orders" },
      { id: "pos", icon: Monitor, label: "POS Terminal", href: "/admin/pos" },
      { id: "kds", icon: Coffee, label: "Kitchen Display", href: "/admin/kds" },
      { id: "tables", icon: Grid, label: "Tables", href: "/admin/tables" }
    ]
  },
  {
    label: "MENU", items: [
      { id: "products", icon: ShoppingCart, label: "Products", href: "/admin/products" },
      { id: "categories", icon: Folder, label: "Categories", href: "/admin/categories" }
    ]
  },
  {
    label: "BRANCHES", items: [
      { id: "branches", icon: MapPin, label: "Branches", href: "/admin/branches" },
      { id: "stock", icon: Clipboard, label: "Stock", href: "/admin/stock" }
    ]
  },
  {
    label: "POS MGMT", items: [
      { id: "shifts", icon: Clock, label: "Shifts", href: "/admin/shifts" },
      { id: "cash", icon: DollarSign, label: "Cash Mgmt", href: "/admin/cash" },
      { id: "employees", icon: Users, label: "Employees", href: "/admin/employees" },
      { id: "attendance", icon: Calendar, label: "Attendance", href: "/admin/attendance" },
      { id: "refunds", icon: RotateCcw, label: "Refunds", href: "/admin/refunds" },
      { id: "discounts", icon: Tag, label: "Discounts", href: "/admin/discounts" },
      { id: "taxconfig", icon: FileText, label: "Tax Config", href: "/admin/taxconfig" }
    ]
  },
  {
    label: "INVENTORY", items: [
      { id: "inventory", icon: Target, label: "Ingredients", href: "/admin/inventory" },
      { id: "suppliers", icon: Package, label: "Suppliers", href: "/admin/suppliers" },
      { id: "purchaseorders", icon: FileText, label: "Purchase Orders", href: "/admin/purchaseorders" },
      { id: "stockopname", icon: Clipboard, label: "Stock Opname", href: "/admin/stockopname" }
    ]
  },
  {
    label: "MARKETING", items: [
      { id: "campaigns", icon: Target, label: "Campaigns", href: "/admin/campaigns" },
      { id: "vouchers", icon: Tag, label: "Vouchers", href: "/admin/vouchers" },
      { id: "banners", icon: Eye, label: "Banners", href: "/admin/banners" },
      { id: "loyalty", icon: Star, label: "Loyalty", href: "/admin/loyalty" }
    ]
  },
  {
    label: "CRM", items: [
      { id: "customers", icon: Users, label: "Customers", href: "/admin/customers" },
      { id: "notifications", icon: Bell, label: "Notifications", href: "/admin/notifications" }
    ]
  },
  {
    label: "SYSTEM", items: [
      { id: "payments", icon: CreditCard, label: "Payments", href: "/admin/payments" },
      { id: "content", icon: FileText, label: "Content", href: "/admin/content" },
      { id: "reports", icon: TrendingUp, label: "Reports", href: "/admin/reports" },
      { id: "users", icon: Settings, label: "Users", href: "/admin/users" }
    ]
  }
];

interface SidebarProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  isMobile: boolean;
  role?: string;
  userName?: string;
  userEmail?: string;
  dineinEnabled?: boolean;
  hasActiveShift?: boolean;
}

export function Sidebar({ open, setOpen, isMobile, role, userName, userEmail, dineinEnabled, hasActiveShift }: SidebarProps) {
  const pathname = usePathname();
  const [currentBranch, setCurrentBranch] = React.useState("all");

  React.useEffect(() => {
    import("@/app/actions/branch").then(mod => {
      mod.getBranchCookie().then(val => {
        setCurrentBranch(val);
      });
    });

    // Listen to storage changes for branch
    const interval = setInterval(() => {
      const stored = sessionStorage.getItem("er_selected_branch");
      if (stored && stored !== currentBranch) {
        setCurrentBranch(stored);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentBranch]);

  // Filter menu based on role and branch config
  const filteredGR = React.useMemo(() => {
    return GR.map(group => {
      let currentItems = group.items;

      // Role-based filtering
      if (role === "STORE_ADMIN") {
        if (group.label === "SYSTEM") return null;
        if (group.label === "MARKETING") {
          currentItems = currentItems.filter(item => item.id === "vouchers");
        } else {
          currentItems = currentItems.filter(item =>
            !["suppliers", "notifications", "taxconfig"].includes(item.id)
          ).map(item => {
            if (item.id === "branches") {
              return { ...item, label: "Store Settings" }
            }
            return item
          })
        }
      }

      if (role === "EMPLOYEE") {
        if (group.label === "OVERVIEW") return null;
        if (group.label === "MARKETING") return null;
        if (group.label === "CRM") return null;
        if (group.label === "SYSTEM") return null;
        if (group.label === "BRANCHES") {
          currentItems = currentItems.filter(item => ["stock"].includes(item.id));
        }
        if (group.label === "POS MGMT") {
          currentItems = currentItems.filter(item => ["shifts", "cash", "attendance", "refunds", "discounts"].includes(item.id));
        }
        if (group.label === "INVENTORY") {
          currentItems = currentItems.filter(item => ["stockopname"].includes(item.id));
        }
        if (group.label === "MENU") {
          return null;
        }
      }

      // Hide branches menu if not 'all' branches (Only for SUPERADMIN)
      if (role === "SUPERADMIN" && currentBranch !== "all" && group.label === "BRANCHES") {
        currentItems = currentItems.filter(item => item.id !== "branches");
      }

      if (currentItems.length === 0) return null;
      return { ...group, items: currentItems };
    }).filter(Boolean);
  }, [role, dineinEnabled, hasActiveShift, currentBranch]);

  return (
    <div
      className={cn(
        "print:hidden fixed md:sticky top-0 left-0 z-50 h-screen flex flex-col transition-all duration-200 overflow-hidden",
        "bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-sm",
        isMobile ? (open ? "w-[260px]" : "w-0 -translate-x-full") : (open ? "w-[240px]" : "w-[58px]")
      )}
    >
      <div className="flex items-center gap-2.5 px-3 py-3 border-b border-sidebar-border shrink-0 min-h-[60px]">
        {open || isMobile ? (
          <div className="flex-1 flex items-center justify-between overflow-hidden">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <img src="/logo-light.png" alt="ER COFFEELAB" className="h-8 w-auto block dark:hidden" />
                <img src="/logo-dark.png" alt="ER COFFEELAB" className="h-8 w-auto hidden dark:block" />
                <div className="bg-brand-blue/10 border border-brand-blue/20 text-brand-blue dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-400 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest whitespace-nowrap mt-0.5">
                  {role === "SUPERADMIN" ? "Super Admin" : role === "EMPLOYEE" ? "Kasir / Barista" : "Admin Outlet"}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-sidebar-muted hover:text-sidebar-foreground shrink-0 ml-2">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <div className="relative h-7 w-7 flex items-center justify-center rounded-full bg-brand-blue">
              <Coffee size={16} className="text-brand-blue-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        {filteredGR.map((group: any, i) => (
          <div key={i} className="mb-2">
            {(open || isMobile) && (
              <div className="px-4 py-2 text-[10px] font-extrabold tracking-[1.5px] text-sidebar-muted">
                {group.label}
              </div>
            )}
            {group.items.map((item: any) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon || Circle;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={false}
                  className={cn(
                    "flex items-center gap-2.5 mx-1.5 my-[2px] rounded-md cursor-pointer transition-all duration-200 border-l-4",
                    open || isMobile ? "px-3 py-2 justify-start" : "py-2 justify-center px-0",
                    active
                      ? "bg-sidebar-active-bg text-sidebar-active-text font-bold border-brand-blue shadow-sm"
                      : "bg-transparent text-sidebar-muted font-medium border-transparent hover:text-sidebar-foreground hover:bg-sidebar-hover-bg"
                  )}
                  title={item.label}
                >
                  <Icon size={16} className={cn("shrink-0", active ? "text-sidebar-active-text" : "text-sidebar-muted")} />
                  {(open || isMobile) && <span className="text-[13px] truncate">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-sidebar-border shrink-0">
        {(open || isMobile) && (
          <div className="flex items-center gap-2 p-1.5">
            <div className="w-7 h-7 rounded-full bg-brand-blue flex items-center justify-center font-bold text-[11px] text-brand-blue-foreground shrink-0 uppercase">
              {userName ? userName.slice(0, 2) : "AD"}
            </div>
            <div className="overflow-hidden">
              <div className="text-[11px] font-semibold truncate">{userName || "Admin"}</div>
              <div className="text-[9px] text-sidebar-muted truncate">{role === "SUPERADMIN" ? "Super Admin" : role === "EMPLOYEE" ? "Kasir / Barista" : "Store Admin"} • {userEmail || ""}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
