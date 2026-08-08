"use client";

import { LoaderCircle, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { migrateGuestWatchlist } from "@/lib/guest-watchlist-migration";
import { useWatchlist } from "@/store/watchlist";

export function WatchlistErrorToast() {
  const t = useTranslations("WatchlistErrors");
  const error = useWatchlist((state) => state.error);
  const isMigrating = useWatchlist((state) => state.isMigrating);
  const clearError = useWatchlist((state) => state.clearError);

  if (isMigrating) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 z-[80] flex w-[calc(100%-max(1rem,env(safe-area-inset-left))-max(1rem,env(safe-area-inset-right)))] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border border-blue-400/20 bg-blue-950/95 px-4 py-3 text-sm text-blue-100 shadow-2xl backdrop-blur sm:bottom-6"
      >
        <LoaderCircle className="shrink-0 animate-spin" size={18} />
        <span>{t("syncing")}</span>
      </div>
    );
  }

  if (!error) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 z-[80] flex w-[calc(100%-max(1rem,env(safe-area-inset-left))-max(1rem,env(safe-area-inset-right)))] max-w-md -translate-x-1/2 items-center justify-between gap-4 rounded-2xl border border-red-400/20 bg-red-950/95 px-4 py-3 text-sm text-red-100 shadow-2xl backdrop-blur sm:bottom-6"
    >
      <span className="flex-1">{t(error)}</span>
      {error === "migrationFailed" ? (
        <button
          type="button"
          onClick={() => void migrateGuestWatchlist()}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 font-semibold hover:bg-white/10"
        >
          <RefreshCw size={16} />
          {t("retry")}
        </button>
      ) : null}
      <button
        type="button"
        onClick={clearError}
        className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-white/10"
        aria-label={t("dismiss")}
      >
        <X size={17} />
      </button>
    </div>
  );
}
