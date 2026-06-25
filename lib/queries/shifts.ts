import { sql } from "@/lib/db"

export async function getShifts(branchId?: number) {
  if (branchId) {
    return await sql`
      SELECT 
        s.id, 
        e.id as employee_id,
        e.name as emp, 
        b.name as branch, 
        to_char(s.opened_at AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') as open,
        COALESCE(to_char(s.closed_at AT TIME ZONE 'Asia/Jakarta', 'HH24:MI'), '-') as close,
        s.opening_cash as starting,
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
        e.id as employee_id,
        e.name as emp, 
      b.name as branch, 
      to_char(s.opened_at AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') as open,
      COALESCE(to_char(s.closed_at AT TIME ZONE 'Asia/Jakarta', 'HH24:MI'), '-') as close,
      s.opening_cash as starting,
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

export async function closeShift(id: number, actualCash: number) {
  // Get the shift to calculate difference
  const shift = await sql`SELECT expected_cash FROM shifts WHERE id = ${id}`;
  if (!shift.length) throw new Error("Shift not found");
  
  const expectedCash = Number(shift[0].expected_cash);
  const diff = actualCash - expectedCash;
  
  return await sql`
    UPDATE shifts
    SET 
      closed_at = NOW(),
      actual_cash = ${actualCash},
      cash_difference = ${diff},
      status = 'CLOSED'
    WHERE id = ${id}
    RETURNING id
  `;
}

export async function updateShift(id: number, actualCash: number, status: string, startingCash?: number) {
  const shift = await sql`SELECT expected_cash FROM shifts WHERE id = ${id}`;
  if (!shift.length) throw new Error("Shift not found");
  
  if (status === 'OPEN') {
    return await sql`
      UPDATE shifts
      SET 
        closed_at = NULL,
        actual_cash = NULL,
        cash_difference = NULL,
        status = 'OPEN',
        opening_cash = COALESCE(${startingCash ?? null}, opening_cash),
        expected_cash = COALESCE(${startingCash ?? null}, expected_cash)
      WHERE id = ${id}
      RETURNING id
    `;
  } else {
    const expectedCash = Number(shift[0].expected_cash);
    const diff = actualCash - expectedCash;
    return await sql`
      UPDATE shifts
      SET 
        actual_cash = ${actualCash},
        cash_difference = ${diff},
        status = 'CLOSED'
      WHERE id = ${id}
      RETURNING id
    `;
  }
}

export async function deleteShift(id: number) {
  return await sql`DELETE FROM shifts WHERE id = ${id} RETURNING id`;
}
