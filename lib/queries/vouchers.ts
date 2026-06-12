import { sql } from "@/lib/db"

export async function getVouchers() {
  return await sql`
    SELECT 
      id,
      code,
      discount_type,
      discount_value,
      max_discount,
      min_transaction,
      usage_quota,
      used_count,
      status
    FROM vouchers
    ORDER BY created_at DESC
  `
}
