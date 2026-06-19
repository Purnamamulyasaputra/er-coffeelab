import { sql } from "@/lib/db"

export async function getProducts(branchId?: number) {
  if (branchId) {
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
        p.status,
        p.branch_id,
        COALESCE(bps.stock_status, 'AVAILABLE') as branch_visibility
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN branch_product_stock bps ON p.id = bps.product_id AND bps.branch_id = ${branchId}
      WHERE (p.branch_id IS NULL OR p.branch_id = ${branchId})
      AND COALESCE(bps.stock_status, 'AVAILABLE') != 'HIDDEN'
      ORDER BY p.created_at ASC
    `
  }
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
      p.status,
      p.branch_id
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
    AND (p.branch_id IS NULL OR p.branch_id = ${branchId})
    AND COALESCE(bps.stock_status, 'AVAILABLE') != 'HIDDEN'
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
  branch_id?: number | null
}) {
  return await sql`
    INSERT INTO products (
      name, category_id, base_price, cost_price, sku, description, badge, status, image_url, branch_id
    )
    VALUES (
      ${data.name}, ${data.category_id}, ${data.price}, ${data.cost}, ${data.sku}, ${data.description || null}, ${data.badge}, ${data.status}, ${data.image_url || null}, ${data.branch_id || null}
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

export async function deleteProduct(id: number, branchId?: number) {
  if (branchId) {
    // If a branch admin tries to delete a product, we must check if they own it
    const res = await sql`SELECT branch_id FROM products WHERE id = ${id}`;
    if (res.length > 0) {
      if (res[0].branch_id === null) {
        // It's a global product, hide it instead of hard delete
        return await sql`
          INSERT INTO branch_product_stock (branch_id, product_id, stock_status)
          VALUES (${branchId}, ${id}, 'HIDDEN')
          ON CONFLICT (branch_id, product_id)
          DO UPDATE SET stock_status = 'HIDDEN', updated_at = NOW()
        `;
      }
      if (res[0].branch_id !== branchId) {
        throw new Error("You do not have permission to delete this product");
      }
    }
  }
  
  // Hard delete if it's super admin or branch admin owns the product
  return await sql`
    DELETE FROM products WHERE id = ${id}
  `
}

