import { pgTable, bigserial, varchar, text, numeric, boolean, integer, timestamp, bigint, date, index, uniqueIndex } from 'drizzle-orm/pg-core';

// 2.1 Auth & Users
export const admins = pgTable('admins', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('SUPERADMIN'),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  roleStatusIdx: index('idx_admins_role_status').on(table.role, table.status),
}));

export const branches = pgTable('branches', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  address: text('address').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  imageUrl: varchar('image_url', { length: 500 }),
  operatingHours: varchar('operating_hours', { length: 255 }),
  status: varchar('status', { length: 20 }).default('OPEN'),
  pickupEnabled: boolean('pickup_enabled').default(true),
  deliveryEnabled: boolean('delivery_enabled').default(true),
  dineinEnabled: boolean('dinein_enabled').default(false),
  deliveryRadiusKm: numeric('delivery_radius_km', { precision: 5, scale: 2 }).default('5.00'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0.00'),
  serviceChargePct: numeric('service_charge_pct', { precision: 5, scale: 2 }).default('0.00'),
  sortOrder: integer('sort_order').default(0),
  posKey: varchar('pos_key', { length: 50 }).unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const branchAdmins = pgTable('branch_admins', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  branchId: bigint('branch_id', { mode: 'number' }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  adminId: bigint('admin_id', { mode: 'number' }).notNull().references(() => admins.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  unq: uniqueIndex('unq_branch_admins').on(table.branchId, table.adminId),
  adminIdx: index('idx_branch_admins_admin').on(table.adminId),
  branchIdx: index('idx_branch_admins_branch').on(table.branchId),
}));

export const loyaltyTiers = pgTable('loyalty_tiers', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  minSpend: bigint('min_spend', { mode: 'number' }).notNull(),
  pointMultiplier: numeric('point_multiplier', { precision: 3, scale: 1 }).default('1.0'),
  benefits: text('benefits'),
  sortOrder: integer('sort_order').default(0),
});

export const customers = pgTable('customers', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  authProvider: varchar('auth_provider', { length: 20 }).default('PHONE'),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  loyaltyTierId: bigint('loyalty_tier_id', { mode: 'number' }).references(() => loyaltyTiers.id, { onDelete: 'set null' }),
  totalPoints: bigint('total_points', { mode: 'number' }).default(0),
  lifetimeSpend: bigint('lifetime_spend', { mode: 'number' }).default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  emailIdx: index('idx_customers_email').on(table.email),
  tierIdx: index('idx_customers_tier').on(table.loyaltyTierId),
}));

export const customerAddresses = pgTable('customer_addresses', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  customerId: bigint('customer_id', { mode: 'number' }).notNull().references(() => customers.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 50 }).notNull(),
  address: text('address').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  notes: varchar('notes', { length: 255 }),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  custIdx: index('idx_customer_addresses_customer').on(table.customerId),
}));

// 2.2 Employees & Shifts
export const employees = pgTable('employees', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  branchId: bigint('branch_id', { mode: 'number' }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 150 }),
  pinHash: varchar('pin_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('BARISTA'),
  hourlyRate: bigint('hourly_rate', { mode: 'number' }).default(0),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  branchIdx: index('idx_employees_branch').on(table.branchId, table.status),
}));

export const shifts = pgTable('shifts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  branchId: bigint('branch_id', { mode: 'number' }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  employeeId: bigint('employee_id', { mode: 'number' }).notNull().references(() => employees.id, { onDelete: 'restrict' }),
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  openingCash: bigint('opening_cash', { mode: 'number' }).notNull().default(0),
  expectedCash: bigint('expected_cash', { mode: 'number' }).default(0),
  actualCash: bigint('actual_cash', { mode: 'number' }),
  cashDifference: bigint('cash_difference', { mode: 'number' }),
  totalSales: bigint('total_sales', { mode: 'number' }).default(0),
  totalOrders: integer('total_orders').default(0),
  totalRefunds: bigint('total_refunds', { mode: 'number' }).default(0),
  notes: text('notes'),
  status: varchar('status', { length: 20 }).default('OPEN'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  branchStatusIdx: index('idx_shifts_branch_status').on(table.branchId, table.status),
  branchOpenedIdx: index('idx_shifts_branch_opened').on(table.branchId, table.openedAt),
}));

