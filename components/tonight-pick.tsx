"use client";

import { ArrowRight, Shuffle, Sparkles } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { imageUrl } from "@/lib/catalog";
import type { SavedMedia } from "@/lib/types";

export function TonightPick({
  item,
  canShuffle,
  firstContent,
  onShuffle,
}: {
  item: SavedMedia;
  canShuffle: boolean;
  firstContent: boolean;
  onShuffle: () => void;
}) {
  const tHome = useTranslations("Home");
  const headingId = `tonight-pick-${item.mediaType}-${item.id}`;

  return (
    <section
      className={`safe-page-x mb-16 ${firstContent ? "pt-24" : ""}`}
      aria-labelledby={headingId}
    >
      <article className="relative isolate flex min-h-[31rem] items-end overflow-hidden rounded-[2rem] bg-zinc-900 p-6 shadow-[0_30px_90px_rgba(0,0,0,.45)] sm:min-h-[34rem] sm:p-10 lg:min-h-[30rem] lg:p-12">
        <Image
          src={imageUrl(item.backdropPath, "backdrop")}
          alt=""
          fill
          sizes="(min-width: 1024px) calc(100vw - 7rem), calc(100vw - 2.5rem)"
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/65 to-black/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-transparent to-black/15" />

        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs font-bold tracking-[.28em] text-amber-300 uppercase">
            <Sparkles size={15} /> {tHome("dynamic.tonightPick.eyebrow")}
          </p>
          <h2
            id={headingId}
            className="mt-4 text-4xl font-bold tracking-[-.04em] sm:text-6xl"
          >
            {item.title}
          </h2>
          <p className="mt-3 text-sm font-medium text-zinc-300">
            {tHome("dynamic.tonightPick.meta", {
              type:
                item.mediaType === "movie"
                  ? tHome("dynamic.movie")
                  : tHome("dynamic.series"),
              year: item.year || tHome("dynamic.unknownYear"),
              rating: item.rating.toFixed(1),
            })}
          </p>
          <p className="mt-5 line-clamp-3 max-w-xl text-sm leading-6 text-zinc-200 sm:text-base sm:leading-7">
            {item.overview}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={`/title/${item.mediaType}/${item.id}`}
              prefetch={false}
              className="flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:scale-[1.03]"
            >
              {tHome("dynamic.tonightPick.seeDetails")}
              <ArrowRight size={18} />
            </Link>
            {canShuffle ? (
              <button
                type="button"
                onClick={onShuffle}
                className="glass flex min-h-12 items-center gap-2 rounded-full px-6 py-3 font-semibold text-white transition hover:scale-[1.03]"
              >
                <Shuffle size={18} />
                {tHome("dynamic.tonightPick.another")}
              </button>
            ) : null}
          </div>
        </div>
      </article>
    </section>
  );
}
