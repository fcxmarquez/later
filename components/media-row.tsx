"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef } from "react";
import type { MediaItem } from "@/lib/types";
import { MediaCard } from "./media-card";

export function MediaRow({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: MediaItem[];
}) {
  const tHome = useTranslations("Home");
  const headingId = useId();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({
      left: direction * Math.max(scroller.clientWidth * 0.8, 320),
      behavior: "smooth",
    });
  };

  return (
    <section className="safe-page-left mb-16" aria-labelledby={headingId}>
      <div className="safe-page-right flex items-end justify-between gap-5">
        <div>
          <h2
            id={headingId}
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
            aria-label={tHome("railPrevious", { title })}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
            aria-label={tHome("railNext", { title })}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        tabIndex={0}
        aria-label={title}
        className="safe-page-right hide-scrollbar mt-6 flex snap-x snap-proximity gap-4 overflow-x-auto pb-8 outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:gap-5"
      >
        {items.map((item) => (
          <div key={`${item.mediaType}-${item.id}`} className="snap-start">
            <MediaCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
