# ER Coffeelab — Technical Requirements Document (TRD)

**Version:** 1.0 · **Date:** June 5, 2026  
**Project:** Admin Panel + POS System  
**PRD Reference:** PRD.md  
**ERD Reference:** ERD_ER_Coffeelab_v1.1.md

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Project Structure](#2-project-structure)
3. [Database Layer](#3-database-layer)
4. [API Layer](#4-api-layer)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Component Library](#6-component-library)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [File Upload & Storage](#8-file-upload--storage)
9. [Offline & Performance Strategy](#9-offline--performance-strategy)
10. [Third-Party Libraries](#10-third-party-libraries)
11. [Deployment & Infrastructure](#11-deployment--infrastructure)
12. [Coding Standards](#12-coding-standards)

---

## 1. Technology Stack

| Layer | Technology | Version | Purpose |
| --- | --- | --- | --- |
| **Framework** | Next.js (App Router) | 15.x | Full-stack React framework |
| **Language** | TypeScript | 5.x | Type safety |
| **Database** | Neon PostgreSQL | Serverless | Cloud-native Postgres |
| **DB Driver** | `@neondatabase/serverless` | Latest | HTTP-based serverless driver |
| **Migrations** | Drizzle Kit | Latest | Schema migration and seed ONLY |
| **ORM** | None (raw SQL) | — | All queries written as raw SQL via neon serverless driver |
| **Deployment** | Vercel | — | Serverless hosting |
| **Storage** | Vercel Blob | — | File/image uploads |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **Font** | Source Sans Pro | — | STRICTLY the only body font |
| **Charts** | Recharts | 2.x | Dashboard and report charts |
| **Drag & Drop** | @dnd-kit | Latest | Sortable lists, table floor plan, kanban |
| **PDF** | @react-pdf/renderer or jspdf | Latest | Report export, receipt, PO print |
| **Excel** | SheetJS (xlsx) | Latest | CSV/Excel export |
| **Icons** | Lucide React | Latest | Consistent icon set |

---

## 2. Project Structure

```
er-coffeelab/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── orders/
│   │   │   └── page.tsx
│   │   ├── menu/
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── categories/
│   │   │       └── page.tsx
│   │   ├── branches/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── stock/
│   │   │       │   └── page.tsx
│   │   │       └── tables/
│   │   │           └── page.tsx
│   │   ├── promos/
│   │   │   ├── campaigns/
│   │   │   │   └── page.tsx
│   │   │   ├── vouchers/
│   │   │   │   └── page.tsx
│   │   │   └── banners/
│   │   │       └── page.tsx
│   │   ├── loyalty/
│   │   │   └── page.tsx
│   │   ├── customers/
│   │   │   └── page.tsx
│   │   ├── payments/
│   │   │   └── page.tsx
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   ├── content/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   ├── inventory/
│   │   │   └── page.tsx
│   │   ├── suppliers/
│   │   │   └── page.tsx
│   │   ├── purchase-orders/
│   │   │   └── page.tsx
│   │   ├── stock-opname/
│   │   │   └── page.tsx
│   │   ├── employees/
│   │   │   └── page.tsx
│   │   ├── attendance/
│   │   │   └── page.tsx
│   │   ├── refunds/
│   │   │   └── page.tsx
│   │   ├── tax-config/
│   │   │   └── page.tsx
│   │   ├── discounts/
│   │   │   └── page.tsx
│   │   └── layout.tsx                  ← admin sidebar layout
│   ├── pos/
│   │   ├── page.tsx                    ← POS order screen
│   │   ├── kitchen/
│   │   │   └── page.tsx               ← KDS full-screen
│   │   ├── tables/
│   │   │   └── page.tsx
│   │   └── layout.tsx                  ← POS full-screen layout (no sidebar)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── route.ts
│   │   │   ├── pos-login/
│   │   │   │   └── route.ts
│   │   │   └── logout/
│   │   │       └── route.ts
│   │   ├── admin/
│   │   │   └── [...slug]/
│   │   │       └── route.ts           ← catch-all admin API
│   │   ├── orders/
│   │   │   ├── route.ts               ← GET list, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts           ← GET detail, PATCH update
│   │   │       └── status/
│   │   │           └── route.ts       ← PATCH status update
│   │   ├── products/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── categories/
│   │   │   └── route.ts
│   │   ├── branches/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── stock/
│   │   │       │   └── route.ts
│   │   │       └── tables/
│   │   │           └── route.ts
│   │   ├── shifts/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── cash-movements/
│   │   │   └── route.ts
│   │   ├── employees/
│   │   │   └── route.ts
│   │   ├── attendance/
│   │   │   └── route.ts
│   │   ├── ingredients/
│   │   │   └── route.ts
│   │   ├── inventory/
│   │   │   ├── stock/
│   │   │   │   └── route.ts
│   │   │   └── movements/
│   │   │       └── route.ts
│   │   ├── purchase-orders/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── stock-opname/
│   │   │   └── route.ts
│   │   ├── suppliers/
│   │   │   └── route.ts
│   │   ├── refunds/
│   │   │   └── route.ts
│   │   ├── vouchers/
│   │   │   └── route.ts
│   │   ├── campaigns/
│   │   │   └── route.ts
│   │   ├── banners/
│   │   │   └── route.ts
│   │   ├── customers/
│   │   │   └── route.ts
│   │   ├── loyalty/
│   │   │   └── route.ts
│   │   ├── payments/
│   │   │   └── route.ts
│   │   ├── notifications/
│   │   │   └── route.ts
│   │   ├── reports/
│   │   │   └── route.ts
│   │   ├── tax-config/
│   │   │   └── route.ts
│   │   ├── discounts/
│   │   │   └── route.ts
│   │   ├── upload/
│   │   │   └── route.ts               ← Vercel Blob upload
│   │   └── health/
│   │       └── route.ts
│   ├── layout.tsx                       ← root layout (font, providers)
│   └── globals.css
├── components/
│   ├── ui/                              ← reusable primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── modal.tsx
│   │   ├── drawer.tsx
│   │   ├── table.tsx
│   │   ├── pagination.tsx
│   │   ├── badge.tsx
│   │   ├── toggle.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   ├── spinner.tsx
│   │   ├── skeleton.tsx
│   │   ├── card.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── date-picker.tsx
│   │   ├── rich-text-editor.tsx
│   │   └── image-uploader.tsx
│   ├── layout/
│   │   ├── admin-sidebar.tsx
│   │   ├── admin-header.tsx
│   │   ├── pos-layout.tsx
│   │   └── breadcrumbs.tsx
│   ├── shared/
│   │   ├── data-table.tsx              ← generic sortable/filterable table
│   │   ├── kpi-card.tsx
│   │   ├── chart-wrapper.tsx
│   │   ├── export-button.tsx
│   │   ├── branch-selector.tsx
│   │   ├── date-range-filter.tsx
│   │   ├── search-input.tsx
│   │   ├── status-badge.tsx
│   │   ├── confirm-dialog.tsx
│   │   ├── empty-state.tsx
│   │   ├── drag-sort-list.tsx
│   │   └── pin-prompt.tsx
│   ├── pos/
│   │   ├── product-grid.tsx
│   │   ├── product-card.tsx
│   │   ├── customization-modal.tsx
│   │   ├── pos-cart.tsx
│   │   ├── cart-item.tsx
│   │   ├── payment-modal.tsx
│   │   ├── cash-calculator.tsx
│   │   ├── split-payment.tsx
│   │   ├── customer-lookup.tsx
│   │   ├── table-selector.tsx
│   │   ├── discount-selector.tsx
│   │   ├── receipt-printer.tsx
│   │   ├── barcode-scanner.tsx
│   │   ├── offline-indicator.tsx
│   │   ├── shift-panel.tsx
│   │   ├── kds-ticket-card.tsx
│   │   ├── kds-column.tsx
│   │   ├── bump-button.tsx
│   │   ├── elapsed-timer.tsx
│   │   ├── table-floor-plan.tsx
│   │   └── table-card.tsx
│   └── admin/
│       ├── order-queue.tsx
│       ├── order-card.tsx
│       ├── order-detail-drawer.tsx
│       ├── product-form.tsx
│       ├── customization-group-editor.tsx
│       ├── branch-form.tsx
│       ├── voucher-form.tsx
│       ├── campaign-form.tsx
│       ├── employee-form.tsx
│       ├── ingredient-form.tsx
│       ├── recipe-editor.tsx
│       ├── stock-level-grid.tsx
│       ├── po-form.tsx
│       ├── refund-modal.tsx
│       └── notification-composer.tsx
├── lib/
│   ├── db.ts                            ← neon serverless connection
│   ├── queries/                          ← raw SQL query functions
│   │   ├── orders.ts
│   │   ├── products.ts
│   │   ├── branches.ts
│   │   ├── categories.ts
│   │   ├── employees.ts
│   │   ├── shifts.ts
│   │   ├── inventory.ts
│   │   ├── suppliers.ts
│   │   ├── purchase-orders.ts
│   │   ├── stock-opname.ts
│   │   ├── customers.ts
│   │   ├── vouchers.ts
│   │   ├── campaigns.ts
│   │   ├── loyalty.ts
│   │   ├── payments.ts
│   │   ├── notifications.ts
│   │   ├── refunds.ts
│   │   ├── reports.ts
│   │   └── auth.ts
│   ├── auth.ts                           ← JWT helpers, session
│   ├── middleware.ts                     ← role guard middleware
│   ├── utils.ts                          ← shared utilities
│   ├── constants.ts                      ← static values from ERD
│   ├── types.ts                          ← TypeScript interfaces
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-branch.ts
│   │   ├── use-debounce.ts
│   │   ├── use-local-storage.ts
│   │   ├── use-offline-queue.ts
│   │   └── use-polling.ts
│   └── offline/
│       ├── queue.ts                      ← localStorage order queue
│       ├── sync.ts                       ← reconnect sync logic
│       └── catalog-cache.ts              ← product catalog cache
├── drizzle/
│   ├── schema.ts                         ← Drizzle schema (migration ONLY)
│   ├── migrate.ts                        ← migration runner
│   ├── seed.ts                           ← seed runner
│   └── migrations/                       ← generated SQL migrations
│       └── 0001_initial.sql
├── public/
│   ├── fonts/
│   │   ├── SourceSansPro-Regular.woff2
│   │   ├── SourceSansPro-SemiBold.woff2
│   │   └── SourceSansPro-Bold.woff2
│   └── icons/
├── middleware.ts                          ← Next.js middleware (auth guard)
├── drizzle.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.local
├── CLAUDE.md
└── agents.md
```

---

## 3. Database Layer

### 3.1 Connection

```typescript
// lib/db.ts
import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);
```

### 3.2 Raw SQL Query Pattern (NO ORM)

Drizzle is used ONLY for migrations (`drizzle-kit push/migrate`) and seeding (`drizzle/seed.ts`). All runtime queries use the neon serverless driver directly with raw SQL.

```typescript
// lib/queries/orders.ts
import { sql } from '@/lib/db';

export async function getOrdersByBranch(branchId: number, status?: string) {
  const query = `
    SELECT o.*, b.name AS branch_name, e.name AS employee_name
    FROM orders o
    JOIN branches b ON b.id = o.branch_id
    LEFT JOIN employees e ON e.id = o.employee_id
    WHERE o.branch_id = $1
    ${status ? 'AND o.status = $2' : ''}
    ORDER BY o.created_at DESC
    LIMIT 50
  `;
  const params = status ? [branchId, status] : [branchId];
  return sql(query, params);
}

export async function createPOSOrder(data: POSOrderInput) {
  const result = await sql(`
    INSERT INTO orders (
      invoice_code, receipt_number, branch_id, order_mode, order_source,
      status, subtotal, discount_amount, discount_id, tax_amount,
      service_charge, total_amount, payment_method_code, shift_id,
      employee_id, is_pos, customer_id, table_id, paid_at
    ) VALUES (
      $1, $2, $3, $4, 'POS',
      'COMPLETED', $5, $6, $7, $8,
      $9, $10, $11, $12,
      $13, TRUE, $14, $15, NOW()
    ) RETURNING id
  `, [
    data.invoiceCode, data.receiptNumber, data.branchId, data.orderMode,
    data.subtotal, data.discountAmount, data.discountId, data.taxAmount,
    data.serviceCharge, data.totalAmount, data.paymentMethodCode, data.shiftId,
    data.employeeId, data.customerId, data.tableId
  ]);
  return result[0];
}
```

### 3.3 API Route Pattern

All API routes live under `app/api/` using Next.js App Router conventions. No API logic inside page components.

```typescript
// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getOrdersByBranch, createPOSOrder } from '@/lib/queries/orders';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await requireAuth(request);
  const { searchParams } = new URL(request.url);
  const branchId = Number(searchParams.get('branchId'));
  const status = searchParams.get('status') || undefined;

  // Store Admin scope check
  if (session.role === 'STORE_ADMIN') {
    const hasAccess = await checkBranchAccess(session.adminId, branchId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const orders = await getOrdersByBranch(branchId, status);
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const session = await requireAuth(request);
  const body = await request.json();
  const order = await createPOSOrder(body);
  return NextResponse.json(order, { status: 201 });
}
```

### 3.4 Drizzle (Migration & Seed ONLY)

```typescript
// drizzle/schema.ts — defines schema for migration generation ONLY
import { pgTable, bigserial, varchar, bigint, boolean, integer, numeric, text, timestamp } from 'drizzle-orm/pg-core';

export const orders = pgTable('orders', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  invoiceCode: varchar('invoice_code', { length: 50 }).notNull().unique(),
  // ... all columns matching ERD
});

// drizzle.config.ts
export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: { connectionString: process.env.DATABASE_URL! },
};

// Commands (package.json scripts):
// "db:generate" → "drizzle-kit generate"
// "db:migrate"  → "drizzle-kit push"
// "db:seed"     → "tsx drizzle/seed.ts"
```

---

## 4. API Layer

### 4.1 Route Structure

All API routes follow REST conventions at `app/api/[resource]/route.ts`:

| Method | Route | Function |
| --- | --- | --- |
| GET | `/api/orders` | List orders (filterable) |
| POST | `/api/orders` | Create order (POS or system) |
| GET | `/api/orders/[id]` | Get order detail |
| PATCH | `/api/orders/[id]` | Update order |
| PATCH | `/api/orders/[id]/status` | Update order status |
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| GET | `/api/products/[id]` | Get product with customizations |
| PUT | `/api/products/[id]` | Update product |
| DELETE | `/api/products/[id]` | Soft delete (set inactive) |
| POST | `/api/shifts` | Open shift |
| PATCH | `/api/shifts/[id]` | Close shift |
| POST | `/api/cash-movements` | Record cash in/out |
| POST | `/api/attendance` | Clock in/out |
| POST | `/api/refunds` | Request refund |
| PATCH | `/api/refunds/[id]` | Approve/reject refund |
| POST | `/api/upload` | Upload file to Vercel Blob |
| GET | `/api/reports` | Generate report data |
| GET | `/api/health` | Health check |

### 4.2 Response Format

```typescript
// Success
{ data: T, meta?: { page, limit, total } }

// Error
{ error: string, code: string, details?: any }
```

### 4.3 Pagination

```typescript
// Standard pagination query params
GET /api/orders?page=1&limit=20&sort=created_at&order=desc

// Response includes meta
{ data: [...], meta: { page: 1, limit: 20, total: 156, totalPages: 8 } }
```

---

## 5. Frontend Architecture

### 5.1 Data Fetching

- **Server Components** (default): fetch data on server for initial page load. Fast, no client JS.
- **Client Components** (`'use client'`): only for interactive elements (forms, modals, drag-and-drop, charts).
- **SWR or React Query**: client-side data fetching for real-time updates (order queue, KDS, shift totals).
- **No `useEffect` for data fetching**: use SWR/React Query or server components.

### 5.2 State Management

- **Server state**: SWR / React Query with cache invalidation.
- **UI state**: React useState/useReducer (local to component).
- **POS cart state**: React Context with localStorage persistence.
- **Offline queue**: Custom hook `useOfflineQueue` with localStorage.
- **No global state library** (no Redux, no Zustand). Keep it simple.

### 5.3 Font Configuration

Source Sans Pro is the ONLY body font. No exceptions.

```typescript
// app/layout.tsx
import localFont from 'next/font/local';

const sourceSansPro = localFont({
  src: [
    { path: '../public/fonts/SourceSansPro-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/SourceSansPro-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/SourceSansPro-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-source-sans-pro',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sourceSansPro.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

```typescript
// tailwind.config.ts
export default {
  theme: {
    fontFamily: {
      sans: ['var(--font-source-sans-pro)', 'system-ui', 'sans-serif'],
    },
  },
};
```

---

## 6. Component Library

### 6.1 Reusable Component Rules

- Every UI primitive lives in `components/ui/`.
- Every shared pattern (data table, KPI card, filters) lives in `components/shared/`.
- Domain-specific components live in `components/admin/` or `components/pos/`.
- All components accept `className` prop for composition.
- No inline styles. Tailwind only.
- Every component must be a named export.
- No anonymous default exports.

### 6.2 Key Reusable Components

| Component | Location | Reused In |
| --- | --- | --- |
| `DataTable` | `shared/data-table.tsx` | All list pages (orders, products, customers, etc.) |
| `KPICard` | `shared/kpi-card.tsx` | Dashboard, reports, shift panel |
| `BranchSelector` | `shared/branch-selector.tsx` | Dashboard, orders, stock, reports, inventory |
| `DateRangeFilter` | `shared/date-range-filter.tsx` | Dashboard, reports, order history, attendance |
| `ExportButton` | `shared/export-button.tsx` | Reports, customers, attendance, PO |
| `DragSortList` | `shared/drag-sort-list.tsx` | Categories, banners, payment methods, products |
| `PINPrompt` | `shared/pin-prompt.tsx` | POS login, discount approval, refund approval |
| `ImageUploader` | `ui/image-uploader.tsx` | Products, categories, branches, banners, employees, merchandise |
| `StatusBadge` | `shared/status-badge.tsx` | Orders, shifts, POs, refunds, everywhere |
| `ConfirmDialog` | `shared/confirm-dialog.tsx` | All destructive actions |
| `EmptyState` | `shared/empty-state.tsx` | All list pages when no data |
| `Modal` | `ui/modal.tsx` | All modals across admin and POS |
| `Drawer` | `ui/drawer.tsx` | Order detail, customer detail, shift panel |

---

## 7. Authentication & Authorization

### 7.1 Admin Auth Flow

```
Login page → POST /api/auth/login (email + password)
  → Verify bcrypt hash against admins table
  → Issue JWT (access token 15min + refresh token 7d)
  → Set httpOnly cookies
  → Redirect to /admin/dashboard
```

### 7.2 POS Auth Flow

```
POS PIN screen → POST /api/auth/pos-login (branchId + PIN)
  → Verify bcrypt hash against employees table (filtered by branch)
  → Issue short-lived session token (shift duration)
  → Store in httpOnly cookie
  → Redirect to /pos
```

### 7.3 Middleware Route Guards

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/admin')) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (path.startsWith('/pos')) {
    const token = request.cookies.get('pos_token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.redirect(new URL('/pos/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/pos/:path*'],
};
```

### 7.4 API Role Guards

```typescript
// lib/auth.ts
export async function requireRole(request: NextRequest, roles: string[]) {
  const session = await getSession(request);
  if (!session || !roles.includes(session.role)) {
    throw new AuthError('Insufficient permissions', 403);
  }
  return session;
}

// Usage in API route:
const session = await requireRole(request, ['SUPERADMIN']);
```

---

## 8. File Upload & Storage

### 8.1 Vercel Blob Upload

```typescript
// app/api/upload/route.ts
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const folder = formData.get('folder') as string || 'uploads';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
    access: 'public',
  });

  return NextResponse.json({ url: blob.url });
}
```

### 8.2 Image Uploader Component

```typescript
// components/ui/image-uploader.tsx
// Reusable across: products, categories, branches, banners, employees, merchandise
// Props: onUpload(url), folder, maxSize, accept, preview
// Features: drag-and-drop zone, preview thumbnail, loading state, error handling
```

---

## 9. Offline & Performance Strategy

### 9.1 POS Offline Mode

```typescript
// lib/offline/queue.ts
const QUEUE_KEY = 'pos_offline_orders';

export function enqueueOrder(order: POSOrderInput) {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  queue.push({ ...order, queuedAt: Date.now(), synced: false });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueuedOrders(): POSOrderInput[] {
  return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    .filter((o: any) => !o.synced);
}

export function markSynced(queuedAt: number) {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  const updated = queue.map((o: any) =>
    o.queuedAt === queuedAt ? { ...o, synced: true } : o
  );
  localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}
```

```typescript
// lib/offline/catalog-cache.ts
const CATALOG_KEY = 'pos_product_catalog';
const CATALOG_TTL = 4 * 60 * 60 * 1000; // 4 hours

export function cacheCatalog(products: Product[]) {
  localStorage.setItem(CATALOG_KEY, JSON.stringify({
    data: products,
    cachedAt: Date.now(),
  }));
}

export function getCachedCatalog(): Product[] | null {
  const raw = localStorage.getItem(CATALOG_KEY);
  if (!raw) return null;
  const { data, cachedAt } = JSON.parse(raw);
  if (Date.now() - cachedAt > CATALOG_TTL) return null;
  return data;
}
```

### 9.2 Performance Rules

- **No memory leaks:** Clean up event listeners, intervals, and subscriptions in useEffect return. Cancel pending fetch requests on unmount.
- **localStorage for POS state:** Cart, offline queue, catalog cache, shift context. Reduces API calls.
- **Server Components by default:** Only use `'use client'` when interactivity is required.
- **Image optimization:** Use `next/image` for all images. Vercel Blob URLs support automatic resizing.
- **Code splitting:** Dynamic imports for heavy components (charts, PDF renderer, rich text editor).
- **Skeleton loading:** Show skeleton UI immediately, never a blank white screen.
- **Debounce search inputs:** 300ms debounce on all search/filter inputs.
- **Virtualized lists:** Use virtualization for lists > 100 items (order history, customer list).
- **Memoize expensive calculations:** Use `useMemo` for derived data (subtotals, filtered lists).

---

## 10. Third-Party Libraries

### 10.1 Package List

```json
{
  "dependencies": {
    "next": "^15",
    "@neondatabase/serverless": "latest",
    "@vercel/blob": "latest",
    "recharts": "^2",
    "@dnd-kit/core": "latest",
    "@dnd-kit/sortable": "latest",
    "@dnd-kit/utilities": "latest",
    "xlsx": "latest",
    "jspdf": "latest",
    "jspdf-autotable": "latest",
    "lucide-react": "latest",
    "bcryptjs": "latest",
    "jose": "latest",
    "swr": "latest",
    "date-fns": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "drizzle-orm": "latest",
    "drizzle-kit": "latest",
    "typescript": "^5",
    "tailwindcss": "^4",
    "@types/node": "latest",
    "@types/react": "latest"
  }
}
```

### 10.2 Library Usage Map

| Library | Used For |
| --- | --- |
| `recharts` | All charts in dashboard, reports, analytics |
| `@dnd-kit` | Category sort, banner sort, payment method sort, table floor plan, order kanban |
| `xlsx` | Export customers, attendance, reports to Excel/CSV |
| `jspdf` + `jspdf-autotable` | Export reports to PDF, print PO, print shift report |
| `lucide-react` | All icons across admin and POS |
| `bcryptjs` | Hash admin passwords and employee PINs |
| `jose` | JWT sign/verify for auth tokens |
| `swr` | Client-side data fetching with cache (order queue, KDS, shift) |
| `date-fns` | Date formatting and manipulation |
| `zod` | Request body validation in API routes |

---

## 11. Deployment & Infrastructure

### 11.1 Vercel Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["sin1"],
  "env": {
    "DATABASE_URL": "@neon-database-url",
    "BLOB_READ_WRITE_TOKEN": "@vercel-blob-token",
    "JWT_SECRET": "@jwt-secret",
    "NEXT_PUBLIC_APP_URL": "@app-url"
  }
}
```

### 11.2 Environment Variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string (pooled) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token |
| `JWT_SECRET` | Secret for JWT signing |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `NEXT_PUBLIC_APP_URL` | Public URL of the application |
| `MIDTRANS_SERVER_KEY` | Midtrans payment gateway key |
| `XENDIT_SECRET_KEY` | Xendit payment gateway key |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging key |

### 11.3 Branch Strategy

| Branch | Purpose | Auto-deploy |
| --- | --- | --- |
| `main` | Production | ✓ → production URL |
| `staging` | Staging/QA | ✓ → staging URL |
| `dev` | Development | ✓ → preview URL |

---

## 12. Coding Standards

### 12.1 Naming Conventions

| Item | Convention | Example |
| --- | --- | --- |
| Files/folders | kebab-case | `order-detail-drawer.tsx` |
| Components | PascalCase | `OrderDetailDrawer` |
| Functions | camelCase | `getOrdersByBranch` |
| Constants | SCREAMING_SNAKE | `ORDER_STATUS.COMPLETED` |
| DB columns | snake_case | `invoice_code`, `created_at` |
| API routes | kebab-case | `/api/purchase-orders` |
| CSS classes | Tailwind utilities | `className="flex items-center gap-2"` |

### 12.2 File Rules

- Max 300 lines per file. Split if larger.
- One component per file.
- No `any` type. Define proper TypeScript interfaces.
- All API request bodies validated with Zod.
- All database queries parameterized (no string concatenation).
- No `console.log` in production code (use proper logger or remove).

### 12.3 Git Commit Convention

```
feat(pos): add offline order queue with localStorage sync
fix(orders): prevent duplicate invoice code generation
refactor(inventory): extract stock movement logic to shared query
docs: update TRD with offline strategy section
```

---

*— End of Document —*
