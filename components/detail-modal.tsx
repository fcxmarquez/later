"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type SyntheticEvent } from "react";
import { Check, Eye, Plus, X } from "lucide-react";
import { imageUrl } from "@/lib/catalog";
import type {
  CastMember,
  MediaDetail,
  MediaItem,
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
      runtime: null,
      seasons: null,
      status: null,
      director: null,
      creators: [],
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
  const [failed, setFailed] = useState(!member.profilePath);
  return (
    <li className="detail-stagger w-[104px] shrink-0 sm:w-[116px]">
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-800 ring-1 ring-white/10">
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
            className="object-cover"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <p className="mt-2 truncate text-sm font-medium text-zinc-100">
        {member.name}
      </p>
      <p className="truncate text-xs text-zinc-500">{member.character}</p>
    </li>
  );
}

function ExpandableOverview({ text, id }: { text: string; id: string }) {
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const measure = () => {
      const style = getComputedStyle(node);
      const lineHeight = Number.parseFloat(style.lineHeight);
      const maxCollapsed = Number.isFinite(lineHeight)
        ? lineHeight * OVERVIEW_COLLAPSED_LINES
        : 96;
      setCanExpand(node.scrollHeight > maxCollapsed + 2);
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
  }, [text]);

  const collapsed = canExpand && !expanded;

  return (
    <div className="mt-4 max-w-3xl">
      <div
        className={`detail-overview relative ${collapsed ? "is-collapsed" : "is-expanded"} ${canExpand ? "cursor-pointer" : ""}`}
        onClick={() => {
          if (canExpand) setExpanded((value) => !value);
        }}
        onKeyDown={(event) => {
          if (!canExpand) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setExpanded((value) => !value);
          }
        }}
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : undefined}
        aria-expanded={canExpand ? expanded : undefined}
        aria-controls={canExpand ? id : undefined}
      >
        <p
          ref={contentRef}
          id={id}
          className="detail-overview-text text-base leading-8 text-zinc-300 sm:text-lg"
        >
          {text}
        </p>
        {collapsed && (
          <span
            className="detail-overview-fade pointer-events-none absolute inset-x-0 bottom-0 h-16"
            aria-hidden
          />
        )}
      </div>
      {canExpand && (
        <p className="mt-2 text-sm font-medium text-zinc-100">
          {expanded ? "Ver menos" : "Ver más"}
        </p>
      )}
    </div>
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

  const view = mergeDetail(item, detail);
  const runtimeLabel = formatRuntime(view.runtime);
  const creditLine = view.director
    ? `Dirección · ${view.director}`
    : view.creators?.length
      ? `Creación · ${view.creators.join(", ")}`
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
    fetch(`/api/tmdb/detail?id=${item.id}&type=${item.mediaType}`, {
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
  }, [item.id, item.mediaType]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex='-1'])",
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
    view.mediaType === "tv" && view.seasons ? `${view.seasons} temp.` : null,
    view.rating > 0 ? `★ ${view.rating.toFixed(1)}` : null,
    ...view.genres,
  ].filter(Boolean);

  return (
    <div
      className={`detail-overlay fixed inset-0 z-50 ${phase === "enter" ? "is-enter" : ""} ${phase === "shown" ? "is-shown" : ""} ${phase === "exit" ? "is-exit" : ""}`}
      onClick={requestClose}
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
        className="detail-panel absolute inset-0 overflow-y-auto overscroll-contain bg-[#07070a]"
      >
        <div className="relative min-h-[72vh] bg-black sm:min-h-[78vh]">
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
            className="glass absolute top-5 right-5 z-20 grid size-11 place-items-center rounded-full transition hover:bg-white hover:text-black sm:top-7 sm:right-8"
            aria-label="Cerrar"
          >
            <X />
          </button>

          <div className="relative flex min-h-[72vh] flex-col justify-end px-5 pb-10 sm:min-h-[78vh] sm:px-10 sm:pb-14 lg:px-16">
            <div className="detail-hero-copy max-w-3xl">
              <span className="text-[11px] font-semibold tracking-[0.22em] text-zinc-300 uppercase">
                {view.mediaType === "movie" ? "Película" : "Serie"}
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

              <div className="mt-7 flex flex-wrap gap-3">
                {!saved ? (
                  <button
                    type="button"
                    onClick={() => add(item)}
                    className="flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-black transition hover:scale-[1.03]"
                  >
                    <Plus size={19} /> Añadir a mi lista
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleWatched(item)}
                      className={`flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold transition hover:scale-[1.03] ${saved.watched ? "bg-emerald-400 text-black" : "bg-white text-black"}`}
                    >
                      {saved.watched ? <Check size={19} /> : <Eye size={19} />}{" "}
                      {saved.watched ? "Ya la viste" : "Marcar como vista"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      className="rounded-full bg-white/10 px-6 py-3.5 font-semibold backdrop-blur-md transition hover:bg-white/20"
                    >
                      Quitar de mi lista
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-12 px-5 pb-20 sm:px-10 lg:px-16">
          <section className="detail-stagger max-w-3xl">
            <h3 className="text-xs font-bold tracking-[0.28em] text-zinc-500 uppercase">
              Sinopsis
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
                No pudimos enriquecer la ficha. Mostramos la información básica.
              </p>
            )}
          </section>

          {view.providers.length > 0 && (
            <section className="detail-stagger">
              <h3 className="text-xs font-bold tracking-[0.28em] text-zinc-500 uppercase">
                Dónde verlo
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Disponibilidad en España (streaming, alquiler o compra).
              </p>
              <ul className="mt-5 flex gap-4 overflow-x-auto pb-2">
                {view.providers.map((provider) => (
                  <ProviderBadge key={provider.id} provider={provider} />
                ))}
              </ul>
            </section>
          )}

          {view.cast.length > 0 && (
            <section className="detail-stagger">
              <h3 className="text-xs font-bold tracking-[0.28em] text-zinc-500 uppercase">
                Reparto
              </h3>
              <ul className="hide-scrollbar mt-5 flex gap-4 overflow-x-auto pb-4">
                {view.cast.map((member) => (
                  <CastCard key={member.id} member={member} />
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
