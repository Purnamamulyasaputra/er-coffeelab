import { drizzle } from 'drizzle-orm/neon-http';
import { sql as dSql } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('Seeding data...');

  // 1. Admins
  await db.insert(schema.admins).values([
    { name: 'Ahmad Fulan', email: 'ahmad@ercoffeelab.id', passwordHash: '$2a$12$Hash1', role: 'SUPERADMIN', status: 'ACTIVE' },
    { name: 'Rina Keuangan', email: 'rina@ercoffeelab.id', passwordHash: '$2a$12$Hash2', role: 'SUPERADMIN', status: 'ACTIVE' },
    { name: 'Budi Barista CBD', email: 'budi@ercoffeelab.id', passwordHash: '$2a$12$Hash3', role: 'STORE_ADMIN', status: 'ACTIVE' },
    { name: 'Sari Barista GI', email: 'sari@ercoffeelab.id', passwordHash: '$2a$12$Hash4', role: 'STORE_ADMIN', status: 'ACTIVE' },
    { name: 'Dani Barista Kemang', email: 'dani@ercoffeelab.id', passwordHash: '$2a$12$Hash5', role: 'STORE_ADMIN', status: 'ACTIVE' },
  ]).onConflictDoNothing();

  // 1.5 Branch Admins (Store Admins holding branches)
  await db.insert(schema.branchAdmins).values([
    // Budi -> CBD, GI
    { branchId: 1, adminId: 3 },
    { branchId: 2, adminId: 3 },
    // Sari -> BSD, Bandung
    { branchId: 4, adminId: 4 },
    { branchId: 5, adminId: 4 },
    // Dani -> Kemang
    { branchId: 3, adminId: 5 },
  ]).onConflictDoNothing();

  // 2. Branches
  await db.insert(schema.branches).values([
    { name: 'ER Coffeelab CBD Jakarta', address: 'Plaza Indonesia Lt. 3, Jakarta Pusat', latitude: '-6.1930000', longitude: '106.8220000', phone: '021-5001001', operatingHours: '07:00-22:00', status: 'OPEN', pickupEnabled: true, deliveryEnabled: true, dineinEnabled: true, deliveryRadiusKm: '5.00', taxRate: '10.00', serviceChargePct: '5.00', sortOrder: 1 },
    { name: 'ER Coffeelab Grand Indonesia', address: 'Grand Indonesia Mall East Lt. 2, Jakarta', latitude: '-6.1950000', longitude: '106.8200000', phone: '021-5001002', operatingHours: '10:00-22:00', status: 'OPEN', pickupEnabled: true, deliveryEnabled: true, dineinEnabled: false, deliveryRadiusKm: '5.00', taxRate: '10.00', serviceChargePct: '5.00', sortOrder: 2 },
    { name: 'ER Coffeelab Kemang', address: 'Jl. Kemang Raya No. 45, Jakarta Selatan', latitude: '-6.2610000', longitude: '106.8130000', phone: '021-5001003', operatingHours: '07:00-23:00', status: 'OPEN', pickupEnabled: true, deliveryEnabled: true, dineinEnabled: true, deliveryRadiusKm: '5.00', taxRate: '10.00', serviceChargePct: '5.00', sortOrder: 3 },
    { name: 'ER Coffeelab BSD', address: 'The Breeze BSD City, Tangerang Selatan', latitude: '-6.3010000', longitude: '106.6530000', phone: '021-5001004', operatingHours: '08:00-22:00', status: 'OPEN', pickupEnabled: true, deliveryEnabled: true, dineinEnabled: false, deliveryRadiusKm: '5.00', taxRate: '10.00', serviceChargePct: '0.00', sortOrder: 4 },
    { name: 'ER Coffeelab Bandung', address: 'Jl. Braga No. 12, Bandung', latitude: '-6.9175000', longitude: '107.6090000', phone: '022-4001001', operatingHours: '07:00-22:00', status: 'OPEN', pickupEnabled: true, deliveryEnabled: true, dineinEnabled: true, deliveryRadiusKm: '5.00', taxRate: '10.00', serviceChargePct: '5.00', sortOrder: 5 },
  ]).onConflictDoNothing();

  // 3. Employees
  await db.insert(schema.employees).values([
    { branchId: 1, name: 'Andi Barista', phone: '081200001001', pinHash: '$2a$12$Pin1', role: 'BARISTA', hourlyRate: 25000, status: 'ACTIVE' },
    { branchId: 1, name: 'Bella Cashier', phone: '081200001002', pinHash: '$2a$12$Pin2', role: 'CASHIER', hourlyRate: 25000, status: 'ACTIVE' },
    { branchId: 1, name: 'Chandra Lead', phone: '081200001003', pinHash: '$2a$12$Pin3', role: 'SHIFT_LEAD', hourlyRate: 30000, status: 'ACTIVE' },
    { branchId: 2, name: 'Dina Barista', phone: '081200002001', pinHash: '$2a$12$Pin4', role: 'BARISTA', hourlyRate: 25000, status: 'ACTIVE' },
    { branchId: 2, name: 'Eka Cashier', phone: '081200002002', pinHash: '$2a$12$Pin5', role: 'CASHIER', hourlyRate: 25000, status: 'ACTIVE' },
    { branchId: 3, name: 'Fajar Barista', phone: '081200003001', pinHash: '$2a$12$Pin6', role: 'BARISTA', hourlyRate: 25000, status: 'ACTIVE' },
    { branchId: 3, name: 'Gita Lead', phone: '081200003002', pinHash: '$2a$12$Pin7', role: 'SHIFT_LEAD', hourlyRate: 30000, status: 'ACTIVE' },
    { branchId: 4, name: 'Hadi Barista', phone: '081200004001', pinHash: '$2a$12$Pin8', role: 'BARISTA', hourlyRate: 25000, status: 'ACTIVE' },
    { branchId: 5, name: 'Indah Barista', phone: '081200005001', pinHash: '$2a$12$Pin9', role: 'BARISTA', hourlyRate: 25000, status: 'ACTIVE' },
    { branchId: 5, name: 'Joko Cashier', phone: '081200005002', pinHash: '$2a$12$PinA', role: 'CASHIER', hourlyRate: 25000, status: 'ACTIVE' },
  ]).onConflictDoNothing();

  // 4. Store Tables
  await db.insert(schema.storeTables).values([
    { branchId: 1, tableNumber: 'T01', section: 'Indoor', capacity: 2, status: 'AVAILABLE', sortOrder: 1 },
    { branchId: 1, tableNumber: 'T02', section: 'Indoor', capacity: 4, status: 'AVAILABLE', sortOrder: 2 },
    { branchId: 1, tableNumber: 'T03', section: 'Indoor', capacity: 4, status: 'AVAILABLE', sortOrder: 3 },
    { branchId: 1, tableNumber: 'T04', section: 'Outdoor', capacity: 2, status: 'AVAILABLE', sortOrder: 4 },
    { branchId: 1, tableNumber: 'T05', section: 'Outdoor', capacity: 4, status: 'AVAILABLE', sortOrder: 5 },
    { branchId: 3, tableNumber: 'T01', section: 'Indoor', capacity: 4, status: 'AVAILABLE', sortOrder: 1 },
    { branchId: 3, tableNumber: 'T02', section: 'Indoor', capacity: 6, status: 'AVAILABLE', sortOrder: 2 },
    { branchId: 3, tableNumber: 'T03', section: 'Smoking', capacity: 2, status: 'AVAILABLE', sortOrder: 3 },
    { branchId: 3, tableNumber: 'T04', section: 'Smoking', capacity: 4, status: 'AVAILABLE', sortOrder: 4 },
    { branchId: 5, tableNumber: 'T01', section: 'Indoor', capacity: 2, status: 'AVAILABLE', sortOrder: 1 },
    { branchId: 5, tableNumber: 'T02', section: 'Indoor', capacity: 4, status: 'AVAILABLE', sortOrder: 2 },
    { branchId: 5, tableNumber: 'T03', section: 'Indoor', capacity: 6, status: 'AVAILABLE', sortOrder: 3 },
    { branchId: 5, tableNumber: 'T04', section: 'Outdoor', capacity: 4, status: 'AVAILABLE', sortOrder: 4 },
  ]).onConflictDoNothing();

  // 5. Ingredients
  await db.insert(schema.ingredients).values([
    { name: 'Arabica Coffee Beans', sku: 'ING-001', unit: 'g', costPerUnit: 120, minStockAlert: '5000', category: 'COFFEE_BEAN', status: 'ACTIVE' },
    { name: 'Robusta Coffee Beans', sku: 'ING-002', unit: 'g', costPerUnit: 80, minStockAlert: '5000', category: 'COFFEE_BEAN', status: 'ACTIVE' },
    { name: 'Fresh Milk', sku: 'ING-003', unit: 'ml', costPerUnit: 25, minStockAlert: '10000', category: 'DAIRY', status: 'ACTIVE' },
    { name: 'Oat Milk', sku: 'ING-004', unit: 'ml', costPerUnit: 55, minStockAlert: '5000', category: 'DAIRY', status: 'ACTIVE' },
    { name: 'Almond Milk', sku: 'ING-005', unit: 'ml', costPerUnit: 65, minStockAlert: '3000', category: 'DAIRY', status: 'ACTIVE' },
    { name: 'Vanilla Syrup', sku: 'ING-006', unit: 'ml', costPerUnit: 40, minStockAlert: '3000', category: 'SYRUP', status: 'ACTIVE' },
    { name: 'Hazelnut Syrup', sku: 'ING-007', unit: 'ml', costPerUnit: 40, minStockAlert: '3000', category: 'SYRUP', status: 'ACTIVE' },
    { name: 'Caramel Syrup', sku: 'ING-008', unit: 'ml', costPerUnit: 40, minStockAlert: '3000', category: 'SYRUP', status: 'ACTIVE' },
    { name: 'Aren Syrup', sku: 'ING-009', unit: 'ml', costPerUnit: 50, minStockAlert: '3000', category: 'SYRUP', status: 'ACTIVE' },
    { name: 'Dark Chocolate Powder', sku: 'ING-010', unit: 'g', costPerUnit: 90, minStockAlert: '3000', category: 'TOPPING', status: 'ACTIVE' },
    { name: 'Whipped Cream', sku: 'ING-011', unit: 'ml', costPerUnit: 35, minStockAlert: '3000', category: 'TOPPING', status: 'ACTIVE' },
    { name: 'Ice Cube', sku: 'ING-012', unit: 'pcs', costPerUnit: 200, minStockAlert: '200', category: 'OTHER', status: 'ACTIVE' },
    { name: 'Cup 16oz', sku: 'ING-013', unit: 'pcs', costPerUnit: 1500, minStockAlert: '200', category: 'CUP', status: 'ACTIVE' },
    { name: 'Cup 22oz', sku: 'ING-014', unit: 'pcs', costPerUnit: 2000, minStockAlert: '200', category: 'CUP', status: 'ACTIVE' },
    { name: 'Lid', sku: 'ING-015', unit: 'pcs', costPerUnit: 500, minStockAlert: '200', category: 'CUP', status: 'ACTIVE' },
    { name: 'Paper Straw', sku: 'ING-016', unit: 'pcs', costPerUnit: 300, minStockAlert: '300', category: 'CUP', status: 'ACTIVE' },
    { name: 'Sugar', sku: 'ING-017', unit: 'g', costPerUnit: 15, minStockAlert: '5000', category: 'OTHER', status: 'ACTIVE' },
    { name: 'Sea Salt', sku: 'ING-018', unit: 'g', costPerUnit: 30, minStockAlert: '1000', category: 'TOPPING', status: 'ACTIVE' },
    { name: 'Oreo Crumbs', sku: 'ING-019', unit: 'g', costPerUnit: 60, minStockAlert: '2000', category: 'TOPPING', status: 'ACTIVE' },
    { name: 'Croissant Shell (Frozen)', sku: 'ING-020', unit: 'pcs', costPerUnit: 8000, minStockAlert: '50', category: 'FOOD_SUPPLY', status: 'ACTIVE' },
    { name: 'Almond Cream Filling', sku: 'ING-021', unit: 'g', costPerUnit: 80, minStockAlert: '2000', category: 'FOOD_SUPPLY', status: 'ACTIVE' },
  ]).onConflictDoNothing();
  
  // 6. Suppliers
  await db.insert(schema.suppliers).values([
    { name: 'PT Kopi Nusantara', contactPerson: 'Pak Rudi', phone: '081300010001', email: 'rudi@kopinusantara.id', status: 'ACTIVE' },
    { name: 'CV Dairy Fresh Indonesia', contactPerson: 'Bu Sinta', phone: '081300020001', email: 'sinta@dairyfresh.id', status: 'ACTIVE' },
    { name: 'PT Syrup & Co', contactPerson: 'Pak Arman', phone: '081300030001', email: 'arman@syrupco.id', status: 'ACTIVE' },
    { name: 'CV Packaging Prima', contactPerson: 'Bu Lestari', phone: '081300040001', email: 'lestari@packagingprima.id', status: 'ACTIVE' },
  ]).onConflictDoNothing();

  // 7. Tax Configs
  await db.insert(schema.taxConfigs).values([
    { branchId: 1, taxName: 'PB1', taxRate: '10.00', isInclusive: false, isActive: true },
    { branchId: 2, taxName: 'PB1', taxRate: '10.00', isInclusive: false, isActive: true },
    { branchId: 3, taxName: 'PB1', taxRate: '10.00', isInclusive: false, isActive: true },
    { branchId: 4, taxName: 'PB1', taxRate: '10.00', isInclusive: false, isActive: true },
    { branchId: 5, taxName: 'PB1', taxRate: '10.00', isInclusive: false, isActive: true },
  ]).onConflictDoNothing();

  // 8. Discounts
  await db.insert(schema.discounts).values([
    { name: 'Employee Discount 50%', discountType: 'PERCENTAGE', discountValue: 50, maxDiscount: 50000, applyTo: 'ORDER', requiresPin: true, status: 'ACTIVE' },
    { name: 'VIP Member 10%', discountType: 'PERCENTAGE', discountValue: 10, maxDiscount: null, applyTo: 'ORDER', requiresPin: false, status: 'ACTIVE' },
    { name: 'Happy Hour 20%', discountType: 'PERCENTAGE', discountValue: 20, maxDiscount: 30000, applyTo: 'ORDER', requiresPin: false, status: 'ACTIVE' },
    { name: 'Complimentary Item', discountType: 'PERCENTAGE', discountValue: 100, maxDiscount: null, applyTo: 'ITEM', requiresPin: true, status: 'ACTIVE' },
    { name: 'Rp 5.000 Off Per Item', discountType: 'FIXED', discountValue: 5000, maxDiscount: null, applyTo: 'ITEM', requiresPin: false, status: 'ACTIVE' },
  ]).onConflictDoNothing();

  // 9. Payment Methods
  await db.insert(schema.paymentMethods).values([
    // Manual POS Methods
    { name: 'Cash', code: 'CASH', type: 'CASH', provider: 'MANUAL', logoUrl: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png', isActive: true, sortOrder: 0, adminFeeFlat: 0, adminFeePct: '0.00', isRedirect: false },
    { name: 'Debit/Credit Card (EDC)', code: 'EDC', type: 'EDC', provider: 'MANUAL', logoUrl: 'https://cdn-icons-png.flaticon.com/512/4021/4021111.png', isActive: true, sortOrder: 20, adminFeeFlat: 0, adminFeePct: '0.00', isRedirect: false },
    
    // QRIS (Fee 0.7%)
    { name: 'QRIS', code: 'QRIS', type: 'QR_CODE', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/QRIS.svg', isActive: true, sortOrder: 1, adminFeeFlat: 0, adminFeePct: '0.70', isRedirect: false },
    
    // Virtual Accounts (Flat Fee Rp 4.500)
    { name: 'BCA Virtual Account', code: 'BCA_VA', type: 'VIRTUAL_ACCOUNT', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/BCA.svg', isActive: true, sortOrder: 2, adminFeeFlat: 4500, adminFeePct: '0.00', isRedirect: false },
    { name: 'Mandiri Virtual Account', code: 'MANDIRI_VA', type: 'VIRTUAL_ACCOUNT', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/MANDIRI.svg', isActive: true, sortOrder: 3, adminFeeFlat: 4500, adminFeePct: '0.00', isRedirect: false },
    { name: 'BRI Virtual Account', code: 'BRI_VA', type: 'VIRTUAL_ACCOUNT', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/BRI.svg', isActive: true, sortOrder: 4, adminFeeFlat: 4500, adminFeePct: '0.00', isRedirect: false },
    { name: 'BNI Virtual Account', code: 'BNI_VA', type: 'VIRTUAL_ACCOUNT', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/BNI.svg', isActive: true, sortOrder: 5, adminFeeFlat: 4500, adminFeePct: '0.00', isRedirect: false },
    { name: 'BJB Virtual Account', code: 'BJB_VA', type: 'VIRTUAL_ACCOUNT', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/BJB.svg', isActive: true, sortOrder: 6, adminFeeFlat: 4500, adminFeePct: '0.00', isRedirect: false },
    { name: 'BNC Virtual Account', code: 'BNC_VA', type: 'VIRTUAL_ACCOUNT', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/BNC.svg', isActive: true, sortOrder: 7, adminFeeFlat: 4500, adminFeePct: '0.00', isRedirect: false },
    { name: 'BSI Virtual Account', code: 'BSI_VA', type: 'VIRTUAL_ACCOUNT', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/BSI.svg', isActive: true, sortOrder: 8, adminFeeFlat: 4500, adminFeePct: '0.00', isRedirect: false },
    { name: 'BSS Virtual Account', code: 'BSS_VA', type: 'VIRTUAL_ACCOUNT', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/BSS.svg', isActive: true, sortOrder: 9, adminFeeFlat: 4500, adminFeePct: '0.00', isRedirect: false },
    { name: 'CIMB Virtual Account', code: 'CIMB_VA', type: 'VIRTUAL_ACCOUNT', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/CIMB.svg', isActive: true, sortOrder: 10, adminFeeFlat: 4500, adminFeePct: '0.00', isRedirect: false },
    { name: 'Muamalat Virtual Account', code: 'MUAMALAT_VA', type: 'VIRTUAL_ACCOUNT', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/MUAMALAT.svg', isActive: true, sortOrder: 11, adminFeeFlat: 4500, adminFeePct: '0.00', isRedirect: false },
    { name: 'Permata Virtual Account', code: 'PERMATA_VA', type: 'VIRTUAL_ACCOUNT', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/PERMATA.svg', isActive: true, sortOrder: 12, adminFeeFlat: 4500, adminFeePct: '0.00', isRedirect: false },
    
    // E-Wallets (Fee 1.5% - 2.0%, isRedirect = TRUE)
    { name: 'GoPay', code: 'GOPAY', type: 'E_WALLET', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/GOPAY.svg', isActive: true, sortOrder: 13, adminFeeFlat: 0, adminFeePct: '2.00', isRedirect: true },
    { name: 'OVO', code: 'OVO', type: 'E_WALLET', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/OVO.svg', isActive: true, sortOrder: 14, adminFeeFlat: 0, adminFeePct: '1.50', isRedirect: true },
    { name: 'DANA', code: 'DANA', type: 'E_WALLET', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/DANA.svg', isActive: true, sortOrder: 15, adminFeeFlat: 0, adminFeePct: '1.50', isRedirect: true },
    { name: 'LinkAja', code: 'LINKAJA', type: 'E_WALLET', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/LINKAJA.svg', isActive: true, sortOrder: 16, adminFeeFlat: 0, adminFeePct: '1.50', isRedirect: true },
    { name: 'ShopeePay', code: 'SHOPEEPAY', type: 'E_WALLET', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/SHOPEEPAY.svg', isActive: true, sortOrder: 17, adminFeeFlat: 0, adminFeePct: '1.50', isRedirect: true },
    
    // Over The Counter (Flat Fee Rp 5.000)
    { name: 'Alfamart', code: 'ALFAMART', type: 'OVER_THE_COUNTER', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/ALFAMART.svg', isActive: true, sortOrder: 18, adminFeeFlat: 5000, adminFeePct: '0.00', isRedirect: false },
    { name: 'Indomaret', code: 'INDOMARET', type: 'OVER_THE_COUNTER', provider: 'XENDIT', logoUrl: 'https://assets.xendit.co/payment-session/logos/INDOMARET.svg', isActive: true, sortOrder: 19, adminFeeFlat: 5000, adminFeePct: '0.00', isRedirect: false },
  ])
  .onConflictDoUpdate({
    target: schema.paymentMethods.code,
    set: {
      adminFeeFlat: dSql`EXCLUDED.admin_fee_flat`,
      adminFeePct: dSql`EXCLUDED.admin_fee_pct`,
      isRedirect: dSql`EXCLUDED.is_redirect`,
    }
  });

  console.log('Seeding completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Failed to seed:', err);
  process.exit(1);
});
