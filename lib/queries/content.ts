import { sql } from "@/lib/db"

// Static Pages
export async function getStaticPages() {
  return await sql`SELECT * FROM static_pages ORDER BY id ASC`
}

export async function createStaticPage(data: any) {
  return await sql`
    INSERT INTO static_pages (slug, title, content)
    VALUES (${data.slug}, ${data.title}, ${data.content})
    RETURNING *
  `
}

export async function updateStaticPage(id: number, data: any) {
  return await sql`
    UPDATE static_pages
    SET slug = ${data.slug}, title = ${data.title}, content = ${data.content}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
}

export async function deleteStaticPage(id: number) {
  return await sql`DELETE FROM static_pages WHERE id = ${id} RETURNING *`
}

// Merchandise
export async function getMerchandise() {
  return await sql`SELECT * FROM merchandise ORDER BY sort_order ASC, id ASC`
}

export async function createMerchandise(data: any) {
  return await sql`
    INSERT INTO merchandise (name, description, image_url, price, personalizable, badge, status, sort_order)
    VALUES (${data.name}, ${data.description}, ${data.image_url}, ${data.price}, ${data.personalizable}, ${data.badge}, ${data.status}, ${data.sort_order})
    RETURNING *
  `
}

export async function updateMerchandise(id: number, data: any) {
  return await sql`
    UPDATE merchandise
    SET 
      name = ${data.name}, 
      description = ${data.description}, 
      image_url = ${data.image_url}, 
      price = ${data.price}, 
      personalizable = ${data.personalizable}, 
      badge = ${data.badge}, 
      status = ${data.status}, 
      sort_order = ${data.sort_order}
    WHERE id = ${id}
    RETURNING *
  `
}

export async function deleteMerchandise(id: number) {
  return await sql`DELETE FROM merchandise WHERE id = ${id} RETURNING *`
}
