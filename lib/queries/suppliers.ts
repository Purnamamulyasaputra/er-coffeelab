import { sql } from "@/lib/db"

export async function getSuppliers() {
  return await sql`
    SELECT 
      s.id, 
      s.name, 
      s.contact_person as contact, 
      s.phone, 
      s.email, 
      s.status,
      COUNT(po.id) as pos
    FROM suppliers s
    LEFT JOIN purchase_orders po ON po.supplier_id = s.id
    GROUP BY s.id, s.name, s.contact_person, s.phone, s.email, s.status
    ORDER BY s.name ASC
  `
}

export async function createSupplier(data: {
  name: string
  contact: string
  phone: string
  email: string
}) {
  return await sql`
    INSERT INTO suppliers (name, contact_person, phone, email, status)
    VALUES (${data.name}, ${data.contact}, ${data.phone}, ${data.email}, 'ACTIVE')
    RETURNING id
  `
}
