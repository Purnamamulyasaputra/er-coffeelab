import { neon, neonConfig } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}



// Global auto-retry fetch for Neon to handle ECONNRESET / transient network issues
neonConfig.fetchFunction = async (url: string, init: RequestInit) => {
  let retries = 2;
  while (retries >= 0) {
    try {
      return await fetch(url, { ...init, keepalive: true });
    } catch (error: any) {
      const msg = error.message || "";
      if ((msg.includes('fetch failed') || msg.includes('ECONNRESET') || msg.includes('Timeout')) && retries > 0) {
        retries--;
        await new Promise(res => setTimeout(res, 500)); // Wait 500ms before retry
      } else {
        throw error;
      }
    }
  }
};

export const sql = neon(process.env.DATABASE_URL);
