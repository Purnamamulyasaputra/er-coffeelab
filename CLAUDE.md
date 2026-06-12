# agents.md — ER Coffeelab Task Agents

This file defines autonomous agent workflows for building the ER Coffeelab Admin Panel and POS System. Each agent handles a specific domain with clear inputs, outputs, and dependencies.

---

## Agent Index

| # | Agent | Domain | Dependencies | Priority |
| --- | --- | --- | --- | --- |
| A01 | [Scaffold Agent](#a01-scaffold-agent) | Project setup | None | P0 |
| A02 | [Database Agent](#a02-database-agent) | Schema, migration, seed | A01 | P0 |
| A03 | [Auth Agent](#a03-auth-agent) | Authentication, authorization | A01, A02 | P0 |
| A04 | [UI Foundation Agent](#a04-ui-foundation-agent) | Reusable components | A01 | P0 |
| A05 | [Admin Layout Agent](#a05-admin-layout-agent) | Sidebar, header, routing | A03, A04 | P1 |
| A06 | [Dashboard Agent](#a06-dashboard-agent) | ADM-001 | A05, A02 | P1 |
| A07 | [Menu Management Agent](#a07-menu-management-agent) | ADM-003, ADM-004 | A05, A02 | P1 |
| A08 | [Branch Management Agent](#a08-branch-management-agent) | ADM-005, ADM-006 | A05, A02 | P1 |
| A09 | [Order Management Agent](#a09-order-management-agent) | ADM-002 | A05, A02, A07 | P1 |
| A10 | [POS Terminal Agent](#a10-pos-terminal-agent) | ADM-017 | A02, A03, A07, A04 | P1 |
| A11 | [Shift & Cash Agent](#a11-shift--cash-agent) | ADM-018, ADM-019 | A10, A02 | P1 |
| A12 | [KDS Agent](#a12-kds-agent) | ADM-021 | A09, A10 | P1 |
| A13 | [Table Management Agent](#a13-table-management-agent) | ADM-020 | A10, A08 | P2 |
| A14 | [Inventory Agent](#a14-inventory-agent) | ADM-022, ADM-023, ADM-024, ADM-025 | A05, A02, A07 | P2 |
| A15 | [Employee Agent](#a15-employee-agent) | ADM-026, ADM-027 | A05, A02, A03 | P2 |
| A16 | [Promo Agent](#a16-promo-agent) | ADM-007, ADM-008, ADM-009 | A05, A02 | P2 |
| A17 | [Loyalty Agent](#a17-loyalty-agent) | ADM-010 | A05, A02 | P2 |
| A18 | [Customer Agent](#a18-customer-agent) | ADM-011 | A05, A02 | P2 |
| A19 | [Payment Agent](#a19-payment-agent) | ADM-012 | A05, A02 | P2 |
| A20 | [Refund Agent](#a20-refund-agent) | ADM-028 | A09, A10, A11 | P2 |
| A21 | [Notification Agent](#a21-notification-agent) | ADM-013 | A05, A02 | P3 |
| A22 | [Content Agent](#a22-content-agent) | ADM-014 | A05, A02 | P3 |
| A23 | [Reports Agent](#a23-reports-agent) | ADM-015 | A05, A02, all data agents | P3 |
| A24 | [User Management Agent](#a24-user-management-agent) | ADM-016 | A05, A02, A03 | P2 |
| A25 | [Tax & Discount Agent](#a25-tax--discount-agent) | ADM-029, ADM-030 | A05, A02 | P2 |
| A26 | [Offline Agent](#a26-offline-agent) | POS offline mode | A10, A11 | P3 |

---

## Agent Definitions

### A01: Scaffold Agent

**Goal:** Initialize the Next.js project with all dependencies, folder structure, configuration files, and base layouts.

**Tasks:**

1. `npx create-next-app@latest er-coffeelab --typescript --tailwind --app --src-dir=false`
2. Install all dependencies from TRD.md Section 10.1
3. Create folder structure from TRD.md Section 2
4. Configure `tailwind.config.ts` with Source Sans Pro font family
5. Add Source Sans Pro woff2 font files to `public/fonts/`
6. Configure `app/layout.tsx` with `next/font/local` for Source Sans Pro
7. Configure `globals.css` with Tailwind base and CSS variables
8. Create `lib/db.ts` with neon serverless connection
9. Create `lib/utils.ts` with `cn()` helper (clsx + tailwind-merge)
10. Create `lib/constants.ts` with all static values from ERD Section 5
11. Create `lib/types.ts` with TypeScript interfaces for all 50 tables
12. Create `drizzle.config.ts`
13. Create `.env.local.example`
14. Create `vercel.json`
15. Verify `npm run dev` starts without errors

**Output:** Working Next.js project with complete folder structure, all configs, and dev server running.

---

### A02: Database Agent

**Goal:** Create Drizzle schema, generate migration, run migration on Neon, and seed all tables.

**Tasks:**

1. Create `drizzle/schema.ts` with all 50 tables from ERD v1.1 (exact column names, types, constraints)
2. Create all indexes from ERD Section 3
3. Create `drizzle/seed.ts` with all seed data from ERD Section 4
4. Run `drizzle-kit generate` to create migration SQL
5. Review generated SQL against ERD to verify correctness
6. Run `drizzle-kit push` to apply to Neon database
7. Run `tsx drizzle/seed.ts` to populate seed data
8. Verify all 50 tables exist with correct schema
9. Verify all seed data inserted correctly
10. Create `lib/queries/` directory with initial query files (empty exports)

**Output:** Neon database with all 50 tables, indexes, constraints, and seed data. Drizzle schema for future migrations.

**Important:** After this agent completes, Drizzle is DONE. All subsequent agents use raw SQL via `lib/db.ts`.

---

### A03: Auth Agent

**Goal:** Implement authentication for Admin Panel (email/password) and POS Terminal (PIN).

**Tasks:**

1. Create `lib/auth.ts`: JWT sign/verify with jose, session helpers, cookie management
2. Create `lib/middleware.ts`: role checking, branch access verification
3. Create `lib/queries/auth.ts`: raw SQL queries for admin lookup, employee PIN lookup
4. Create `app/api/auth/login/route.ts`: POST admin login (email + bcrypt verify → JWT)
5. Create `app/api/auth/pos-login/route.ts`: POST POS login (branchId + PIN → session)
6. Create `app/api/auth/logout/route.ts`: POST clear cookies
7. Create `app/api/auth/me/route.ts`: GET current session info
8. Create `middleware.ts` (root): route guards for /admin/*and /pos/*
9. Create `app/(auth)/login/page.tsx`: admin login form
10. Create POS PIN login screen component
11. Create `lib/hooks/use-auth.ts`: client-side auth hook
12. Test: admin login, POS PIN login, unauthorized redirect, role guard

**Output:** Working auth system with JWT for admin, PIN sessions for POS, route guards.

---

### A04: UI Foundation Agent

**Goal:** Build all reusable UI primitives and shared components.

**Tasks:**

1. Create all `components/ui/` primitives: button, input, select, modal, drawer, table, pagination, badge, toggle, tabs, toast, spinner, skeleton, card, dropdown-menu, date-picker, rich-text-editor, image-uploader
2. Create all `components/shared/` patterns: data-table (sortable, filterable, paginated), kpi-card, chart-wrapper, export-button (PDF + Excel), branch-selector, date-range-filter, search-input, status-badge, confirm-dialog, empty-state, drag-sort-list (dndkit), pin-prompt
3. Each component: TypeScript props interface, className prop, named export, Tailwind styling
4. Source Sans Pro must be the font in all components
5. Skeleton variants for: table rows, cards, charts
6. Toast notification system (success, error, warning, info)

**Output:** Complete component library ready for all admin and POS pages.

---

### A05: Admin Layout Agent

**Goal:** Build the admin panel shell: sidebar navigation, header, breadcrumbs, responsive layout.

**Tasks:**

1. Create `components/layout/admin-sidebar.tsx`: collapsible sidebar with all 30 menu items grouped (see PRD.md Section 3.1), active state, role-based visibility
2. Create `components/layout/admin-header.tsx`: branch selector (for Store Admin scope), user menu, notification bell
3. Create `components/layout/breadcrumbs.tsx`: auto-generated from route
4. Create `app/admin/layout.tsx`: sidebar + header + main content area
5. Role-based menu filtering: Store Admin sees only their permitted menus
6. Mobile responsive: sidebar becomes hamburger menu on small screens
7. Branch context: Store Admin auto-scoped to assigned branches

**Output:** Admin shell with working navigation, role filtering, branch scoping.

---

### A06: Dashboard Agent

**Goal:** Build ADM-001 Dashboard & Analytics.

**Tasks:**

1. Create `lib/queries/reports.ts`: raw SQL aggregations for KPIs, trends, top products, peak hours
2. Create `app/api/reports/route.ts`: GET with date range, branch, category filters
3. Create `app/admin/dashboard/page.tsx`: server component fetching initial data
4. Build KPI cards row: orders today, revenue today, orders month, revenue month
5. Build trend chart (recharts): LineChart for revenue and order volume, daily/weekly/monthly toggle
6. Build top products table: sortable by volume and revenue
7. Build branch comparison chart (recharts): BarChart comparing 5 branches (Super Admin only)
8. Build peak hours heatmap
9. Build order source pie chart: APP vs POS breakdown
10. All charts wrapped in `components/shared/chart-wrapper.tsx` with loading skeleton
11. Date range filter and branch filter at top

**Output:** Fully functional analytics dashboard with real data from seed.

---

### A07: Menu Management Agent

**Goal:** Build ADM-003 Products and ADM-004 Categories.

**Tasks:**

1. Create `lib/queries/products.ts`: CRUD queries, customization group/option CRUD
2. Create `lib/queries/categories.ts`: CRUD queries with product count
3. Create `app/api/products/route.ts` and `app/api/products/[id]/route.ts`
4. Create `app/api/categories/route.ts`
5. Create `app/admin/menu/products/page.tsx`: product list with search, filter, status badges
6. Create `app/admin/menu/products/[id]/page.tsx`: product edit form
7. Create `components/admin/product-form.tsx`: full form with image upload (Vercel Blob), all fields
8. Create `components/admin/customization-group-editor.tsx`: add/edit/remove groups with nested options
9. Create `app/admin/menu/categories/page.tsx`: category list with drag-sort (dndkit)
10. Image upload integrated with Vercel Blob via `app/api/upload/route.ts`

**Output:** Full CRUD for products (including nested customizations) and categories.

---

### A08: Branch Management Agent

**Goal:** Build ADM-005 Branch List and ADM-006 Stock Availability.

**Tasks:**

1. Create `lib/queries/branches.ts`: CRUD, admin assignment, stock queries
2. Create `app/api/branches/route.ts` and `app/api/branches/[id]/route.ts`
3. Create `app/api/branches/[id]/stock/route.ts`
4. Create `app/admin/branches/page.tsx`: branch list
5. Create `components/admin/branch-form.tsx`: form with map picker, feature toggles, admin assignment
6. Create `app/admin/branches/[id]/stock/page.tsx`: product and option stock toggle grids
7. Bulk toggle functionality for stock updates

**Output:** Branch CRUD with feature toggles, admin assignment, and per-branch stock management.

---

### A09: Order Management Agent

**Goal:** Build ADM-002 Order Management.

**Tasks:**

1. Create `lib/queries/orders.ts`: list, detail, status update, status log creation
2. Create `app/api/orders/route.ts`, `app/api/orders/[id]/route.ts`, `app/api/orders/[id]/status/route.ts`
3. Create `app/admin/orders/page.tsx`: order queue with auto-refresh (SWR polling)
4. Create `components/admin/order-queue.tsx`: filterable list by status, branch, mode, source
5. Create `components/admin/order-card.tsx`: compact order card with status badge, mode icon
6. Create `components/admin/order-detail-drawer.tsx`: full order detail in slide-out drawer
7. Status pipeline: drag-and-drop between columns (dndkit) or button-based status transitions
8. Audio notification for new orders (Web Audio API)
9. Cancel order modal with reason input

**Output:** Real-time order management with status pipeline and detail view.

---

### A10: POS Terminal Agent

**Goal:** Build ADM-017 POS Terminal — the main cashier interface.

**Tasks:**

1. Create `app/pos/layout.tsx`: full-screen layout (no admin sidebar)
2. Create `app/pos/page.tsx`: split-screen POS terminal
3. Create `components/pos/product-grid.tsx`: category tabs + product card grid
4. Create `components/pos/product-card.tsx`: image, name, price, sold-out overlay
5. Create `components/pos/customization-modal.tsx`: dynamic from product_customization_groups
6. Create `components/pos/pos-cart.tsx`: right panel cart with item list, totals, tax, service charge
7. Create `components/pos/cart-item.tsx`: item with qty control, customization display, notes, remove
8. Create `components/pos/payment-modal.tsx`: payment method selection + processing
9. Create `components/pos/cash-calculator.tsx`: amount tendered, change display
10. Create `components/pos/split-payment.tsx`: multiple payment methods
11. Create `components/pos/customer-lookup.tsx`: phone input, auto-fill name/tier/points
12. Create `components/pos/discount-selector.tsx`: preset list, PIN prompt for restricted
13. Create `components/pos/receipt-printer.tsx`: ESC/POS receipt template
14. Create `components/pos/barcode-scanner.tsx`: SKU input handler
15. POS cart state: React Context + localStorage persistence
16. Auto-calculate tax from `tax_configs` and service charge from `branches.service_charge_pct`
17. Create order on payment: POST to `/api/orders` with `is_pos=true`, `order_source='POS'`

**Output:** Fully functional POS terminal capable of processing walk-in orders.

---

### A11: Shift & Cash Agent

**Goal:** Build ADM-018 Shift Management and ADM-019 Cash Management.

**Tasks:**

1. Create `lib/queries/shifts.ts`: open, close, get active, list history, running totals
2. Create `app/api/shifts/route.ts` and `app/api/shifts/[id]/route.ts`
3. Create `app/api/cash-movements/route.ts`
4. Create `components/pos/shift-panel.tsx`: slide-out panel on POS
5. Open shift form: opening cash input
6. Running totals during shift: sales, orders, cash/non-cash breakdown
7. Close shift form: actual cash input, difference calculation, notes
8. Cash in/out form with reason
9. Cash movement history for current shift
10. Shift history table (admin view)
11. Shift report PDF export
12. Gate POS access: require open shift before processing orders

**Output:** Complete shift lifecycle with cash reconciliation.

---

### A12: KDS Agent

**Goal:** Build ADM-021 Kitchen Display System.

**Tasks:**

1. Create `app/pos/kitchen/page.tsx`: full-screen 3-column board
2. Create `components/pos/kds-column.tsx`: New, In Progress, Ready columns
3. Create `components/pos/kds-ticket-card.tsx`: order card with items, customization, mode badge, table #
4. Create `components/pos/elapsed-timer.tsx`: live timer with color coding
5. Create `components/pos/bump-button.tsx`: tap to advance status
6. Auto-refresh via SWR polling (2-second interval)
7. Audio alert for new orders
8. Source filter: All / POS / App
9. Order status updates create `order_status_logs` entries

**Output:** Real-time kitchen display showing all orders (POS + app) with bump workflow.

---

### A13: Table Management Agent

**Goal:** Build ADM-020 Table Management.

**Tasks:**

1. Create `lib/queries/tables.ts`: CRUD, status updates
2. Create `app/api/branches/[id]/tables/route.ts`
3. Create `components/pos/table-floor-plan.tsx`: visual grid with drag positioning (dndkit)
4. Create `components/pos/table-card.tsx`: number, capacity, status color, duration timer
5. Table detail popover: current order, total bill, quick actions
6. Quick actions: seat, move, merge, clear, reserve
7. Section tabs: Indoor / Outdoor / Smoking / VIP
8. Admin config page: CRUD tables for each branch

**Output:** Visual table management with floor plan and POS integration.

---

### A14: Inventory Agent

**Goal:** Build ADM-022 Inventory, ADM-023 Suppliers, ADM-024 Purchase Orders, ADM-025 Stock Opname.

**Tasks:**

1. Create `lib/queries/inventory.ts`: ingredients CRUD, recipe CRUD, stock levels, movements
2. Create `lib/queries/suppliers.ts`: CRUD
3. Create `lib/queries/purchase-orders.ts`: CRUD, approval flow, receive
4. Create `lib/queries/stock-opname.ts`: create, count entry, complete
5. Create all API routes for inventory, suppliers, purchase-orders, stock-opname
6. Create admin pages for all four menus
7. Create `components/admin/ingredient-form.tsx`
8. Create `components/admin/recipe-editor.tsx`: ingredient picker with quantity
9. Create `components/admin/stock-level-grid.tsx`: per-branch stock with low-stock highlight
10. Create stock adjustment modal
11. Create `components/admin/po-form.tsx`: supplier select, line items, totals
12. PO approval workflow UI
13. PO receive form: ordered vs received comparison
14. Stock opname count form
15. Variance report with color coding

**Output:** Complete inventory management pipeline: ingredients → recipes → stock → procurement → counting.

---

### A15: Employee Agent

**Goal:** Build ADM-026 Employee Management and ADM-027 Attendance.

**Tasks:**

1. Create `lib/queries/employees.ts`: CRUD, attendance
2. Create API routes
3. Employee CRUD page with PIN setup, branch assignment
4. Attendance page: log table, filters, labor cost calculation
5. POS clock in/out component
6. CSV export for payroll

**Output:** Employee management with attendance tracking and payroll export.

---

### A16: Promo Agent

**Goal:** Build ADM-007 Campaigns, ADM-008 Vouchers, ADM-009 Banners.

**Tasks:**

1. Create queries, API routes, admin pages for all three menus
2. Campaign CRUD with performance dashboard
3. Voucher CRUD with all discount types and targeting
4. Banner CRUD with drag-sort and device preview
5. Image upload integration for campaigns and banners

**Output:** Full promotional content management.

---

### A17: Loyalty Agent

**Goal:** Build ADM-010 Loyalty Program.

**Tasks:**

1. Tier configuration form
2. Earning rules configuration
3. Daily check-in schedule editor
4. Manual point adjustment modal
5. Loyalty reports with charts

**Output:** Loyalty program administration.

---

### A18: Customer Agent

**Goal:** Build ADM-011 Customer Management.

**Tasks:**

1. Customer database with search, filters, pagination
2. Customer detail drawer: profile, tier, points, order history, favorites
3. Segmentation filters
4. CSV/Excel export

**Output:** Customer CRM view with export.

---

### A19: Payment Agent

**Goal:** Build ADM-012 Payment Configuration.

**Tasks:**

1. Payment method CRUD with drag-sort
2. Payment instruction editor per method
3. Payment log viewer with filters

**Output:** Payment method administration.

---

### A20: Refund Agent

**Goal:** Build ADM-028 Refund & Void.

**Tasks:**

1. Refund request modal on POS
2. Approval queue on admin panel
3. Auto-actions on approval (status update, payment refund, cash adjustment)
4. Refund log with filters

**Output:** Refund workflow from POS request through admin approval.

---

### A21: Notification Agent

**Goal:** Build ADM-013 Notifications.

**Tasks:**

1. Push notification composer with audience targeting
2. Template CRUD for automated events
3. Delivery report dashboard

**Output:** Notification management and broadcasting.

---

### A22: Content Agent

**Goal:** Build ADM-014 Content Management.

**Tasks:**

1. Static page editor with rich text
2. Merchandise CRUD

**Output:** CMS for static pages and merchandise catalog.

---

### A23: Reports Agent

**Goal:** Build ADM-015 Reports & Export.

**Tasks:**

1. Report tabs: Sales, Products, Payments, Promos, Customers, POS Shifts, Inventory
2. Each tab with recharts visualizations
3. Date range and branch filters
4. PDF export (jspdf)
5. Excel export (xlsx)

**Output:** Comprehensive reporting dashboard with multi-format export.

---

### A24: User Management Agent

**Goal:** Build ADM-016 User & Role Management.

**Tasks:**

1. Admin CRUD with role and branch assignment
2. Activity log viewer

**Output:** Admin user administration.

---

### A25: Tax & Discount Agent

**Goal:** Build ADM-029 Tax Config and ADM-030 Discount Presets.

**Tasks:**

1. Per-branch tax configuration
2. Discount preset CRUD
3. Receipt preview with tax breakdown

**Output:** Tax and discount configuration for POS.

---

### A26: Offline Agent

**Goal:** Implement POS offline capability.

**Tasks:**

1. Create `lib/offline/queue.ts`: localStorage order queue
2. Create `lib/offline/sync.ts`: reconnect sync with conflict handling
3. Create `lib/offline/catalog-cache.ts`: product catalog cache with TTL
4. Create `components/pos/offline-indicator.tsx`: visual indicator
5. Create `lib/hooks/use-offline-queue.ts`: hook for queue management
6. Network detection: `navigator.onLine` + periodic health check
7. Test: create orders offline → reconnect → verify sync → verify no duplicates

**Output:** POS terminal that functions without internet and syncs on reconnect.

---

## Execution Order

```
Phase 0 (Foundation):  A01 → A02 → A03 → A04
Phase 1 (Core):        A05 → A06 + A07 + A08 + A09 (parallel)
Phase 1 (POS):         A10 → A11 + A12 (parallel)
Phase 2 (Operations):  A13 + A14 + A15 + A16 + A17 (parallel)
Phase 2 (Commerce):    A18 + A19 + A20 + A24 + A25 (parallel)
Phase 3 (Polish):      A21 + A22 + A23 + A26 (parallel)
```

---

*— End of Document —*
