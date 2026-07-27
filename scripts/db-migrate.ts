import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { resolve } from "node:path";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  const productionOnly = process.argv.includes("--production-only");

  if (productionOnly && process.env.VERCEL_ENV !== "production") {
    console.log(
      `Skipping production migrations (VERCEL_ENV=${process.env.VERCEL_ENV ?? "local"}).`,
    );
    return;
  }

  const databaseUrl =
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log("Skipping migrations (no DATABASE_URL configured).");
    return;
  }

  const db = drizzle(neon(databaseUrl));
  const migrationsFolder = resolve(process.cwd(), "db/migrations");

  console.log("Applying Drizzle migrations...");
  await migrate(db, { migrationsFolder });
  console.log("Migrations applied.");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
