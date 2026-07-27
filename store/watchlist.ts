"use client";

import { create } from "zustand";
import type { MediaItem, SavedMedia } from "@/lib/types";
import {
  clearGuestWatchlist,
  isSavedMedia,
  loadGuestWatchlist,
  saveGuestWatchlist,
} from "@/lib/guest-storage";

export type WatchlistMode = "guest" | "authenticated";

type MediaIdentity = Pick<MediaItem, "id" | "mediaType">;

type WatchlistStore = {
  items: SavedMedia[];
  mode: WatchlistMode | null;
  initialized: boolean;
  error: string | null;
  initialize: (items: SavedMedia[], mode: WatchlistMode) => void;
  clearError: () => void;
  add: (item: MediaItem) => Promise<boolean>;
  remove: (item: MediaIdentity) => Promise<boolean>;
  toggleWatched: (item: MediaIdentity) => Promise<boolean>;
  has: (item: MediaIdentity) => boolean;
};

function isSameMedia(
  left: Pick<SavedMedia, "id" | "mediaType">,
  right: MediaIdentity,
) {
  return left.id === right.id && left.mediaType === right.mediaType;
}

async function requestWatchlist(
  method: "POST" | "PATCH" | "DELETE",
  body: MediaItem | (MediaIdentity & { watched?: boolean }),
) {
  const response = await fetch("/api/watchlist", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("No se pudo guardar el cambio en Postgres.");
  }

  if (response.status === 204) return null;
  return (await response.json()) as { item: SavedMedia };
}

function persistGuestItems(items: SavedMedia[]) {
  saveGuestWatchlist(items);
}

export const useWatchlist = create<WatchlistStore>((set, get) => ({
  items: [],
  mode: null,
  initialized: false,
  error: null,
  initialize: (items, mode) => {
    if (get().initialized) return;

    if (mode === "guest") {
      set({
        items: loadGuestWatchlist(),
        mode,
        initialized: true,
        error: null,
      });
      return;
    }

    set({ items, mode, initialized: true, error: null });
  },
  clearError: () => set({ error: null }),
  add: async (item) => {
    if (get().items.some((saved) => isSameMedia(saved, item))) return true;

    const optimisticItem: SavedMedia = {
      ...item,
      watched: false,
      addedAt: Date.now(),
    };

    const nextItems = [...get().items, optimisticItem];
    set({ items: nextItems, error: null });

    if (get().mode === "guest") {
      persistGuestItems(nextItems);
      return true;
    }

    try {
      const result = await requestWatchlist("POST", item);
      if (result) {
        set((state) => ({
          items: state.items.map((saved) =>
            isSameMedia(saved, item) ? result.item : saved,
          ),
        }));
      }
      return true;
    } catch {
      set((state) => ({
        items: state.items.filter((saved) => !isSameMedia(saved, item)),
        error: "No pudimos añadir el título. Inténtalo de nuevo.",
      }));
      return false;
    }
  },
  remove: async (item) => {
    const removed = get().items.find((saved) => isSameMedia(saved, item));
    if (!removed) return true;

    const nextItems = get().items.filter((saved) => !isSameMedia(saved, item));
    set({ items: nextItems, error: null });

    if (get().mode === "guest") {
      persistGuestItems(nextItems);
      return true;
    }

    try {
      await requestWatchlist("DELETE", item);
      return true;
    } catch {
      set((state) => ({
        items: [...state.items, removed].sort(
          (left, right) => left.addedAt - right.addedAt,
        ),
        error: "No pudimos quitar el título. Inténtalo de nuevo.",
      }));
      return false;
    }
  },
  toggleWatched: async (item) => {
    const saved = get().items.find((entry) => isSameMedia(entry, item));
    if (!saved) return false;

    const watched = !saved.watched;
    const nextItems = get().items.map((entry) =>
      isSameMedia(entry, item) ? { ...entry, watched } : entry,
    );
    set({ items: nextItems, error: null });

    if (get().mode === "guest") {
      persistGuestItems(nextItems);
      return true;
    }

    try {
      const result = await requestWatchlist("PATCH", { ...item, watched });
      if (result) {
        set((state) => ({
          items: state.items.map((entry) =>
            isSameMedia(entry, item) ? result.item : entry,
          ),
        }));
      }
      return true;
    } catch {
      set((state) => ({
        items: state.items.map((entry) =>
          isSameMedia(entry, item) ? { ...entry, watched: saved.watched } : entry,
        ),
        error: "No pudimos cambiar el estado. Inténtalo de nuevo.",
      }));
      return false;
    }
  },
  has: (item) => get().items.some((saved) => isSameMedia(saved, item)),
}));

export { clearGuestWatchlist, isSavedMedia as isLegacySavedMedia };
