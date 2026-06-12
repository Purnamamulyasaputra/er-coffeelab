import { sql } from "@/lib/db"

export async function getBranches() {
  return await sql`
    SELECT * FROM branches
    ORDER BY sort_order ASC, id ASC
  `
}

export async function createBranch(data: {
  name: string
  address: string
  latitude: number
  longitude: number
  phone?: string
  image_url?: string
  operating_hours?: string
  status?: string
  delivery_radius_km?: number
  sort_order?: number
  pickup_enabled: boolean
  delivery_enabled: boolean
  dinein_enabled: boolean
  tax_rate: number
  service_charge_pct: number
}) {
  return await sql`
    INSERT INTO branches (
      name, address, latitude, longitude, phone, image_url, operating_hours, status, delivery_radius_km, sort_order,
      pickup_enabled, delivery_enabled, dinein_enabled, tax_rate, service_charge_pct
    )
    VALUES (
      ${data.name}, ${data.address}, ${data.latitude}, ${data.longitude}, ${data.phone || null}, 
      ${data.image_url || null}, ${data.operating_hours || null}, ${data.status || 'OPEN'}, 
      ${data.delivery_radius_km ?? 5}, ${data.sort_order ?? 0},
      ${data.pickup_enabled}, ${data.delivery_enabled}, ${data.dinein_enabled}, 
      ${data.tax_rate}, ${data.service_charge_pct}
    )
    RETURNING id
  `
}

export async function updateBranch(data: {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  phone?: string
  image_url?: string
  operating_hours?: string
  status?: string
  delivery_radius_km?: number
  sort_order?: number
  pickup_enabled: boolean
  delivery_enabled: boolean
  dinein_enabled: boolean
  tax_rate: number
  service_charge_pct: number
}) {
  return await sql`
    UPDATE branches SET
      name = ${data.name},
      address = ${data.address},
      latitude = ${data.latitude},
      longitude = ${data.longitude},
      phone = ${data.phone || null},
      image_url = ${data.image_url || null},
      operating_hours = ${data.operating_hours || null},
      status = ${data.status || 'OPEN'},
      delivery_radius_km = ${data.delivery_radius_km ?? 5},
      sort_order = ${data.sort_order ?? 0},
      pickup_enabled = ${data.pickup_enabled},
      delivery_enabled = ${data.delivery_enabled},
      dinein_enabled = ${data.dinein_enabled},
      tax_rate = ${data.tax_rate},
      service_charge_pct = ${data.service_charge_pct}
    WHERE id = ${data.id}
    RETURNING id
  `
}

export async function deleteBranch(id: number) {
  return await sql` DELETE FROM branches WHERE id = ${id} RETURNING id `
}
