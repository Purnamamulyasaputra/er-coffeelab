import { requireAdmin } from "@/lib/auth"
import { sql } from "@/lib/db"
import { OpnameDetailClient } from "./opname-detail-client"
import { notFound } from "next/navigation"

export default async function StockOpnameDetailPage(props: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const params = await props.params
  const id = Number(params.id)
  
  if (isNaN(id)) return notFound()

  // Get the opname details
  const opname = await sql`
    SELECT 
      so.id, 
      b.name as branch_name, 
      e.name as employee_name, 
      so.status,
      so.created_at,
      so.notes
    FROM stock_opnames so
    LEFT JOIN branches b ON so.branch_id = b.id
    LEFT JOIN employees e ON so.employee_id = e.id
    WHERE so.id = ${id}
  `

  if (!opname.length) return notFound()

  return <OpnameDetailClient opname={opname[0]} />
}
