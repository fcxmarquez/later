import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    userId: uuid("user_id").notNull(),
    mediaId: integer("media_id").notNull(),
    mediaType: text("media_type").notNull(),
    title: text("title").notNull(),
    overview: text("overview").notNull().default(""),
    posterPath: text("poster_path").notNull(),
    backdropPath: text("backdrop_path").notNull(),
    releaseYear: text("release_year").notNull().default(""),
    rating: doublePrecision("rating").notNull().default(0),
    genres: text("genres")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    watched: boolean("watched").notNull().default(false),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "watchlist_items_pkey",
      columns: [table.userId, table.mediaType, table.mediaId],
    }),
    check(
      "watchlist_items_media_type_check",
      sql`${table.mediaType} in ('movie', 'tv')`,
    ),
    check(
      "watchlist_items_rating_check",
      sql`${table.rating} >= 0 and ${table.rating} <= 10`,
    ),
    index("watchlist_items_user_added_at_idx").on(
      table.userId,
      table.addedAt.desc(),
    ),
  ],
);
