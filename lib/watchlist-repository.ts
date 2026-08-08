import { watchlistItems } from "@/db/schema";
import type { MediaItem, MediaType, SavedMedia } from "@/lib/types";
import { and, desc, eq, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

type WatchlistRow = typeof watchlistItems.$inferSelect;
type WatchlistSchema = { watchlistItems: typeof watchlistItems };
type WatchlistDatabase<TQueryResult extends PgQueryResultHKT> = PgDatabase<
  TQueryResult,
  WatchlistSchema
>;

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

export function createWatchlistRepository<
  TQueryResult extends PgQueryResultHKT,
>(db: WatchlistDatabase<TQueryResult>) {
  return {
    async getWatchlist(userId: string) {
      const rows = await db
        .select()
        .from(watchlistItems)
        .where(eq(watchlistItems.userId, userId))
        .orderBy(desc(watchlistItems.addedAt));

      return rows.map(toSavedMedia);
    },

    async saveWatchlistItem(userId: string, item: MediaItem) {
      const [row] = await db
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
    },

    async migrateWatchlistItems(userId: string, items: SavedMedia[]) {
      if (items.length === 0) return [];

      const rows = await db
        .insert(watchlistItems)
        .values(
          items.map((item) => ({
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
            watched: item.watched,
            addedAt: new Date(item.addedAt),
          })),
        )
        .onConflictDoUpdate({
          target: [
            watchlistItems.userId,
            watchlistItems.mediaType,
            watchlistItems.mediaId,
          ],
          set: {
            watched: sql`excluded.watched`,
            updatedAt: sql`now()`,
          },
          setWhere: sql`not ${watchlistItems.watched} and excluded.watched`,
        })
        .returning();

      return rows.map(toSavedMedia);
    },

    async setWatchlistItemWatched(
      userId: string,
      mediaId: number,
      mediaType: MediaType,
      watched: boolean,
    ) {
      const [row] = await db
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
    },

    async deleteWatchlistItem(
      userId: string,
      mediaId: number,
      mediaType: MediaType,
    ) {
      const rows = await db
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
    },
  };
}
