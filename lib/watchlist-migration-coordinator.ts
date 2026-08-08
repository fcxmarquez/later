export type WatchlistMigrationSnapshot<Item> =
  | { status: "missing" }
  | { status: "invalid"; items?: Item[] }
  | { status: "ready"; raw: string; items: Item[] };

export type WatchlistSnapshotClearResult = "cleared" | "changed" | "failed";

export type WatchlistMigrationOutcome =
  "nothing-to-migrate" | "migrated" | "invalid-backup" | "failed";

type WatchlistMigrationDependencies<Item> = {
  read: () => WatchlistMigrationSnapshot<Item>;
  migrate: (items: readonly Item[]) => Promise<boolean>;
  clear: (raw: string) => WatchlistSnapshotClearResult;
  onFailure?: (outcome: "invalid-backup" | "failed") => void;
  waitBeforeRetry?: (attempt: number) => Promise<void>;
};

type WatchlistMigrationOptions = {
  maxMigrationAttempts?: number;
  maxSnapshotChanges?: number;
};

export function createWatchlistMigrationCoordinator<Item>(
  dependencies: WatchlistMigrationDependencies<Item>,
  options: WatchlistMigrationOptions = {},
) {
  const maxMigrationAttempts = options.maxMigrationAttempts ?? 2;
  const maxSnapshotChanges = options.maxSnapshotChanges ?? 3;
  let activeMigration: Promise<WatchlistMigrationOutcome> | null = null;

  const fail = (outcome: "invalid-backup" | "failed") => {
    dependencies.onFailure?.(outcome);
    return outcome;
  };

  const run = async (): Promise<WatchlistMigrationOutcome> => {
    let migratedAnyItems = false;

    try {
      for (
        let snapshotAttempt = 0;
        snapshotAttempt < maxSnapshotChanges;
        snapshotAttempt += 1
      ) {
        const snapshot = dependencies.read();

        if (snapshot.status === "missing") {
          return migratedAnyItems ? "migrated" : "nothing-to-migrate";
        }

        if (snapshot.status === "invalid") {
          return fail("invalid-backup");
        }

        if (snapshot.items.length > 0) {
          let migrated = false;

          for (let attempt = 1; attempt <= maxMigrationAttempts; attempt += 1) {
            migrated = await dependencies.migrate(snapshot.items);
            if (migrated) break;

            if (attempt < maxMigrationAttempts) {
              await dependencies.waitBeforeRetry?.(attempt);
            }
          }

          if (!migrated) return fail("failed");
          migratedAnyItems = true;
        }

        const clearResult = dependencies.clear(snapshot.raw);
        if (clearResult === "cleared") {
          return migratedAnyItems ? "migrated" : "nothing-to-migrate";
        }
        if (clearResult === "failed") return fail("failed");
      }
    } catch {
      return fail("failed");
    }

    return fail("failed");
  };

  return {
    migrate() {
      if (activeMigration) return activeMigration;

      const migration = run().finally(() => {
        if (activeMigration === migration) activeMigration = null;
      });
      activeMigration = migration;
      return migration;
    },
  };
}
