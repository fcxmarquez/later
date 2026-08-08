"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { Bookmark, Check, Play } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { imageUrl } from "@/lib/catalog";
import type { MediaItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/store/watchlist";

const AUTOPLAY_DELAY_MS = 6500;

type FeaturedCarouselProps = {
  items: MediaItem[];
};

export function FeaturedCarousel({ items }: FeaturedCarouselProps) {
  const tHome = useTranslations("Home");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const canAutoplay = items.length > 1;
  const [plugins] = useState(() => [
    Autoplay({
      delay: AUTOPLAY_DELAY_MS,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  ]);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: canAutoplay },
    canAutoplay ? plugins : [],
  );

  useEffect(() => {
    if (!emblaApi) return;

    const handleSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", handleSelect);
    emblaApi.on("reInit", handleSelect);
    return () => {
      emblaApi.off("select", handleSelect);
      emblaApi.off("reInit", handleSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || !canAutoplay) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => {
      const plugin = emblaApi.plugins().autoplay;
      if (!plugin) return;
      if (media.matches) plugin.stop();
      else plugin.play();
    };

    syncMotionPreference();
    media.addEventListener("change", syncMotionPreference);
    return () => media.removeEventListener("change", syncMotionPreference);
  }, [canAutoplay, emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi],
  );

  if (items.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={tHome("carouselLabel")}
      className="relative overflow-hidden"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {items.map((item, index) => {
            const isActive = index === selectedIndex;
            return (
              <article
                key={`${item.mediaType}-${item.id}`}
                aria-roledescription="slide"
                aria-label={tHome("carouselSlide", {
                  current: index + 1,
                  total: items.length,
                })}
                aria-hidden={!isActive}
                inert={!isActive}
                className="safe-page-x relative flex min-h-[78vh] min-w-0 shrink-0 grow-0 basis-full items-end pb-20 supports-[height:100svh]:min-h-[78svh] lg:min-h-[88vh] lg:pb-28 supports-[height:100svh]:lg:min-h-[88svh]"
              >
                <Image
                  src={imageUrl(item.backdropPath, "backdrop")}
                  alt={tHome("featuredAlt", { title: item.title })}
                  fill
                  priority={index === 0}
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
                    {item.title}
                  </h1>
                  <p className="mt-5 line-clamp-3 max-w-xl text-base leading-7 text-zinc-200 sm:text-lg">
                    {item.overview}
                  </p>
                  <div className="mt-7 flex gap-3 max-[359px]:gap-2">
                    <Link
                      href={`/title/${item.mediaType}/${item.id}`}
                      prefetch={false}
                      className="flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold whitespace-nowrap text-black transition hover:scale-105 max-[359px]:px-3 max-[359px]:text-sm"
                    >
                      <Play size={18} fill="currentColor" />{" "}
                      {tHome("seeDetails")}
                    </Link>
                    <FeaturedWatchlistButton item={item} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {canAutoplay ? (
        <div
          className="safe-page-x absolute inset-x-0 bottom-2 z-10 flex justify-center gap-0 sm:bottom-4 sm:gap-1 lg:bottom-6 lg:justify-start"
          role="tablist"
          aria-label={tHome("carouselDotsLabel")}
        >
          {items.map((item, index) => {
            const isActive = index === selectedIndex;
            return (
              <button
                key={`${item.mediaType}-${item.id}-dot`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={tHome("carouselDot", { title: item.title })}
                onClick={() => scrollTo(index)}
                className="group grid size-11 place-items-center rounded-full"
              >
                <span
                  className={cn(
                    "h-2 rounded-full transition-[width,background-color,opacity] duration-300",
                    isActive
                      ? "w-7 bg-white"
                      : "w-2 bg-white/45 group-hover:bg-white/70",
                  )}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function FeaturedWatchlistButton({ item }: { item: MediaItem }) {
  const tHome = useTranslations("Home");
  const saved = useWatchlist((state) =>
    state.items.some(
      (entry) => entry.id === item.id && entry.mediaType === item.mediaType,
    ),
  );
  const add = useWatchlist((state) => state.add);
  const remove = useWatchlist((state) => state.remove);
  const [justAdded, setJustAdded] = useState(false);

  const toggleSaved = () => {
    if (saved) {
      setJustAdded(false);
      void remove(item);
      return;
    }

    setJustAdded(true);
    void add(item);
  };

  return (
    <button
      type="button"
      onClick={toggleSaved}
      aria-label={saved ? tHome("removeFromList") : tHome("addToList")}
      aria-pressed={saved}
      className={cn(
        "glass flex cursor-pointer items-center gap-2 rounded-full px-6 py-3.5 font-semibold whitespace-nowrap transition hover:scale-105 max-[359px]:px-3 max-[359px]:text-sm",
        saved && justAdded && "watchlist-added",
      )}
    >
      {saved ? <Check size={19} /> : <Bookmark size={19} />}{" "}
      {saved ? tHome("inYourList") : tHome("myList")}
    </button>
  );
}
