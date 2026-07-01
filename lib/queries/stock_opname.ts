import { sql } from "@/lib/db"

export async function getStockOpnames(branchId?: number) {
  if (branchId) {
    return await sql`
      SELECT 
        so.id, 
        b.name as branch, 
        e.name as employee, 
        to_char(so.created_at AT TIME ZONE 'Asia/Jakarta', 'DD-MM-YYYY') as date,
        (SELECT COUNT(id) FROM stock_opname_items WHERE stock_opname_id = so.id)::text as items,
        CASE 
          WHEN (SELECT COUNT(id) FROM stock_opname_items WHERE stock_opname_id = so.id AND difference != 0) = 0 THEN 'Match'
          ELSE (SELECT COUNT(id) FROM stock_opname_items WHERE stock_opname_id = so.id AND difference != 0)::text || ' variance'
        END as variance,
        so.status
      FROM stock_opnames so
      LEFT JOIN branches b ON so.branch_id = b.id
      LEFT JOIN employees e ON so.employee_id = e.id
      WHERE so.branch_id = ${branchId}
      ORDER BY so.created_at DESC
    `
  }
  return await sql`
    SELECT 
      so.id, 
      b.name as branch, 
      e.name as employee, 
      to_char(so.created_at AT TIME ZONE 'Asia/Jakarta', 'DD-MM-YYYY') as date,
      (SELECT COUNT(id) FROM stock_opname_items WHERE stock_opname_id = so.id)::text as items,
      CASE 
        WHEN (SELECT COUNT(id) FROM stock_opname_items WHERE stock_opname_id = so.id AND difference != 0) = 0 THEN 'Match'
        ELSE (SELECT COUNT(id) FROM stock_opname_items WHERE stock_opname_id = so.id AND difference != 0)::text || ' variance'
      END as variance,
      so.status
    FROM stock_opnames so
    LEFT JOIN branches b ON so.branch_id = b.id
    LEFT JOIN employees e ON so.employee_id = e.id
    ORDER BY so.created_at DESC
  `
}

export async function createStockOpname(data: {
  branch_id: number
  conducted_by: number
}) {
  const result = await sql`
    INSERT INTO stock_opnames (
      branch_id, employee_id, status
    )
    VALUES (
      ${data.branch_id}, ${data.conducted_by}, 'IN_PROGRESS'
    )
    RETURNING id
  `
  const opnameId = result[0].id

  await sql`
    INSERT INTO stock_opname_items (stock_opname_id, ingredient_id, system_stock, actual_stock, difference, unit)
    SELECT 
      ${opnameId}, 
      i.id, 
      COALESCE(ist.current_stock, 0), 
      COALESCE(ist.current_stock, 0), 
      0, 
      i.unit
    FROM ingredients i
    LEFT JOIN ingredient_stock ist ON ist.ingredient_id = i.id AND ist.branch_id = ${data.branch_id}
    WHERE i.status = 'ACTIVE'
  `

  return result
}

export async function getStockOpnameItems(opnameId: number) {
  return await sql`
    SELECT 
      soi.id,
      soi.ingredient_id,
      i.name as ingredient_name,
      i.category,
      soi.system_stock,
      soi.actual_stock,
      soi.difference,
      soi.unit,
      soi.notes
    FROM stock_opname_items soi
    JOIN ingredients i ON soi.ingredient_id = i.id
    WHERE soi.stock_opname_id = ${opnameId}
    ORDER BY i.name ASC
  `
}

export async function completeStockOpname(opnameId: number) {
  // 1. Get branch id and employee_id from opname
  const opname = await sql`SELECT branch_id, employee_id FROM stock_opnames WHERE id = ${opnameId}`
  if (!opname.length) throw new Error("Opname not found")
  const branchId = opname[0].branch_id
  const opnameEmployeeId = opname[0].employee_id

  // 2. Mark as completed
  await sql`
    UPDATE stock_opnames 
    SET status = 'COMPLETED', completed_at = NOW() 
    WHERE id = ${opnameId}
  `

  // 3. Update stock levels and create movements
  const items = await sql`
    SELECT ingredient_id, actual_stock, difference, unit
    FROM stock_opname_items 
    WHERE stock_opname_id = ${opnameId} AND difference != 0
  `

  for (const item of items) {
    // Upsert ingredient stock
    await sql`
      INSERT INTO ingredient_stock (branch_id, ingredient_id, current_stock, unit)
      VALUES (${branchId}, ${item.ingredient_id}, ${item.actual_stock}, ${item.unit})
      ON CONFLICT (branch_id, ingredient_id) 
      DO UPDATE SET 
        current_stock = ${item.actual_stock},
        updated_at = NOW()
    `

    // Log movement
    await sql`
      INSERT INTO stock_movements (
        branch_id, 
        ingredient_id, 
        type,
        quantity,
        stock_before,
        stock_after,
        unit,
        reference_type,
        reference_id,
        employee_id
      )
      VALUES (
        ${branchId},
        ${item.ingredient_id},
        ${item.difference > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT'},
        ${Math.abs(item.difference)},
        ${item.actual_stock - item.difference},
        ${item.actual_stock},
        ${item.unit},
        'STOCK_OPNAME',
        ${opnameId},
        ${opnameEmployeeId}
      )
    `
  }

  return true
}

export async function deleteStockOpname(id: number) {
  const opname = await sql`SELECT status FROM stock_opnames WHERE id = ${id}`;
  if (opname.length === 0) throw new Error("Opname not found");
  if (opname[0].status === "COMPLETED") throw new Error("Cannot delete a completed stock opname");

  await sql`DELETE FROM stock_opname_items WHERE stock_opname_id = ${id}`;
  await sql`DELETE FROM stock_opnames WHERE id = ${id}`;
  return true;
}
