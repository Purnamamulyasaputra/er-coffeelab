import { sql } from "@/lib/db"

export async function getProducts() {
  return await sql`
    SELECT 
      p.id, 
      p.sku,
      p.name, 
      c.name as cat, 
      p.category_id,
      p.base_price as price, 
      p.cost_price as cost, 
      p.badge, 
      p.image_url,
      p.status 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `
}

export async function createProduct(data: {
  name: string
  category_id: number
  price: number
  cost: number
  sku: string
  badge: string
  status: string
}) {
  return await sql`
    INSERT INTO products (
      name, category_id, base_price, cost_price, sku, badge, status
    )
    VALUES (
      ${data.name}, ${data.category_id}, ${data.price}, ${data.cost}, ${data.sku}, ${data.badge}, ${data.status}
    )
    RETURNING id
  `
}
