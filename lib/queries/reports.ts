import { sql } from "@/lib/db"

export async function getReportsData(branchId?: number) {
  // Run all queries concurrently using Promise.all to prevent Neon connection timeouts
  const [sales, payments, products, shifts, customers, promos] = await Promise.all([
    // Sales: Revenue and Orders by Month
    sql`
      SELECT 
        TO_CHAR(created_at, 'Mon') as m,
        EXTRACT(MONTH FROM created_at) as month_num,
        ROUND(SUM(total_amount) / 1000000.0, 2) as r,
        COUNT(id) as o
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '6 months' AND status != 'CANCELLED'
        AND (${branchId || null}::int IS NULL OR branch_id = ${branchId || null}::int)
      GROUP BY m, month_num
      ORDER BY month_num ASC
    `,

    // Payment split
    sql`
      SELECT 
        COALESCE(pm.name, o.payment_method_code, 'Unknown') as name,
        COUNT(o.id) as value
      FROM orders o
      LEFT JOIN payment_methods pm ON pm.code = o.payment_method_code
      WHERE o.status != 'CANCELLED' AND o.payment_method_code IS NOT NULL
        AND (${branchId || null}::int IS NULL OR o.branch_id = ${branchId || null}::int)
      GROUP BY pm.name, o.payment_method_code
    `,

    // Products Performance (sold quantity)
    sql`
      SELECT 
        p.id,
        p.name,
        c.name as category,
        SUM(oi.quantity) as sold,
        SUM(oi.subtotal) as revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE (${branchId || null}::int IS NULL OR o.branch_id = ${branchId || null}::int)
      GROUP BY p.id, p.name, c.name
      ORDER BY sold DESC
      LIMIT 50
    `,

    // Shifts Performance
    sql`
      SELECT 
        s.id,
        e.name as employee,
        b.name as branch,
        TO_CHAR(s.opened_at, 'DD Mon YYYY') as shift_date,
        TO_CHAR(s.opened_at, 'HH12:MI AM') as open_time,
        TO_CHAR(s.closed_at, 'HH12:MI AM') as close_time,
        COALESCE((SELECT SUM(total_amount) FROM orders WHERE shift_id = s.id AND status != 'CANCELLED'), s.total_sales, 0) as sales,
        COALESCE((SELECT COUNT(id) FROM orders WHERE shift_id = s.id AND status != 'CANCELLED'), s.total_orders, 0) as orders,
        s.status
      FROM shifts s
      JOIN employees e ON e.id = s.employee_id
      JOIN branches b ON b.id = s.branch_id
      WHERE (${branchId || null}::int IS NULL OR s.branch_id = ${branchId || null}::int)
      ORDER BY s.id DESC
      LIMIT 50
    `,

    // Customers: Signups by Month
    sql`
      SELECT 
        TO_CHAR(created_at, 'Mon') as m,
        EXTRACT(MONTH FROM created_at) as month_num,
        COUNT(id) as signups
      FROM customers
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY m, month_num
      ORDER BY month_num ASC
    `,

    // Promos: Voucher Redemptions Performance
    sql`
      SELECT 
        v.code,
        COUNT(vr.id) as redeemed,
        SUM(vr.discount_applied) as total_discount
      FROM voucher_redemptions vr
      JOIN vouchers v ON v.id = vr.voucher_id
      GROUP BY v.code
      ORDER BY redeemed DESC
      LIMIT 20
    `
  ])

  return {
    sales: sales.map(s => ({ ...s, r: Number(s.r), o: Number(s.o) })),
    payments: payments.map(p => ({ ...p, value: Number(p.value) })),
    products: products.map(p => ({ ...p, sold: Number(p.sold), revenue: Number(p.revenue) })),
    shifts: shifts.map(s => ({ ...s, sales: Number(s.sales), orders: Number(s.orders) })),
    customers: customers.map(c => ({ ...c, signups: Number(c.signups) })),
    promos: promos.map(p => ({ ...p, redeemed: Number(p.redeemed), total_discount: Number(p.total_discount) }))
  }
}
