"use client"

import * as React from "react"
import { AlertTriangle, Check, Info, X } from "lucide-react"

type ToastType = "info" | "success" | "error"

interface Toast {
  id: number
  msg: string
  type: ToastType
}

interface ToastContextType {
  toast: (msg: string, type?: ToastType) => void
}

const ToastContext = React.createContext<ToastContextType>({ toast: () => {} })

export function useToast() {
  return React.useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((msg: string, type: ToastType = "info") => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, msg, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2.5 z-[9999]">
        {toasts.map((t) => {
          const bg = t.type === "error" ? "bg-destructive" : t.type === "success" ? "bg-success" : "bg-primary"
          const Icon = t.type === "error" ? AlertTriangle : t.type === "success" ? Check : Info
          return (
            <div 
              key={t.id} 
              className={`${bg} text-white px-5 py-3 rounded-2xl flex items-center justify-between gap-3 text-[15px] font-semibold shadow-xl min-w-[280px] max-w-[400px] animate-in slide-in-from-bottom-5 fade-in duration-300`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} strokeWidth={2.5} />
                {t.msg}
              </div>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-white/60 hover:text-white transition-colors cursor-pointer p-0.5 ml-4">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
