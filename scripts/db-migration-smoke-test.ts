import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { watchlistItems } from "../db/schema";
import { createWatchlistRepository } from "../lib/watchlist-repository";
import type { MediaItem } from "../lib/types";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { runMigrations } from "./db-migration-runner";

function readExpectedMigrationHashes(migrationsFolder: string) {
  const journalPath = join(migrationsFolder, "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
    entries?: Array<{ tag?: unknown }>;
  };

  assert.ok(Array.isArray(journal.entries), "Migration journal is invalid.");

  return journal.entries.map((entry) => {
    assert.equal(
      typeof entry.tag,
      "string",
      "Migration journal entry is missing its tag.",
    );

    const migrationSql = readFileSync(
      join(migrationsFolder, `${entry.tag}.sql`),
    );

    return createHash("sha256").update(migrationSql).digest("hex");
  });
}

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
  const expectedMigrationHashes = readExpectedMigrationHashes(migrationsFolder);

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
      hash: string;
    }>(`
      SELECT hash
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at
    `);

    assert.deepEqual(
      migrationResult.rows.map(({ hash }) => hash),
      expectedMigrationHashes,
      "Applied migrations do not match the journaled SQL history.",
    );

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

    assert.deepEqual(
      foreignKeyNames,
      ["watchlist_items_user_id_fkey"],
      `Unexpected watchlist foreign keys: ${foreignKeyNames.join(", ")}`,
    );

    const userId = randomUUID();
    const db = drizzle(verificationClient, {
      schema: { watchlistItems },
    });
    const watchlist = createWatchlistRepository(db);
    const mediaItem: MediaItem = {
      id: 1,
      mediaType: "movie",
      title: "Migration smoke test",
      overview: "Initial overview",
      posterPath: "/poster.jpg",
      backdropPath: "/backdrop.jpg",
      year: "2026",
      rating: 7.5,
      genres: ["Drama"],
    };

    await verificationClient.query(
      `INSERT INTO neon_auth."user" (id) VALUES ($1)`,
      [userId],
    );

    const savedItem = await watchlist.saveWatchlistItem(userId, mediaItem);
    assert.equal(savedItem.title, mediaItem.title);
    assert.equal(savedItem.watched, false);
    assert.ok(Number.isFinite(savedItem.addedAt));

    const watchedItem = await watchlist.setWatchlistItemWatched(
      userId,
      mediaItem.id,
      mediaItem.mediaType,
      true,
    );
    assert.equal(watchedItem?.watched, true);

    const updatedItem = await watchlist.saveWatchlistItem(userId, {
      ...mediaItem,
      title: "Updated migration smoke test",
      rating: 8.5,
      genres: ["Drama", "Science Fiction"],
    });
    assert.equal(updatedItem.title, "Updated migration smoke test");
    assert.equal(updatedItem.watched, true);
    assert.equal(updatedItem.addedAt, savedItem.addedAt);

    const savedWatchlist = await watchlist.getWatchlist(userId);
    assert.equal(savedWatchlist.length, 1);
    assert.equal(savedWatchlist[0]?.title, updatedItem.title);

    const missingItem = await watchlist.setWatchlistItemWatched(
      userId,
      999,
      "movie",
      true,
    );
    assert.equal(missingItem, null);

    assert.equal(
      await watchlist.deleteWatchlistItem(
        userId,
        mediaItem.id,
        mediaItem.mediaType,
      ),
      true,
    );
    assert.equal(
      await watchlist.deleteWatchlistItem(
        userId,
        mediaItem.id,
        mediaItem.mediaType,
      ),
      false,
    );
    assert.deepEqual(await watchlist.getWatchlist(userId), []);

    await watchlist.saveWatchlistItem(userId, {
      ...mediaItem,
      id: 2,
      mediaType: "tv",
    });
    await verificationClient.query(
      `DELETE FROM neon_auth."user" WHERE id = $1`,
      [userId],
    );

    assert.deepEqual(
      await watchlist.getWatchlist(userId),
      [],
      "The user foreign key did not cascade deletes.",
    );
  } finally {
    await verificationClient.end();
  }

  console.log("Migration smoke test passed.");
}

main().catch((error) => {
  console.error("Migration smoke test failed:", error);
  process.exit(1);
});
