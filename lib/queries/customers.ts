import { sql } from "@/lib/db"

export async function getCustomers() {
  return await sql`
    SELECT 
      c.id, 
      c.name, 
      c.phone, 
      c.email,
      COALESCE(lt.name, 'Member') as tier, 
      c.total_points as pts, 
      c.lifetime_spend as spend, 
      TO_CHAR(c.created_at, 'DD Mon YYYY') as registered_at,
      TO_CHAR(c.created_at, 'DD Mon YYYY') as last 
    FROM customers c
    LEFT JOIN loyalty_tiers lt ON lt.id = c.loyalty_tier_id
    ORDER BY c.created_at DESC
  `
}

export async function getCustomerDetail(id: number) {
  const profile = await sql`
    SELECT c.*, COALESCE(lt.name, 'Member') as tier_name
    FROM customers c
    LEFT JOIN loyalty_tiers lt ON lt.id = c.loyalty_tier_id
    WHERE c.id = ${id}
  `

  const orders = await sql`
    SELECT o.id, o.invoice_code, o.total_amount, o.order_status, o.created_at, b.name as branch_name
    FROM orders o
    LEFT JOIN branches b ON b.id = o.branch_id
    WHERE o.customer_id = ${id}
    ORDER BY o.created_at DESC
    LIMIT 10
  `

  const addresses = await sql`
    SELECT * FROM customer_addresses
    WHERE customer_id = ${id}
    ORDER BY is_primary DESC, id ASC
  `

  return {
    profile: profile[0],
    orders,
    addresses
  }
}
