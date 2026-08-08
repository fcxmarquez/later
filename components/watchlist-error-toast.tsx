"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useWatchlist } from "@/store/watchlist";

export function WatchlistErrorToast() {
  const t = useTranslations("WatchlistErrors");
  const error = useWatchlist((state) => state.error);
  const clearError = useWatchlist((state) => state.clearError);

  if (!error) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 z-[80] flex w-[calc(100%-max(1rem,env(safe-area-inset-left))-max(1rem,env(safe-area-inset-right)))] max-w-md -translate-x-1/2 items-center justify-between gap-4 rounded-2xl border border-red-400/20 bg-red-950/95 px-4 py-3 text-sm text-red-100 shadow-2xl backdrop-blur sm:bottom-6"
    >
      <span>{t(error)}</span>
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
