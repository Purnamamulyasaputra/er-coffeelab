import { sql } from "@/lib/db"

export async function getReportsData() {
  // Sales: Revenue and Orders by Month
  const sales = await sql`
    SELECT 
      TO_CHAR(created_at, 'Mon') as m,
      EXTRACT(MONTH FROM created_at) as month_num,
      ROUND(SUM(total_amount) / 1000000.0, 2) as r,
      COUNT(id) as o
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '6 months' AND status != 'CANCELLED'
    GROUP BY m, month_num
    ORDER BY month_num ASC
  `

  // Payment split
  const payments = await sql`
    SELECT 
      COALESCE(pm.name, o.payment_method_code, 'Unknown') as name,
      COUNT(o.id) as value
    FROM orders o
    LEFT JOIN payment_methods pm ON pm.code = o.payment_method_code
    WHERE o.status != 'CANCELLED' AND o.payment_method_code IS NOT NULL
    GROUP BY pm.name, o.payment_method_code
  `

  // Products Performance (sold quantity)
  const products = await sql`
    SELECT 
      p.id,
      p.name,
      c.name as category,
      SUM(oi.quantity) as sold,
      SUM(oi.subtotal) as revenue
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    GROUP BY p.id, p.name, c.name
    ORDER BY sold DESC
    LIMIT 50
  `

  // Shifts Performance
  const shifts = await sql`
    SELECT 
      s.id,
      e.name as employee,
      b.name as branch,
      TO_CHAR(s.opened_at, 'HH24:MI') as open_time,
      TO_CHAR(s.closed_at, 'HH24:MI') as close_time,
      s.total_sales as sales,
      s.total_orders as orders,
      s.status
    FROM shifts s
    JOIN employees e ON e.id = s.employee_id
    JOIN branches b ON b.id = s.branch_id
    ORDER BY s.opened_at DESC
    LIMIT 50
  `

  return {
    sales: sales.map(s => ({ ...s, r: Number(s.r), o: Number(s.o) })),
    payments: payments.map(p => ({ ...p, value: Number(p.value) })),
    products: products.map(p => ({ ...p, sold: Number(p.sold), revenue: Number(p.revenue) })),
    shifts: shifts.map(s => ({ ...s, sales: Number(s.sales), orders: Number(s.orders) }))
  }
}
