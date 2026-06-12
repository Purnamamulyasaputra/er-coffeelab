import { sql } from "@/lib/db"

export async function getAttendance() {
  return await sql`
    SELECT 
      a.id, 
      e.name as emp, 
      b.name as branch, 
      to_char(a.clock_in, 'YYYY-MM-DD') as date,
      to_char(a.clock_in, 'HH24:MI') as in,
      COALESCE(to_char(a.clock_out, 'HH24:MI'), '-') as out,
      COALESCE(
        EXTRACT(HOUR FROM (a.clock_out - a.clock_in))::text || 'h', 
        '-'
      ) as hours,
      COALESCE(
        (e.hourly_rate * EXTRACT(EPOCH FROM (a.clock_out - a.clock_in))/3600), 
        null
      ) as cost
    FROM employee_attendances a
    JOIN employees e ON a.employee_id = e.id
    JOIN branches b ON a.branch_id = b.id
    ORDER BY a.clock_in DESC
  `
}

export async function createAttendance(data: {
  employee_id: number
  branch_id: number
}) {
  return await sql`
    INSERT INTO employee_attendances (
      employee_id, branch_id, clock_in
    )
    VALUES (
      ${data.employee_id}, ${data.branch_id}, NOW()
    )
    RETURNING id
  `
}
