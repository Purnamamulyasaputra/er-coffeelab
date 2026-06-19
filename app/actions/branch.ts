"use server"

import { cookies } from "next/headers"

export async function setBranchCookie(branchId: string) {
  const cookieStore = await cookies();
  if (branchId === "all") {
    cookieStore.delete("selectedBranchId")
  } else {
    cookieStore.set("selectedBranchId", branchId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      httpOnly: false,
    })
  }
}

export async function getBranchCookie() {
  const cookieStore = await cookies();
  return cookieStore.get("selectedBranchId")?.value || "all";
}