export const cashMovements = pgTable('cash_movements', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  shiftId: bigint('shift_id', { mode: 'number' }).notNull().references(() => shifts.id, { onDelete: 'cascade' }),
  employeeId: bigint('employee_id', { mode: 'number' }).notNull().references(() => employees.id, { onDelete: 'restrict' }),
  type: varchar('type', { length: 20 }).notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  reason: varchar('reason', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  shiftIdx: index('idx_cash_movements_shift').on(table.shiftId),
}));

export const employeeAttendances = pgTable('employee_attendances', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  employeeId: bigint('employee_id', { mode: 'number' }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  branchId: bigint('branch_id', { mode: 'number' }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  clockIn: timestamp('clock_in', { withTimezone: true }).notNull(),
  clockOut: timestamp('clock_out', { withTimezone: true }),
  totalHours: numeric('total_hours', { precision: 5, scale: 2 }),
  notes: varchar('notes', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  empClockIdx: index('idx_employee_attendances_emp').on(table.employeeId, table.clockIn),
  branchClockIdx: index('idx_employee_attendances_branch').on(table.branchId, table.clockIn),
}));

// 2.3 Menu & Catalog
export const categories = pgTable('categories', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  iconUrl: varchar('icon_url', { length: 500 }),
  sortOrder: integer('sort_order').default(0),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
});

export const products = pgTable('products', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  categoryId: bigint('category_id', { mode: 'number' }).notNull().references(() => categories.id, { onDelete: 'restrict' }),
  branchId: bigint('branch_id', { mode: 'number' }).references(() => branches.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  sku: varchar('sku', { length: 50 }),
  basePrice: bigint('base_price', { mode: 'number' }).notNull(),
  costPrice: bigint('cost_price', { mode: 'number' }).default(0),
  sweetnessLevel: integer('sweetness_level').default(0),
  creaminessLevel: integer('creaminess_level').default(0),
  badge: varchar('badge', { length: 30 }),
  tempOptions: varchar('temp_options', { length: 20 }).default('BOTH'),
  pointsEarned: integer('points_earned').default(0),
  isPosOnly: boolean('is_pos_only').default(false),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  catIdx: index('idx_products_category').on(table.categoryId),
  skuIdx: index('idx_products_sku').on(table.sku),
  statusSortIdx: index('idx_products_status_sort').on(table.status, table.sortOrder),
  badgeIdx: index('idx_products_badge').on(table.badge),
}));

export const productCustomizationGroups = pgTable('product_customization_groups', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  productId: bigint('product_id', { mode: 'number' }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  selectionType: varchar('selection_type', { length: 20 }).default('SINGLE'),
  maxSelections: integer('max_selections').default(1),
  isRequired: boolean('is_required').default(true),
  sortOrder: integer('sort_order').default(0),
}, (table) => ({
  prodIdx: index('idx_pcg_product').on(table.productId),
}));

export const productCustomizationOptions = pgTable('product_customization_options', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  groupId: bigint('group_id', { mode: 'number' }).notNull().references(() => productCustomizationGroups.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  additionalPrice: bigint('additional_price', { mode: 'number' }).default(0),
  status: varchar('status', { length: 20 }).default('AVAILABLE'),
  sortOrder: integer('sort_order').default(0),
}, (table) => ({
  groupIdx: index('idx_pco_group').on(table.groupId),
}));

