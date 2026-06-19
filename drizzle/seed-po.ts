import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('Seeding dummy POs and Stock...');
  
  const ingredientsList = await db.select().from(schema.ingredients);
  if (ingredientsList.length === 0) {
    console.log("No ingredients found. Run full seed first.");
    process.exit(1);
  }

  for (const branch of [1, 2, 3, 4, 5]) {
    for (const ingredient of ingredientsList) {
      const currentStock = Math.floor(Math.random() * 5000) + 1000;
      await db.insert(schema.ingredientStock).values({
        branchId: branch,
        ingredientId: ingredient.id,
        currentStock: currentStock.toString(),
        unit: ingredient.unit,
      }).onConflictDoNothing();
      
      await db.insert(schema.stockMovements).values({
        branchId: branch,
        ingredientId: ingredient.id,
        type: 'INITIAL_STOCK',
        quantity: currentStock.toString(),
        unit: ingredient.unit,
        stockBefore: '0',
        stockAfter: currentStock.toString(),
        referenceType: 'SYSTEM_SEED',
        notes: 'Initial seed stock',
      });
    }

    for (let i = 0; i < 2; i++) {
      const poResult = await db.insert(schema.purchaseOrders).values({
        poNumber: `PO-${Math.floor(Date.now() / 1000)}-${branch}-${i}`,
        branchId: branch,
        supplierId: 1, 
        status: i === 0 ? 'RECEIVED' : 'SUBMITTED',
        totalAmount: 1000000,
        notes: 'Monthly supply',
        approvedBy: null, 
        receivedAt: i === 0 ? new Date() : null,
      }).returning({ id: schema.purchaseOrders.id });
      
      if (poResult.length > 0) {
        const poId = poResult[0].id;
        await db.insert(schema.purchaseOrderItems).values([
          {
            purchaseOrderId: poId,
            ingredientId: ingredientsList[0].id, 
            quantityOrdered: '5000',
            quantityReceived: i === 0 ? '5000' : '0',
            unit: ingredientsList[0].unit,
            unitPrice: ingredientsList[0].costPerUnit,
            subtotal: 5000 * ingredientsList[0].costPerUnit,
          },
          {
            purchaseOrderId: poId,
            ingredientId: ingredientsList[1].id,
            quantityOrdered: '5000',
            quantityReceived: i === 0 ? '5000' : '0',
            unit: ingredientsList[1].unit,
            unitPrice: ingredientsList[1].costPerUnit,
            subtotal: 5000 * ingredientsList[1].costPerUnit,
          }
        ]);
      }
    }
  }

  console.log('Dummy seeding completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Failed to seed dummy data:', err);
  process.exit(1);
});
