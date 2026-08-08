import { create } from "zustand";
import type { MediaItem } from "@/lib/types";

export type PersonOrigin = {
  returnPath: string;
  title: MediaItem;
};

type DetailNavigationState = {
  personOrigin: PersonOrigin | null;
  titleRestore: PersonOrigin | null;
  rememberPersonOrigin: (title: MediaItem, returnPath: string) => void;
  takePersonOrigin: () => PersonOrigin | null;
  queueTitleRestore: (origin: PersonOrigin) => void;
  clearTitleRestore: () => void;
};

export const useDetailNavigation = create<DetailNavigationState>(
  (set, get) => ({
    personOrigin: null,
    titleRestore: null,
    rememberPersonOrigin: (title, returnPath) => {
      set({ personOrigin: { returnPath, title } });
    },
    takePersonOrigin: () => {
      const origin = get().personOrigin;
      set({ personOrigin: null });
      return origin;
    },
    queueTitleRestore: (origin) => set({ titleRestore: origin }),
    clearTitleRestore: () => set({ titleRestore: null }),
  }),
);
