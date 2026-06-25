import { sql } from "@/lib/db"

export async function getActivePaymentMethods() {
  return sql`
    SELECT 
      pm.*,
      COALESCE(
        json_agg(pi ORDER BY pi.sort_order) FILTER (WHERE pi.id IS NOT NULL), '[]'
      ) AS instructions
    FROM payment_methods pm
    LEFT JOIN payment_instructions pi ON pi.payment_method_id = pm.id
    WHERE pm.is_active = true
    GROUP BY pm.id
    ORDER BY pm.sort_order ASC
  `
}
