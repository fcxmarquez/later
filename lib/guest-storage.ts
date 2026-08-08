import "client-only";

import type { SavedMedia } from "@/lib/types";
import type {
  WatchlistMigrationSnapshot,
  WatchlistSnapshotClearResult,
} from "@/lib/watchlist-migration-coordinator";

export const GUEST_WATCHLIST_KEY = "later-watchlist";
const GUEST_WATCHLIST_VERSION = 1;

type StoredWatchlist = {
  version?: number;
  state?: {
    items?: unknown[];
  };
};

export function isSavedMedia(value: unknown): value is SavedMedia {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SavedMedia>;

  return (
    Number.isInteger(item.id) &&
    Number(item.id) > 0 &&
    (item.mediaType === "movie" || item.mediaType === "tv") &&
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    typeof item.overview === "string" &&
    typeof item.posterPath === "string" &&
    typeof item.backdropPath === "string" &&
    typeof item.year === "string" &&
    typeof item.rating === "number" &&
    Number.isFinite(item.rating) &&
    item.rating >= 0 &&
    item.rating <= 10 &&
    Array.isArray(item.genres) &&
    item.genres.every((genre) => typeof genre === "string") &&
    typeof item.watched === "boolean" &&
    typeof item.addedAt === "number" &&
    Number.isFinite(item.addedAt) &&
    item.addedAt >= 0 &&
    item.addedAt <= 8.64e15
  );
}

export function readGuestWatchlist(): WatchlistMigrationSnapshot<SavedMedia> {
  if (typeof window === "undefined") return { status: "missing" };

  try {
    const raw = window.localStorage.getItem(GUEST_WATCHLIST_KEY);
    if (raw === null) return { status: "missing" };

    const parsed = JSON.parse(raw) as StoredWatchlist;
    if (
      parsed.version !== undefined &&
      parsed.version !== GUEST_WATCHLIST_VERSION
    ) {
      return { status: "invalid" };
    }
    const items = parsed.state?.items;
    if (!Array.isArray(items)) {
      return { status: "invalid" };
    }

    const validItems = items
      .filter(isSavedMedia)
      .sort((left, right) => right.addedAt - left.addedAt);
    if (validItems.length !== items.length) {
      return { status: "invalid", items: validItems };
    }

    return { status: "ready", raw, items: validItems };
  } catch {
    return { status: "invalid" };
  }
}

export function loadGuestWatchlist(): SavedMedia[] {
  const snapshot = readGuestWatchlist();
  return snapshot.status === "missing" ? [] : (snapshot.items ?? []);
}

export function saveGuestWatchlist(items: SavedMedia[]): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(
      GUEST_WATCHLIST_KEY,
      JSON.stringify({ version: GUEST_WATCHLIST_VERSION, state: { items } }),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearGuestWatchlistSnapshot(
  raw: string,
): WatchlistSnapshotClearResult {
  if (typeof window === "undefined") return "failed";

  try {
    const current = window.localStorage.getItem(GUEST_WATCHLIST_KEY);
    if (current === null) return "cleared";
    if (current !== raw) return "changed";

    window.localStorage.removeItem(GUEST_WATCHLIST_KEY);
    return window.localStorage.getItem(GUEST_WATCHLIST_KEY) === null
      ? "cleared"
      : "failed";
  } catch {
    return "failed";
  }
}
