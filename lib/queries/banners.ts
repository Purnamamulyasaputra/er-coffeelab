import { sql } from "@/lib/db"

export async function getBanners() {
  return await sql`SELECT * FROM banners ORDER BY sort_order ASC, id ASC`
}

export async function createBanner(data: any) {
  return await sql`
    INSERT INTO banners (title, image_url, link_destination, placement, sort_order, status, start_date, end_date)
    VALUES (
      ${data.title}, 
      ${data.image_url}, 
      ${data.link_destination}, 
      ${data.placement || 'HOME'}, 
      ${data.sort_order || 0}, 
      ${data.status || 'ACTIVE'},
      ${data.start_date ? new Date(data.start_date).toISOString() : null},
      ${data.end_date ? new Date(data.end_date).toISOString() : null}
    )
    RETURNING *
  `
}

export async function updateBanner(id: number, data: any) {
  return await sql`
    UPDATE banners
    SET 
      title = ${data.title}, 
      image_url = ${data.image_url}, 
      link_destination = ${data.link_destination}, 
      placement = ${data.placement}, 
      sort_order = ${data.sort_order}, 
      status = ${data.status},
      start_date = ${data.start_date ? new Date(data.start_date).toISOString() : null},
      end_date = ${data.end_date ? new Date(data.end_date).toISOString() : null}
    WHERE id = ${id}
    RETURNING *
  `
}

export async function deleteBanner(id: number) {
  return await sql`DELETE FROM banners WHERE id = ${id} RETURNING *`
}