// 2.4 Branch Stock & Table
export const branchProductStock = pgTable('branch_product_stock', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  branchId: bigint('branch_id', { mode: 'number' }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  productId: bigint('product_id', { mode: 'number' }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  stockStatus: varchar('stock_status', { length: 20 }).default('AVAILABLE'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  unq: uniqueIndex('unq_bps').on(table.branchId, table.productId),
  branchStockIdx: index('idx_branch_product_stock_branch').on(table.branchId, table.stockStatus),
}));

export const branchOptionStock = pgTable('branch_option_stock', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  branchId: bigint('branch_id', { mode: 'number' }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  optionId: bigint('option_id', { mode: 'number' }).notNull().references(() => productCustomizationOptions.id, { onDelete: 'cascade' }),
  stockStatus: varchar('stock_status', { length: 20 }).default('AVAILABLE'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  unq: uniqueIndex('unq_bos').on(table.branchId, table.optionId),
  branchOptionIdx: index('idx_branch_option_stock_branch').on(table.branchId, table.stockStatus),
}));

export const storeTables = pgTable('store_tables', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  branchId: bigint('branch_id', { mode: 'number' }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  tableNumber: varchar('table_number', { length: 20 }).notNull(),
  section: varchar('section', { length: 50 }),
  capacity: integer('capacity').default(4),
  posX: integer('pos_x').default(0),
  posY: integer('pos_y').default(0),
  status: varchar('status', { length: 20 }).default('AVAILABLE'),
  currentOrderId: bigint('current_order_id', { mode: 'number' }),
  currentSessionId: bigint('current_session_id', { mode: 'number' }),
  occupiedSince: timestamp('occupied_since', { withTimezone: true }),
  sortOrder: integer('sort_order').default(0),
}, (table) => ({
  unq: uniqueIndex('unq_st').on(table.branchId, table.tableNumber),
  statusIdx: index('idx_store_tables_branch_status').on(table.branchId, table.status),
}));

export const tableSessions = pgTable('table_sessions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  branchId: bigint('branch_id', { mode: 'number' }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  tableId: bigint('table_id', { mode: 'number' }).notNull().references(() => storeTables.id, { onDelete: 'cascade' }),
  sessionDate: date('session_date').notNull().defaultNow(),
  guestCount: integer('guest_count').default(1),
  openedBy: bigint('opened_by', { mode: 'number' }),
  closedBy: bigint('closed_by', { mode: 'number' }),
  status: varchar('status', { length: 20 }).default('OPEN'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  subtotal: bigint('subtotal', { mode: 'number' }).default(0),
  taxAmount: bigint('tax_amount', { mode: 'number' }).default(0),
  totalAmount: bigint('total_amount', { mode: 'number' }).default(0),
  notes: text('notes'),
  openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  branchIdx: index('idx_table_sessions_branch').on(table.branchId, table.status),
  tableIdx: index('idx_table_sessions_table').on(table.tableId, table.status),
}));

