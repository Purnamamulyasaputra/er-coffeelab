import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  const res = await sql`SELECT * FROM employees`;
  console.log(res);
}

run().catch(console.error);
