import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { signToken, setAuthCookie } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { branchId, pin } = await request.json()

    if (!branchId || !pin) {
      return NextResponse.json({ error: "Branch ID and PIN are required" }, { status: 400 })
    }

    // Special logic for testing: Auto-create a cashier for branch 1 with PIN '1234' if it doesn't exist
    if (branchId === 1 && pin === "1234") {
      const existing = await sql`SELECT id FROM employees WHERE branch_id = 1 AND name = 'Test Cashier'`
      if (existing.length === 0) {
        const hash = await bcrypt.hash("1234", 10)
        await sql`
          INSERT INTO employees (branch_id, name, pin_hash, role, status)
          VALUES (1, 'Test Cashier', ${hash}, 'CASHIER', 'ACTIVE')
        `
      }
    }

    const employees = await sql`SELECT id, name, pin_hash, role, status, branch_id FROM employees WHERE branch_id = ${branchId}`
    
    // Find employee with matching PIN
    let matchedEmployee = null
    for (const emp of employees) {
      const isMatch = await bcrypt.compare(pin, emp.pin_hash)
      if (isMatch) {
        matchedEmployee = emp
        break
      }
    }

    if (!matchedEmployee) {
      return NextResponse.json({ error: "Invalid PIN or Branch ID" }, { status: 401 })
    }

    if (matchedEmployee.status !== "ACTIVE") {
      return NextResponse.json({ error: "Employee account is inactive" }, { status: 403 })
    }

    // Issue short-lived JWT for POS
    const payload = {
      sub: matchedEmployee.id.toString(),
      name: matchedEmployee.name,
      role: matchedEmployee.role,
      branchId: matchedEmployee.branch_id,
      type: "pos"
    }

    const token = await signToken(payload)
    await setAuthCookie(token, "pos")

    return NextResponse.json({ success: true, redirect: "/pos" })
  } catch (error: any) {
    console.error("POS Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
