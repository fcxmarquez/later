"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { imageUrl } from "@/lib/catalog";
import type { MediaItem } from "@/lib/types";
import { useWatchlist } from "@/store/watchlist";

const GRID_IMAGE_SIZES = [
  "(min-width: 1536px) calc((100vw - 208px) / 7)",
  "(min-width: 1280px) calc((100vw - 192px) / 6)",
  "(min-width: 1024px) calc((100vw - 176px) / 5)",
  "(min-width: 768px) calc((100vw - 128px) / 4)",
  "(min-width: 640px) calc((100vw - 112px) / 3)",
  "calc((100vw - 56px) / 2)",
].join(", ");
const RAIL_IMAGE_SIZES =
  "(min-width: 1024px) 215px, (min-width: 640px) 190px, 155px";

export function MediaCard({
  item,
  layout = "rail",
  subtitle,
}: {
  item: MediaItem;
  layout?: "grid" | "rail";
  subtitle?: string;
}) {
  const t = useTranslations("MediaCard");
  const tCommon = useTranslations("Common");
  const saved = useWatchlist((state) =>
    state.items.find(
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
    <article
      className={`group relative ${layout === "grid" ? "w-full min-w-0" : "w-[155px] shrink-0 sm:w-[190px] lg:w-[215px]"}`}
    >
      <Link
        href={`/title/${item.mediaType}/${item.id}`}
        prefetch={false}
        className="absolute inset-0 z-10 cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#050507]"
        aria-label={t("openDetails", { title: item.title })}
      />
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900 transition duration-500 group-hover:-translate-y-2 group-hover:scale-[1.025] group-hover:shadow-[0_20px_55px_rgba(0,0,0,.8)]">
        <Image
          src={imageUrl(item.posterPath)}
          alt={t("posterAlt", { title: item.title })}
          fill
          sizes={layout === "grid" ? GRID_IMAGE_SIZES : RAIL_IMAGE_SIZES}
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-50 group-hover:opacity-100" />
        <button
          type="button"
          onClick={toggleSaved}
          className={`absolute right-3 bottom-3 z-20 grid size-11 cursor-pointer place-items-center rounded-full bg-white text-black opacity-100 shadow-lg transition hover:scale-110 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 ${saved && justAdded ? "watchlist-added" : ""}`}
          aria-label={saved ? t("removeFromList") : t("addToList")}
          aria-pressed={Boolean(saved)}
        >
          {saved ? <Check size={19} /> : <Plus size={20} />}
        </button>
        <span className="absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold tracking-widest uppercase backdrop-blur-md">
          {item.mediaType === "movie" ? tCommon("movie") : tCommon("series")}
        </span>
      </div>
      <h3 className="mt-3 truncate text-sm font-semibold text-zinc-100 sm:text-base">
        {item.title}
      </h3>
      <p className="mt-1 text-xs text-zinc-500">
        {item.year} <span className="px-1">·</span> ★ {item.rating.toFixed(1)}
      </p>
      {subtitle ? (
        <p className="mt-1 truncate text-xs text-zinc-400">{subtitle}</p>
      ) : null}
    </article>
  );
}
