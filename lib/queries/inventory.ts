import { sql } from "@/lib/db"

export async function getIngredients() {
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
