"use client";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  Compass,
  Eye,
  Film,
  LoaderCircle,
  LogIn,
  LogOut,
  Play,
  Search,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getAuthClient } from "@/lib/auth/client";
import { featured, fallbackCatalog, imageUrl } from "@/lib/catalog";
import {
  clearGuestWatchlist,
  GUEST_WATCHLIST_KEY,
  isSavedMedia,
} from "@/lib/guest-storage";
import type { MediaItem, SavedMedia } from "@/lib/types";
import { type WatchlistMode, useWatchlist } from "@/store/watchlist";
import { LanguageSwitcher } from "./language-switcher";
import { MediaCard } from "./media-card";
import { DetailModal } from "./detail-modal";

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
  const tErrors = useTranslations("WatchlistErrors");
  const locale = useLocale();
  const [view, setView] = useState<View>("home");
  const [homeCatalog, setHomeCatalog] = useState(fallbackCatalog);
  const [searchResults, setSearchResults] = useState(fallbackCatalog);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "watched">("all");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const legacyMigrationStarted = useRef(false);
  const isGuest = mode === "guest";
  const items = useWatchlist((state) => state.items);
  const add = useWatchlist((state) => state.add);
  const initialize = useWatchlist((state) => state.initialize);
  const error = useWatchlist((state) => state.error);
  const clearError = useWatchlist((state) => state.clearError);
  const hasFeatured = useWatchlist((state) => state.has(featured));
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
    fetch(`/api/tmdb?locale=${encodeURIComponent(locale)}`)
      .then((res) => res.json())
      .then((data) => data.results?.length && setHomeCatalog(data.results))
      .catch(() => {});
  }, [locale]);
  useEffect(() => {
    if (view !== "search") return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsSearching(true);
      setSearchError(false);
      const params = new URLSearchParams({ locale });
      if (query) params.set("query", query);
      fetch(`/api/tmdb?${params}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error("catalog failed");
          return res.json();
        })
        .then((data) => setSearchResults(data.results || []))
        .catch((fetchError) => {
          if (fetchError.name !== "AbortError") {
            setSearchError(true);
            setSearchResults([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [locale, query, view]);
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
    <main className="min-h-screen pb-28">
      <header className="fixed inset-x-0 top-0 z-40 flex h-20 items-center justify-between bg-gradient-to-b from-black/85 to-transparent px-5 sm:px-10 lg:px-14">
        <button
          onClick={() => nav("home")}
          className="flex items-center gap-2 text-xl font-bold tracking-tight"
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
              className={`rounded-full px-5 py-2 text-sm transition ${view === key ? "bg-white text-black" : "text-zinc-300 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {isGuest ? (
            <div className="glass flex items-center gap-2 rounded-full p-1 pr-2">
              <span
                className="grid size-8 place-items-center rounded-full bg-white/15 text-sm font-bold text-white"
                title={tNav("guestMode")}
              >
                I
              </span>
              <span className="hidden max-w-36 truncate text-xs text-zinc-300 lg:block">
                {tNav("guest")}
              </span>
              <Link
                href="/auth/sign-in"
                className="grid size-8 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
                aria-label={tNav("signIn")}
              >
                <LogIn size={16} />
              </Link>
            </div>
          ) : (
            <div className="glass flex items-center gap-2 rounded-full p-1 pr-2">
              <span
                className="grid size-8 place-items-center rounded-full bg-white text-sm font-bold text-black"
                title={tNav("signedIn")}
              >
                {user?.name?.charAt(0).toUpperCase() || "F"}
              </span>
              <span className="hidden max-w-36 truncate text-xs text-zinc-300 lg:block">
                {user?.name}
              </span>
              <button
                type="button"
                onClick={signOut}
                disabled={isSigningOut}
                className="grid size-8 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:cursor-wait"
                aria-label={tNav("signOut")}
              >
                {isSigningOut ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <LogOut size={16} />
                )}
              </button>
            </div>
          )}
        </div>
      </header>

      {view === "home" && (
        <>
          <section className="relative flex min-h-[78vh] items-end overflow-hidden px-5 pb-16 sm:px-10 lg:min-h-[88vh] lg:px-14 lg:pb-24">
            <Image
              src={imageUrl(featured.backdropPath, "backdrop")}
              alt={tHome("featuredAlt")}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-black/20" />
            <div className="relative max-w-2xl">
              <p className="mb-4 text-xs font-bold tracking-[.32em] text-blue-300 uppercase">
                {tHome("eyebrow")}
              </p>
              <h1 className="text-5xl font-bold tracking-[-.05em] sm:text-7xl lg:text-8xl">
                Interstellar
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-zinc-200 sm:text-lg">
                {tHome("featuredOverview")}
              </p>
              <div className="mt-7 flex gap-3">
                <button
                  onClick={() => setSelected(featured)}
                  className="flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-black transition hover:scale-105"
                >
                  <Play size={18} fill="currentColor" /> {tHome("seeDetails")}
                </button>
                <button
                  disabled={hasFeatured}
                  onClick={() => add(featured)}
                  className="glass flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold disabled:opacity-70"
                >
                  {hasFeatured ? <Check size={19} /> : <Bookmark size={19} />}{" "}
                  {hasFeatured ? tHome("inYourList") : tHome("myList")}
                </button>
              </div>
            </div>
          </section>
          <MediaRow
            title={tHome("trendingTitle")}
            subtitle={tHome("trendingSubtitle")}
            items={homeCatalog}
            open={setSelected}
          />
          <MediaRow
            title={tHome("epicTitle")}
            subtitle={tHome("epicSubtitle")}
            items={[...homeCatalog].reverse()}
            open={setSelected}
          />
        </>
      )}

      {view === "search" && (
        <section className="px-5 pt-32 sm:px-10 lg:px-14">
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
              className="min-w-0 flex-1 bg-transparent py-2 text-lg outline-none placeholder:text-zinc-600"
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
          <div className="mt-12" aria-live="polite">
            {isSearching ? (
              <div className="flex min-h-48 items-center justify-center gap-3 text-zinc-400">
                <LoaderCircle className="animate-spin" size={22} />
                <span>{tSearch("searching")}</span>
              </div>
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
              <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {searchResults.map((item) => (
                  <MediaCard
                    key={`${item.mediaType}-${item.id}`}
                    item={item}
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
        <section className="px-5 pt-32 sm:px-10 lg:px-14">
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
                  className={`rounded-full px-4 py-2 text-sm ${filter === key ? "bg-white text-black" : "text-zinc-400"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {list.length ? (
            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {list.map((item) => (
                <MediaCard
                  key={`${item.mediaType}-${item.id}`}
                  item={item}
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

      <nav className="glass fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full p-1.5 shadow-2xl sm:hidden">
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
      {error && (
        <div
          role="alert"
          className="fixed bottom-24 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-4 rounded-2xl border border-red-400/20 bg-red-950/95 px-4 py-3 text-sm text-red-100 shadow-2xl backdrop-blur"
        >
          <span>{tErrors(error)}</span>
          <button
            type="button"
            onClick={clearError}
            className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-white/10"
            aria-label={tErrors("dismiss")}
          >
            <X size={17} />
          </button>
        </div>
      )}
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
    <section className="mb-16 pl-5 sm:pl-10 lg:pl-14">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      <div className="hide-scrollbar mt-6 flex gap-4 overflow-x-auto pr-5 pb-8 sm:gap-5 sm:pr-10 lg:pr-14">
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
