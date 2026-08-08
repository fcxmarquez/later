"use client";

import { create } from "zustand";
import type { MediaItem, SavedMedia, WatchlistMode } from "@/lib/types";
import { loadGuestWatchlist, saveGuestWatchlist } from "@/lib/guest-storage";

type MediaIdentity = Pick<MediaItem, "id" | "mediaType">;

export type WatchlistErrorKey = "addFailed" | "removeFailed" | "toggleFailed";

type WatchlistStore = {
  items: SavedMedia[];
  mode: WatchlistMode | null;
  initialized: boolean;
  pendingItems: Record<string, true>;
  error: WatchlistErrorKey | null;
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

function mediaIdentityKey(item: MediaIdentity) {
  return `${item.mediaType}:${item.id}`;
}

function withoutPendingItem(pendingItems: Record<string, true>, key: string) {
  const nextPendingItems = { ...pendingItems };
  delete nextPendingItems[key];
  return nextPendingItems;
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
    throw new Error("watchlist-persist-failed");
  }

  if (response.status === 204) return null;
  return (await response.json()) as { item: SavedMedia };
}

export const useWatchlist = create<WatchlistStore>((set, get) => ({
  items: [],
  mode: null,
  initialized: false,
  pendingItems: {},
  error: null,
  initialize: (items, mode) => {
    if (get().initialized && get().mode === mode) return;

    if (mode === "guest") {
      set({
        items: loadGuestWatchlist(),
        mode,
        initialized: true,
        pendingItems: {},
        error: null,
      });
      return;
    }

    set({
      items,
      mode,
      initialized: true,
      pendingItems: {},
      error: null,
    });
  },
  clearError: () => set({ error: null }),
  add: async (item) => {
    const state = get();
    if (!state.initialized || !state.mode) return false;
    if (state.items.some((saved) => isSameMedia(saved, item))) return true;

    const key = mediaIdentityKey(item);
    if (state.pendingItems[key]) return false;

    const optimisticItem: SavedMedia = {
      ...item,
      watched: false,
      addedAt: Date.now(),
    };

    const nextItems = [optimisticItem, ...state.items];
    set((current) => ({
      items: nextItems,
      pendingItems: { ...current.pendingItems, [key]: true },
      error: null,
    }));

    try {
      if (state.mode === "guest") {
        if (!saveGuestWatchlist(nextItems)) {
          throw new Error("watchlist-persist-failed");
        }
        return true;
      }

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
        error: "addFailed",
      }));
      return false;
    } finally {
      set((current) => ({
        pendingItems: withoutPendingItem(current.pendingItems, key),
      }));
    }
  },
  remove: async (item) => {
    const state = get();
    if (!state.initialized || !state.mode) return false;

    const removed = state.items.find((saved) => isSameMedia(saved, item));
    if (!removed) return true;

    const key = mediaIdentityKey(item);
    if (state.pendingItems[key]) return false;

    const nextItems = state.items.filter((saved) => !isSameMedia(saved, item));
    set((current) => ({
      items: nextItems,
      pendingItems: { ...current.pendingItems, [key]: true },
      error: null,
    }));

    try {
      if (state.mode === "guest") {
        if (!saveGuestWatchlist(nextItems)) {
          throw new Error("watchlist-persist-failed");
        }
        return true;
      }

      await requestWatchlist("DELETE", item);
      return true;
    } catch {
      set((state) => ({
        items: [...state.items, removed].sort(
          (left, right) => right.addedAt - left.addedAt,
        ),
        error: "removeFailed",
      }));
      return false;
    } finally {
      set((current) => ({
        pendingItems: withoutPendingItem(current.pendingItems, key),
      }));
    }
  },
  toggleWatched: async (item) => {
    const state = get();
    if (!state.initialized || !state.mode) return false;

    const saved = state.items.find((entry) => isSameMedia(entry, item));
    if (!saved) return false;

    const key = mediaIdentityKey(item);
    if (state.pendingItems[key]) return false;

    const watched = !saved.watched;
    const nextItems = state.items.map((entry) =>
      isSameMedia(entry, item) ? { ...entry, watched } : entry,
    );
    set((current) => ({
      items: nextItems,
      pendingItems: { ...current.pendingItems, [key]: true },
      error: null,
    }));

    try {
      if (state.mode === "guest") {
        if (!saveGuestWatchlist(nextItems)) {
          throw new Error("watchlist-persist-failed");
        }
        return true;
      }

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
          isSameMedia(entry, item)
            ? { ...entry, watched: saved.watched }
            : entry,
        ),
        error: "toggleFailed",
      }));
      return false;
    } finally {
      set((current) => ({
        pendingItems: withoutPendingItem(current.pendingItems, key),
      }));
    }
  },
  has: (item) => get().items.some((saved) => isSameMedia(saved, item)),
}));

export function useWatchlistItem(item: MediaIdentity) {
  const key = mediaIdentityKey(item);
  const saved = useWatchlist((state) =>
    state.items.find((entry) => isSameMedia(entry, item)),
  );
  const isPending = useWatchlist(
    (state) => !state.initialized || Boolean(state.pendingItems[key]),
  );
  const add = useWatchlist((state) => state.add);
  const remove = useWatchlist((state) => state.remove);
  const toggleWatched = useWatchlist((state) => state.toggleWatched);

  return { saved, isPending, add, remove, toggleWatched };
}
