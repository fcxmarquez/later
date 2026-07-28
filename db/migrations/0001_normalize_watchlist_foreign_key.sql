DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'watchlist_items_user_id_neon_auth_user_id_fk'
      AND conrelid = 'public.watchlist_items'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'watchlist_items_user_id_fkey'
        AND conrelid = 'public.watchlist_items'::regclass
    ) THEN
      ALTER TABLE public.watchlist_items
        DROP CONSTRAINT "watchlist_items_user_id_neon_auth_user_id_fk";
    ELSE
      ALTER TABLE public.watchlist_items
        RENAME CONSTRAINT "watchlist_items_user_id_neon_auth_user_id_fk"
        TO "watchlist_items_user_id_fkey";
    END IF;
  END IF;
END $$;
