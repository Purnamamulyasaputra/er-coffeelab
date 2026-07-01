import { sql } from "@/lib/db"

// --- TIER MANAGEMENT ---

export async function getLoyaltyTiers() {
  return await sql`
    SELECT 
      id, 
      name, 
      min_spend, 
      point_multiplier, 
      benefits,
      sort_order
    FROM loyalty_tiers 
    ORDER BY sort_order ASC, min_spend ASC
  `
}

export async function createLoyaltyTier(data: {
  name: string
  min_spend: number
  point_multiplier: number
  benefits: string
  sort_order: number
}) {
  return await sql`
    INSERT INTO loyalty_tiers (
      name, min_spend, point_multiplier, benefits, sort_order
    ) VALUES (
      ${data.name}, ${data.min_spend}, ${data.point_multiplier}, ${data.benefits}, ${data.sort_order}
    )
    RETURNING id
  `
}

export async function updateLoyaltyTier(id: number, data: {
  name: string
  min_spend: number
  point_multiplier: number
  benefits: string
  sort_order: number
}) {
  return await sql`
    UPDATE loyalty_tiers
    SET
      name = ${data.name},
      min_spend = ${data.min_spend},
      point_multiplier = ${data.point_multiplier},
      benefits = ${data.benefits},
      sort_order = ${data.sort_order}
    WHERE id = ${id}
    RETURNING id
  `
}

export async function deleteLoyaltyTier(id: number) {
  // Rely on ON DELETE SET NULL for customers
  return await sql`
    DELETE FROM loyalty_tiers WHERE id = ${id}
  `
}

// --- TRANSACTION MANAGEMENT ---

export async function getLoyaltyTransactions(limit = 100, offset = 0) {
  return await sql`
    SELECT 
      lt.id,
      lt.customer_id,
      lt.order_id,
      lt.type,
      lt.points,
      lt.balance_after,
      lt.description,
      lt.created_at,
      c.name as customer_name,
      c.phone as customer_phone
    FROM loyalty_transactions lt
    JOIN customers c ON c.id = lt.customer_id
    ORDER BY lt.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `
}

export async function adjustCustomerPoints(customerId: number, points: number, description: string) {
  // Using a transaction is better, but since serverless neon doesn't easily support raw transactions without multiple awaits sharing a connection,
  // we can do it in a single plpgsql block or two queries.
  // We'll use a plpgsql DO block or just a CTE. 
  // Let's use a CTE to get the current points, insert transaction, and update the customer (if we kept track of balance on customer, but balance is calculated or we can get latest balance_after).
  // Wait, does `customers` table have a `total_points` column?
  const custRes = await sql`SELECT COALESCE((SELECT balance_after FROM loyalty_transactions WHERE customer_id = ${customerId} ORDER BY created_at DESC LIMIT 1), 0) as current_balance`;
  const currentBalance = custRes.length > 0 ? Number(custRes[0].current_balance) : 0;
  
  const balanceAfter = currentBalance + points;
  if (balanceAfter < 0) {
    throw new Error("Insufficient points for deduction.");
  }
  
  return await sql`
    INSERT INTO loyalty_transactions (
      customer_id, type, points, balance_after, description
    ) VALUES (
      ${customerId}, 'ADJUSTMENT', ${points}, ${balanceAfter}, ${description}
    )
    RETURNING id, balance_after
  `
}

// --- ANALYTICS ---

export async function getLoyaltyStats() {
  // Basic stats for the dashboard
  const activeMembers = await sql`
    SELECT COUNT(DISTINCT customer_id) as count
    FROM loyalty_transactions
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `;
  
  const pointsIssued = await sql`
    SELECT COALESCE(SUM(points), 0) as total
    FROM loyalty_transactions
    WHERE type = 'EARN' AND created_at >= NOW() - INTERVAL '30 days'
  `;
  
  const pointsRedeemed = await sql`
    SELECT COALESCE(SUM(ABS(points)), 0) as total
    FROM loyalty_transactions
    WHERE type = 'SPEND' AND created_at >= NOW() - INTERVAL '30 days'
  `;

  // Last 7 days trend
  const trend = await sql`
    WITH days AS (
      SELECT generate_series(
        date_trunc('day', NOW() - INTERVAL '6 days'),
        date_trunc('day', NOW()),
        '1 day'::interval
      ) as day
    )
    SELECT 
      to_char(d.day, 'DD Mon') as date,
      COALESCE(SUM(lt.points) FILTER (WHERE lt.type = 'EARN'), 0) as earned,
      COALESCE(SUM(ABS(lt.points)) FILTER (WHERE lt.type = 'SPEND'), 0) as redeemed
    FROM days d
    LEFT JOIN loyalty_transactions lt 
      ON date_trunc('day', lt.created_at) = d.day
    GROUP BY d.day
    ORDER BY d.day ASC
  `;

  return {
    activeMembers: Number(activeMembers[0]?.count || 0),
    pointsIssued: Number(pointsIssued[0]?.total || 0),
    pointsRedeemed: Number(pointsRedeemed[0]?.total || 0),
    trend
  }
}
