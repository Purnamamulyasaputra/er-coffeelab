import { sql } from "@/lib/db"

export async function getCampaigns() {
  return await sql`
    SELECT 
      c.id, 
      c.name,
      c.description,
      c.image_url,
      c.status,
      TO_CHAR(c.start_date AT TIME ZONE 'Asia/Jakarta', 'DD-MM-YYYY') as start, 
      TO_CHAR(c.end_date AT TIME ZONE 'Asia/Jakarta', 'DD-MM-YYYY') as end,
      c.start_date,
      c.end_date,
      (SELECT COUNT(id) FROM vouchers WHERE campaign_id = c.id)::int as vouchers_count
    FROM campaigns c
    ORDER BY c.created_at DESC
  `
}

export async function createCampaign(data: {
  name: string
  description?: string
  imageUrl?: string
  startDate: string
  endDate: string
  status: string
}) {
  return await sql`
    INSERT INTO campaigns (name, description, image_url, start_date, end_date, status)
    VALUES (
      ${data.name}, 
      ${data.description || null}, 
      ${data.imageUrl || null}, 
      ${data.startDate}::timestamp AT TIME ZONE 'Asia/Jakarta', 
      ${data.endDate}::timestamp AT TIME ZONE 'Asia/Jakarta', 
      ${data.status}
    )
    RETURNING id
  `
}

export async function updateCampaign(id: number, data: {
  name: string
  description?: string
  imageUrl?: string
  startDate: string
  endDate: string
  status: string
}) {
  return await sql`
    UPDATE campaigns 
    SET 
      name = ${data.name}, 
      description = ${data.description || null}, 
      image_url = ${data.imageUrl || null}, 
      start_date = ${data.startDate}::timestamp AT TIME ZONE 'Asia/Jakarta', 
      end_date = ${data.endDate}::timestamp AT TIME ZONE 'Asia/Jakarta', 
      status = ${data.status}
    WHERE id = ${id}
  `
}

export async function deleteCampaign(id: number) {
  return await sql`
    DELETE FROM campaigns WHERE id = ${id}
  `
}
