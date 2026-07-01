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
      status,
      campaign_id,
      start_date,
      end_date
    FROM vouchers
    ORDER BY created_at DESC
  `
}

export async function getActiveVouchers() {
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
    WHERE status = 'ACTIVE'
      AND NOW() BETWEEN start_date AND end_date
      AND (usage_quota IS NULL OR used_count < usage_quota)
    ORDER BY created_at DESC
  `
}

export async function createVoucher(data: {
  campaign_id: number | null
  code: string
  discount_type: string
  discount_value: number
  max_discount: number | null
  min_transaction: number
  usage_quota: number | null
  start_date: string
  end_date: string
  status: string
}) {
  return await sql`
    INSERT INTO vouchers (
      campaign_id, code, discount_type, discount_value, max_discount, min_transaction,
      usage_quota, start_date, end_date, status
    ) VALUES (
      ${data.campaign_id}, ${data.code}, ${data.discount_type}, ${data.discount_value}, ${data.max_discount}, ${data.min_transaction},
      ${data.usage_quota}, ${data.start_date}, ${data.end_date}, ${data.status}
    )
    RETURNING id
  `
}

export async function updateVoucher(id: number, data: {
  campaign_id: number | null
  code: string
  discount_type: string
  discount_value: number
  max_discount: number | null
  min_transaction: number
  usage_quota: number | null
  start_date: string
  end_date: string
  status: string
}) {
  return await sql`
    UPDATE vouchers
    SET
      campaign_id = ${data.campaign_id},
      code = ${data.code},
      discount_type = ${data.discount_type},
      discount_value = ${data.discount_value},
      max_discount = ${data.max_discount},
      min_transaction = ${data.min_transaction},
      usage_quota = ${data.usage_quota},
      start_date = ${data.start_date},
      end_date = ${data.end_date},
      status = ${data.status}
    WHERE id = ${id}
    RETURNING id
  `
}

export async function deleteVoucher(id: number) {
  return await sql`
    DELETE FROM vouchers WHERE id = ${id}
  `
}
