import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function getEmployees(branchId?: number) {
  if (branchId) {
    return await sql`
      SELECT 
        e.id, 
        e.name, 
        e.email,
        e.phone,
        b.name as branch, 
        e.branch_id,
        e.role, 
        e.hourly_rate as rate, 
        e.status,
        e.password_hash,
        (SELECT COUNT(*) FROM admins a WHERE a.email = e.email) > 0 as has_login
      FROM employees e
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE e.branch_id = ${branchId}
      ORDER BY e.created_at DESC
    `
  }
  return await sql`
    SELECT 
      e.id, 
      e.name, 
      e.email,
      e.phone,
      b.name as branch, 
      e.branch_id,
      e.role, 
      e.hourly_rate as rate, 
      e.status,
      e.password_hash,
      (SELECT COUNT(*) FROM admins a WHERE a.email = e.email) > 0 as has_login
    FROM employees e
    LEFT JOIN branches b ON e.branch_id = b.id
    ORDER BY e.created_at DESC
  `
}

export async function createEmployee(data: {
  name: string
  branch_id: number
  role: string
  rate: number
  password: string
  email?: string
  phone?: string
  status?: string
  giveLoginAccess?: boolean
  loginPassword?: string
}) {
  const password_hash = await bcrypt.hash(data.password, 10)
  
  const emp = await sql`
    INSERT INTO employees (
      name, branch_id, role, hourly_rate, password_hash, status, email, phone
    )
    VALUES (
      ${data.name}, ${data.branch_id}, ${data.role}, ${data.rate}, ${password_hash}, ${data.status || 'ACTIVE'}, ${data.email || null}, ${data.phone || null}
    )
    RETURNING id
  `

  if (data.giveLoginAccess && data.email && data.loginPassword) {
    const passwordHash = await bcrypt.hash(data.loginPassword, 10)
    await sql`
      INSERT INTO admins (name, email, password_hash, role, status)
      VALUES (${data.name}, ${data.email}, ${passwordHash}, 'EMPLOYEE', 'ACTIVE')
      ON CONFLICT (email) DO NOTHING
    `
  }

  return emp
}

export async function updateEmployee(id: number, data: {
  name: string
  branch_id: number
  role: string
  password?: string
  rate: number
  email?: string
  phone?: string
  status?: string
  giveLoginAccess?: boolean
  loginPassword?: string
}) {
  let result;
  if (data.password) {
    const hash = await bcrypt.hash(data.password, 10)
    result = await sql`
      UPDATE employees
      SET name = ${data.name}, branch_id = ${data.branch_id}, role = ${data.role}, hourly_rate = ${data.rate}, password_hash = ${hash}, email = ${data.email || null}, phone = ${data.phone || null}, status = ${data.status || 'ACTIVE'}
      WHERE id = ${id}
      RETURNING id
    `
  } else {
    result = await sql`
      UPDATE employees
      SET name = ${data.name}, branch_id = ${data.branch_id}, role = ${data.role}, hourly_rate = ${data.rate}, email = ${data.email || null}, phone = ${data.phone || null}, status = ${data.status || 'ACTIVE'}
      WHERE id = ${id}
      RETURNING id
    `
  }

  if (data.giveLoginAccess && data.email) {
    if (data.loginPassword) {
      const passwordHash = await bcrypt.hash(data.loginPassword, 10)
      await sql`
        INSERT INTO admins (name, email, password_hash, role, status)
        VALUES (${data.name}, ${data.email}, ${passwordHash}, 'EMPLOYEE', 'ACTIVE')
        ON CONFLICT (email) DO UPDATE 
        SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name
      `
    } else {
      // If no password provided but wants access, just make sure record exists without changing password
      await sql`
        INSERT INTO admins (name, email, password_hash, role, status)
        VALUES (${data.name}, ${data.email}, 'dummy_hash', 'EMPLOYEE', 'ACTIVE')
        ON CONFLICT (email) DO UPDATE 
        SET name = EXCLUDED.name
      `
    }
  } else if (!data.giveLoginAccess && data.email) {
    // Optionally remove login access if unchecked
    await sql`DELETE FROM admins WHERE email = ${data.email} AND role = 'EMPLOYEE'`
  }

  return result;
}

export async function deleteEmployee(id: number) {
  // Always soft delete so history is preserved
  await sql`DELETE FROM admins WHERE email = (SELECT email FROM employees WHERE id = ${id})`
  return await sql`UPDATE employees SET closed_at = NOW() WHERE id = ${id}`
}
