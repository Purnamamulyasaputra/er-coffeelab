"use client"

import * as React from "react"

/**
 * TabSessionSync ensures that multiple tabs can be logged into different 
 * accounts (e.g. Super Admin and Store Admin) in the same browser.
 * It uses sessionStorage to store the token and branch for the current tab,
 * and overrides the document.cookie whenever the tab gains focus.
 */
export function TabSessionSync() {
  React.useEffect(() => {
    const syncSessionToCookie = () => {
      // 1. Token Sync
      let token = sessionStorage.getItem("er_auth_token")
      if (!token) {
        // Inherit from current cookie if opened in a new tab without sessionStorage
        const match = document.cookie.match(/(^|;)\s*admin_token\s*=\s*([^;]+)/)
        if (match) {
          token = match[2]
          sessionStorage.setItem("er_auth_token", token)
        }
      }
      
      if (token) {
        // Overwrite cookie with this tab's token
        document.cookie = `admin_token=${token}; path=/; max-age=604800; samesite=lax`
      }

      // 2. Branch Sync
      let branch = sessionStorage.getItem("er_selected_branch")
      if (!branch) {
        const match = document.cookie.match(/(^|;)\s*selectedBranchId\s*=\s*([^;]+)/)
        if (match) {
          branch = match[2]
          sessionStorage.setItem("er_selected_branch", branch)
        }
      }

      if (branch) {
        if (branch === "all") {
          document.cookie = `selectedBranchId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        } else {
          document.cookie = `selectedBranchId=${branch}; path=/; max-age=2592000; samesite=lax`
        }
      }
    }

    // Sync immediately on mount
    syncSessionToCookie()

    // Sync when tab regains focus or visibility
    window.addEventListener("focus", syncSessionToCookie)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        syncSessionToCookie()
      }
    })

    return () => {
      window.removeEventListener("focus", syncSessionToCookie)
      document.removeEventListener("visibilitychange", syncSessionToCookie)
    }
  }, [])

  return null
}
