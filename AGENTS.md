# CLAUDE.md — ER Coffeelab Admin Panel & POS

## Project Overview

ER Coffeelab Admin Panel and POS System. A Next.js 15 application replacing Moka POS for a 5-branch coffee chain. Combines a web admin dashboard with a full-screen POS terminal for walk-in ordering, shift management, inventory, and kitchen display.

## Quick Reference

- **PRD:** `PRD.md` — 30 menus (16 admin + 14 POS), full specifications
- **TRD:** `TRD.md` — tech stack, architecture, coding patterns
- **ERD:** `ERD_ER_Coffeelab_v1.1.md` — 50 tables, all SQL, all seeds, all indexes
- **Agents:** `agents.md` — task delegation and workflow definitions

## Tech Stack (Non-Negotiable)

- Next.js 15 App Router (NOT Pages Router)
- TypeScript strict mode
- Neon PostgreSQL with `@neondatabase/serverless` driver
- Vercel deployment
- Vercel Blob for file uploads
- Tailwind CSS 4
- Font: Source Sans Pro ONLY (`--font-source-sans-pro`)
- Drizzle ONLY for migration and seed — never for runtime queries
- All runtime DB queries: raw SQL via neon serverless driver
- recharts for charts, @dnd-kit for drag-and-drop, jspdf for PDF, xlsx for Excel

## Critical Rules

### Database Queries

```
ALWAYS: Raw SQL with parameterized queries via `sql` from lib/db.ts
NEVER: Drizzle ORM query builder at runtime
NEVER: String concatenation in SQL (SQL injection risk)
ALWAYS: Keep queries in lib/queries/*.ts, not in components or API routes
```

### API Routes

```
ALWAYS: app/api/[resource]/route.ts pattern
NEVER: API logic inside page components
NEVER: app/api/ routes inside (admin) or (pos) route groups
ALWAYS: Validate request body with Zod
ALWAYS: Check auth and role permissions
```

### Components

```
ALWAYS: Server Components by default
ONLY: 'use client' when interactivity is required (forms, modals, drag-drop, charts)
ALWAYS: Reuse components from components/ui/ and components/shared/
NEVER: Duplicate a component — extract and reuse
NEVER: Inline styles — Tailwind only
ALWAYS: Named exports, one component per file
ALWAYS: Accept className prop for composition
```

### Font

```
ALWAYS: Source Sans Pro via next/font/local
NEVER: Import Google Fonts CDN
NEVER: Use any other font family
ALWAYS: font-sans in Tailwind config points to Source Sans Pro
```

### Performance

```
ALWAYS: Skeleton loading states (never blank screen)
ALWAYS: Clean up useEffect (return cleanup function)
ALWAYS: Debounce search inputs (300ms)
ALWAYS: Dynamic import heavy components (recharts, jspdf, rich-text-editor)
ALWAYS: Use next/image for all images
NEVER: Fetch data in useEffect — use SWR or server components
NEVER: Leave intervals or event listeners without cleanup
ALWAYS: POS cart and offline queue use localStorage
```

### Offline (POS Only)

```
ALWAYS: POS order creation works without internet
ALWAYS: Orders queue in localStorage when offline
ALWAYS: Auto-sync queued orders on reconnect
ALWAYS: Product catalog cached in localStorage (4h TTL)
ALWAYS: Visual offline indicator with queue count
```

## File Structure Summary

```
app/api/[resource]/route.ts    → API endpoints (raw SQL queries)
app/admin/[page]/page.tsx      → Admin panel pages
app/pos/[page]/page.tsx        → POS terminal pages
components/ui/                 → Reusable UI primitives
components/shared/             → Shared patterns (DataTable, KPICard, etc.)
components/admin/              → Admin-specific components
components/pos/                → POS-specific components
lib/db.ts                      → Neon serverless connection
lib/queries/                   → Raw SQL query functions
lib/auth.ts                    → JWT helpers
lib/hooks/                     → Custom React hooks
lib/offline/                   → POS offline queue and cache
drizzle/                       → Schema, migrations, seed (NOT runtime)
```

## Database Connection Pattern

```typescript
import { neon } from '@neondatabase/serverless';
export const sql = neon(process.env.DATABASE_URL!);

// Usage in lib/queries/orders.ts:
export async function getOrders(branchId: number) {
  return sql(`
    SELECT o.*, b.name AS branch_name
    FROM orders o
    JOIN branches b ON b.id = o.branch_id
    WHERE o.branch_id = $1
    ORDER BY o.created_at DESC
  `, [branchId]);
}
```

## API Route Pattern

```typescript
// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder } from '@/lib/queries/orders';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await requireAuth(request);
  const branchId = Number(new URL(request.url).searchParams.get('branchId'));
  const data = await getOrders(branchId);
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const session = await requireAuth(request);
  const body = await request.json();
  // validate with zod, then:
  const order = await createOrder(body);
  return NextResponse.json({ data: order }, { status: 201 });
}
```

## Key Tables (50 total — see ERD for full schema)

Core: `admins`, `branches`, `branch_admins`, `customers`, `customer_addresses`
POS Staff: `employees`, `shifts`, `cash_movements`, `employee_attendances`
Menu: `categories`, `products`, `product_customization_groups`, `product_customization_options`
Stock: `branch_product_stock`, `branch_option_stock`, `store_tables`
Inventory: `ingredients`, `product_recipes`, `ingredient_stock`, `stock_movements`, `suppliers`, `purchase_orders`, `purchase_order_items`, `stock_opnames`, `stock_opname_items`
Cart: `carts`, `cart_items`, `cart_item_options`
Orders: `orders`, `order_items`, `order_item_options`, `order_status_logs`, `refunds`
Payment: `payment_methods`, `payment_instructions`, `payment_logs`
Promo: `campaigns`, `vouchers`, `voucher_redemptions`, `discounts`
Loyalty: `loyalty_tiers`, `loyalty_transactions`, `daily_checkins`
Content: `customer_favorites`, `banners`, `static_pages`, `merchandise`
Notification: `notification_templates`, `notification_logs`
Config: `tax_configs`

## Environment Variables

```
DATABASE_URL=postgresql://...@neon.tech/ercoffeelab
BLOB_READ_WRITE_TOKEN=vercel_blob_...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
NEXT_PUBLIC_APP_URL=https://ercoffeelab.vercel.app
```

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Push migrations to Neon
npm run db:seed      # Run seed data
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```