// 2.5 Inventory & Procurement
export const ingredients = pgTable('ingredients', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  sku: varchar('sku', { length: 50 }),
  unit: varchar('unit', { length: 20 }).notNull(),
  costPerUnit: bigint('cost_per_unit', { mode: 'number' }).default(0),
  minStockAlert: numeric('min_stock_alert', { precision: 10, scale: 2 }).default('0'),
  category: varchar('category', { length: 50 }),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const productRecipes = pgTable('product_recipes', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  productId: bigint('product_id', { mode: 'number' }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  ingredientId: bigint('ingredient_id', { mode: 'number' }).notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  quantityUsed: numeric('quantity_used', { precision: 10, scale: 3 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
}, (table) => ({
  unq: uniqueIndex('unq_pr').on(table.productId, table.ingredientId),
  prodIdx: index('idx_product_recipes_product').on(table.productId),
  ingIdx: index('idx_product_recipes_ingredient').on(table.ingredientId),
}));

export const ingredientStock = pgTable('ingredient_stock', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  branchId: bigint('branch_id', { mode: 'number' }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  ingredientId: bigint('ingredient_id', { mode: 'number' }).notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  currentStock: numeric('current_stock', { precision: 10, scale: 3 }).notNull().default('0'),
  unit: varchar('unit', { length: 20 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  unq: uniqueIndex('unq_is').on(table.branchId, table.ingredientId),
  branchIdx: index('idx_ingredient_stock_branch').on(table.branchId),
  ingIdx: index('idx_ingredient_stock_ingredient').on(table.ingredientId),
  lowIdx: index('idx_ingredient_stock_low').on(table.branchId, table.currentStock),
}));

export const stockMovements = pgTable('stock_movements', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  branchId: bigint('branch_id', { mode: 'number' }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  ingredientId: bigint('ingredient_id', { mode: 'number' }).notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 30 }).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 3 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  stockBefore: numeric('stock_before', { precision: 10, scale: 3 }),
  stockAfter: numeric('stock_after', { precision: 10, scale: 3 }),
  referenceType: varchar('reference_type', { length: 30 }),
  referenceId: bigint('reference_id', { mode: 'number' }),
  notes: varchar('notes', { length: 255 }),
  employeeId: bigint('employee_id', { mode: 'number' }).references(() => employees.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  branchIngIdx: index('idx_stock_movements_branch_ing').on(table.branchId, table.ingredientId, table.createdAt),
  typeIdx: index('idx_stock_movements_type').on(table.type, table.createdAt),
}));

export const suppliers = pgTable('suppliers', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  contactPerson: varchar('contact_person', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 150 }),
  address: text('address'),
  notes: text('notes'),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const purchaseOrders = pgTable('purchase_orders', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  poNumber: varchar('po_number', { length: 50 }).notNull().unique(),
  branchId: bigint('branch_id', { mode: 'number' }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  supplierId: bigint('supplier_id', { mode: 'number' }).notNull().references(() => suppliers.id, { onDelete: 'restrict' }),
  status: varchar('status', { length: 20 }).default('DRAFT'),
  totalAmount: bigint('total_amount', { mode: 'number' }).default(0),
  notes: text('notes'),
  orderedBy: bigint('ordered_by', { mode: 'number' }).references(() => employees.id, { onDelete: 'set null' }),
  approvedBy: bigint('approved_by', { mode: 'number' }).references(() => admins.id, { onDelete: 'set null' }),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  branchStatusIdx: index('idx_purchase_orders_branch').on(table.branchId, table.status),
  supplierIdx: index('idx_purchase_orders_supplier').on(table.supplierId),
}));

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  purchaseOrderId: bigint('purchase_order_id', { mode: 'number' }).notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  ingredientId: bigint('ingredient_id', { mode: 'number' }).notNull().references(() => ingredients.id, { onDelete: 'restrict' }),
  quantityOrdered: numeric('quantity_ordered', { precision: 10, scale: 3 }).notNull(),
  quantityReceived: numeric('quantity_received', { precision: 10, scale: 3 }).default('0'),
  unit: varchar('unit', { length: 20 }).notNull(),
  unitPrice: bigint('unit_price', { mode: 'number' }).notNull(),
  subtotal: bigint('subtotal', { mode: 'number' }).notNull(),
}, (table) => ({
  poIdx: index('idx_purchase_order_items_po').on(table.purchaseOrderId),
}));

export const stockOpnames = pgTable('stock_opnames', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  branchId: bigint('branch_id', { mode: 'number' }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  employeeId: bigint('employee_id', { mode: 'number' }).notNull().references(() => employees.id, { onDelete: 'restrict' }),
  status: varchar('status', { length: 20 }).default('IN_PROGRESS'),
  notes: text('notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  branchIdx: index('idx_stock_opnames_branch').on(table.branchId, table.createdAt),
}));

export const stockOpnameItems = pgTable('stock_opname_items', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  stockOpnameId: bigint('stock_opname_id', { mode: 'number' }).notNull().references(() => stockOpnames.id, { onDelete: 'cascade' }),
  ingredientId: bigint('ingredient_id', { mode: 'number' }).notNull().references(() => ingredients.id, { onDelete: 'restrict' }),
  systemStock: numeric('system_stock', { precision: 10, scale: 3 }).notNull(),
  actualStock: numeric('actual_stock', { precision: 10, scale: 3 }).notNull(),
  difference: numeric('difference', { precision: 10, scale: 3 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  notes: varchar('notes', { length: 255 }),
}, (table) => ({
  opnameIdx: index('idx_stock_opname_items_opname').on(table.stockOpnameId),
}));
// 2.6 Cart
export const carts = pgTable('carts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  customerId: bigint('customer_id', { mode: 'number' }).notNull().references(() => customers.id, { onDelete: 'cascade' }),
  branchId: bigint('branch_id', { mode: 'number' }).references(() => branches.id, { onDelete: 'set null' }),
  orderMode: varchar('order_mode', { length: 20 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  unq: uniqueIndex('unq_carts').on(table.customerId),
}));

export const cartItems = pgTable('cart_items', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  cartId: bigint('cart_id', { mode: 'number' }).notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: bigint('product_id', { mode: 'number' }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: bigint('unit_price', { mode: 'number' }).notNull(),
  notes: varchar('notes', { length: 255 }),
}, (table) => ({
  cartIdx: index('idx_cart_items_cart').on(table.cartId),
}));

export const cartItemOptions = pgTable('cart_item_options', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  cartItemId: bigint('cart_item_id', { mode: 'number' }).notNull().references(() => cartItems.id, { onDelete: 'cascade' }),
  optionId: bigint('option_id', { mode: 'number' }).notNull().references(() => productCustomizationOptions.id, { onDelete: 'cascade' }),
  additionalPrice: bigint('additional_price', { mode: 'number' }).default(0),
}, (table) => ({
  itemIdx: index('idx_cart_item_options_item').on(table.cartItemId),
}));

