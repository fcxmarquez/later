import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { Client } from "pg";
import { runMigrations } from "./db-migration-runner";

function requireDisposableDatabaseUrl() {
  const databaseUrl = process.env.MIGRATION_TEST_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("MIGRATION_TEST_DATABASE_URL is required.");
  }

  const parsedUrl = new URL(databaseUrl);
  const databaseName = parsedUrl.pathname.slice(1);
  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);

  if (
    !localHosts.has(parsedUrl.hostname) ||
    databaseName !== "later_migration_test"
  ) {
    throw new Error(
      "Migration smoke tests only run against local database later_migration_test.",
    );
  }

  return databaseUrl;
}

async function main() {
  const databaseUrl = requireDisposableDatabaseUrl();
  const client = new Client({ connectionString: databaseUrl });
  const migrationsFolder = resolve(process.cwd(), "db/migrations");

  await client.connect();

  try {
    await client.query("CREATE SCHEMA IF NOT EXISTS neon_auth");
    await client.query(`
      CREATE TABLE IF NOT EXISTS neon_auth."user" (
        id uuid PRIMARY KEY
      )
    `);
  } finally {
    await client.end();
  }

  await runMigrations(databaseUrl, migrationsFolder);
  await runMigrations(databaseUrl, migrationsFolder);

  const verificationClient = new Client({ connectionString: databaseUrl });

  await verificationClient.connect();

  try {
    const migrationResult = await verificationClient.query<{
      migration_count: string;
    }>(`
      SELECT count(*)::text AS migration_count
      FROM drizzle.__drizzle_migrations
    `);

    if (migrationResult.rows[0]?.migration_count !== "2") {
      throw new Error("Expected exactly two applied migrations.");
    }

    const foreignKeyResult = await verificationClient.query<{
      constraint_name: string;
    }>(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'watchlist_items'
        AND constraint_type = 'FOREIGN KEY'
    `);

    const foreignKeyNames = foreignKeyResult.rows.map(
      ({ constraint_name }) => constraint_name,
    );

    if (
      foreignKeyNames.length !== 1 ||
      foreignKeyNames[0] !== "watchlist_items_user_id_fkey"
    ) {
      throw new Error(
        `Unexpected watchlist foreign keys: ${foreignKeyNames.join(", ")}`,
      );
    }

    const userId = randomUUID();

    await verificationClient.query(
      `INSERT INTO neon_auth."user" (id) VALUES ($1)`,
      [userId],
    );
    await verificationClient.query(
      `
        INSERT INTO public.watchlist_items (
          user_id,
          media_id,
          media_type,
          title,
          poster_path,
          backdrop_path
        )
        VALUES ($1, 1, 'movie', 'Migration smoke test', '', '')
      `,
      [userId],
    );
    await verificationClient.query(
      `DELETE FROM neon_auth."user" WHERE id = $1`,
      [userId],
    );

    const cascadeResult = await verificationClient.query<{
      item_count: string;
    }>(
      `
        SELECT count(*)::text AS item_count
        FROM public.watchlist_items
        WHERE user_id = $1
      `,
      [userId],
    );

    if (cascadeResult.rows[0]?.item_count !== "0") {
      throw new Error("The user foreign key did not cascade deletes.");
    }
  } finally {
    await verificationClient.end();
  }

  console.log("Migration smoke test passed.");
}

main().catch((error) => {
  console.error("Migration smoke test failed:", error);
  process.exit(1);
});
