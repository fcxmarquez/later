"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type SyntheticEvent } from "react";
import { Check, ChevronDown, Eye, Play, Plus, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { imageUrl, youtubeEmbedUrl, youtubeThumbUrl } from "@/lib/catalog";
import type {
  CastMember,
  MediaDetail,
  MediaEpisode,
  MediaItem,
  MediaSeason,
  MediaSeasonDetail,
  MediaTrailer,
  WatchProvider,
} from "@/lib/types";
import { useWatchlist } from "@/store/watchlist";

const OVERVIEW_COLLAPSED_LINES = 3;

function formatRuntime(minutes?: number | null) {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function formatAirDate(value: string, locale: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatRegionName(region: string, locale: string) {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "region" }).of(region) || region
    );
  } catch {
    return region;
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function mergeDetail(item: MediaItem, detail: MediaDetail | null): MediaDetail {
  if (!detail) {
    return {
      ...item,
      cast: [],
      providers: [],
      providersRegion: null,
      inCinemas: false,
      runtime: null,
      seasons: null,
      status: null,
      director: null,
      creators: [],
      trailers: [],
      seasonList: [],
    };
  }
  return {
    ...item,
    ...detail,
    title: detail.title || item.title,
    overview: detail.overview || item.overview,
    posterPath: detail.posterPath || item.posterPath,
    backdropPath: detail.backdropPath || item.backdropPath,
    genres: detail.genres.length ? detail.genres : item.genres,
    year: detail.year || item.year,
    rating: detail.rating || item.rating,
  };
}

function ProviderBadge({ provider }: { provider: WatchProvider }) {
  const [failed, setFailed] = useState(false);
  return (
    <li className="detail-stagger flex min-w-[4.75rem] flex-col items-center gap-2">
      <div className="relative size-14 overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,.35)] ring-1 ring-white/15">
        {failed ? (
          <span className="grid size-full place-items-center px-1 text-center text-[10px] font-bold text-zinc-800">
            {provider.name}
          </span>
        ) : (
          <Image
            src={imageUrl(provider.logoPath, "logo")}
            alt={provider.name}
            fill
            sizes="56px"
            className="object-cover"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <span className="max-w-16 truncate text-center text-[11px] text-zinc-400">
        {provider.name}
      </span>
    </li>
  );
}

function CastCard({ member }: { member: CastMember }) {
  const t = useTranslations("Detail");
  const [failed, setFailed] = useState(!member.profilePath);
  return (
    <li className="detail-stagger w-[104px] shrink-0 sm:w-[116px]">
      <Link
        href={`/person/${member.id}`}
        aria-label={t("personDetails", { name: member.name })}
        className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#07070a]"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-800 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-white/30">
          {failed || !member.profilePath ? (
            <span className="grid size-full place-items-center bg-gradient-to-br from-zinc-700 to-zinc-900 text-lg font-semibold tracking-wide text-zinc-200">
              {initials(member.name)}
            </span>
          ) : (
            <Image
              src={imageUrl(member.profilePath, "profile")}
              alt={member.name}
              fill
              sizes="116px"
              className="object-cover transition duration-500 group-hover:scale-105"
              onError={() => setFailed(true)}
            />
          )}
        </div>
        <p className="mt-2 truncate text-sm font-medium text-zinc-100">
          {member.name}
        </p>
        <p className="truncate text-xs text-zinc-500">{member.character}</p>
      </Link>
    </li>
  );
}

type TrailerOrigin = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TrailerPlayerState = {
  trailer: MediaTrailer;
  origin: TrailerOrigin;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getCenteredTrailerRect(): TrailerOrigin {
  const maxWidth = Math.min(window.innerWidth * 0.92, 960);
  const maxHeight = window.innerHeight * 0.78;
  let width = maxWidth;
  let height = (width * 9) / 16;
  if (height > maxHeight) {
    height = maxHeight;
    width = (height * 16) / 9;
  }
  return {
    top: (window.innerHeight - height) / 2,
    left: (window.innerWidth - width) / 2,
    width,
    height,
  };
}

function getFlipTransform(origin: TrailerOrigin, target: TrailerOrigin) {
  const scaleX = origin.width / target.width;
  const scaleY = origin.height / target.height;
  const originCenterX = origin.left + origin.width / 2;
  const originCenterY = origin.top + origin.height / 2;
  const targetCenterX = target.left + target.width / 2;
  const targetCenterY = target.top + target.height / 2;
  const translateX = originCenterX - targetCenterX;
  const translateY = originCenterY - targetCenterY;
  return `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
}

function TrailerCard({
  trailer,
  onPlay,
}: {
  trailer: MediaTrailer;
  onPlay: (trailer: MediaTrailer, origin: TrailerOrigin) => void;
}) {
  const t = useTranslations("Detail");
  const frameRef = useRef<HTMLDivElement>(null);
  const [thumbFailed, setThumbFailed] = useState(false);

  return (
    <li className="w-[min(100%,20rem)] shrink-0 sm:w-[22rem]">
      <div
        ref={frameRef}
        className="relative aspect-video overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10"
      >
        <button
          type="button"
          onClick={() => {
            const rect = frameRef.current?.getBoundingClientRect();
            if (!rect) return;
            onPlay(trailer, {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            });
          }}
          className="group absolute inset-0 grid place-items-center"
          aria-label={t("playTrailer", { name: trailer.name })}
        >
          {!thumbFailed ? (
            <Image
              src={youtubeThumbUrl(trailer.key)}
              alt=""
              fill
              sizes="(max-width: 640px) 90vw, 352px"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              onError={() => setThumbFailed(true)}
            />
          ) : (
            <span className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
          )}
          <span className="absolute inset-0 bg-black/35 transition group-hover:bg-black/25" />
          <span className="relative grid size-14 place-items-center rounded-full bg-white text-black shadow-[0_12px_40px_rgba(0,0,0,.45)] transition group-hover:scale-105 sm:size-16">
            <Play size={26} fill="currentColor" className="ml-0.5" />
          </span>
        </button>
      </div>
      <p className="mt-3 truncate text-sm font-medium text-zinc-100">
        {trailer.name}
      </p>
      <p className="truncate text-xs text-zinc-500">{trailer.type}</p>
    </li>
  );
}

function TrailerLightbox({
  trailer,
  origin,
  onClosed,
}: {
  trailer: MediaTrailer;
  origin: TrailerOrigin;
  onClosed: () => void;
}) {
  const t = useTranslations("Detail");
  const [layout] = useState(() => {
    const target = getCenteredTrailerRect();
    const reducedMotion = prefersReducedMotion();
    return {
      target,
      reducedMotion,
      phase: (reducedMotion ? "shown" : "enter") as "enter" | "shown" | "exit",
      transform: reducedMotion ? "none" : getFlipTransform(origin, target),
      playing: reducedMotion,
    };
  });
  const phaseRef = useRef<"enter" | "shown" | "exit">(layout.phase);
  const targetRef = useRef<TrailerOrigin>(layout.target);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onClosedRef = useRef(onClosed);
  const originRef = useRef(origin);
  const [phase, setPhase] = useState<"enter" | "shown" | "exit">(layout.phase);
  const [target, setTarget] = useState<TrailerOrigin>(layout.target);
  const [transform, setTransform] = useState(layout.transform);
  const [playing, setPlaying] = useState(layout.playing);
  const [thumbFailed, setThumbFailed] = useState(false);

  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);

  useEffect(() => {
    originRef.current = origin;
  }, [origin]);

  const requestClose = () => {
    if (phaseRef.current === "exit") return;
    phaseRef.current = "exit";
    setPlaying(false);
    setPhase("exit");
    if (layout.reducedMotion) {
      onClosedRef.current();
      return;
    }
    setTransform(getFlipTransform(originRef.current, targetRef.current));
  };

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (phaseRef.current === "exit") return;
        phaseRef.current = "exit";
        setPlaying(false);
        setPhase("exit");
        if (layout.reducedMotion) {
          onClosedRef.current();
          return;
        }
        setTransform(getFlipTransform(originRef.current, targetRef.current));
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    if (layout.reducedMotion) {
      return () => window.removeEventListener("keydown", handleKeyDown, true);
    }

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        phaseRef.current = "shown";
        setPhase("shown");
        setTransform("none");
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [layout.reducedMotion]);

  useEffect(() => {
    const onResize = () => {
      const next = getCenteredTrailerRect();
      targetRef.current = next;
      setTarget(next);
      if (phaseRef.current === "exit") {
        setTransform(getFlipTransform(originRef.current, next));
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div
      className={`trailer-lightbox fixed inset-0 z-[70] ${phase === "enter" ? "is-enter" : ""} ${phase === "shown" ? "is-shown" : ""} ${phase === "exit" ? "is-exit" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={trailer.name}
      onClick={(event) => {
        event.stopPropagation();
        requestClose();
      }}
    >
      <div className="trailer-lightbox-dim absolute inset-0 bg-black/80 backdrop-blur-[2px]" />
      <button
        ref={closeButtonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          requestClose();
        }}
        className="glass absolute top-[max(1.25rem,env(safe-area-inset-top))] right-[max(1.25rem,env(safe-area-inset-right))] z-20 grid size-11 place-items-center rounded-full transition hover:bg-white hover:text-black sm:top-[max(1.75rem,env(safe-area-inset-top))] sm:right-[max(2rem,env(safe-area-inset-right))]"
        aria-label={t("closeTrailer")}
      >
        <X />
      </button>
      <div
        className="trailer-lightbox-frame absolute overflow-hidden rounded-2xl bg-zinc-950 shadow-[0_28px_90px_rgba(0,0,0,.6)] ring-1 ring-white/15"
        style={{
          top: target.top,
          left: target.left,
          width: target.width,
          height: target.height,
          transform,
          borderRadius: phase === "shown" ? "1.25rem" : "1rem",
        }}
        onClick={(event) => event.stopPropagation()}
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.propertyName !== "transform") return;
          if (phaseRef.current === "shown" && !playing) {
            setPlaying(true);
            return;
          }
          if (phaseRef.current === "exit") onClosedRef.current();
        }}
      >
        {playing ? (
          <iframe
            src={youtubeEmbedUrl(trailer.key)}
            title={trailer.name}
            className="absolute inset-0 size-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <>
            {!thumbFailed ? (
              <Image
                src={youtubeThumbUrl(trailer.key)}
                alt=""
                fill
                sizes="92vw"
                className="object-cover"
                onError={() => setThumbFailed(true)}
                priority
              />
            ) : (
              <span className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
            )}
            <span className="absolute inset-0 bg-black/25" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-14 place-items-center rounded-full bg-white/90 text-black sm:size-16">
                <Play size={26} fill="currentColor" className="ml-0.5" />
              </span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function ExpandableOverview({ text, id }: { text: string; id: string }) {
  const t = useTranslations("Detail");
  const contentRef = useRef<HTMLParagraphElement>(null);
  const collapsedHeightRef = useRef(96);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [height, setHeight] = useState<number | "auto">("auto");

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const measure = () => {
      const style = getComputedStyle(node);
      const lineHeight = Number.parseFloat(style.lineHeight);
      const collapsedHeight = Number.isFinite(lineHeight)
        ? lineHeight * OVERVIEW_COLLAPSED_LINES
        : 96;
      collapsedHeightRef.current = collapsedHeight;

      const fullHeight = node.scrollHeight;
      const needsCollapse = fullHeight > collapsedHeight + 2;
      setCanExpand(needsCollapse);
      if (!expanded) {
        setHeight(needsCollapse ? collapsedHeight : "auto");
      }
    };

    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    observer.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [text, expanded]);

  const toggle = () => {
    const node = contentRef.current;
    if (!node || !canExpand) return;

    if (expanded) {
      const fullHeight = node.scrollHeight;
      setHeight(fullHeight);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHeight(collapsedHeightRef.current);
          setExpanded(false);
        });
      });
      return;
    }

    const fullHeight = node.scrollHeight;
    setExpanded(true);
    setHeight(fullHeight);
  };

  return (
    <div className="mt-4 max-w-3xl">
      <div
        className={`detail-overview relative ${expanded ? "is-expanded" : "is-collapsed"} ${canExpand ? "cursor-pointer pb-8" : ""}`}
        onClick={toggle}
        onKeyDown={(event) => {
          if (!canExpand) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : undefined}
        aria-expanded={canExpand ? expanded : undefined}
        aria-controls={canExpand ? id : undefined}
        aria-label={
          canExpand ? (expanded ? t("showLess") : t("showMore")) : undefined
        }
      >
        <p
          ref={contentRef}
          id={id}
          className="detail-overview-text text-base leading-8 text-zinc-300 sm:text-lg"
          style={{
            height: typeof height === "number" ? `${height}px` : height,
          }}
          onTransitionEnd={(event) => {
            if (
              event.propertyName !== "height" ||
              event.target !== event.currentTarget
            )
              return;
            if (expanded) setHeight("auto");
          }}
        >
          {text}
        </p>
        {canExpand && (
          <>
            <span
              className={`detail-overview-fade pointer-events-none absolute inset-x-0 bottom-0 h-20 transition-opacity duration-300 ${expanded ? "opacity-0" : "opacity-100"}`}
              aria-hidden
            />
            <span
              className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center"
              aria-hidden
            >
              <ChevronDown
                size={22}
                strokeWidth={2}
                className={`text-zinc-200 drop-shadow-[0_1px_8px_rgba(0,0,0,.65)] transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              />
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function EpisodeCard({
  episode,
  locale,
}: {
  episode: MediaEpisode;
  locale: string;
}) {
  const t = useTranslations("Detail");
  const [stillFailed, setStillFailed] = useState(!episode.stillPath);
  const dateLabel = formatAirDate(episode.airDate, locale);
  const runtimeLabel = formatRuntime(episode.runtime);
  const metaBits = [
    dateLabel,
    runtimeLabel,
    episode.rating > 0 ? `★ ${episode.rating.toFixed(1)}` : null,
  ].filter(Boolean);

  return (
    <li className="w-[min(84vw,22rem)] shrink-0 sm:w-[22rem]">
      <article className="h-full overflow-hidden rounded-2xl bg-white/[0.045] ring-1 ring-white/10">
        <div className="relative aspect-video overflow-hidden bg-zinc-900">
          {!stillFailed && episode.stillPath ? (
            <Image
              src={imageUrl(episode.stillPath, "still")}
              alt={t("episodeStillAlt", {
                number: episode.episodeNumber,
                title: episode.name,
              })}
              fill
              sizes="(max-width: 640px) 84vw, 352px"
              className="object-cover"
              onError={() => setStillFailed(true)}
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-sm font-semibold tracking-[0.16em] text-zinc-500 uppercase">
              S{episode.seasonNumber} · E{episode.episodeNumber}
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
          <span className="absolute bottom-3 left-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-zinc-100 backdrop-blur-md">
            {t("episodeNumber", { number: episode.episodeNumber })}
          </span>
        </div>
        <div className="p-4">
          <h4 className="line-clamp-2 text-base font-semibold text-zinc-100">
            {episode.name}
          </h4>
          {metaBits.length > 0 && (
            <p className="mt-1 text-xs text-zinc-500">{metaBits.join(" · ")}</p>
          )}
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
            {episode.overview}
          </p>
        </div>
      </article>
    </li>
  );
}

function EpisodeSection({
  seriesId,
  seasons,
}: {
  seriesId: number;
  seasons: MediaSeason[];
}) {
  const t = useTranslations("Detail");
  const locale = useLocale();
  const headingId = useId();
  const firstRegularSeason =
    seasons.find(
      (season) => season.seasonNumber > 0 && season.episodeCount > 0,
    ) ||
    seasons.find((season) => season.seasonNumber > 0) ||
    seasons[0];
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(
    firstRegularSeason.seasonNumber,
  );
  const [season, setSeason] = useState<MediaSeasonDetail | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      id: String(seriesId),
      season: String(selectedSeasonNumber),
      locale,
    });

    fetch(`/api/tmdb/season?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("season failed");
        const data = (await response.json()) as {
          season?: MediaSeasonDetail;
        };
        if (!data.season) throw new Error("missing season");
        if (!controller.signal.aborted) {
          setSeason(data.season);
          setLoadState("ready");
        }
      })
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        setLoadState("error");
      });

    return () => controller.abort();
  }, [locale, requestVersion, selectedSeasonNumber, seriesId]);

  return (
    <section className="detail-stagger" aria-labelledby={headingId}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3
            id={headingId}
            className="text-xs font-bold tracking-[0.28em] text-zinc-500 uppercase"
          >
            {t("episodes")}
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            {t("episodeCount", {
              count:
                seasons.find(
                  (entry) => entry.seasonNumber === selectedSeasonNumber,
                )?.episodeCount ?? 0,
            })}
          </p>
        </div>

        <div className="relative">
          <label htmlFor={`${headingId}-season`} className="sr-only">
            {t("seasonSelectLabel")}
          </label>
          <select
            id={`${headingId}-season`}
            value={selectedSeasonNumber}
            onChange={(event) => {
              setLoadState("loading");
              setSeason(null);
              setSelectedSeasonNumber(Number(event.target.value));
            }}
            className="min-h-11 appearance-none rounded-full border border-white/10 bg-white/[0.07] py-2.5 pr-11 pl-5 text-sm font-semibold text-zinc-100 transition outline-none hover:bg-white/[0.11] focus-visible:ring-2 focus-visible:ring-white/70"
          >
            {seasons.map((entry) => (
              <option
                key={entry.id}
                value={entry.seasonNumber}
                className="bg-zinc-900"
              >
                {entry.name} ·{" "}
                {t("episodeCount", { count: entry.episodeCount })}
              </option>
            ))}
          </select>
          <ChevronDown
            size={17}
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
        </div>
      </div>

      <div className="mt-5" aria-busy={loadState === "loading"}>
        {loadState === "loading" && (
          <ul className="hide-scrollbar flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 3 }, (_, index) => (
              <li
                key={index}
                className="w-[min(84vw,22rem)] shrink-0 overflow-hidden rounded-2xl bg-white/[0.045] ring-1 ring-white/10"
              >
                <div className="aspect-video animate-pulse bg-zinc-800/80" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800/70" />
                  <div className="h-14 animate-pulse rounded bg-zinc-800/50" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {loadState === "error" && (
          <div
            role="alert"
            className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-5"
          >
            <p className="text-sm text-amber-200/90">{t("episodesError")}</p>
            <button
              type="button"
              onClick={() => {
                setLoadState("loading");
                setSeason(null);
                setRequestVersion((version) => version + 1);
              }}
              className="mt-4 min-h-11 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              {t("tryAgain")}
            </button>
          </div>
        )}

        {loadState === "ready" && season && season.episodes.length === 0 && (
          <p className="rounded-2xl bg-white/[0.045] p-5 text-sm text-zinc-400 ring-1 ring-white/10">
            {t("noEpisodes")}
          </p>
        )}

        {loadState === "ready" && season && season.episodes.length > 0 && (
          <>
            {season.overview && (
              <p className="mb-5 max-w-3xl text-sm leading-6 text-zinc-400">
                {season.overview}
              </p>
            )}
            <ul className="hide-scrollbar flex gap-4 overflow-x-auto pb-4">
              {season.episodes.map((episode) => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  locale={locale}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function HeroBackdrop({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes="100vw"
      priority
      onLoad={() => setLoaded(true)}
      className={`detail-hero-image object-cover object-center transition-opacity duration-700 ease-out ${loaded ? "is-loaded opacity-100" : "opacity-0"}`}
    />
  );
}

export function DetailModal({
  item,
  close,
}: {
  item: MediaItem;
  close: () => void;
}) {
  const t = useTranslations("Detail");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const saved = useWatchlist((state) =>
    state.items.find(
      (entry) => entry.id === item.id && entry.mediaType === item.mediaType,
    ),
  );
  const { add, remove, toggleWatched } = useWatchlist();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const phaseRef = useRef<"enter" | "shown" | "exit">("enter");
  const [phase, setPhase] = useState<"enter" | "shown" | "exit">("enter");
  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [trailerPlayer, setTrailerPlayer] = useState<TrailerPlayerState | null>(
    null,
  );
  const trailerPlayerRef = useRef<TrailerPlayerState | null>(null);

  useEffect(() => {
    trailerPlayerRef.current = trailerPlayer;
  }, [trailerPlayer]);

  const view = mergeDetail(item, detail);
  const runtimeLabel = formatRuntime(view.runtime);
  const creditLine = view.director
    ? t("directedBy", { name: view.director })
    : view.creators?.length
      ? t("createdBy", { names: view.creators.join(", ") })
      : null;

  const requestClose = () => {
    if (phaseRef.current === "exit") return;
    phaseRef.current = "exit";
    setPhase("exit");
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      phaseRef.current = "shown";
      setPhase("shown");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      id: String(item.id),
      type: item.mediaType,
      locale,
    });
    fetch(`/api/tmdb/detail?${params}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("detail failed");
        const data = (await response.json()) as { detail?: MediaDetail };
        if (!data.detail) throw new Error("missing detail");
        if (!controller.signal.aborted) {
          setDetail(data.detail);
        }
      })
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        setLoadError(true);
      });
    return () => controller.abort();
  }, [item.id, item.mediaType, locale]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (trailerPlayerRef.current) return;
      if (event.key === "Escape") {
        requestClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  const onPanelAnimationEnd = (event: SyntheticEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (phaseRef.current === "exit") close();
  };

  const metaBits = [
    view.year,
    runtimeLabel,
    view.mediaType === "tv" && view.seasons
      ? t("seasons", { count: view.seasons })
      : null,
    view.rating > 0 ? `★ ${view.rating.toFixed(1)}` : null,
  ].filter(Boolean);

  return (
    <div
      className={`detail-overlay fixed inset-0 z-50 ${phase === "enter" ? "is-enter" : ""} ${phase === "shown" ? "is-shown" : ""} ${phase === "exit" ? "is-exit" : ""}`}
      onClick={() => {
        if (trailerPlayerRef.current) return;
        requestClose();
      }}
    >
      <div className="detail-overlay-dim absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
        onAnimationEnd={onPanelAnimationEnd}
        className="detail-panel absolute inset-0 min-h-screen overflow-y-auto overscroll-contain bg-[#07070a] supports-[height:100dvh]:min-h-dvh"
      >
        <div className="relative min-h-[72vh] bg-black supports-[height:100svh]:min-h-[72svh] sm:min-h-[78vh] supports-[height:100svh]:sm:min-h-[78svh]">
          {view.backdropPath ? (
            <HeroBackdrop
              key={view.backdropPath}
              src={imageUrl(view.backdropPath, "backdrop")}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/45 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07070a]/90 via-[#07070a]/35 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07070a] to-transparent" />

          <button
            ref={closeButtonRef}
            type="button"
            onClick={requestClose}
            className="glass absolute top-[max(1.25rem,env(safe-area-inset-top))] right-[max(1.25rem,env(safe-area-inset-right))] z-20 grid size-11 place-items-center rounded-full transition hover:bg-white hover:text-black sm:top-[max(1.75rem,env(safe-area-inset-top))] sm:right-[max(2rem,env(safe-area-inset-right))]"
            aria-label={t("close")}
          >
            <X />
          </button>

          <div className="safe-detail-x relative flex min-h-[72vh] flex-col justify-end pb-[max(2.5rem,env(safe-area-inset-bottom))] supports-[height:100svh]:min-h-[72svh] sm:min-h-[78vh] sm:pb-[max(3.5rem,env(safe-area-inset-bottom))] supports-[height:100svh]:sm:min-h-[78svh]">
            <div className="detail-hero-copy max-w-3xl">
              <span className="text-[11px] font-semibold tracking-[0.22em] text-zinc-300 uppercase">
                {view.mediaType === "movie"
                  ? tCommon("movie")
                  : tCommon("series")}
              </span>

              <h2
                id={titleId}
                className="mt-4 text-4xl font-bold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl"
              >
                {view.title}
              </h2>

              {view.tagline && (
                <p className="mt-4 max-w-2xl text-base text-zinc-300 italic sm:text-lg">
                  {view.tagline}
                </p>
              )}

              {metaBits.length > 0 && (
                <p className="mt-5 text-sm text-zinc-300 sm:text-[15px]">
                  {metaBits.join(" · ")}
                </p>
              )}
              {view.genres.length > 0 && (
                <p className="mt-2 text-sm text-zinc-400 sm:text-[15px]">
                  {view.genres.join(" · ")}
                </p>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                {!saved ? (
                  <button
                    type="button"
                    onClick={() => add(item)}
                    className="flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-black transition hover:scale-[1.03]"
                  >
                    <Plus size={19} /> {t("addToList")}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleWatched(item)}
                      className={`flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold transition hover:scale-[1.03] ${saved.watched ? "bg-emerald-400 text-black" : "bg-white text-black"}`}
                    >
                      {saved.watched ? <Check size={19} /> : <Eye size={19} />}{" "}
                      {saved.watched ? t("alreadyWatched") : t("markWatched")}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      className="rounded-full bg-white/10 px-6 py-3.5 font-semibold backdrop-blur-md transition hover:bg-white/20"
                    >
                      {t("removeFromList")}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="safe-detail-x relative z-10 space-y-12 pb-[calc(5rem+env(safe-area-inset-bottom))]">
          <section className="detail-stagger max-w-3xl">
            <h3 className="text-xs font-bold tracking-[0.28em] text-zinc-500 uppercase">
              {t("synopsis")}
            </h3>
            <ExpandableOverview
              key={view.overview}
              text={view.overview}
              id={descriptionId}
            />
            {creditLine && (
              <p className="mt-5 text-sm text-zinc-500">{creditLine}</p>
            )}
            {loadError && (
              <p className="mt-4 text-sm text-amber-300/90">
                {t("enrichmentError")}
              </p>
            )}
          </section>

          {view.mediaType === "tv" && view.seasonList.length > 0 && (
            <EpisodeSection
              key={`${view.id}-${locale}`}
              seriesId={view.id}
              seasons={view.seasonList}
            />
          )}

          {view.inCinemas ? (
            <section className="detail-stagger">
              <h3 className="text-xs font-bold tracking-[0.28em] text-zinc-500 uppercase">
                {t("whereToWatch")}
              </h3>
              <p className="mt-2 text-sm text-zinc-100">
                {t("inCinemasHint", {
                  regionName: formatRegionName(
                    view.providersRegion || "US",
                    locale,
                  ),
                })}
              </p>
            </section>
          ) : (
            view.providers.length > 0 && (
              <section className="detail-stagger">
                <h3 className="text-xs font-bold tracking-[0.28em] text-zinc-500 uppercase">
                  {t("whereToWatch")}
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  {t("whereToWatchHint", {
                    regionName: formatRegionName(
                      view.providersRegion || "US",
                      locale,
                    ),
                  })}
                </p>
                <ul className="mt-5 flex gap-4 overflow-x-auto pb-2">
                  {view.providers.map((provider) => (
                    <ProviderBadge key={provider.id} provider={provider} />
                  ))}
                </ul>
              </section>
            )
          )}

          {view.cast.length > 0 && (
            <section className="detail-stagger">
              <h3 className="text-xs font-bold tracking-[0.28em] text-zinc-500 uppercase">
                {t("cast")}
              </h3>
              <ul className="hide-scrollbar mt-5 flex gap-4 overflow-x-auto pb-4">
                {view.cast.map((member) => (
                  <CastCard key={member.id} member={member} />
                ))}
              </ul>
            </section>
          )}

          {view.trailers.length > 0 && (
            <section className="detail-stagger">
              <h3 className="text-xs font-bold tracking-[0.28em] text-zinc-500 uppercase">
                {t("trailers")}
              </h3>
              <ul className="hide-scrollbar mt-5 flex gap-4 overflow-x-auto pb-4">
                {view.trailers.map((trailer) => (
                  <TrailerCard
                    key={trailer.id}
                    trailer={trailer}
                    onPlay={(nextTrailer, origin) =>
                      setTrailerPlayer({ trailer: nextTrailer, origin })
                    }
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>

      {trailerPlayer && (
        <TrailerLightbox
          key={trailerPlayer.trailer.id}
          trailer={trailerPlayer.trailer}
          origin={trailerPlayer.origin}
          onClosed={() => setTrailerPlayer(null)}
        />
      )}
    </div>
  );
}
