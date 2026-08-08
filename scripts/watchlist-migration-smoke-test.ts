import assert from "node:assert/strict";
import { createWatchlistMigrationCoordinator } from "../lib/watchlist-migration-coordinator";

type Item = { id: number };

async function verifySingleFlightMigration() {
  let finishMigration: ((value: boolean) => void) | undefined;
  const pendingMigration = new Promise<boolean>((resolve) => {
    finishMigration = resolve;
  });
  let migrationCalls = 0;
  let clearCalls = 0;

  const coordinator = createWatchlistMigrationCoordinator<Item>({
    read: () => ({
      status: "ready",
      raw: "guest-snapshot",
      items: [{ id: 1 }],
    }),
    migrate: async () => {
      migrationCalls += 1;
      return pendingMigration;
    },
    clear: (raw) => {
      assert.equal(raw, "guest-snapshot");
      clearCalls += 1;
      return "cleared";
    },
  });

  const first = coordinator.migrate();
  const second = coordinator.migrate();
  assert.equal(
    first,
    second,
    "Concurrent callers did not share one migration.",
  );
  assert.equal(migrationCalls, 1);

  finishMigration?.(true);
  assert.equal(await first, "migrated");
  assert.equal(await second, "migrated");
  assert.equal(clearCalls, 1);
}

async function verifyFailedMigrationKeepsBackup() {
  let migrationCalls = 0;
  let clearCalls = 0;
  let failureCalls = 0;

  const coordinator = createWatchlistMigrationCoordinator<Item>(
    {
      read: () => ({
        status: "ready",
        raw: "guest-snapshot",
        items: [{ id: 1 }],
      }),
      migrate: async () => {
        migrationCalls += 1;
        return false;
      },
      clear: () => {
        clearCalls += 1;
        return "cleared";
      },
      onFailure: () => {
        failureCalls += 1;
      },
      waitBeforeRetry: async () => undefined,
    },
    { maxMigrationAttempts: 2 },
  );

  assert.equal(await coordinator.migrate(), "failed");
  assert.equal(migrationCalls, 2);
  assert.equal(clearCalls, 0, "A failed migration cleared the backup.");
  assert.equal(failureCalls, 1);
}

async function verifyInvalidBackupIsPreserved() {
  let clearCalls = 0;
  let migrationCalls = 0;

  const coordinator = createWatchlistMigrationCoordinator<Item>({
    read: () => ({ status: "invalid" }),
    migrate: async () => {
      migrationCalls += 1;
      return true;
    },
    clear: () => {
      clearCalls += 1;
      return "cleared";
    },
  });

  assert.equal(await coordinator.migrate(), "invalid-backup");
  assert.equal(migrationCalls, 0);
  assert.equal(clearCalls, 0, "An invalid backup was deleted.");
}

async function verifyChangedSnapshotIsMigratedBeforeClearing() {
  const snapshots = [
    { status: "ready" as const, raw: "first", items: [{ id: 1 }] },
    { status: "ready" as const, raw: "second", items: [{ id: 1 }, { id: 2 }] },
  ];
  const migratedIds: number[][] = [];
  const clearedSnapshots: string[] = [];

  const coordinator = createWatchlistMigrationCoordinator<Item>({
    read: () => snapshots.shift() ?? { status: "missing" },
    migrate: async (items) => {
      migratedIds.push(items.map(({ id }) => id));
      return true;
    },
    clear: (raw) => {
      clearedSnapshots.push(raw);
      return raw === "first" ? "changed" : "cleared";
    },
  });

  assert.equal(await coordinator.migrate(), "migrated");
  assert.deepEqual(migratedIds, [[1], [1, 2]]);
  assert.deepEqual(clearedSnapshots, ["first", "second"]);
}

async function main() {
  await verifySingleFlightMigration();
  await verifyFailedMigrationKeepsBackup();
  await verifyInvalidBackupIsPreserved();
  await verifyChangedSnapshotIsMigratedBeforeClearing();
  console.log("Watchlist migration smoke test passed.");
}

main().catch((error) => {
  console.error("Watchlist migration smoke test failed:", error);
  process.exit(1);
});
