"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MediaItem, SavedMedia } from "@/lib/types";

type WatchlistStore = {
  items: SavedMedia[];
  add: (item: MediaItem) => void;
  remove: (id: number) => void;
  toggleWatched: (id: number) => void;
  has: (id: number) => boolean;
};

export const useWatchlist = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => set((state) => state.items.some((saved) => saved.id === item.id) ? state : { items: [...state.items, { ...item, watched: false, addedAt: Date.now() }] }),
      remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      toggleWatched: (id) => set((state) => ({ items: state.items.map((item) => item.id === id ? { ...item, watched: !item.watched } : item) })),
      has: (id) => get().items.some((item) => item.id === id),
    }),
    { name: "later-watchlist", skipHydration: true },
  ),
);
