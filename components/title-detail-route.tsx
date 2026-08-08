"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import type { MediaDetail, SavedMedia } from "@/lib/types";
import { type WatchlistMode, useWatchlist } from "@/store/watchlist";
import { DetailModal } from "./detail-modal";
import { WatchlistErrorToast } from "./watchlist-error-toast";

export function RoutedDetailModal({ detail }: { detail: MediaDetail }) {
  const router = useRouter();

  return (
    <>
      <DetailModal
        item={detail}
        initialDetail={detail}
        close={() => router.back()}
      />
      <WatchlistErrorToast />
    </>
  );
}

export function RoutedDetailPage({
  detail,
  mode,
  initialWatchlist,
}: {
  detail: MediaDetail;
  mode: WatchlistMode;
  initialWatchlist: SavedMedia[];
}) {
  const router = useRouter();
  const initialize = useWatchlist((state) => state.initialize);

  useEffect(() => {
    initialize(initialWatchlist, mode);
  }, [initialWatchlist, initialize, mode]);

  return (
    <>
      <DetailModal
        item={detail}
        initialDetail={detail}
        close={() => router.push("/")}
        presentation="page"
      />
      <WatchlistErrorToast />
    </>
  );
}
