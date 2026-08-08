import "client-only";

import type { SavedMedia } from "@/lib/types";

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
    if (
      parsed.version !== undefined &&
      parsed.version !== GUEST_WATCHLIST_VERSION
    ) {
      return [];
    }
    return (parsed.state?.items?.filter(isSavedMedia) ?? []).sort(
      (left, right) => right.addedAt - left.addedAt,
    );
  } catch {
    return [];
  }
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

export function clearGuestWatchlist(): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.removeItem(GUEST_WATCHLIST_KEY);
    return true;
  } catch {
    return false;
  }
}
