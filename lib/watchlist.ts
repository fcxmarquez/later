import "server-only";

import { getSql } from "@/lib/db";
import type { MediaItem, MediaType, SavedMedia } from "@/lib/types";

type WatchlistRow = {
  media_id: number;
  media_type: MediaType;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_year: string;
  rating: number;
  genres: string[];
  watched: boolean;
  added_at: string | Date;
};

function toSavedMedia(row: WatchlistRow): SavedMedia {
  return {
    id: row.media_id,
    mediaType: row.media_type,
    title: row.title,
    overview: row.overview,
    posterPath: row.poster_path,
    backdropPath: row.backdrop_path,
    year: row.release_year,
    rating: row.rating,
    genres: row.genres,
    watched: row.watched,
    addedAt: new Date(row.added_at).getTime(),
  };
}

export async function getWatchlist(userId: string) {
  const rows = await getSql()`
    SELECT
      media_id,
      media_type,
      title,
      overview,
      poster_path,
      backdrop_path,
      release_year,
      rating,
      genres,
      watched,
      added_at
    FROM public.watchlist_items
    WHERE user_id = ${userId}
    ORDER BY added_at ASC
  `;

  return (rows as WatchlistRow[]).map(toSavedMedia);
}

export async function saveWatchlistItem(userId: string, item: MediaItem) {
  const rows = await getSql()`
    INSERT INTO public.watchlist_items (
      user_id,
      media_id,
      media_type,
      title,
      overview,
      poster_path,
      backdrop_path,
      release_year,
      rating,
      genres
    )
    VALUES (
      ${userId},
      ${item.id},
      ${item.mediaType},
      ${item.title},
      ${item.overview},
      ${item.posterPath},
      ${item.backdropPath},
      ${item.year},
      ${item.rating},
      ${item.genres}
    )
    ON CONFLICT (user_id, media_type, media_id)
    DO UPDATE SET
      title = EXCLUDED.title,
      overview = EXCLUDED.overview,
      poster_path = EXCLUDED.poster_path,
      backdrop_path = EXCLUDED.backdrop_path,
      release_year = EXCLUDED.release_year,
      rating = EXCLUDED.rating,
      genres = EXCLUDED.genres,
      updated_at = now()
    RETURNING
      media_id,
      media_type,
      title,
      overview,
      poster_path,
      backdrop_path,
      release_year,
      rating,
      genres,
      watched,
      added_at
  `;

  return toSavedMedia(rows[0] as WatchlistRow);
}

export async function setWatchlistItemWatched(
  userId: string,
  mediaId: number,
  mediaType: MediaType,
  watched: boolean,
) {
  const rows = await getSql()`
    UPDATE public.watchlist_items
    SET watched = ${watched}, updated_at = now()
    WHERE user_id = ${userId}
      AND media_id = ${mediaId}
      AND media_type = ${mediaType}
    RETURNING
      media_id,
      media_type,
      title,
      overview,
      poster_path,
      backdrop_path,
      release_year,
      rating,
      genres,
      watched,
      added_at
  `;

  const row = rows[0] as WatchlistRow | undefined;
  return row ? toSavedMedia(row) : null;
}

export async function deleteWatchlistItem(
  userId: string,
  mediaId: number,
  mediaType: MediaType,
) {
  const rows = await getSql()`
    DELETE FROM public.watchlist_items
    WHERE user_id = ${userId}
      AND media_id = ${mediaId}
      AND media_type = ${mediaType}
    RETURNING media_id
  `;

  return rows.length > 0;
}
