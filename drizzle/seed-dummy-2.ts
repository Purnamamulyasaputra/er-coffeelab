import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seedTransactions() {
  console.log('Seeding Transactions & Stocks...');

  try {
    const branches = await db.query.branches.findMany();
    const products = await db.query.products.findMany();
    const ingredients = await db.query.ingredients.findMany();
    const customers = await db.query.customers.findMany();
    const employees = await db.query.employees.findMany();

    if (branches.length === 0 || products.length === 0) {
      console.log('Need branches and products to continue.');
      process.exit(0);
    }

    console.log('1. Seeding branch product & ingredient stocks...');
    for (const branch of branches) {
      const isHighVolume = branch.id === 1 || branch.id === 3;
      const multiplier = isHighVolume ? 3 : 1;

      // Product Stocks
      const prodStocks = products.map(p => ({
        branchId: branch.id,
        productId: p.id,
        currentStock: Math.floor(Math.random() * 50) * multiplier + 10,
        minStockAlert: 10,
        isTracked: true
      }));
      await db.insert(schema.branchProductStock).values(prodStocks).onConflictDoNothing();

      // Ingredient Stocks (first 5 ingredients)
      const ingStocks = ingredients.slice(0, 5).map(i => ({
        branchId: branch.id,
        ingredientId: i.id,
        currentStock: String(Math.floor(Math.random() * 5000) * multiplier + 1000),
        unit: i.unit || 'g',
        minStockAlert: '1000'
      }));
      await db.insert(schema.ingredientStock).values(ingStocks).onConflictDoNothing();
    }

    console.log('2. Seeding Shifts...');
    const shiftsToInsert = [];
    for (const branch of branches) {
      const branchEmps = employees.filter(e => e.branchId === branch.id);
      if (branchEmps.length > 0) {
        // Closed shift yesterday
        shiftsToInsert.push({
          branchId: branch.id,
          employeeId: branchEmps[0].id,
          startTime: new Date(Date.now() - 32*3600000), // ~yesterday
          endTime: new Date(Date.now() - 24*3600000),
          status: 'CLOSED',
          startingCash: 500000,
          expectedEndingCash: 1500000,
          actualEndingCash: 1500000
        });

        // Open shift today
        shiftsToInsert.push({
          branchId: branch.id,
          employeeId: branchEmps[0].id,
          startTime: new Date(Date.now() - 4*3600000),
          status: 'OPEN',
          startingCash: 500000
        });
      }
    }
    await db.insert(schema.shifts).values(shiftsToInsert).onConflictDoNothing();

    console.log('3. Seeding Cash Movements...');
    const allShifts = await db.query.shifts.findMany();
    if (allShifts.length > 0) {
      await db.insert(schema.cashMovements).values([
        { shiftId: allShifts[0].id, type: 'CASH_IN', amount: 500000, reason: 'Opening Cash', employeeId: allShifts[0].employeeId },
        { shiftId: allShifts[0].id, type: 'EXPENSE', amount: 50000, reason: 'Buy Ice', employeeId: allShifts[0].employeeId }
      ]).onConflictDoNothing();
    }

    console.log('4. Seeding Orders...');
    const ordersToInsert = [];
    const openShifts = allShifts.filter(s => s.status === 'OPEN');
    
    let ordId = 1000;
    for (const shift of openShifts) {
      const custId = customers.length > 0 ? customers[0].id : null;
      ordersToInsert.push({
        branchId: shift.branchId,
        customerId: custId,
        shiftId: shift.id,
        invoiceCode: `ORD-${shift.branchId}-${ordId++}`,
        orderMode: 'DINE_IN',
        status: 'COMPLETED',
        subtotal: 45000,
        taxAmount: 4500,
        totalAmount: 49500
      });
    }
    
    if (ordersToInsert.length > 0) {
      const insertedOrders = await db.insert(schema.orders).values(ordersToInsert).returning().onConflictDoNothing();
      const actualOrders = insertedOrders.length > 0 ? insertedOrders : await db.query.orders.findMany();

      if (actualOrders.length > 0) {
        console.log('5. Seeding Order Items...');
        const orderItems = [];
        for (const o of actualOrders) {
          orderItems.push({
            orderId: o.id,
            productId: products[0].id,
            productName: products[0].name,
            quantity: 1,
            unitPrice: 45000,
            subtotal: 45000
          });
        }
        await db.insert(schema.orderItems).values(orderItems).onConflictDoNothing();

        console.log('6. Seeding Payment Logs...');
        const paymentLogs = [];
        for (const o of actualOrders) {
          paymentLogs.push({
            invoiceCode: o.invoiceCode,
            endpoint: '/api/payment/xendit',
            type: 'CHARGE',
            httpStatus: 200,
            requestPayload: JSON.stringify({ amount: 49500 }),
            responsePayload: JSON.stringify({ status: 'SUCCESS' })
          });
        }
        await db.insert(schema.paymentLogs).values(paymentLogs).onConflictDoNothing();
      }
    }

    console.log('Transaction seeding completed successfully!');
  } catch (e) {
    console.error('Error seeding transactions:', e);
  }
  process.exit(0);
}

seedTransactions();