// 2.7 Orders
export const orders = pgTable('orders', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  invoiceCode: varchar('invoice_code', { length: 50 }).notNull().unique(),
  receiptNumber: varchar('receipt_number', { length: 50 }),
  customerId: bigint('customer_id', { mode: 'number' }).references(() => customers.id, { onDelete: 'set null' }),
  branchId: bigint('branch_id', { mode: 'number' }).notNull().references(() => branches.id, { onDelete: 'restrict' }),
  orderMode: varchar('order_mode', { length: 20 }).notNull(),
  orderSource: varchar('order_source', { length: 20 }).default('APP'),
  status: varchar('status', { length: 30 }).default('PENDING'),
  subtotal: bigint('subtotal', { mode: 'number' }).notNull(),
  discountAmount: bigint('discount_amount', { mode: 'number' }).default(0),
  discountId: bigint('discount_id', { mode: 'number' }), // FK added later
  taxAmount: bigint('tax_amount', { mode: 'number' }).default(0),
  serviceCharge: bigint('service_charge', { mode: 'number' }).default(0),
  deliveryFee: bigint('delivery_fee', { mode: 'number' }).default(0),
  bagFee: bigint('bag_fee', { mode: 'number' }).default(0),
  totalAmount: bigint('total_amount', { mode: 'number' }).notNull(),
  pointsEarned: bigint('points_earned', { mode: 'number' }).default(0),
  voucherId: bigint('voucher_id', { mode: 'number' }), // FK added later
  paymentMethodCode: varchar('payment_method_code', { length: 50 }),
  paymentReference: varchar('payment_reference', { length: 255 }),
  deliveryAddressId: bigint('delivery_address_id', { mode: 'number' }).references(() => customerAddresses.id, { onDelete: 'set null' }),
  tableId: bigint('table_id', { mode: 'number' }), // FK added later
  tableNumber: varchar('table_number', { length: 10 }),
  tableSessionId: bigint('table_session_id', { mode: 'number' }),
  shiftId: bigint('shift_id', { mode: 'number' }), // FK added later
  employeeId: bigint('employee_id', { mode: 'number' }).references(() => employees.id, { onDelete: 'set null' }),
  isPos: boolean('is_pos').default(false),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  cancelReason: text('cancel_reason'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  xenditPaymentId: varchar('xendit_payment_id', { length: 255 }),
  xenditPaymentMethodId: varchar('xendit_payment_method_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  custIdx: index('idx_orders_customer').on(table.customerId, table.createdAt),
  branchIdx: index('idx_orders_branch').on(table.branchId, table.createdAt),
  invoiceIdx: index('idx_orders_invoice').on(table.invoiceCode),
  createdIdx: index('idx_orders_created_at').on(table.createdAt),
}));

export const orderItems = pgTable('order_items', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  orderId: bigint('order_id', { mode: 'number' }).notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: bigint('product_id', { mode: 'number' }).references(() => products.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 200 }).notNull(),
  unitPrice: bigint('unit_price', { mode: 'number' }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  subtotal: bigint('subtotal', { mode: 'number' }).notNull(),
  discountAmount: bigint('discount_amount', { mode: 'number' }).default(0),
  notes: varchar('notes', { length: 255 }),
}, (table) => ({
  orderIdx: index('idx_order_items_order').on(table.orderId),
}));

