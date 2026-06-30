import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { signToken, setAuthCookie } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Special logic for testing: Auto-create superadmin if it doesn't exist
    if (email === "superadmin@ercoffeelab.id" && password === "admin123") {
      const existing = await sql`SELECT id FROM admins WHERE email = ${email}`
      if (existing.length === 0) {
        const hash = await bcrypt.hash(password, 10)
        await sql`
          INSERT INTO admins (name, email, password_hash, role, status)
          VALUES ('Super Admin', ${email}, ${hash}, 'SUPERADMIN', 'ACTIVE')
        `
      }
    }
    
    // Auto-seed STORE_ADMIN accounts for branches
    const outletAccounts = [
      { email: 'cbd@ercoffeelab.id', name: 'Admin CBD', branchId: 1 },
      { email: 'gi@ercoffeelab.id', name: 'Admin Grand Indonesia', branchId: 2 },
      { email: 'kemang@ercoffeelab.id', name: 'Admin Kemang', branchId: 3 },
      { email: 'bsd@ercoffeelab.id', name: 'Admin BSD', branchId: 4 },
      { email: 'bandung@ercoffeelab.id', name: 'Admin Bandung', branchId: 5 },
    ]

    // Auto-seed EMPLOYEE (Cashier) accounts for branches
    const employeeAccounts = [
      { email: 'kasir.cbd@ercoffeelab.id', name: 'Kasir CBD', branchId: 1 },
      { email: 'kasir.gi@ercoffeelab.id', name: 'Kasir GI', branchId: 2 },
      { email: 'kasir.kemang@ercoffeelab.id', name: 'Kasir Kemang', branchId: 3 },
      { email: 'kasir.bsd@ercoffeelab.id', name: 'Kasir BSD', branchId: 4 },
      { email: 'kasir.bandung@ercoffeelab.id', name: 'Kasir Bandung', branchId: 5 },
    ]
    const matchedAccount = outletAccounts.find(acc => acc.email === email && password === "login123")
    if (matchedAccount) {
      const existing = await sql`SELECT id FROM admins WHERE email = ${email}`
      if (existing.length === 0) {
        const hash = await bcrypt.hash(password, 10)
        const inserted = await sql`
          INSERT INTO admins (name, email, password_hash, role, status)
          VALUES (${matchedAccount.name}, ${email}, ${hash}, 'STORE_ADMIN', 'ACTIVE')
          RETURNING id
        `
        const adminId = inserted[0].id
        // Link to branch
        await sql`
          INSERT INTO branch_admins (branch_id, admin_id)
          VALUES (${matchedAccount.branchId}, ${adminId})
        `
      }
    }

    const matchedEmployee = employeeAccounts.find(acc => acc.email === email && password === "kasir123")
    if (matchedEmployee) {
      const existing = await sql`SELECT id FROM admins WHERE email = ${email}`
      if (existing.length === 0) {
        const hash = await bcrypt.hash(password, 10)
        await sql`
          INSERT INTO admins (name, email, password_hash, role, status)
          VALUES (${matchedEmployee.name}, ${email}, ${hash}, 'EMPLOYEE', 'ACTIVE')
        `
        // Ensure employee record exists
        const existingEmp = await sql`SELECT id FROM employees WHERE email = ${email}`
        if (existingEmp.length === 0) {
          const defaultPinHash = await bcrypt.hash("1234", 10)
          await sql`
            INSERT INTO employees (branch_id, name, email, pin_hash, role, status)
            VALUES (${matchedEmployee.branchId}, ${matchedEmployee.name}, ${email}, ${defaultPinHash}, 'BARISTA', 'ACTIVE')
          `
        }
      }
    }

    const admins = await sql`SELECT id, name, email, password_hash, role, status FROM admins WHERE email = ${email}`
    let user = admins[0]
    let isFromEmployeeTable = false

    if (!user) {
      const emps = await sql`SELECT id, name, email, password_hash, role, status, branch_id FROM employees WHERE email = ${email}`
      if (emps.length > 0) {
        user = emps[0]
        isFromEmployeeTable = true
        user.role = 'EMPLOYEE'
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Account is inactive" }, { status: 403 })
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Get branchId if STORE_ADMIN or EMPLOYEE
    let branchId: number | null = null
    let employeeId: number | null = null

    if (isFromEmployeeTable) {
      branchId = user.branch_id
      employeeId = user.id
    } else {
      if (user.role === 'STORE_ADMIN') {
        const branchLink = await sql`
          SELECT branch_id FROM branch_admins 
          WHERE admin_id = ${user.id} 
          LIMIT 1
        `
        branchId = branchLink[0]?.branch_id ?? null
      } else if (user.role === 'EMPLOYEE') {
        const empInfo = await sql`
          SELECT id, branch_id FROM employees 
          WHERE email = ${user.email} 
          LIMIT 1
        `
        branchId = empInfo[0]?.branch_id ?? null
        employeeId = empInfo[0]?.id ?? null
      }
    }

    // Issue JWT
    const payload = {
      sub: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: branchId,
      employeeId: employeeId,
      type: "admin"
    }

    const token = await signToken(payload)
    await setAuthCookie(token, "admin")

    // Explicitly reset branch filter to 'all' for superadmin on fresh login
    if (user.role === 'SUPERADMIN') {
      const cookieStore = await cookies()
      cookieStore.set("selectedBranchId", "all", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        httpOnly: false,
      })
    }

    const redirectPath = user.role === 'EMPLOYEE' ? '/admin/pos' : '/admin/dashboard';

    return NextResponse.json({ success: true, redirect: redirectPath, role: user.role, token })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
