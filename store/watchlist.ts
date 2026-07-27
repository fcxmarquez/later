"use client";

import { create } from "zustand";
import type { MediaItem, SavedMedia } from "@/lib/types";

type MediaIdentity = Pick<MediaItem, "id" | "mediaType">;

type WatchlistStore = {
  items: SavedMedia[];
  initialized: boolean;
  error: string | null;
  initialize: (items: SavedMedia[]) => void;
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

export const useWatchlist = create<WatchlistStore>((set, get) => ({
  items: [],
  initialized: false,
  error: null,
  initialize: (items) =>
    set((state) => (state.initialized ? state : { items, initialized: true })),
  clearError: () => set({ error: null }),
  add: async (item) => {
    if (get().items.some((saved) => isSameMedia(saved, item))) return true;

    const optimisticItem: SavedMedia = {
      ...item,
      watched: false,
      addedAt: Date.now(),
    };

    set((state) => ({
      items: [...state.items, optimisticItem],
      error: null,
    }));

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

    set((state) => ({
      items: state.items.filter((saved) => !isSameMedia(saved, item)),
      error: null,
    }));

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
    set((state) => ({
      items: state.items.map((entry) =>
        isSameMedia(entry, item) ? { ...entry, watched } : entry,
      ),
      error: null,
    }));

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

export function isLegacySavedMedia(value: unknown): value is SavedMedia {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SavedMedia>;

  return (
    Number.isInteger(item.id) &&
    (item.mediaType === "movie" || item.mediaType === "tv") &&
    typeof item.title === "string" &&
    typeof item.overview === "string" &&
    typeof item.posterPath === "string" &&
    typeof item.backdropPath === "string" &&
    typeof item.year === "string" &&
    typeof item.rating === "number" &&
    Array.isArray(item.genres) &&
    item.genres.every((genre) => typeof genre === "string") &&
    typeof item.watched === "boolean" &&
    typeof item.addedAt === "number"
  );
}