export const orderItemOptions = pgTable('order_item_options', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  orderItemId: bigint('order_item_id', { mode: 'number' }).notNull().references(() => orderItems.id, { onDelete: 'cascade' }),
  optionId: bigint('option_id', { mode: 'number' }).references(() => productCustomizationOptions.id, { onDelete: 'set null' }),
  optionGroupName: varchar('option_group_name', { length: 100 }).notNull(),
  optionName: varchar('option_name', { length: 100 }).notNull(),
  additionalPrice: bigint('additional_price', { mode: 'number' }).default(0),
}, (table) => ({
  itemIdx: index('idx_order_item_options_item').on(table.orderItemId),
}));

export const orderStatusLogs = pgTable('order_status_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  orderId: bigint('order_id', { mode: 'number' }).notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 30 }).notNull(),
  actorType: varchar('actor_type', { length: 20 }),
  actorId: bigint('actor_id', { mode: 'number' }),
  notes: varchar('notes', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  orderIdx: index('idx_order_status_logs_order').on(table.orderId, table.createdAt),
}));

export const refunds = pgTable('refunds', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  orderId: bigint('order_id', { mode: 'number' }).notNull().references(() => orders.id, { onDelete: 'restrict' }),
  shiftId: bigint('shift_id', { mode: 'number' }).references(() => shifts.id, { onDelete: 'set null' }),
  refundType: varchar('refund_type', { length: 20 }).notNull(),
  refundAmount: bigint('refund_amount', { mode: 'number' }).notNull(),
  reason: varchar('reason', { length: 255 }).notNull(),
  refundMethod: varchar('refund_method', { length: 50 }),
  approvedBy: bigint('approved_by', { mode: 'number' }).references(() => admins.id, { onDelete: 'set null' }),
  employeeId: bigint('employee_id', { mode: 'number' }).references(() => employees.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 20 }).default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  orderIdx: index('idx_refunds_order').on(table.orderId),
}));
// 2.8 Payment
export const paymentMethods = pgTable('payment_methods', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  logoUrl: varchar('logo_url', { length: 500 }),
  type: varchar('type', { length: 50 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  adminFeeFlat: bigint('admin_fee_flat', { mode: 'number' }).default(0),
  adminFeePct: numeric('admin_fee_pct', { precision: 5, scale: 2 }).default('0.00'),
  isActive: boolean('is_active').default(true),
  isRedirect: boolean('is_redirect').default(false),
  sortOrder: integer('sort_order').default(0),
});

export const paymentInstructions = pgTable('payment_instructions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  paymentMethodId: bigint('payment_method_id', { mode: 'number' }).notNull().references(() => paymentMethods.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  methodIdx: index('idx_payment_instructions_method').on(table.paymentMethodId, table.sortOrder),
}));

export const paymentLogs = pgTable('payment_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  invoiceCode: varchar('invoice_code', { length: 50 }).notNull(),
  endpoint: varchar('endpoint', { length: 255 }),
  type: varchar('type', { length: 50 }),
  requestPayload: text('request_payload'),
  responsePayload: text('response_payload'),
  httpStatus: integer('http_status'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  invoiceIdx: index('idx_payment_logs_invoice').on(table.invoiceCode),
  createdIdx: index('idx_payment_logs_created_at').on(table.createdAt),
}));

// 2.9 Promo & Voucher
export const campaigns = pgTable('campaigns', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const vouchers = pgTable('vouchers', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  campaignId: bigint('campaign_id', { mode: 'number' }).references(() => campaigns.id, { onDelete: 'set null' }),
  code: varchar('code', { length: 50 }).notNull().unique(),
  discountType: varchar('discount_type', { length: 20 }).notNull(),
  discountValue: bigint('discount_value', { mode: 'number' }).notNull(),
  maxDiscount: bigint('max_discount', { mode: 'number' }),
  minTransaction: bigint('min_transaction', { mode: 'number' }).default(0),
  usageQuota: integer('usage_quota'),
  usedCount: integer('used_count').default(0),
  targetAudience: varchar('target_audience', { length: 30 }).default('ALL'),
  targetTier: varchar('target_tier', { length: 30 }),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  campaignIdx: index('idx_vouchers_campaign').on(table.campaignId),
}));

