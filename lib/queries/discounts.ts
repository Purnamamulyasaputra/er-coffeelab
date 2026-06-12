import { sql } from "@/lib/db"

export async function getDiscounts() {
  return await sql`
    SELECT 
      id, 
      name, 
      CASE WHEN discount_type = 'PERCENTAGE' THEN 'PCT' ELSE 'FIXED' END as type,
      CASE WHEN discount_type = 'PERCENTAGE' THEN discount_value::text || '%' ELSE 'IDR ' || discount_value::text END as val,
      apply_to as scope,
      CASE WHEN requires_pin THEN 'Yes' ELSE 'No' END as "pinReq",
      CASE WHEN status = 'ACTIVE' THEN 'ON' ELSE 'OFF' END as status
    FROM discounts
    ORDER BY name ASC
  `
}

export async function createDiscount(data: {
  name: string
  type: string
  value: number
  scope: string
  requires_pin: boolean
  is_active: boolean
}) {
  return await sql`
    INSERT INTO discounts (
      name, discount_type, discount_value, apply_to, requires_pin, status
    )
    VALUES (
      ${data.name}, ${data.type}, ${data.value}, ${data.scope}, ${data.requires_pin}, ${data.is_active ? 'ACTIVE' : 'INACTIVE'}
    )
    RETURNING id
  `
}
