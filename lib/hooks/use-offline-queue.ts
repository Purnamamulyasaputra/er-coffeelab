"use client"
import * as React from "react"

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = React.useState(true)
  const [pendingSyncCount, setPendingSyncCount] = React.useState(0)

  React.useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return { isOnline, pendingSyncCount }
}
