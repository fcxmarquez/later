"use client";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Compass, Eye, Film, Play, Search, X } from "lucide-react";
import { getAuthClient } from "@/lib/auth/client";
import {
  clearGuestWatchlist,
  GUEST_WATCHLIST_KEY,
  isSavedMedia,
} from "@/lib/guest-storage";
import { HOME_SECTION_IDS, type HomeSection } from "@/lib/tmdb";
import type { MediaItem, SavedMedia } from "@/lib/types";
import { type WatchlistMode, useWatchlist } from "@/store/watchlist";
import { DetailModal } from "./detail-modal";
import { FeaturedCarousel } from "./featured-carousel";
import { MediaCard } from "./media-card";
import {
  FeaturedHeroSkeleton,
  MediaRowSkeleton,
  SearchGridSkeleton,
} from "./media-skeletons";
import { ProfileMenu } from "./profile-menu";
import { WatchlistErrorToast } from "./watchlist-error-toast";

const FEATURED_SLIDE_COUNT = 6;

type View = "home" | "search" | "list";

type AppShellProps = {
  mode: WatchlistMode;
  user: { name: string } | null;
  initialWatchlist: SavedMedia[];
};

export function AppShell({ mode, user, initialWatchlist }: AppShellProps) {
  const tNav = useTranslations("Nav");
  const tHome = useTranslations("Home");
  const tSearch = useTranslations("Search");
  const tList = useTranslations("List");
  const locale = useLocale();
  const [view, setView] = useState<View>("home");
  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
  const [loadedHomeLocale, setLoadedHomeLocale] = useState<string | null>(null);
  const [homeError, setHomeError] = useState(false);
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [resolvedSearchKey, setResolvedSearchKey] = useState<string | null>(
    null,
  );
  const [searchError, setSearchError] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "watched">("all");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const legacyMigrationStarted = useRef(false);
  const isGuest = mode === "guest";
  const searchKey = `${locale}|${query}`;
  const isHomeLoading = loadedHomeLocale !== locale;
  const isSearching = view === "search" && resolvedSearchKey !== searchKey;
  const items = useWatchlist((state) => state.items);
  const initialize = useWatchlist((state) => state.initialize);
  const featuredItems = useMemo(() => {
    const trending = homeSections.find(
      (section) => section.id === "trending",
    )?.results;
    const source =
      trending && trending.length > 0
        ? trending
        : (homeSections[0]?.results ?? []);
    return source.slice(0, FEATURED_SLIDE_COUNT);
  }, [homeSections]);
  useEffect(() => {
    initialize(initialWatchlist, mode);
    if (isGuest || legacyMigrationStarted.current) return;
    legacyMigrationStarted.current = true;

    const raw = window.localStorage.getItem(GUEST_WATCHLIST_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { state?: { items?: unknown[] } };
      const legacyItems = parsed.state?.items?.filter(isSavedMedia) ?? [];
      const migrateItem = async (item: SavedMedia) => {
        const added = await useWatchlist.getState().add(item);
        if (!added || !item.watched) return added;

        const current = useWatchlist
          .getState()
          .items.find(
            (saved) =>
              saved.id === item.id && saved.mediaType === item.mediaType,
          );
        return current?.watched
          ? true
          : useWatchlist.getState().toggleWatched(item);
      };

      void Promise.all(legacyItems.map(migrateItem)).then((results) => {
        if (results.every(Boolean)) clearGuestWatchlist();
      });
    } catch {
      clearGuestWatchlist();
    }
  }, [initialWatchlist, initialize, isGuest, mode]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/tmdb/home?locale=${encodeURIComponent(locale)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("catalog failed");
        return res.json();
      })
      .then((data: { sections?: HomeSection[] }) => {
        const sections = (data.sections ?? []).filter(
          (section) =>
            HOME_SECTION_IDS.includes(section.id) && section.results.length > 0,
        );
        setHomeSections(sections);
        setHomeError(false);
        setLoadedHomeLocale(locale);
      })
      .catch((fetchError) => {
        if (fetchError.name === "AbortError") return;
        setHomeError(true);
        setHomeSections([]);
        setLoadedHomeLocale(locale);
      });
    return () => controller.abort();
  }, [locale]);
  useEffect(() => {
    if (view !== "search") return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ locale });
      if (query) params.set("query", query);
      fetch(`/api/tmdb?${params}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error("catalog failed");
          return res.json();
        })
        .then((data) => {
          setSearchResults(data.results || []);
          setSearchError(false);
          setResolvedSearchKey(searchKey);
        })
        .catch((fetchError) => {
          if (fetchError.name !== "AbortError") {
            setSearchError(true);
            setSearchResults([]);
            setResolvedSearchKey(searchKey);
          }
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [locale, query, searchKey, view]);
  const list = useMemo(
    () =>
      items.filter(
        (item) =>
          filter === "all" ||
          (filter === "watched" ? item.watched : !item.watched),
      ),
    [items, filter],
  );
  const nav = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const closeModal = useCallback(() => setSelected(null), []);
  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await getAuthClient().signOut();
    } finally {
      window.location.assign(`/${locale}/auth/sign-in`);
    }
  };
  return (
    <main className="min-h-screen pb-[calc(7rem+env(safe-area-inset-bottom))] supports-[height:100dvh]:min-h-dvh">
      <header className="safe-page-x fixed inset-x-0 top-0 z-40 flex h-[calc(5rem+env(safe-area-inset-top))] items-center justify-between bg-gradient-to-b from-black/85 to-transparent pt-[env(safe-area-inset-top)]">
        <button
          onClick={() => nav("home")}
          className="flex min-h-11 items-center gap-2 text-xl font-bold tracking-tight"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-white text-black">
            <Play size={17} fill="currentColor" />
          </span>{" "}
          later
        </button>
        <nav className="glass hidden items-center gap-1 rounded-full p-1 sm:flex">
          {(
            [
              ["home", tNav("home")],
              ["search", tNav("explore")],
              ["list", tNav("myList")],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => nav(key)}
              className={`min-h-11 rounded-full px-5 py-2 text-sm transition ${view === key ? "bg-white text-black" : "text-zinc-300 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ProfileMenu
            isGuest={isGuest}
            userName={user?.name ?? null}
            isSigningOut={isSigningOut}
            onSignOut={signOut}
          />
        </div>
      </header>

      {view === "home" && (
        <>
          {isHomeLoading ? (
            <>
              <FeaturedHeroSkeleton />
              {HOME_SECTION_IDS.map((sectionId) => (
                <MediaRowSkeleton
                  key={sectionId}
                  title={tHome(`sections.${sectionId}.title`)}
                  subtitle={tHome(`sections.${sectionId}.subtitle`)}
                />
              ))}
            </>
          ) : homeError ? (
            <section className="safe-page-x flex min-h-[70vh] flex-col items-center justify-center text-center supports-[height:100svh]:min-h-[70svh]">
              <Film size={34} className="text-zinc-600" />
              <h2 className="mt-4 text-xl font-semibold">
                {tHome("loadErrorTitle")}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-zinc-500">
                {tHome("loadErrorBody")}
              </p>
            </section>
          ) : featuredItems.length === 0 ? (
            <section className="safe-page-x flex min-h-[70vh] flex-col items-center justify-center text-center supports-[height:100svh]:min-h-[70svh]">
              <Film size={34} className="text-zinc-600" />
              <h2 className="mt-4 text-xl font-semibold">
                {tHome("emptyTitle")}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-zinc-500">
                {tHome("emptyBody")}
              </p>
            </section>
          ) : (
            <>
              <FeaturedCarousel items={featuredItems} onOpen={setSelected} />
              {homeSections.map((section) => (
                <MediaRow
                  key={section.id}
                  title={tHome(`sections.${section.id}.title`)}
                  subtitle={tHome(`sections.${section.id}.subtitle`)}
                  items={section.results}
                  open={setSelected}
                />
              ))}
            </>
          )}
        </>
      )}

      {view === "search" && (
        <section className="safe-page-x pt-32">
          <p className="text-xs font-bold tracking-[.3em] text-blue-400 uppercase">
            {tSearch("eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
            {tSearch("title")}
          </h1>
          <div className="mt-10 flex max-w-3xl items-center gap-3 rounded-2xl bg-white/10 py-2 pr-2 pl-5 ring-1 ring-white/10 focus-within:ring-white/40">
            <Search className="shrink-0 text-zinc-400" />
            <input
              autoFocus
              aria-label={tSearch("aria")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tSearch("placeholder")}
              className="min-h-11 min-w-0 flex-1 bg-transparent py-2 text-lg outline-none placeholder:text-zinc-600"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="grid size-11 shrink-0 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
                aria-label={tSearch("clear")}
              >
                <X size={19} />
              </button>
            )}
          </div>
          <div className="mt-12" aria-live="polite" aria-busy={isSearching}>
            {isSearching ? (
              <SearchGridSkeleton />
            ) : searchError ? (
              <div className="flex min-h-48 flex-col items-center justify-center text-center">
                <Film size={34} className="text-zinc-600" />
                <h2 className="mt-4 text-xl font-semibold">
                  {tSearch("loadErrorTitle")}
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  {tSearch("loadErrorBody")}
                </p>
              </div>
            ) : searchResults.length ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                {searchResults.map((item) => (
                  <MediaCard
                    key={`${item.mediaType}-${item.id}`}
                    item={item}
                    layout="grid"
                    onOpen={setSelected}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center text-center">
                <Search size={34} className="text-zinc-600" />
                <h2 className="mt-4 text-xl font-semibold">
                  {tSearch("emptyTitle")}
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  {tSearch("emptyBody")}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {view === "list" && (
        <section className="safe-page-x pt-32">
          <p className="text-xs font-bold tracking-[.3em] text-blue-400 uppercase">
            {tList("eyebrow")}
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                {tList("title")}
              </h1>
              <p className="mt-3 text-zinc-500">
                {tList("count", { count: items.length })}
                {isGuest ? tList("onThisDevice") : ""}
              </p>
            </div>
            <div className="flex rounded-full bg-white/10 p-1">
              {(
                [
                  ["all", tList("filterAll")],
                  ["pending", tList("filterPending")],
                  ["watched", tList("filterWatched")],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`min-h-11 rounded-full px-4 py-2 text-sm ${filter === key ? "bg-white text-black" : "text-zinc-400"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {list.length ? (
            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {list.map((item) => (
                <MediaCard
                  key={`${item.mediaType}-${item.id}`}
                  item={item}
                  layout="grid"
                  onOpen={setSelected}
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mt-20 flex flex-col items-center text-center">
              <span className="grid size-20 place-items-center rounded-full bg-white/5">
                <Film size={32} className="text-zinc-600" />
              </span>
              <h2 className="mt-6 text-2xl font-semibold">
                {tList("emptyTitle")}
              </h2>
              <p className="mt-2 max-w-sm text-zinc-500">
                {tList("emptyBody")}
              </p>
              <button
                onClick={() => nav("search")}
                className="mt-6 rounded-full bg-white px-6 py-3 font-semibold text-black"
              >
                {tList("emptyCta")}
              </button>
            </div>
          ) : filter === "pending" ? (
            <div className="mt-20 flex flex-col items-center text-center">
              <span className="grid size-20 place-items-center rounded-full bg-emerald-400/10">
                <Check size={32} className="text-emerald-400" />
              </span>
              <h2 className="mt-6 text-2xl font-semibold">
                {tList("noPendingTitle")}
              </h2>
              <p className="mt-2 max-w-sm text-zinc-500">
                {tList("noPendingBody")}
              </p>
              <button
                onClick={() => setFilter("watched")}
                className="mt-6 rounded-full bg-white px-6 py-3 font-semibold text-black"
              >
                {tList("noPendingCta")}
              </button>
            </div>
          ) : (
            <div className="mt-20 flex flex-col items-center text-center">
              <span className="grid size-20 place-items-center rounded-full bg-white/5">
                <Eye size={32} className="text-zinc-600" />
              </span>
              <h2 className="mt-6 text-2xl font-semibold">
                {tList("noWatchedTitle")}
              </h2>
              <p className="mt-2 max-w-sm text-zinc-500">
                {tList("noWatchedBody")}
              </p>
              <button
                onClick={() => setFilter("pending")}
                className="mt-6 rounded-full bg-white px-6 py-3 font-semibold text-black"
              >
                {tList("noWatchedCta")}
              </button>
            </div>
          )}
        </section>
      )}

      <nav className="glass fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full p-1.5 shadow-2xl sm:hidden">
        {(
          [
            ["home", Compass, tNav("home")],
            ["search", Search, tNav("explore")],
            ["list", Eye, tNav("myList")],
          ] as const
        ).map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => nav(key)}
            className={`grid size-12 place-items-center rounded-full ${view === key ? "bg-white text-black" : "text-zinc-400"}`}
            aria-label={label}
          >
            <Icon size={20} />
          </button>
        ))}
      </nav>
      <WatchlistErrorToast />
      {selected && <DetailModal item={selected} close={closeModal} />}
    </main>
  );
}
function MediaRow({
  title,
  subtitle,
  items,
  open,
}: {
  title: string;
  subtitle: string;
  items: MediaItem[];
  open: (item: MediaItem) => void;
}) {
  return (
    <section className="safe-page-left mb-16">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      <div className="safe-page-right hide-scrollbar mt-6 flex gap-4 overflow-x-auto pb-8 sm:gap-5">
        {items.map((item) => (
          <MediaCard
            key={`${title}-${item.mediaType}-${item.id}`}
            item={item}
            onOpen={open}
          />
        ))}
      </div>
    </section>
  );
}
