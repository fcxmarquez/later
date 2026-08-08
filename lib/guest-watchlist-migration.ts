import "client-only";

import {
  clearGuestWatchlistSnapshot,
  readGuestWatchlist,
} from "@/lib/guest-storage";
import type { SavedMedia } from "@/lib/types";
import { createWatchlistMigrationCoordinator } from "@/lib/watchlist-migration-coordinator";
import { useWatchlist } from "@/store/watchlist";

const coordinator = createWatchlistMigrationCoordinator<SavedMedia>(
  {
    read: readGuestWatchlist,
    migrate: (items) => useWatchlist.getState().migrateGuestItems([...items]),
    clear: clearGuestWatchlistSnapshot,
    onFailure: (outcome) =>
      useWatchlist.setState({
        error:
          outcome === "invalid-backup" ? "migrationInvalid" : "migrationFailed",
      }),
    waitBeforeRetry: (attempt) =>
      new Promise((resolve) => window.setTimeout(resolve, attempt * 500)),
  },
  { maxMigrationAttempts: 2, maxSnapshotChanges: 3 },
);

export function migrateGuestWatchlist() {
  return coordinator.migrate();
}
