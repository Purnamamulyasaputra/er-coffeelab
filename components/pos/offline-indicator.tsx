import { Wifi, WifiOff } from "lucide-react"
import * as React from "react"
import { useOfflineQueue } from "@/lib/hooks/use-offline-queue"

export function OfflineIndicator() {
  const { isOnline, pendingSyncCount } = useOfflineQueue()

  if (isOnline && pendingSyncCount === 0) return null

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold ${isOnline ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}`}>
      {isOnline ? (
        <>
          <Wifi size={12} className="animate-pulse" />
          <span>Syncing ({pendingSyncCount})</span>
        </>
      ) : (
        <>
          <WifiOff size={12} />
          <span>Offline ({pendingSyncCount} queued)</span>
        </>
      )}
    </div>
  )
}
