import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

const MIGRATION_LOCK_ID = 708_491_825;

function requireVerifiedTlsForNeon(databaseUrl: string) {
  const parsedUrl = new URL(databaseUrl);
  const sslMode = parsedUrl.searchParams.get("sslmode");

  if (
    parsedUrl.hostname.endsWith(".neon.tech") &&
    (!sslMode || ["prefer", "require", "verify-ca"].includes(sslMode))
  ) {
    parsedUrl.searchParams.set("sslmode", "verify-full");
  }

  return parsedUrl.toString();
}

export function isPooledDatabaseUrl(databaseUrl: string) {
  return new URL(databaseUrl).hostname.includes("-pooler");
}

export function toDirectNeonDatabaseUrl(databaseUrl: string) {
  const parsedUrl = new URL(databaseUrl);

  parsedUrl.hostname = parsedUrl.hostname.replace("-pooler", "");

  return parsedUrl.toString();
}

export async function runMigrations(
  databaseUrl: string,
  migrationsFolder: string,
) {
  const client = new Client({
    connectionString: requireVerifiedTlsForNeon(databaseUrl),
  });

  await client.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    await migrate(drizzle(client), { migrationsFolder });
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
    } finally {
      await client.end();
    }
  }
}
