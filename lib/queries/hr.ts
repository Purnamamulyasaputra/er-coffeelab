import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function getEmployees(branchId?: number) {
  if (branchId) {
    return await sql`
      SELECT 
        e.id, 
        e.name, 
        b.name as branch, 
        e.branch_id,
        e.role, 
        e.hourly_rate as rate, 
        e.status 
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
      b.name as branch, 
      e.branch_id,
      e.role, 
      e.hourly_rate as rate, 
      e.status 
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
  pin: string
}) {
  const pin_hash = await bcrypt.hash(data.pin, 10)
  
  return await sql`
    INSERT INTO employees (
      name, branch_id, role, hourly_rate, pin_hash, status
    )
    VALUES (
      ${data.name}, ${data.branch_id}, ${data.role}, ${data.rate}, ${pin_hash}, 'ACTIVE'
    )
    RETURNING id
  `
}

export async function updateEmployee(id: number, data: {
  name: string
  branch_id: number
  role: string
  pin?: string
  rate: number
}) {
  if (data.pin) {
    const hash = await bcrypt.hash(data.pin, 10)
    return await sql`
      UPDATE employees
      SET name = ${data.name}, branch_id = ${data.branch_id}, role = ${data.role}, hourly_rate = ${data.rate}, pin_hash = ${hash}
      WHERE id = ${id}
      RETURNING id
    `
  }
  
  return await sql`
    UPDATE employees
    SET name = ${data.name}, branch_id = ${data.branch_id}, role = ${data.role}, hourly_rate = ${data.rate}
    WHERE id = ${id}
    RETURNING id
  `
}

export async function deleteEmployee(id: number) {
  return await sql`
    DELETE FROM employees WHERE id = ${id}
  `
}
