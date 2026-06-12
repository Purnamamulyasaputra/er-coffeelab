# ER Coffeelab — Admin Panel & POS System PRD

**Version:** 1.0 · **Date:** June 5, 2026  
**Scope:** Admin Panel (Web Dashboard) + POS Terminal (Tablet/Desktop) — Moka POS Replacement  
**ERD Reference:** ERD_ER_Coffeelab_v1.1.md (50 tables)  
**Tech Stack Reference:** TRD.md

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Roles & Access Control](#2-user-roles--access-control)
3. [Admin Panel — Menu Specifications](#3-admin-panel--menu-specifications)
4. [POS System — Menu Specifications](#4-pos-system--menu-specifications)
5. [Order Processing Flow](#5-order-processing-flow)
6. [Integration & Third-Party Services](#6-integration--third-party-services)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Roadmap & Phasing](#8-roadmap--phasing)
9. [Success Metrics](#9-success-metrics)

---

## 1. Product Overview

### 1.1 What This Document Covers

This PRD covers **only** the Admin Panel and POS System for ER Coffeelab's 5 branches. It does **not** cover the customer-facing web or mobile apps (see the main PRD for those).

The system has two operational surfaces:

- **Admin Panel** — A web dashboard for headquarters and store managers to configure menus, manage branches, run promotions, view reports, and control all back-office operations.
- **POS Terminal** — A full-screen tablet/desktop interface that replaces Moka POS. Used by baristas and cashiers for walk-in order processing, shift management, cash reconciliation, inventory tracking, and kitchen display.

Both surfaces share the same backend, same database, and same product catalog. An order placed on the POS terminal appears in the same reporting pipeline as an order placed from the customer app.

### 1.2 Business Goals

- Replace Moka POS entirely with an in-house system integrated into the ER Coffeelab platform
- Unify online ordering (app) and in-store ordering (POS) into a single order pipeline
- Provide real-time inventory tracking with raw material recipes and low-stock alerts
- Enable shift-based cash reconciliation and employee attendance tracking
- Support multi-branch operations from a single centralized admin dashboard
- Deliver an offline-capable POS that can queue orders during connectivity loss

### 1.3 Branch Configuration

| Branch | Pickup | Delivery | Dine-In | POS Terminal |
| --- | --- | --- | --- | --- |
| ER Coffeelab CBD Jakarta | ✓ | ✓ | ✓ | ✓ |
| ER Coffeelab Grand Indonesia | ✓ | ✓ | ✗ | ✓ |
| ER Coffeelab Kemang | ✓ | ✓ | ✓ | ✓ |
| ER Coffeelab BSD | ✓ | ✓ | ✗ | ✓ |
| ER Coffeelab Bandung | ✓ | ✓ | ✓ | ✓ |

---

## 2. User Roles & Access Control

### 2.1 Admin Panel Roles

| Role | DB Value | Login Method | Scope |
| --- | --- | --- | --- |
| **Super Admin** | `admins.role = 'SUPERADMIN'` | Email + Password | All branches, all features |
| **Store Admin** | `admins.role = 'STORE_ADMIN'` | Email + Password | Assigned branches only (via `branch_admins`) |

### 2.2 POS Terminal Roles

| Role | DB Value | Login Method | Scope |
| --- | --- | --- | --- |
| **Manager** | `employees.role = 'MANAGER'` | 4–6 digit PIN | Full POS access incl. refunds, restricted discounts, shift close, stock adjust |
| **Shift Lead** | `employees.role = 'SHIFT_LEAD'` | 4–6 digit PIN | Open/close shifts, cash management, stock opname |
| **Cashier** | `employees.role = 'CASHIER'` | 4–6 digit PIN | Process orders, accept payments, basic discounts |
| **Barista** | `employees.role = 'BARISTA'` | 4–6 digit PIN | View kitchen display, update order status, clock in/out |

### 2.3 Full Access Matrix

| Menu | ID | Super Admin | Store Admin | Manager | Shift Lead | Cashier | Barista |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | ADM-001 | ✓ All | ✓ Own | — | — | — | — |
| Order Management | ADM-002 | ✓ All | ✓ Own | — | — | — | — |
| Products | ADM-003 | ✓ | — | — | — | — | — |
| Categories | ADM-004 | ✓ | — | — | — | — | — |
| Branch List | ADM-005 | ✓ | — | — | — | — | — |
| Stock Availability | ADM-006 | ✓ All | ✓ Own | — | — | — | — |
| Campaigns | ADM-007 | ✓ | — | — | — | — | — |
| Vouchers | ADM-008 | ✓ | — | — | — | — | — |
| Banners | ADM-009 | ✓ | — | — | — | — | — |
| Loyalty Program | ADM-010 | ✓ | — | — | — | — | — |
| Customer Management | ADM-011 | ✓ | — | — | — | — | — |
| Payment Config | ADM-012 | ✓ | — | — | — | — | — |
| Notifications | ADM-013 | ✓ | — | — | — | — | — |
| Content Management | ADM-014 | ✓ | — | — | — | — | — |
| Reports & Export | ADM-015 | ✓ All | ✓ Own | — | — | — | — |
| User & Role Mgmt | ADM-016 | ✓ | — | — | — | — | — |
| **POS Terminal** | **ADM-017** | ✓ | ✓ | **✓** | **✓** | **✓** | — |
| **Shift Management** | **ADM-018** | ✓ | ✓ | **✓** | **✓** | — | — |
| **Cash Management** | **ADM-019** | ✓ | ✓ | **✓** | **✓** | — | — |
| **Table Management** | **ADM-020** | ✓ | ✓ | **✓** | **✓** | **✓** | **✓** |
| **Kitchen Display** | **ADM-021** | ✓ | ✓ | **✓** | **✓** | **✓** | **✓** |
| **Inventory** | **ADM-022** | ✓ All | ✓ Own | **✓ Edit** | **✓ View** | **✓ View** | — |
| **Suppliers** | **ADM-023** | ✓ | — | — | — | — | — |
| **Purchase Orders** | **ADM-024** | ✓ All | ✓ Own | **✓ Create** | — | — | — |
| **Stock Opname** | **ADM-025** | ✓ | ✓ | **✓** | **✓** | — | — |
| **Employees** | **ADM-026** | ✓ | — | — | — | — | — |
| **Attendance** | **ADM-027** | ✓ All | ✓ Own | **✓ Self** | **✓ Self** | **✓ Self** | **✓ Self** |
| **Refund & Void** | **ADM-028** | ✓ | ✓ | **✓ Approve** | — | **✓ Request** | — |
| **Tax Config** | **ADM-029** | ✓ | — | — | — | — | — |
| **Discount Presets** | **ADM-030** | ✓ | — | — | — | — | — |

---

## 3. Admin Panel — Menu Specifications

### 3.1 Sidebar Navigation

```
📊  Dashboard                          ADM-001
📦  Order Management                   ADM-002
🍵  Menu Management
    ├── Products                        ADM-003
    └── Categories                      ADM-004
📍  Branch Management
    ├── Branch List                     ADM-005
    └── Stock Availability              ADM-006
🎫  Promo & Voucher
    ├── Campaigns                       ADM-007
    ├── Vouchers                        ADM-008
    └── Banners                         ADM-009
⭐  Loyalty Program                    ADM-010
👥  Customer Management                ADM-011
💳  Payment Configuration              ADM-012
🔔  Notifications                      ADM-013
📄  Content Management                 ADM-014
📈  Reports & Export                   ADM-015
👤  User & Role Management             ADM-016
```

### ADM-001: Dashboard & Analytics

| Field | Detail |
| --- | --- |
| **Route** | `/admin/dashboard` |
| **Access** | Super Admin: all branches · Store Admin: own branch |
| **Function** | KPI cards: total orders today, revenue today, orders this month, revenue this month. Trend charts (recharts): daily/weekly/monthly revenue, order volume, average order value. Top selling products by volume and revenue. Branch performance comparison across 5 branches (Super Admin only). Peak hours heatmap. Customer analytics: new vs returning, cohort retention. Order source breakdown: APP vs POS. Filters: date range, branch, category, order mode. |
| **Tables** | `orders`, `order_items`, `customers`, `branches`, `branch_admins` |
| **Components** | `KPICard`, `TrendChart`, `TopProductsTable`, `BranchComparison`, `PeakHoursHeatmap`, `DateRangeFilter`, `BranchFilter` |

### ADM-002: Order Management

| Field | Detail |
| --- | --- |
| **Route** | `/admin/orders` |
| **Access** | Super Admin: all branches · Store Admin: own branch |
| **Function** | Live order queue: real-time list with auto-refresh, filterable by status, branch, mode, source (APP/POS). Status pipeline with drag-and-drop (dndkit): New → Processing → Ready → Completed / Cancelled. Order detail drawer: items with full customization, mode, customer info, POS employee, table number, shift, special notes. Audio/visual alert for new orders. Print receipt / kitchen ticket. Delivery management: assign courier, track. Cancel order: requires reason, triggers auto refund. |
| **Tables** | `orders`, `order_items`, `order_item_options`, `order_status_logs`, `customers`, `branches`, `employees`, `payment_logs` |
| **Components** | `OrderQueue`, `OrderCard`, `OrderDetailDrawer`, `StatusPipeline`, `PrintReceipt`, `OrderFilters` |

### ADM-003: Products

| Field | Detail |
| --- | --- |
| **Route** | `/admin/menu/products` |
| **Access** | Super Admin only |
| **Function** | CRUD product list with search, filter by category/status/badge. Product form: name, description, photo upload (Vercel Blob), base price, cost price (COGS), category, SKU/barcode, sweetness/creaminess scale (1–5), temperature toggle (Iced/Hot/Both), points earned, POS-only toggle, active/inactive. Customization config per product: add/edit/remove customization groups (name, selection type SINGLE/MULTIPLE, max selections, required toggle, sort order) and their options (name, additional price, sort order). Badge assignment: Best Seller, New, Most Popular, Promo. Drag-and-drop sort order (dndkit). |
| **Tables** | `products`, `product_customization_groups`, `product_customization_options`, `categories` |
| **Components** | `ProductTable`, `ProductForm`, `CustomizationGroupEditor`, `CustomizationOptionEditor`, `ImageUploader`, `BadgeSelector`, `DragSortList` |

### ADM-004: Categories

| Field | Detail |
| --- | --- |
| **Route** | `/admin/menu/categories` |
| **Access** | Super Admin only |
| **Function** | CRUD category list: name, icon upload (Vercel Blob), sort order, active/inactive. Drag-and-drop reordering (dndkit). Product count per category displayed. |
| **Tables** | `categories` |
| **Components** | `CategoryTable`, `CategoryForm`, `DragSortList`, `IconUploader` |

### ADM-005: Branch List

| Field | Detail |
| --- | --- |
| **Route** | `/admin/branches` |
| **Access** | Super Admin only |
| **Function** | CRUD branches: name, address, GPS coordinates (map picker), operating hours, photo upload (Vercel Blob), phone. Feature toggles per branch: Pickup/Delivery/Dine-in on/off. Delivery radius slider (default 5 km). Temporary close toggle. Tax rate and service charge % per branch. Assign Store Admin(s) to each branch (multi-select from admins list). |
| **Tables** | `branches`, `branch_admins`, `admins` |
| **Components** | `BranchTable`, `BranchForm`, `MapPicker`, `FeatureToggles`, `AdminAssignment` |

### ADM-006: Stock Availability

| Field | Detail |
| --- | --- |
| **Route** | `/admin/branches/[branchId]/stock` |
| **Access** | Super Admin: all branches · Store Admin: own branch |
| **Function** | Branch selector at top (Super Admin sees all, Store Admin sees assigned). Product stock grid: all active products with AVAILABLE/SOLD_OUT toggle switch per branch. Option stock grid: customization options with AVAILABLE/SOLD_OUT toggle (e.g. Seasonal Cup, Oat Milk). Bulk update: select multiple items and set status. Changes take effect immediately on customer app and POS. |
| **Tables** | `branch_product_stock`, `branch_option_stock`, `products`, `product_customization_options` |
| **Components** | `BranchSelector`, `ProductStockGrid`, `OptionStockGrid`, `BulkToggle` |

### ADM-007: Campaigns

| Field | Detail |
| --- | --- |
| **Route** | `/admin/promos/campaigns` |
| **Access** | Super Admin only |
| **Function** | CRUD campaigns: name, description, image upload (Vercel Blob), start/end date, status (Active/Inactive/Ended). Each campaign groups multiple vouchers. Campaign performance dashboard: total redemptions, total discount given, revenue impact chart. |
| **Tables** | `campaigns`, `vouchers`, `voucher_redemptions` |
| **Components** | `CampaignTable`, `CampaignForm`, `CampaignPerformanceChart`, `ImageUploader` |

### ADM-008: Vouchers

| Field | Detail |
| --- | --- |
| **Route** | `/admin/promos/vouchers` |
| **Access** | Super Admin only |
| **Function** | CRUD vouchers: code (auto-generate or manual), discount type (PERCENTAGE / FIXED / FREE_ITEM / FREE_UPSIZE / FREE_DELIVERY / B1G1), discount value, max discount cap, min transaction, validity period (date pickers), usage quota, target audience (ALL / NEW_USER / SPECIFIC_TIER), target tier filter. Campaign assignment (optional). Automated voucher triggers: birthday, welcome new member, re-engagement. Per-voucher analytics: redemption count, rate, revenue impact. |
| **Tables** | `vouchers`, `campaigns`, `voucher_redemptions`, `loyalty_tiers` |
| **Components** | `VoucherTable`, `VoucherForm`, `VoucherAnalytics`, `CodeGenerator` |

### ADM-009: Banners

| Field | Detail |
| --- | --- |
| **Route** | `/admin/promos/banners` |
| **Access** | Super Admin only |
| **Function** | CRUD banners: title, image upload (Vercel Blob), link destination (URL or deep link), placement (HOME / MENU / CHECKOUT), display period (start/end date), active/inactive. Drag-and-drop reordering (dndkit). Mobile device preview frame. |
| **Tables** | `banners` |
| **Components** | `BannerTable`, `BannerForm`, `DragSortList`, `ImageUploader`, `DevicePreview` |

### ADM-010: Loyalty Program

| Field | Detail |
| --- | --- |
| **Route** | `/admin/loyalty` |
| **Access** | Super Admin only |
| **Function** | Tier config: edit thresholds (min_spend), point multiplier per tier, benefit descriptions for Silver/Gold/Platinum. Earning rules: points per IDR spent (base rate and per-product override). Redemption catalog management. Daily check-in config: set reward schedule per day (points or voucher). Manual point adjustment for complaints/special cases. Reports: total points issued, redeemed, expired. |
| **Tables** | `loyalty_tiers`, `loyalty_transactions`, `daily_checkins`, `customers`, `products` |
| **Components** | `TierConfigForm`, `EarningRulesForm`, `CheckInScheduleEditor`, `PointAdjustmentModal`, `LoyaltyReportChart` |

### ADM-011: Customer Management

| Field | Detail |
| --- | --- |
| **Route** | `/admin/customers` |
| **Access** | Super Admin only |
| **Function** | Customer database: searchable/filterable paginated table. Customer detail drawer: profile info, current tier, total points, lifetime spend, full order history, favorite products, voucher usage, addresses. Segmentation filters: by tier, order frequency, last order date, registration date. Export to CSV (xlsx library). |
| **Tables** | `customers`, `customer_addresses`, `orders`, `loyalty_transactions`, `voucher_redemptions`, `customer_favorites`, `loyalty_tiers`, `daily_checkins` |
| **Components** | `CustomerTable`, `CustomerDetailDrawer`, `SegmentationFilters`, `ExportButton`, `OrderHistoryTimeline` |

### ADM-012: Payment Configuration

| Field | Detail |
| --- | --- |
| **Route** | `/admin/payments` |
| **Access** | Super Admin only |
| **Function** | Payment method list: CRUD each channel — code, name, logo upload (Vercel Blob), type, provider, admin fee (flat + pct), active toggle, redirect flag, sort order. Drag-and-drop sort (dndkit). Payment instructions: CRUD per method — title, rich text HTML content, sort order. Payment log viewer: searchable audit trail filterable by invoice code, status, date range. |
| **Tables** | `payment_methods`, `payment_instructions`, `payment_logs` |
| **Components** | `PaymentMethodTable`, `PaymentMethodForm`, `InstructionEditor`, `PaymentLogViewer`, `DragSortList` |

### ADM-013: Notifications

| Field | Detail |
| --- | --- |
| **Route** | `/admin/notifications` |
| **Access** | Super Admin only |
| **Function** | Push notification composer (for Mobile App): title, body, image, deep link destination. Target audience: all users, specific tier, specific segment, specific branch. Schedule: send now or schedule for later. A/B testing: create message variants. Template management: CRUD notification templates for automated events (order status, payment, birthday, abandoned cart, re-engagement). Delivery reports: sent, delivered, opened, conversion. |
| **Tables** | `notification_templates`, `notification_logs`, `customers`, `loyalty_tiers`, `branches` |
| **Components** | `NotificationComposer`, `AudienceSelector`, `TemplateTable`, `TemplateForm`, `DeliveryReportChart` |

### ADM-014: Content Management

| Field | Detail |
| --- | --- |
| **Route** | `/admin/content` |
| **Access** | Super Admin only |
| **Function** | Static pages editor: CRUD for About Us, FAQ, Terms & Conditions, Privacy Policy using rich text editor. Merchandise catalog: CRUD — name, description, photo upload (Vercel Blob), price, personalizable flag, badge, active/inactive/sold-out. |
| **Tables** | `static_pages`, `merchandise` |
| **Components** | `StaticPageEditor`, `MerchandiseTable`, `MerchandiseForm`, `RichTextEditor`, `ImageUploader` |

### ADM-015: Reports & Export

| Field | Detail |
| --- | --- |
| **Route** | `/admin/reports` |
| **Access** | Super Admin: all branches · Store Admin: own branch |
| **Function** | Report tabs: Sales, Products, Payments, Promos, Customers, POS Shifts, Inventory. Sales report: daily/weekly/monthly by branch, category, product (recharts). Product performance: best/worst sellers, margin analysis using cost_price. Payment method breakdown: revenue share per type (pie chart). Promo performance: redemption rate and revenue impact per campaign/voucher. Customer acquisition & retention: signups, 30-day retention, cohort analysis. POS shift summary: per-shift sales, cash variance, average order value. Inventory consumption: ingredient usage trends, waste tracking. Export all reports: PDF (pdf library) and Excel (xlsx library). |
| **Tables** | `orders`, `order_items`, `products`, `payment_methods`, `payment_logs`, `vouchers`, `voucher_redemptions`, `customers`, `branches`, `shifts`, `ingredients`, `stock_movements` |
| **Components** | `ReportTabs`, `SalesChart`, `ProductPerformanceTable`, `PaymentPieChart`, `PromoPerformanceChart`, `CohortGrid`, `ShiftSummaryTable`, `InventoryConsumptionChart`, `ExportPDFButton`, `ExportExcelButton` |

### ADM-016: User & Role Management

| Field | Detail |
| --- | --- |
| **Route** | `/admin/users` |
| **Access** | Super Admin only |
| **Function** | Admin user list: CRUD — name, email, password (hashed), role (SUPERADMIN / STORE_ADMIN), status (ACTIVE / INACTIVE). Branch assignment: assign Store Admins to one or more branches (checkboxes). Activity log: audit trail of all admin actions across the system (paginated, searchable). |
| **Tables** | `admins`, `branch_admins` |
| **Components** | `AdminTable`, `AdminForm`, `BranchAssignmentCheckboxes`, `ActivityLogTable` |

---

## 4. POS System — Menu Specifications

### 4.1 POS Navigation

The POS Terminal is a dedicated full-screen interface (no admin sidebar). It has its own navigation:

```
🔑  PIN Login Screen
📋  Order Screen (main)           ADM-017
⏱️  Shift Panel (slide-out)       ADM-018
💵  Cash Drawer (in shift panel)  ADM-019
🪑  Table Map (tab/overlay)       ADM-020
🍳  Kitchen Display (full-screen) ADM-021
📦  Inventory (slide-out)         ADM-022
📝  Purchase Orders               ADM-024
📊  Stock Opname                   ADM-025
⏰  Clock In/Out                   ADM-027
↩️  Refund (modal)                 ADM-028
```

### ADM-017: POS Terminal (Order Screen)

| Field | Detail |
| --- | --- |
| **Route** | `/pos` |
| **Access** | Manager, Shift Lead, Cashier (PIN login) |
| **Layout** | Split-screen: **Left 60%** = product grid, **Right 40%** = cart/checkout |
| **Left Panel — Product Grid** | Category tabs (horizontal scroll, same as customer app). Product cards in grid: image, name, price. Tap = open customization modal (same options as customer app, rendered from `product_customization_groups` + `product_customization_options`). Sold-out items greyed (from `branch_product_stock`). Search bar at top. Barcode/SKU scan input. |
| **Right Panel — Cart** | Running list of added items with qty control (±). Each item expandable to show customization. Item-level notes field. Item-level discount (from `discounts` presets, ITEM type). Remove item (swipe or X). Subtotal running total. Order-level discount button (ORDER type presets; some require Manager PIN). Tax display (auto-calculated from `tax_configs`). Service charge display (from `branches.service_charge_pct`). Grand total. Customer lookup: phone input → auto-fill name, tier, points. Link order to customer for loyalty points. Table assignment button (dine-in: opens table map overlay). |
| **Checkout Flow** | "Charge" button → Payment modal. Payment options: Cash (with amount tendered + change calculator), QRIS (display QR on customer screen), EDC/Card (manual input), E-wallet (redirect). Split payment: add multiple payment methods to cover total. On payment complete: auto-print receipt (thermal printer API), create `orders` record with `is_pos=true`, `order_source='POS'`, link `shift_id` and `employee_id`. If customer linked: create `loyalty_transactions` EARN entry. Clear cart. |
| **Offline Mode** | If internet drops: orders queue in localStorage. Visual indicator "Offline — X orders queued". On reconnect: auto-sync queued orders to server in sequence. |
| **Tables** | `orders`, `order_items`, `order_item_options`, `products`, `product_customization_groups`, `product_customization_options`, `branch_product_stock`, `branch_option_stock`, `customers`, `discounts`, `payment_methods`, `payment_logs`, `shifts`, `employees`, `store_tables`, `loyalty_transactions`, `tax_configs` |
| **Components** | `POSLayout`, `ProductGrid`, `ProductCard`, `CustomizationModal`, `POSCart`, `CartItem`, `DiscountSelector`, `PINPrompt`, `PaymentModal`, `CashCalculator`, `SplitPayment`, `CustomerLookup`, `TableSelector`, `ReceiptPrinter`, `OfflineIndicator`, `BarcodeScanner` |

### ADM-018: Shift Management

| Field | Detail |
| --- | --- |
| **Route** | `/pos/shifts` |
| **Access** | Manager, Shift Lead |
| **Function** | **Open Shift:** Employee enters opening cash amount → system creates shift record → POS terminal unlocked for orders. Only one shift can be open per branch at a time. **During Shift:** Slide-out panel shows running totals: total sales, total orders, cash payments, non-cash payments, expected cash in drawer. **Close Shift:** Employee counts physical cash in drawer → enters actual amount → system calculates difference (surplus/shortage) → employee adds notes → shift closes. All POS order functions disabled until a new shift is opened. **Shift History:** List of past shifts with: employee name, open/close time, total sales, total orders, cash difference, refund total. Printable end-of-shift report (PDF). |
| **Tables** | `shifts`, `orders` (aggregation per shift), `cash_movements`, `employees`, `refunds` (per shift total) |
| **Components** | `ShiftPanel`, `OpenShiftForm`, `CloseShiftForm`, `ShiftRunningTotals`, `ShiftHistoryTable`, `ShiftReportPDF` |

### ADM-019: Cash Management

| Field | Detail |
| --- | --- |
| **Route** | `/pos/cash` (within shift panel) |
| **Access** | Manager, Shift Lead |
| **Function** | **Cash In:** Record incoming cash with reason (petty cash top-up, change from bank, tip pool). **Cash Out:** Record outgoing cash with reason (bank deposit, emergency supply, tips payout). All movements automatically linked to active shift and logged employee. Movement history for current shift with running cash balance. Affects expected cash calculation at shift close. |
| **Tables** | `cash_movements`, `shifts`, `employees` |
| **Components** | `CashMovementForm`, `CashMovementHistory`, `RunningBalance` |

### ADM-020: Table Management

| Field | Detail |
| --- | --- |
| **Route** | `/pos/tables` (overlay on POS), `/admin/branches/[id]/tables` (admin) |
| **Access** | All POS employees (view/use), Super Admin (CRUD config) |
| **Function** | **POS View — Floor Plan:** Visual grid/canvas of tables with drag-and-drop positioning (dndkit). Each table shows: number, capacity, status color (green=available, red=occupied, yellow=reserved, grey=inactive). Tap occupied table → see current order, duration timer, total bill. **Quick Actions:** Seat guest (auto-creates order linked to table), Move to different table, Merge tables (combine bills), Clear table (mark available after payment), Reserve table. **Section tabs:** Indoor / Outdoor / Smoking / VIP. **Admin Config:** CRUD tables: number, section, capacity, position. Bulk add tables. |
| **Tables** | `store_tables`, `orders`, `branches` |
| **Components** | `TableFloorPlan`, `TableCard`, `TableDetailPopover`, `SectionTabs`, `TableConfigForm`, `DragPositionCanvas` |

### ADM-021: Kitchen Display System (KDS)

| Field | Detail |
| --- | --- |
| **Route** | `/pos/kitchen` |
| **Access** | All POS employees (primarily Barista) |
| **Function** | **Full-screen ticket board** replacing paper kitchen tickets. Three columns: **New** → **In Progress** → **Ready**. Each order displays as a card: order number (or receipt #), items with customization detail, order mode badge (POS/Pickup/Delivery/Dine-in), table number (dine-in), timestamp, elapsed time with color coding (green <3min, yellow 3–7min, red >7min). **Bump action:** tap item or entire order → moves to next column. When all items bumped → order moves to Ready. **Audio alert** (configurable tone) for new orders. **Source filter:** show all, POS only, App only. Works for POS walk-in orders AND customer app orders simultaneously. Auto-refresh via polling or WebSocket. |
| **Tables** | `orders`, `order_items`, `order_item_options`, `order_status_logs` |
| **Components** | `KDSLayout`, `KDSColumn`, `KDSTicketCard`, `BumpButton`, `ElapsedTimer`, `AudioAlert`, `SourceFilter` |

### ADM-022: Inventory & Raw Materials

| Field | Detail |
| --- | --- |
| **Route** | `/admin/inventory` |
| **Access** | Super Admin: all branches · Store Admin: own · POS Manager: own (edit) · Others: view only |
| **Function** | **Ingredient master list:** CRUD raw materials — name, SKU, unit (g/ml/pcs/kg/l), cost per unit, low-stock threshold, category (Coffee Bean/Dairy/Syrup/Topping/Cup/Food Supply/Other), active/inactive. **Recipe management:** Per product, define bill of materials — list of ingredients with quantity per serving. Enables COGS calculation and auto-deduction. **Stock levels:** Per-branch grid showing current stock, unit, low-stock status (red highlight when below min_stock_alert). **Stock adjustment:** Manual increase/decrease with reason dropdown (Waste/Spillage/Correction/Transfer) and notes. Creates `stock_movements` record. **Movement history:** Full log of all stock in/out per ingredient per branch, filterable by type, date. **Auto-deduction (optional toggle):** When order is completed, auto-calculate ingredient usage from recipes and deduct from `ingredient_stock`. **Low-stock alert:** Push notification to Store Admin when ingredient hits threshold. |
| **Tables** | `ingredients`, `product_recipes`, `ingredient_stock`, `stock_movements`, `products` |
| **Components** | `IngredientTable`, `IngredientForm`, `RecipeEditor`, `StockLevelGrid`, `StockAdjustmentModal`, `MovementHistoryTable`, `LowStockAlertBadge` |

### ADM-023: Supplier Management

| Field | Detail |
| --- | --- |
| **Route** | `/admin/suppliers` |
| **Access** | Super Admin only |
| **Function** | CRUD suppliers: name, contact person, phone, email, address, notes, active/inactive. Supplier performance summary: total POs, total spend, average delivery time. Link to filtered purchase order list. |
| **Tables** | `suppliers`, `purchase_orders` |
| **Components** | `SupplierTable`, `SupplierForm`, `SupplierPerformanceSummary` |

### ADM-024: Purchase Orders

| Field | Detail |
| --- | --- |
| **Route** | `/admin/purchase-orders` |
| **Access** | Super Admin: all · Store Admin: own · POS Manager: create only |
| **Function** | **Create PO:** Select supplier → add ingredient line items (searchable ingredient dropdown, quantity, unit, unit price) → auto-calculate line subtotals and grand total → save as Draft. **Approval workflow:** Draft → Submitted (by creator) → Approved (by Super Admin) → Received (by Store Admin/Manager at branch). **Receive PO:** Compare ordered vs received quantities per item. Partial receive supported. On receive: auto-creates `stock_movements` (PURCHASE_IN) and updates `ingredient_stock`. **PO history:** Filterable by branch, supplier, status, date range. **Print PO** as PDF for supplier. |
| **Tables** | `purchase_orders`, `purchase_order_items`, `suppliers`, `ingredients`, `ingredient_stock`, `stock_movements`, `employees`, `admins` |
| **Components** | `POTable`, `POForm`, `POLineItemEditor`, `POApprovalFlow`, `POReceiveForm`, `POPrintPDF` |

### ADM-025: Stock Opname (Stock Count)

| Field | Detail |
| --- | --- |
| **Route** | `/admin/stock-opname` |
| **Access** | Super Admin · Store Admin · POS Shift Lead+ |
| **Function** | **Start count:** Select branch → system snapshots current `ingredient_stock` for all active ingredients. Creates `stock_opnames` record. **Count entry:** Employee enters actual physical count for each ingredient (scrollable list with system stock shown for reference, editable "actual" field). **Difference report:** System calculates variance (actual − system) per item. Highlights discrepancies with color coding (green = match, yellow = minor, red = major). **Complete opname:** On submit: adjusts `ingredient_stock` to match actual counts, creates ADJUSTMENT `stock_movements` for each discrepancy. **History:** Past opnames list with date, employee, total items counted, total variance summary. |
| **Tables** | `stock_opnames`, `stock_opname_items`, `ingredient_stock`, `stock_movements`, `ingredients`, `employees` |
| **Components** | `StockOpnameTable`, `StartOpnameButton`, `OpnameCountForm`, `VarianceReport`, `OpnameHistoryTable` |

### ADM-026: Employee Management

| Field | Detail |
| --- | --- |
| **Route** | `/admin/employees` |
| **Access** | Super Admin only |
| **Function** | CRUD employees: name, phone, email, branch assignment (dropdown), role (Barista/Cashier/Shift Lead/Manager), PIN setup (masked input, hashed on save), hourly rate (IDR), avatar upload (Vercel Blob), active/inactive. Performance dashboard per employee: total orders processed, average processing time, attendance percentage, total hours worked. |
| **Tables** | `employees`, `branches`, `orders`, `employee_attendances` |
| **Components** | `EmployeeTable`, `EmployeeForm`, `PINSetup`, `EmployeePerformanceCard`, `ImageUploader` |

### ADM-027: Employee Attendance

| Field | Detail |
| --- | --- |
| **Route** | `/pos/attendance` (POS), `/admin/attendance` (admin) |
| **Access** | POS Employee: self clock · Store Admin: own branch · Super Admin: all |
| **Function** | **POS Clock In/Out:** Employee enters PIN → system records clock_in or clock_out with timestamp. Visual status: "Clocked In since HH:MM" or "Not Clocked In". **Admin View:** Attendance log table: employee name, branch, date, clock in time, clock out time, total hours. Filterable by branch, employee, date range. **Labor Cost Report:** Total hours × hourly rate per employee per period. Summary: total labor cost per branch per week/month. **Export CSV** for payroll integration (xlsx library). |
| **Tables** | `employee_attendances`, `employees`, `branches` |
| **Components** | `ClockInOutButton`, `AttendanceLogTable`, `LaborCostReport`, `AttendanceFilters`, `ExportCSVButton` |

### ADM-028: Refund & Void Management

| Field | Detail |
| --- | --- |
| **Route** | `/pos/refund` (POS modal), `/admin/refunds` (admin) |
| **Access** | POS Cashier+: request · POS Manager: approve · Store Admin / Super Admin: approve |
| **Function** | **Request Refund (POS):** Search order by invoice code or receipt number → select Full / Partial / Void → for Partial: check specific items to refund → enter reason (dropdown + free text) → select refund method (Cash / Original Payment Method / Store Credit). **Void:** Only for orders not yet paid or just paid within configurable window (e.g. 5 minutes). No approval required. **Approval Flow:** Cashier submits refund request → Manager/Admin approves or rejects with notes. **Auto-actions on approval:** Update order status to REFUNDED, trigger payment gateway refund API (if non-cash), adjust shift expected_cash (if cash refund), create refund `stock_movements` to return ingredients (optional). **Refund Log (Admin):** Full history with status tracking, filterable by branch, date, status, type. |
| **Tables** | `refunds`, `orders`, `order_items`, `shifts`, `payment_logs`, `employees`, `admins` |
| **Components** | `RefundModal`, `OrderSearchInput`, `RefundTypeSelector`, `ItemSelector`, `ReasonSelector`, `ApprovalQueue`, `RefundLogTable` |

### ADM-029: Tax & Service Charge Configuration

| Field | Detail |
| --- | --- |
| **Route** | `/admin/tax-config` |
| **Access** | Super Admin only |
| **Function** | Per-branch tax config: CRUD tax entries — name (PB1/PPn), rate (%), inclusive/exclusive toggle, active toggle. Multiple taxes per branch supported (stacked). Service charge: percentage on `branches.service_charge_pct`. Sample receipt preview showing price breakdown with all taxes and service charge applied. Applied automatically to all POS and app orders for that branch. |
| **Tables** | `tax_configs`, `branches` |
| **Components** | `TaxConfigTable`, `TaxConfigForm`, `BranchSelector`, `ReceiptPreview` |

### ADM-030: Discount Presets

| Field | Detail |
| --- | --- |
| **Route** | `/admin/discounts` |
| **Access** | Super Admin only |
| **Function** | CRUD discount presets: name, type (Percentage / Fixed), value, max discount cap, apply-to scope (ORDER / ITEM), requires Manager PIN toggle, active/inactive. These presets appear on the POS terminal for quick discount application by cashiers. Usage report: frequency per discount, total discount value given, affected revenue. |
| **Tables** | `discounts`, `orders` |
| **Components** | `DiscountTable`, `DiscountForm`, `DiscountUsageReport` |

---

## 5. Order Processing Flow

### 5.1 POS Walk-In Order

```
Employee PIN Login
    → Verify shift is OPEN (if not → must open shift first)
    → Product grid loads (filtered by branch stock)
    → Tap products → customize → add to cart
    → (Optional) Scan customer phone → link loyalty
    → (Optional) Apply discount preset
    → (Optional) Assign table (dine-in)
    → Tap "Charge" → select payment method
    → Payment processed → receipt auto-prints
    → Order created: is_pos=true, order_source='POS', shift_id linked
    → Order appears on KDS
    → Barista bumps items → status: READY
    → Customer picks up / served to table
    → Status: COMPLETED → points credited (if customer linked)
```

### 5.2 App Order (Pickup/Delivery/Dine-In)

```
Customer places order via Web/Mobile App
    → Payment processed via payment gateway
    → Order created: is_pos=false, order_source='APP'
    → Order appears on Admin Panel Order Queue AND KDS
    → Barista bumps items → status: READY
    → Push notification to customer: "Order ready"
    → Pickup: customer collects / Delivery: courier dispatched / Dine-in: served to table
    → Status: COMPLETED → points credited
```

### 5.3 Both flows converge into the same `orders` table, same KDS display, same shift sales totals, same reports.

---

## 6. Integration & Third-Party Services

| Service | Provider | Function | Used By |
| --- | --- | --- | --- |
| Payment Gateway | Midtrans / Xendit | Process digital payments | POS + App |
| Delivery | GoSend / GrabExpress | Delivery within 5 km | App |
| Push Notification | FCM / OneSignal | Mobile push notifications | Admin Panel |
| SMS OTP | Twilio / Fazpass | Phone verification | App |
| Maps | Google Maps API | Store finder, branch coordinates | Admin + App |
| Cloud | Vercel | Hosting, serverless functions | All |
| Database | Neon PostgreSQL | Serverless Postgres | All |
| Storage | Vercel Blob | Image/file uploads | Admin + POS |
| Analytics | Mixpanel / Amplitude | User behavior tracking | All |
| Thermal Printer | ESC/POS compatible | Receipt printing | POS |

---

## 7. Non-Functional Requirements

### 7.1 Performance

- Admin panel page load: < 2 seconds
- POS terminal order creation: < 500ms (localStorage-first, sync async)
- KDS ticket refresh: < 1 second (polling interval or WebSocket)
- API response time: < 500ms (95th percentile)
- Concurrent POS terminals: support 5 per branch (25 total)
- 99.9% uptime SLA

### 7.2 Offline Capability (POS)

- POS must function without internet for core order flow
- Orders queue in localStorage with sequential IDs
- Sync on reconnect: POST queued orders in order, handle conflicts
- Product catalog cached in localStorage on shift open
- Visual offline indicator with queued order count
- No offline support needed for: reports, inventory management, shift close

### 7.3 Security

- HTTPS/SSL everywhere
- Admin: JWT + refresh token (httpOnly cookies)
- POS: PIN hash (bcrypt) + session token
- PCI-DSS for payment data
- Role-based route guards on both client and API
- Rate limiting on PIN attempts (5 max, 15-min lockout)

### 7.4 Printing

- ESC/POS protocol for thermal receipt printers
- Print triggers: order completion, shift close report, PO
- Receipt template: branch name, receipt #, date/time, items with customization, subtotal, tax, service charge, discount, total, payment method, cashier name, loyalty points earned
- Kitchen ticket template: order #, items with customization, mode badge, table #, timestamp

---

## 8. Roadmap & Phasing

| Phase | Timeline | Scope | Menus Delivered |
| --- | --- | --- | --- |
| **Phase 1** | Month 3–6 | Admin Core + POS MVP | ADM-001 to 006, 012, 015, 016, 017, 018, 019, 021 |
| **Phase 2** | Month 7–9 | POS Inventory + Adv Admin | ADM-007 to 011, 013, 014, 020, 022 to 028 |
| **Phase 3** | Month 10–12 | POS Advanced + Optimization | ADM-029, 030, offline mode, auto-deduction, advanced reporting |

---

## 9. Success Metrics

| Metric | Target (6 Months) | Target (12 Months) |
| --- | --- | --- |
| POS adoption (% of in-store orders via POS) | 90% | 100% |
| Average POS order time (tap to receipt) | < 45 seconds | < 30 seconds |
| Shift cash variance (avg absolute) | < IDR 20,000 | < IDR 10,000 |
| Inventory accuracy (stock opname match) | 90% | 95% |
| POS uptime (incl. offline mode) | 99.5% | 99.9% |
| KDS bump time (order to ready) | < 7 minutes | < 5 minutes |

---

*— End of Document —*
