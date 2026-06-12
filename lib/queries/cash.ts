import { sql } from "@/lib/db"

export async function getCashMovements() {
  return await sql`
    SELECT 
      c.id,
      c.shift_id as "shiftId",
      b.name as branch,
      c.type,
      c.amount,
      c.reason,
      TO_CHAR(c.created_at, 'HH24:MI') as time
    FROM cash_movements c
    LEFT JOIN shifts s ON c.shift_id = s.id
    LEFT JOIN branches b ON s.branch_id = b.id
    ORDER BY c.created_at DESC
  `
}

export async function getActiveShift() {
  return await sql`
    SELECT * FROM shifts WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1
  `.then(res => res[0] || null)
}
