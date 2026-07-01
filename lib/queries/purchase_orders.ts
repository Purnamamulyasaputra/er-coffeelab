import { sql } from "@/lib/db"

export async function getPurchaseOrders(branchId?: number) {
  if (branchId) {
    return await sql`
      SELECT 
        po.po_number as id, 
        s.name as supplier, 
        b.name as branch, 
        po.total_amount as total, 
        po.status, 
        COALESCE(a.name, e.name, 'System') as by, 
        to_char(po.created_at AT TIME ZONE 'Asia/Jakarta', 'DD-MM-YYYY') as date 
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
      po.po_number as id, 
      s.name as supplier, 
      b.name as branch, 
      po.total_amount as total, 
      po.status, 
      COALESCE(a.name, e.name, 'System') as by, 
      to_char(po.created_at AT TIME ZONE 'Asia/Jakarta', 'DD-MM-YYYY') as date 
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
  items?: Array<{
    ingredient_id: number
    quantity: number
    price: number
    unit: string
  }>
}) {
  const result = await sql`
    INSERT INTO purchase_orders (
      po_number, supplier_id, branch_id, total_amount, status, approved_by
    )
    VALUES (
      'PO-' || extract(epoch from now())::int, ${data.supplier_id}, ${data.branch_id}, ${data.total_amount}, 'SUBMITTED', ${data.created_by}
    )
    RETURNING id
  `
  
  if (data.items && data.items.length > 0) {
    const poId = result[0].id
    for (const item of data.items) {
      await sql`
        INSERT INTO purchase_order_items (
          purchase_order_id, ingredient_id, quantity_ordered, quantity_received, unit, unit_price, subtotal
        )
        VALUES (
          ${poId}, ${item.ingredient_id}, ${item.quantity}, 0, ${item.unit}, ${item.price}, ${item.quantity * item.price}
        )
      `
    }
  }

  return result
}

export async function markPoAsReceived(poNumber: string) {
  // 1. Get PO details to know branch_id
  const poResult = await sql`SELECT id, branch_id, status FROM purchase_orders WHERE po_number = ${poNumber}`;
  if (poResult.length === 0) throw new Error("PO not found");
  const po = poResult[0];

  if (po.status === 'RECEIVED') throw new Error("PO already received");

  // 2. Update PO status
  await sql`
    UPDATE purchase_orders 
    SET status = 'RECEIVED', received_at = NOW() 
    WHERE id = ${po.id}
  `;

  // 3. Update PO items to fully received (assuming full delivery for simplicity)
  await sql`
    UPDATE purchase_order_items
    SET quantity_received = quantity_ordered
    WHERE purchase_order_id = ${po.id}
  `;

  // 4. Get items and update stock
  const items = await sql`SELECT ingredient_id, quantity_received, unit FROM purchase_order_items WHERE purchase_order_id = ${po.id}`;
  
  for (const item of items) {
    // Add to stock
    await sql`
      INSERT INTO ingredient_stock (branch_id, ingredient_id, current_stock, unit)
      VALUES (${po.branch_id}, ${item.ingredient_id}, ${item.quantity_received}, ${item.unit})
      ON CONFLICT (branch_id, ingredient_id)
      DO UPDATE SET 
        current_stock = ingredient_stock.current_stock + EXCLUDED.current_stock,
        updated_at = NOW()
    `;

    // Log movement
    await sql`
      INSERT INTO stock_movements (
        branch_id, ingredient_id, type, quantity, unit, 
        reference_type, reference_id, notes, employee_id
      )
      VALUES (
        ${po.branch_id}, ${item.ingredient_id}, 'PURCHASE_RECEIPT', ${item.quantity_received}, 
        ${item.unit}, 'PURCHASE_ORDER', ${po.id}, 
        ${'Received PO ' + poNumber}, null
      )
    `;
  }

  return true;
}

export async function getPurchaseOrderDetails(poNumber: string) {
  const poRes = await sql`
    SELECT * FROM purchase_orders WHERE po_number = ${poNumber}
  `;
  if (poRes.length === 0) return null;
  const po = poRes[0];

  const items = await sql`
    SELECT ingredient_id, quantity_ordered as quantity, unit_price as price, unit 
    FROM purchase_order_items 
    WHERE purchase_order_id = ${po.id}
  `;

  return { po, items };
}

export async function deletePurchaseOrder(poNumber: string) {
  const poRes = await sql`SELECT id, status FROM purchase_orders WHERE po_number = ${poNumber}`;
  if (poRes.length === 0) throw new Error("PO not found");
  if (poRes[0].status === 'RECEIVED') throw new Error("Cannot delete a received PO");

  // Since there is a foreign key from items, delete items first or rely on CASCADE. 
  // Let's delete items first to be safe.
  await sql`DELETE FROM purchase_order_items WHERE purchase_order_id = ${poRes[0].id}`;
  await sql`DELETE FROM purchase_orders WHERE id = ${poRes[0].id}`;
  return true;
}

export async function updatePurchaseOrder(poNumber: string, data: {
  supplier_id: number
  branch_id: number
  total_amount: number
  items?: Array<{
    ingredient_id: number
    quantity: number
    price: number
    unit: string
  }>
}) {
  const poRes = await sql`SELECT id, status FROM purchase_orders WHERE po_number = ${poNumber}`;
  if (poRes.length === 0) throw new Error("PO not found");
  if (poRes[0].status === 'RECEIVED') throw new Error("Cannot edit a received PO");
  
  const poId = poRes[0].id;

  await sql`
    UPDATE purchase_orders 
    SET supplier_id = ${data.supplier_id}, branch_id = ${data.branch_id}, total_amount = ${data.total_amount}
    WHERE id = ${poId}
  `;

  if (data.items && data.items.length > 0) {
    await sql`DELETE FROM purchase_order_items WHERE purchase_order_id = ${poId}`;
    
    for (const item of data.items) {
      await sql`
        INSERT INTO purchase_order_items (
          purchase_order_id, ingredient_id, quantity_ordered, quantity_received, unit, unit_price, subtotal
        )
        VALUES (
          ${poId}, ${item.ingredient_id}, ${item.quantity}, 0, ${item.unit}, ${item.price}, ${item.quantity * item.price}
        )
      `
    }
  }

  return true;
}
