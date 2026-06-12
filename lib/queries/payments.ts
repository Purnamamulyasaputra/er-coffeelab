import { sql } from "@/lib/db"

export async function getPayments() {
  return await sql`
    SELECT *
    FROM payment_methods 
    ORDER BY sort_order ASC, id ASC
  `
}

export async function createPaymentMethod(data: any) {
  return await sql`
    INSERT INTO payment_methods (
      name, code, logo_url, type, provider, admin_fee_flat, admin_fee_pct, is_active, is_redirect, sort_order
    ) VALUES (
      ${data.name}, ${data.code}, ${data.logo_url}, ${data.type}, ${data.provider}, 
      ${data.admin_fee_flat}, ${data.admin_fee_pct}, ${data.is_active}, ${data.is_redirect}, ${data.sort_order}
    )
    RETURNING *
  `
}

export async function updatePaymentMethod(id: number, data: any) {
  return await sql`
    UPDATE payment_methods
    SET 
      name = ${data.name}, 
      code = ${data.code}, 
      logo_url = ${data.logo_url}, 
      type = ${data.type}, 
      provider = ${data.provider}, 
      admin_fee_flat = ${data.admin_fee_flat}, 
      admin_fee_pct = ${data.admin_fee_pct}, 
      is_active = ${data.is_active}, 
      is_redirect = ${data.is_redirect}, 
      sort_order = ${data.sort_order}
    WHERE id = ${id}
    RETURNING *
  `
}

export async function deletePaymentMethod(id: number) {
  return await sql`DELETE FROM payment_methods WHERE id = ${id} RETURNING *`
}

export async function updatePaymentMethodsOrder(items: { id: number; sort_order: number }[]) {
  // Execute sequentially due to neon serverless limitations
  for (const item of items) {
    await sql`UPDATE payment_methods SET sort_order = ${item.sort_order} WHERE id = ${item.id}`;
  }
  return true;
}
