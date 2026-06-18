import { sql } from "@/lib/db"

export async function getPurchaseOrders(branchId?: number) {
  if (branchId) {
    return await sql`
      SELECT 
        po.id, 
        s.name as supplier, 
        b.name as branch, 
        po.total_amount as total, 
        po.status, 
        COALESCE(a.name, e.name) as by, 
        to_char(po.created_at, 'Mon DD') as date 
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN branches b ON po.branch_id = b.id
      LEFT JOIN admins a ON po.approved_by = a.id
      LEFT JOIN employees e ON po.ordered_by = e.id
      WHERE po.branch_id = ${branchId}
      ORDER BY po.created_at DESC
    `
  }
  return await sql`
    SELECT 
      po.id, 
      s.name as supplier, 
      b.name as branch, 
      po.total_amount as total, 
      po.status, 
      COALESCE(a.name, e.name) as by, 
      to_char(po.created_at, 'Mon DD') as date 
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN branches b ON po.branch_id = b.id
    LEFT JOIN admins a ON po.approved_by = a.id
    LEFT JOIN employees e ON po.ordered_by = e.id
    ORDER BY po.created_at DESC
  `
}

export async function createPurchaseOrder(data: {
  supplier_id: number
  branch_id: number
  total_amount: number
  created_by: number
}) {
  return await sql`
    INSERT INTO purchase_orders (
      po_number, supplier_id, branch_id, total_amount, status, approved_by
    )
    VALUES (
      'PO-' || extract(epoch from now())::int, ${data.supplier_id}, ${data.branch_id}, ${data.total_amount}, 'SUBMITTED', ${data.created_by}
    )
    RETURNING id
  `
}
