import "server-only";

import { watchlistItems } from "@/db/schema";
import { getDb } from "@/lib/db";
import type { MediaItem, MediaType, SavedMedia } from "@/lib/types";
import { and, asc, eq, sql } from "drizzle-orm";

type WatchlistRow = typeof watchlistItems.$inferSelect;

function toSavedMedia(row: WatchlistRow): SavedMedia {
  return {
    id: row.mediaId,
    mediaType: row.mediaType as MediaType,
    title: row.title,
    overview: row.overview,
    posterPath: row.posterPath,
    backdropPath: row.backdropPath,
    year: row.releaseYear,
    rating: row.rating,
    genres: row.genres,
    watched: row.watched,
    addedAt: new Date(row.addedAt).getTime(),
  };
}

export async function getWatchlist(userId: string) {
  const rows = await getDb()
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.userId, userId))
    .orderBy(asc(watchlistItems.addedAt));

  return rows.map(toSavedMedia);
}

export async function saveWatchlistItem(userId: string, item: MediaItem) {
  const [row] = await getDb()
    .insert(watchlistItems)
    .values({
      userId,
      mediaId: item.id,
      mediaType: item.mediaType,
      title: item.title,
      overview: item.overview,
      posterPath: item.posterPath,
      backdropPath: item.backdropPath,
      releaseYear: item.year,
      rating: item.rating,
      genres: item.genres,
    })
    .onConflictDoUpdate({
      target: [
        watchlistItems.userId,
        watchlistItems.mediaType,
        watchlistItems.mediaId,
      ],
      set: {
        title: item.title,
        overview: item.overview,
        posterPath: item.posterPath,
        backdropPath: item.backdropPath,
        releaseYear: item.year,
        rating: item.rating,
        genres: item.genres,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  return toSavedMedia(row);
}

export async function setWatchlistItemWatched(
  userId: string,
  mediaId: number,
  mediaType: MediaType,
  watched: boolean,
) {
  const [row] = await getDb()
    .update(watchlistItems)
    .set({
      watched,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(watchlistItems.userId, userId),
        eq(watchlistItems.mediaId, mediaId),
        eq(watchlistItems.mediaType, mediaType),
      ),
    )
    .returning();

  return row ? toSavedMedia(row) : null;
}

export async function deleteWatchlistItem(
  userId: string,
  mediaId: number,
  mediaType: MediaType,
) {
  const rows = await getDb()
    .delete(watchlistItems)
    .where(
      and(
        eq(watchlistItems.userId, userId),
        eq(watchlistItems.mediaId, mediaId),
        eq(watchlistItems.mediaType, mediaType),
      ),
    )
    .returning({ mediaId: watchlistItems.mediaId });

  return rows.length > 0;
}
