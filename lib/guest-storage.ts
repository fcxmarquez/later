import type { SavedMedia } from "@/lib/types";

export const GUEST_WATCHLIST_KEY = "later-watchlist";

type StoredWatchlist = {
  state?: {
    items?: unknown[];
  };
};

export function isSavedMedia(value: unknown): value is SavedMedia {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SavedMedia>;

  return (
    Number.isInteger(item.id) &&
    (item.mediaType === "movie" || item.mediaType === "tv") &&
    typeof item.title === "string" &&
    typeof item.overview === "string" &&
    typeof item.posterPath === "string" &&
    typeof item.backdropPath === "string" &&
    typeof item.year === "string" &&
    typeof item.rating === "number" &&
    Array.isArray(item.genres) &&
    item.genres.every((genre) => typeof genre === "string") &&
    typeof item.watched === "boolean" &&
    typeof item.addedAt === "number"
  );
}

export function loadGuestWatchlist(): SavedMedia[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(GUEST_WATCHLIST_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as StoredWatchlist;
    return parsed.state?.items?.filter(isSavedMedia) ?? [];
  } catch {
    return [];
  }
}

export function saveGuestWatchlist(items: SavedMedia[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    GUEST_WATCHLIST_KEY,
    JSON.stringify({ state: { items } }),
  );
}

export function clearGuestWatchlist() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_WATCHLIST_KEY);
}
