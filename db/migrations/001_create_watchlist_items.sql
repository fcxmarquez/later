CREATE TABLE public.watchlist_items (
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  media_id integer NOT NULL,
  media_type text NOT NULL,
  title text NOT NULL,
  overview text NOT NULL DEFAULT '',
  poster_path text NOT NULL,
  backdrop_path text NOT NULL,
  release_year text NOT NULL DEFAULT '',
  rating double precision NOT NULL DEFAULT 0,
  genres text[] NOT NULL DEFAULT ARRAY[]::text[],
  watched boolean NOT NULL DEFAULT false,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT watchlist_items_pkey PRIMARY KEY (user_id, media_type, media_id),
  CONSTRAINT watchlist_items_media_type_check
    CHECK (media_type IN ('movie', 'tv')),
  CONSTRAINT watchlist_items_rating_check
    CHECK (rating >= 0 AND rating <= 10)
);

CREATE INDEX watchlist_items_user_added_at_idx
  ON public.watchlist_items (user_id, added_at DESC);

COMMENT ON TABLE public.watchlist_items IS
  'Movies and TV shows saved by an authenticated Neon Auth user.';
COMMENT ON COLUMN public.watchlist_items.user_id IS
  'References the managed Neon Auth user record.';
