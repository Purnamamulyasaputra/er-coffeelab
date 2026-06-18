import { sql } from "@/lib/db"

export async function getDiscounts() {
  return await sql`
    SELECT 
      id, 
      name, 
      discount_type as type,
      discount_value as value,
      apply_to as scope,
      requires_pin as "pinReq",
      status
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

export async function updateDiscount(id: number, data: {
  name: string
  type: string
  value: number
  scope: string
  requires_pin: boolean
  is_active: boolean
}) {
  return await sql`
    UPDATE discounts
    SET 
      name = ${data.name},
      discount_type = ${data.type},
      discount_value = ${data.value},
      apply_to = ${data.scope},
      requires_pin = ${data.requires_pin},
      status = ${data.is_active ? 'ACTIVE' : 'INACTIVE'}
    WHERE id = ${id}
    RETURNING id
  `
}

export async function deleteDiscount(id: number) {
  return await sql`
    DELETE FROM discounts WHERE id = ${id}
  `
}

export async function getActiveDiscounts() {
  return await sql`
    SELECT 
      id, 
      name, 
      discount_type as type,
      discount_value as value,
      apply_to as scope,
      requires_pin as "pinReq",
      status
    FROM discounts
    WHERE status = 'ACTIVE'
    ORDER BY name ASC
  `
}
