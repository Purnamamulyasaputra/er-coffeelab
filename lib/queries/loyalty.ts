import { sql } from "@/lib/db"

export async function getLoyalty() {
  return await sql`
    SELECT 
      id, 
      name, 
      min_spend as min, 
      point_multiplier::text || 'x' as mult, 
      benefits as perk 
    FROM loyalty_tiers 
    ORDER BY min_spend ASC
  `
}
