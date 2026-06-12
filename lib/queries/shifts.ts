import { sql } from "@/lib/db"

export async function getShifts(branchId?: number) {
  if (branchId) {
    return await sql`
      SELECT 
        s.id, 
        e.name as emp, 
        b.name as branch, 
        to_char(s.opened_at, 'HH24:MI') as open,
        COALESCE(to_char(s.closed_at, 'HH24:MI'), '-') as close,
        s.actual_cash as sales, 
        s.total_orders as orders,
        COALESCE(s.cash_difference::text, '-') as diff,
        s.status
      FROM shifts s
      LEFT JOIN employees e ON s.employee_id = e.id
      LEFT JOIN branches b ON s.branch_id = b.id
      WHERE s.branch_id = ${branchId}
      ORDER BY s.opened_at DESC
    `
  }

  return await sql`
    SELECT 
      s.id, 
      e.name as emp, 
      b.name as branch, 
      to_char(s.opened_at, 'HH24:MI') as open,
      COALESCE(to_char(s.closed_at, 'HH24:MI'), '-') as close,
      s.actual_cash as sales, 
      s.total_orders as orders,
      COALESCE(s.cash_difference::text, '-') as diff,
      s.status
    FROM shifts s
    LEFT JOIN employees e ON s.employee_id = e.id
    LEFT JOIN branches b ON s.branch_id = b.id
    ORDER BY s.opened_at DESC
  `
}

export async function createShift(data: {
  employee_id: number
  branch_id: number
  starting_cash: number
}) {
  return await sql`
    INSERT INTO shifts (
      employee_id, branch_id, opened_at, opening_cash, expected_cash, status
    )
    VALUES (
      ${data.employee_id}, ${data.branch_id}, NOW(), ${data.starting_cash}, ${data.starting_cash}, 'OPEN'
    )
    RETURNING id
  `
}
