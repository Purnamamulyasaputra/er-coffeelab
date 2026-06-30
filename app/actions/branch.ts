"use server"

import { cookies } from "next/headers"

export async function setBranchCookie(branchId: string) {
  const cookieStore = await cookies();
  // We set the cookie even for "all" because calling delete() without path '/' 
  // fails to override the existing cookie that was set with path '/'.
  // lib/auth.ts already correctly handles the "all" value by treating it as null.
  cookieStore.set("selectedBranchId", branchId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: "lax",
    httpOnly: false,
  })
}

export async function getBranchCookie() {
  const cookieStore = await cookies();
  return cookieStore.get("selectedBranchId")?.value || "all";
}
