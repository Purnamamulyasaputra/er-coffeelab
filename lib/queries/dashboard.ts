import { sql } from "@/lib/db"

export async function getDashboardData(branchId?: number) {
  // 1. KPIs — Orders Today, Revenue Today, AOV Today, Total Customers
  const [
    kpiRows, yesterdayKpi, totalCustomers, lastMonthCustomers,
    revenueOrders, paymentSplit, branchPerf, sourceSplit,
    posAdopt, cashVar, kdsBump, invAcc, fulfillRate, retainRate
  ] = await Promise.all([
    sql`
      SELECT
      COALESCE(COUNT(id), 0)::int                                            AS orders_today,
      COALESCE(SUM(total_amount), 0)::bigint                                AS revenue_today,
      CASE WHEN COUNT(id) > 0 THEN ROUND(SUM(total_amount)::numeric / COUNT(id), 0) ELSE 0 END AS aov_today
    FROM orders
    WHERE created_at::date = CURRENT_DATE AND status != 'CANCELLED'
      AND (${branchId || null}::int IS NULL OR branch_id = ${branchId || null}::int)
  `,
    sql`
      SELECT
      COALESCE(COUNT(id), 0)::int           AS orders_yesterday,
      COALESCE(SUM(total_amount), 0)::bigint AS revenue_yesterday,
      CASE WHEN COUNT(id) > 0 THEN ROUND(SUM(total_amount)::numeric / COUNT(id), 0) ELSE 0 END AS aov_yesterday
    FROM orders
    WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day' AND status != 'CANCELLED'
      AND (${branchId || null}::int IS NULL OR branch_id = ${branchId || null}::int)
  `,
    sql`
      SELECT COUNT(id)::int AS total 
      FROM customers c 
      WHERE status = 'ACTIVE'
        AND (${branchId || null}::int IS NULL OR EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.branch_id = ${branchId || null}::int))
    `,

    sql`
      SELECT COUNT(id)::int AS total 
      FROM customers c
      WHERE status = 'ACTIVE' AND created_at < date_trunc('month', NOW())
        AND (${branchId || null}::int IS NULL OR EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.branch_id = ${branchId || null}::int))
    `,

  // 2. Revenue + Orders by month (last 6 months)
    sql`
      SELECT
      TO_CHAR(created_at, 'Mon') AS m,
      EXTRACT(MONTH FROM created_at)::int AS month_num,
      ROUND(SUM(total_amount) / 1000000.0, 2) AS r,
      COUNT(id)::int AS o
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '6 months' AND status != 'CANCELLED'
      AND (${branchId || null}::int IS NULL OR branch_id = ${branchId || null}::int)
    GROUP BY m, month_num
    ORDER BY month_num ASC
  `,
  // 3. Payment Split
    sql`
      SELECT
      CASE 
        WHEN pm.name IS NOT NULL THEN pm.name
        WHEN o.payment_method_code = 'XENDIT' THEN 'Online Payment'
        ELSE COALESCE(o.payment_method_code, 'Unknown')
      END AS name,
      COUNT(o.id)::int AS value
    FROM orders o
    LEFT JOIN payment_methods pm ON pm.code = o.payment_method_code
    WHERE o.status != 'CANCELLED' AND o.payment_method_code IS NOT NULL
      AND (${branchId || null}::int IS NULL OR o.branch_id = ${branchId || null}::int)
    GROUP BY pm.name, o.payment_method_code
    ORDER BY value DESC
  `,
  // 4. Branch Performance — total revenue per branch (in millions)
    sql`
      SELECT
      REPLACE(b.name, 'ER Coffeelab - ', '') AS n,
      ROUND(COALESCE(SUM(o.total_amount), 0) / 1000000.0, 1) AS r
    FROM branches b
    LEFT JOIN orders o ON o.branch_id = b.id AND o.status != 'CANCELLED'
    WHERE (${branchId || null}::int IS NULL OR b.id = ${branchId || null}::int)
    GROUP BY b.id, b.name
    ORDER BY r DESC
  `,
  // 5. Source Split — orders grouped by order_source (APP vs POS) per month
    sql`
      SELECT
      TO_CHAR(created_at, 'Mon') AS m,
      EXTRACT(MONTH FROM created_at)::int AS month_num,
      COALESCE(SUM(CASE WHEN order_source = 'APP' THEN 1 ELSE 0 END), 0)::int AS a,
      COALESCE(SUM(CASE WHEN order_source = 'POS' THEN 1 ELSE 0 END), 0)::int AS p
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '6 months' AND status != 'CANCELLED'
      AND (${branchId || null}::int IS NULL OR branch_id = ${branchId || null}::int)
    GROUP BY m, month_num
    ORDER BY month_num ASC
  `,
  // 6. Scorecards
  // POS Adopt = % orders from POS
    sql`
      SELECT
      CASE WHEN COUNT(id) > 0
        THEN ROUND(SUM(CASE WHEN is_pos = true THEN 1 ELSE 0 END)::numeric / COUNT(id) * 100, 0)
        ELSE 0
      END AS pct
    FROM orders WHERE status != 'CANCELLED'
      AND (${branchId || null}::int IS NULL OR branch_id = ${branchId || null}::int)
  `,
  // Cash Variance = SUM of |cash_difference| from closed shifts this month
    sql`
      SELECT COALESCE(SUM(ABS(COALESCE(cash_difference, 0))), 0) AS val
    FROM shifts
    WHERE status = 'CLOSED' AND closed_at >= date_trunc('month', NOW())
      AND (${branchId || null}::int IS NULL OR branch_id = ${branchId || null}::int)
  `,
  // KDS Bump = avg time from PREPARING to READY (in minutes)
    sql`
      SELECT
      ROUND(AVG(EXTRACT(EPOCH FROM (ready.created_at - prep.created_at)) / 60.0), 1) AS avg_min
    FROM order_status_logs prep
    JOIN order_status_logs ready ON ready.order_id = prep.order_id AND ready.status = 'READY'
    JOIN orders o ON o.id = prep.order_id
    WHERE prep.status = 'PREPARING'
      AND prep.created_at >= NOW() - INTERVAL '30 days'
      AND (${branchId || null}::int IS NULL OR o.branch_id = ${branchId || null}::int)
  `,
  // Inventory Accuracy = % opname items where difference = 0
    sql`
      SELECT
      CASE WHEN COUNT(i.id) > 0
        THEN ROUND(SUM(CASE WHEN ABS(i.difference::numeric) < 0.01 THEN 1 ELSE 0 END)::numeric / COUNT(i.id) * 100, 0)
        ELSE 0
      END AS pct
    FROM stock_opname_items i
    JOIN stock_opnames o ON o.id = i.stock_opname_id
    WHERE (${branchId || null}::int IS NULL OR o.branch_id = ${branchId || null}::int)
  `,
  // 7. KPI Gauges — order fulfillment rate, customer retention, target achievement
    sql`
      SELECT
      CASE WHEN COUNT(id) > 0
        THEN ROUND(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)::numeric / COUNT(id) * 100, 0)
        ELSE 0
      END AS pct
    FROM orders WHERE created_at >= NOW() - INTERVAL '30 days'
      AND (${branchId || null}::int IS NULL OR branch_id = ${branchId || null}::int)
  `,
    sql`
      SELECT
      CASE WHEN COUNT(DISTINCT customer_id) > 0
        THEN ROUND(
          COUNT(DISTINCT CASE WHEN c2.cnt > 1 THEN c2.customer_id END)::numeric /
          COUNT(DISTINCT c2.customer_id) * 100, 0
        )
        ELSE 0
      END AS pct
    FROM (
      SELECT customer_id, COUNT(id) AS cnt
      FROM orders
      WHERE customer_id IS NOT NULL AND status != 'CANCELLED'
        AND (${branchId || null}::int IS NULL OR branch_id = ${branchId || null}::int)
      GROUP BY customer_id
    ) c2
    `
  ])

  // Helper to compute % change
  const pctChange = (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? "+100%" : "0%"
    const change = ((cur - prev) / prev * 100).toFixed(1)
    return Number(change) >= 0 ? `+${change}%` : `${change}%`
  }

  const todayOrders = Number(kpiRows[0]?.orders_today || 0)
  const todayRevenue = Number(kpiRows[0]?.revenue_today || 0)
  const todayAov = Number(kpiRows[0]?.aov_today || 0)
  const yOrders = Number(yesterdayKpi[0]?.orders_yesterday || 0)
  const yRevenue = Number(yesterdayKpi[0]?.revenue_yesterday || 0)
  const yAov = Number(yesterdayKpi[0]?.aov_yesterday || 0)
  const custTotal = Number(totalCustomers[0]?.total || 0)
  const custPrev = Number(lastMonthCustomers[0]?.total || 0)
  const custDiff = custTotal - custPrev

  // Build 6 month label array
  const months6 = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return d.toLocaleString("en-US", { month: "short" })
  })

  // Map revenue/orders to full 6 month range
  const revMap = new Map(revenueOrders.map((r: any) => [r.m?.trim(), r]))
  const revenueData = months6.map(m => {
    const row = revMap.get(m)
    return { m, r: row ? Number(row.r) : 0, o: row ? Number(row.o) : 0 }
  })

  // Map source split
  const srcMap = new Map(sourceSplit.map((r: any) => [r.m?.trim(), r]))
  const sourceData = months6.map(m => {
    const row = srcMap.get(m)
    return { m, a: row ? Number(row.a) : 0, p: row ? Number(row.p) : 0 }
  })

  return {
    kpis: {
      ordersToday: todayOrders,
      ordersChange: pctChange(todayOrders, yOrders),
      revenue: todayRevenue,
      revenueChange: pctChange(todayRevenue, yRevenue),
      aov: todayAov,
      aovChange: pctChange(todayAov, yAov),
      customers: custTotal,
      customersChange: custDiff >= 0 ? `+${custDiff}` : `${custDiff}`,
    },
    revenueOrders: revenueData,
    paymentSplit: paymentSplit.map((p: any) => ({ name: String(p.name), value: Number(p.value) })),
    branchPerf: branchPerf.map((b: any) => ({ 
      n: String(b.n).replace(/^ER Coffeelab\s*[-–]?\s*/i, '').trim(), 
      r: Number(b.r) 
    })),
    sourceData,
    scorecards: {
      posAdopt: `${Number(posAdopt[0]?.pct || 0)}%`,
      posTime: "—",
      cashVar: formatCompact(Number(cashVar[0]?.val || 0)),
      kdsBump: kdsBump[0]?.avg_min ? `${Number(kdsBump[0].avg_min)}m` : "—",
      invAcc: `${Number(invAcc[0]?.pct || 0)}%`,
      rating: "—",
    },
    gauges: {
      fulfill: Number(fulfillRate[0]?.pct || 0),
      retain: Number(retainRate[0]?.pct || 0),
      target: 75, // business target placeholder
    },
    branchName: branchId ? (branchPerf[0]?.n || "Outlet") : "All Branches"
  }
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}
