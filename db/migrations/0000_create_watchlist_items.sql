CREATE TABLE IF NOT EXISTS "watchlist_items" (
	"user_id" uuid NOT NULL,
	"media_id" integer NOT NULL,
	"media_type" text NOT NULL,
	"title" text NOT NULL,
	"overview" text DEFAULT '' NOT NULL,
	"poster_path" text NOT NULL,
	"backdrop_path" text NOT NULL,
	"release_year" text DEFAULT '' NOT NULL,
	"rating" double precision DEFAULT 0 NOT NULL,
	"genres" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"watched" boolean DEFAULT false NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watchlist_items_pkey" PRIMARY KEY("user_id","media_type","media_id"),
	CONSTRAINT "watchlist_items_media_type_check" CHECK ("watchlist_items"."media_type" in ('movie', 'tv')),
	CONSTRAINT "watchlist_items_rating_check" CHECK ("watchlist_items"."rating" >= 0 and "watchlist_items"."rating" <= 10)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES neon_auth."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "watchlist_items_user_added_at_idx" ON "watchlist_items" USING btree ("user_id","added_at" DESC NULLS LAST);
--> statement-breakpoint
COMMENT ON TABLE "watchlist_items" IS 'Movies and TV shows saved by an authenticated Neon Auth user.';
--> statement-breakpoint
COMMENT ON COLUMN "watchlist_items"."user_id" IS 'References the managed Neon Auth user record.';
