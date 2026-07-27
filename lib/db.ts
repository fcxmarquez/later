import "server-only";

import { watchlistItems } from "@/db/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

const schema = { watchlistItems };

export type Db = NeonHttpDatabase<typeof schema>;

let db: Db | null = null;

export function getDb() {
  if (db) return db;

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  db = drizzle(neon(databaseUrl), { schema });
  return db;
}
