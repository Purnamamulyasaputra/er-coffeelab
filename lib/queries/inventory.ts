import { sql } from "@/lib/db"

export async function getIngredients(branchId?: number) {
  if (branchId) {
    return await sql`
      SELECT 
        i.id,
        i.sku,
        i.name,
        i.unit,
        i.cost_per_unit as cost,
        i.min_stock_alert as min,
        i.category,
        COALESCE(SUM(s.current_stock), 0) as stock
      FROM ingredients i
      LEFT JOIN ingredient_stock s ON s.ingredient_id = i.id AND s.branch_id = ${branchId}
      GROUP BY i.id, i.sku, i.name, i.unit, i.cost_per_unit, i.min_stock_alert, i.category
      ORDER BY i.name ASC
    `
  }
  
  return await sql`
    SELECT 
      i.id,
      i.sku,
      i.name,
      i.unit,
      i.cost_per_unit as cost,
      i.min_stock_alert as min,
      i.category,
      COALESCE(SUM(s.current_stock), 0) as stock
    FROM ingredients i
    LEFT JOIN ingredient_stock s ON s.ingredient_id = i.id
    GROUP BY i.id, i.sku, i.name, i.unit, i.cost_per_unit, i.min_stock_alert, i.category
    ORDER BY i.name ASC
  `
}

export async function createIngredient(data: {
  sku: string
  name: string
  unit: string
  cost: number
  min: number
  category: string
}) {
  return await sql`
    INSERT INTO ingredients (
      sku, name, unit, cost_per_unit, min_stock_alert, category
    )
    VALUES (
      ${data.sku}, ${data.name}, ${data.unit}, ${data.cost}, ${data.min}, ${data.category}
    )
    RETURNING id
  `
}

export async function updateIngredient(id: number, data: {
  sku: string
  name: string
  unit: string
  cost: number
  min: number
  category: string
}) {
  return await sql`
    UPDATE ingredients
    SET
      sku = ${data.sku},
      name = ${data.name},
      unit = ${data.unit},
      cost_per_unit = ${data.cost},
      min_stock_alert = ${data.min},
      category = ${data.category}
    WHERE id = ${id}
    RETURNING id
  `
}

export async function deleteIngredient(id: number) {
  return await sql`
    DELETE FROM ingredients
    WHERE id = ${id}
    RETURNING id
  `
}
