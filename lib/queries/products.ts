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
      p.description,
      p.badge, 
      p.image_url,
      p.status 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at ASC
  `
}

export async function getPOSProducts(branchId: number) {
  return await sql`
    SELECT 
      p.id, 
      p.sku,
      p.name, 
      c.name as cat, 
      p.category_id,
      p.base_price as price, 
      p.cost_price as cost, 
      p.description,
      p.badge, 
      p.image_url,
      p.status as product_status,
      COALESCE(bps.stock_status, 'AVAILABLE') as stock_status
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN branch_product_stock bps ON p.id = bps.product_id AND bps.branch_id = ${branchId}
    WHERE p.status = 'ACTIVE'
    ORDER BY p.created_at ASC
  `
}

export async function createProduct(data: {
  name: string
  category_id: number
  price: number
  cost: number
  sku: string
  description?: string
  badge: string
  status: string
  image_url?: string
}) {
  return await sql`
    INSERT INTO products (
      name, category_id, base_price, cost_price, sku, description, badge, status, image_url
    )
    VALUES (
      ${data.name}, ${data.category_id}, ${data.price}, ${data.cost}, ${data.sku}, ${data.description || null}, ${data.badge}, ${data.status}, ${data.image_url || null}
    )
    RETURNING id
  `
}

export async function updateProduct(id: number, data: {
  name: string
  category_id: number
  price: number
  cost: number
  sku: string
  description?: string
  badge: string
  status: string
  image_url?: string
}) {
  return await sql`
    UPDATE products
    SET 
      name = ${data.name},
      category_id = ${data.category_id},
      base_price = ${data.price},
      cost_price = ${data.cost},
      sku = ${data.sku},
      description = ${data.description || null},
      badge = ${data.badge},
      status = ${data.status},
      image_url = COALESCE(${data.image_url || null}, image_url)
    WHERE id = ${id}
  `
}

export async function deleteProduct(id: number) {
  // In a real app we might want to soft delete, but we'll do hard delete or catch constraint error
  return await sql`
    DELETE FROM products WHERE id = ${id}
  `
}
