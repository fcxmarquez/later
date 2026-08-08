import "server-only";

import { getDb } from "@/lib/db";
import type { MediaItem, MediaType, SavedMedia } from "@/lib/types";
import { createWatchlistRepository } from "@/lib/watchlist-repository";

function getWatchlistRepository() {
  return createWatchlistRepository(getDb());
}

export async function getWatchlist(userId: string) {
  return getWatchlistRepository().getWatchlist(userId);
}

export async function saveWatchlistItem(userId: string, item: MediaItem) {
  return getWatchlistRepository().saveWatchlistItem(userId, item);
}

export async function migrateWatchlistItems(
  userId: string,
  items: SavedMedia[],
) {
  const repository = getWatchlistRepository();
  await repository.migrateWatchlistItems(userId, items);
  return repository.getWatchlist(userId);
}

export async function setWatchlistItemWatched(
  userId: string,
  mediaId: number,
  mediaType: MediaType,
  watched: boolean,
) {
  return getWatchlistRepository().setWatchlistItemWatched(
    userId,
    mediaId,
    mediaType,
    watched,
  );
}

export async function deleteWatchlistItem(
  userId: string,
  mediaId: number,
  mediaType: MediaType,
) {
  return getWatchlistRepository().deleteWatchlistItem(
    userId,
    mediaId,
    mediaType,
  );
}
