import { sql } from "@/lib/db"

export async function getCategories() {
  return await sql`
    SELECT 
      c.id, 
      c.name, 
      c.sort_order as sort, 
      c.status,
      COUNT(p.id) as products
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id, c.name, c.sort_order, c.status
    ORDER BY c.sort_order ASC
  `
}

export async function createCategory(data: {
  name: string
  sort_order: number
  status: string
}) {
  return await sql`
    INSERT INTO categories (name, sort_order, status)
    VALUES (${data.name}, ${data.sort_order}, ${data.status})
    RETURNING id
  `
}

export async function updateCategory(id: number, data: {
  name: string
  sort_order: number
  status: string
}) {
  return await sql`
    UPDATE categories
    SET 
      name = ${data.name},
      sort_order = ${data.sort_order},
      status = ${data.status}
    WHERE id = ${id}
  `
}

export async function deleteCategory(id: number) {
  return await sql`
    DELETE FROM categories WHERE id = ${id}
  `
}
