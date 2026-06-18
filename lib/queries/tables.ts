import { sql } from "@/lib/db"

export async function getTables(branchId: number) {
  // Returns store_tables with their current open session if any
  return await sql`
    SELECT 
      t.*,
      ts.guest_count,
      ts.opened_at as occupied_since
    FROM store_tables t
    LEFT JOIN table_sessions ts ON ts.id = t.current_session_id AND ts.status = 'OPEN'
    WHERE t.branch_id = ${branchId}
    ORDER BY t.section, t.table_number
  `
}

export async function getAllTables() {
  return await sql`
    SELECT 
      t.*,
      b.name as branch_name,
      ts.guest_count,
      ts.opened_at as occupied_since
    FROM store_tables t
    JOIN branches b ON b.id = t.branch_id
    LEFT JOIN table_sessions ts ON ts.id = t.current_session_id AND ts.status = 'OPEN'
    ORDER BY b.name, t.section, t.table_number
  `
}

export async function updateTablePosition(id: number, positionX: number, positionY: number) {
  return await sql`
    UPDATE store_tables 
    SET position_x = ${positionX}, position_y = ${positionY}
    WHERE id = ${id}
    RETURNING *
  `
}

export async function updateTableStatus(id: number, status: string) {
  return await sql`
    UPDATE store_tables 
    SET status = ${status}
    WHERE id = ${id}
    RETURNING *
  `
}



export async function createTable(data: {
  branchId: number
  tableNumber: string
  section: string
  capacity: number
  status: string
  sortOrder: number
}) {
  return await sql`
    INSERT INTO store_tables (branch_id, table_number, section, capacity, status, sort_order)
    VALUES (${data.branchId}, ${data.tableNumber}, ${data.section || null}, ${data.capacity || 4}, ${data.status || 'AVAILABLE'}, ${data.sortOrder || 0})
    RETURNING id
  `
}

export async function updateTable(data: {
  id: number
  tableNumber: string
  section: string
  capacity: number
  status: string
  sortOrder: number
}) {
  return await sql`
    UPDATE store_tables SET
      table_number = ${data.tableNumber},
      section = ${data.section || null},
      capacity = ${data.capacity || 4},
      status = ${data.status || 'AVAILABLE'},
      sort_order = ${data.sortOrder || 0}
    WHERE id = ${data.id}
    RETURNING id
  `
}

export async function deleteTable(id: number) {
  return await sql`
    DELETE FROM store_tables WHERE id = ${id} RETURNING id
  `
}
