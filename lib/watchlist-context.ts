import "server-only";

import { isAuthConfigured } from "@/lib/auth/config";
import { getAuth } from "@/lib/auth/server";
import type { SavedMedia, WatchlistMode } from "@/lib/types";
import { getWatchlist } from "@/lib/watchlist";

export type WatchlistContext = {
  mode: WatchlistMode;
  user: { name: string } | null;
  initialWatchlist: SavedMedia[];
};

export async function getWatchlistContext(): Promise<WatchlistContext> {
  if (!isAuthConfigured()) {
    return { mode: "guest", user: null, initialWatchlist: [] };
  }

  const { data: session } = await getAuth().getSession();
  if (!session?.user) {
    return { mode: "guest", user: null, initialWatchlist: [] };
  }

  return {
    mode: "authenticated",
    user: { name: session.user.name },
    initialWatchlist: await getWatchlist(session.user.id),
  };
}
