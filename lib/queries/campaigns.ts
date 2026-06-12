import { sql } from "@/lib/db"

export async function getCampaigns() {
  return await sql`
    SELECT 
      id, 
      name, 
      'GENERAL' as type, 
      TO_CHAR(start_date, 'DD Mon YYYY') as start, 
      TO_CHAR(end_date, 'DD Mon YYYY') as end, 
      0 as uses, 
      status 
    FROM campaigns 
    ORDER BY created_at DESC
  `
}