export const voucherRedemptions = pgTable('voucher_redemptions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  voucherId: bigint('voucher_id', { mode: 'number' }).notNull().references(() => vouchers.id, { onDelete: 'restrict' }),
  customerId: bigint('customer_id', { mode: 'number' }).notNull().references(() => customers.id, { onDelete: 'restrict' }),
  orderId: bigint('order_id', { mode: 'number' }).notNull().references(() => orders.id, { onDelete: 'restrict' }),
  discountApplied: bigint('discount_applied', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  custIdx: index('idx_voucher_redemptions_customer').on(table.customerId),
  voucherIdx: index('idx_voucher_redemptions_voucher').on(table.voucherId),
  orderIdx: index('idx_voucher_redemptions_order').on(table.orderId),
}));

export const discounts = pgTable('discounts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  discountType: varchar('discount_type', { length: 20 }).notNull(),
  discountValue: bigint('discount_value', { mode: 'number' }).notNull(),
  maxDiscount: bigint('max_discount', { mode: 'number' }),
  applyTo: varchar('apply_to', { length: 20 }).default('ORDER'),
  requiresPin: boolean('requires_pin').default(false),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 2.10 Loyalty Program
export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  customerId: bigint('customer_id', { mode: 'number' }).notNull().references(() => customers.id, { onDelete: 'cascade' }),
  orderId: bigint('order_id', { mode: 'number' }).references(() => orders.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 20 }).notNull(),
  points: bigint('points', { mode: 'number' }).notNull(),
  balanceAfter: bigint('balance_after', { mode: 'number' }).notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  custIdx: index('idx_loyalty_tx_customer').on(table.customerId, table.createdAt),
}));

export const dailyCheckins = pgTable('daily_checkins', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  customerId: bigint('customer_id', { mode: 'number' }).notNull().references(() => customers.id, { onDelete: 'cascade' }),
  daySequence: integer('day_sequence').notNull(),
  pointsAwarded: bigint('points_awarded', { mode: 'number' }).notNull(),
  checkinDate: date('checkin_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  unq: uniqueIndex('unq_daily_checkins').on(table.customerId, table.checkinDate),
}));
// 2.11 Engagement & Content
export const customerFavorites = pgTable('customer_favorites', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  customerId: bigint('customer_id', { mode: 'number' }).notNull().references(() => customers.id, { onDelete: 'cascade' }),
  productId: bigint('product_id', { mode: 'number' }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  unq: uniqueIndex('unq_cust_favs').on(table.customerId, table.productId),
}));

export const banners = pgTable('banners', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  linkDestination: varchar('link_destination', { length: 500 }),
  placement: varchar('placement', { length: 30 }).default('HOME'),
  sortOrder: integer('sort_order').default(0),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
});

export const staticPages = pgTable('static_pages', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const merchandise = pgTable('merchandise', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  price: bigint('price', { mode: 'number' }).notNull(),
  personalizable: boolean('personalizable').default(false),
  badge: varchar('badge', { length: 30 }),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  sortOrder: integer('sort_order').default(0),
});

// 2.12 Notification
export const notificationTemplates = pgTable('notification_templates', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  eventTrigger: varchar('event_trigger', { length: 50 }).notNull().unique(),
  channel: varchar('channel', { length: 20 }).notNull(),
  messageContent: text('message_content').notNull(),
  isActive: boolean('is_active').default(true),
});

export const notificationLogs = pgTable('notification_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  templateId: bigint('template_id', { mode: 'number' }).references(() => notificationTemplates.id, { onDelete: 'set null' }),
  invoiceCode: varchar('invoice_code', { length: 50 }),
  recipient: varchar('recipient', { length: 150 }).notNull(),
  channel: varchar('channel', { length: 20 }).notNull(),
  requestPayload: text('request_payload'),
  responsePayload: text('response_payload'),
  status: varchar('status', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tmplIdx: index('idx_notification_logs_template').on(table.templateId),
  invoiceIdx: index('idx_notification_logs_invoice').on(table.invoiceCode),
  createdIdx: index('idx_notification_logs_created_at').on(table.createdAt),
}));

// 2.13 Configuration (POS)
export const taxConfigs = pgTable('tax_configs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  branchId: bigint('branch_id', { mode: 'number' }).notNull().references(() => branches.id, { onDelete: 'cascade' }),
  taxName: varchar('tax_name', { length: 50 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull(),
  isInclusive: boolean('is_inclusive').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  unq: uniqueIndex('unq_tax_configs').on(table.branchId, table.taxName),
}));
