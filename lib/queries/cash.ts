import { sql } from "@/lib/db"

export async function getCashMovements(branchId?: number) {
  if (branchId) {
    return await sql`
      SELECT 
        c.id,
        c.shift_id as "shiftId",
        e.id as employee_id,
        e.name as employee,
        b.name as branch,
        c.type,
        c.amount,
        c.reason,
        TO_CHAR(c.created_at AT TIME ZONE 'Asia/Jakarta', 'DD-MM-YYYY') as date,
        TO_CHAR(c.created_at AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') as time
      FROM cash_movements c
      LEFT JOIN shifts s ON c.shift_id = s.id
      LEFT JOIN employees e ON c.employee_id = e.id
      LEFT JOIN branches b ON s.branch_id = b.id
      WHERE s.branch_id = ${branchId}
      ORDER BY c.created_at DESC
    `
  }
  return await sql`
    SELECT 
      c.id,
      c.shift_id as "shiftId",
      e.id as employee_id,
      e.name as employee,
      b.name as branch,
      c.type,
      c.amount,
      c.reason,
      TO_CHAR(c.created_at AT TIME ZONE 'Asia/Jakarta', 'DD-MM-YYYY') as date,
      TO_CHAR(c.created_at AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') as time
    FROM cash_movements c
    LEFT JOIN shifts s ON c.shift_id = s.id
    LEFT JOIN employees e ON c.employee_id = e.id
    LEFT JOIN branches b ON s.branch_id = b.id
    ORDER BY c.created_at DESC
  `
}

export async function getActiveShift(branchId?: number, employeeId?: number) {
  if (branchId && employeeId) {
    return await sql`
      SELECT * FROM shifts WHERE status = 'OPEN' AND branch_id = ${branchId} AND employee_id = ${employeeId} ORDER BY opened_at DESC LIMIT 1
    `.then(res => res[0] || null)
  }
  if (branchId) {
    return await sql`
      SELECT * FROM shifts WHERE status = 'OPEN' AND branch_id = ${branchId} ORDER BY opened_at DESC LIMIT 1
    `.then(res => res[0] || null)
  }
  return await sql`
    SELECT * FROM shifts WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1
  `.then(res => res[0] || null)
}

export async function createCashMovement(data: {
  shiftId: number,
  employeeId: number,
  type: string,
  amount: number,
  reason: string
}) {
  // Insert movement
  const result = await sql`
    INSERT INTO cash_movements (shift_id, employee_id, type, amount, reason)
    VALUES (${data.shiftId}, ${data.employeeId}, ${data.type}, ${data.amount}, ${data.reason})
    RETURNING id
  `;

  // Update expected cash in shift
  if (data.type === 'IN') {
    await sql`UPDATE shifts SET expected_cash = expected_cash + ${data.amount} WHERE id = ${data.shiftId}`;
  } else if (data.type === 'OUT') {
    await sql`UPDATE shifts SET expected_cash = expected_cash - ${data.amount} WHERE id = ${data.shiftId}`;
  }

  return result;
}

export async function deleteCashMovement(id: number) {
  // Before deleting, reverse the expected cash change
  const movement = await sql`SELECT shift_id, type, amount FROM cash_movements WHERE id = ${id}`;
  if (movement.length > 0) {
    const { shift_id, type, amount } = movement[0];
    if (type === 'IN') {
      await sql`UPDATE shifts SET expected_cash = expected_cash - ${amount} WHERE id = ${shift_id}`;
    } else if (type === 'OUT') {
      await sql`UPDATE shifts SET expected_cash = expected_cash + ${amount} WHERE id = ${shift_id}`;
    }
  }

  return await sql`DELETE FROM cash_movements WHERE id = ${id} RETURNING id`;
}
