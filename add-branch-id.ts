import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`ALTER TABLE products ADD COLUMN branch_id BIGINT REFERENCES branches(id) ON DELETE CASCADE;`;
    console.log("Successfully added branch_id to products");
  } catch (e: any) {
    if (e.message.includes('already exists')) {
      console.log("Column branch_id already exists");
    } else {
      console.error(e);
    }
  }
}
main();
