import { neon, neonConfig } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// Global auto-retry fetch for Neon to handle ECONNRESET / transient network issues
neonConfig.fetchFunction = async (url: string, init: RequestInit) => {
  let retries = 3;
  while (retries > 0) {
    try {
      return await fetch(url, init);
    } catch (error: any) {
      const msg = error.message || "";
      if (msg.includes('fetch failed') || msg.includes('ECONNRESET')) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(res => setTimeout(res, 1000)); // Wait 1s before retry
      } else {
        throw error;
      }
    }
  }
};

export const sql = neon(process.env.DATABASE_URL);
