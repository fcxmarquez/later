"use client";
import Image from "next/image";
import { Check, Plus } from "lucide-react";
import { imageUrl } from "@/lib/catalog";
import { MediaItem } from "@/lib/types";
import { useWatchlist } from "@/store/watchlist";

export function MediaCard({
  item,
  onOpen,
}: {
  item: MediaItem;
  onOpen: (item: MediaItem) => void;
}) {
  const saved = useWatchlist((state) =>
    state.items.find(
      (entry) => entry.id === item.id && entry.mediaType === item.mediaType,
    ),
  );
  const add = useWatchlist((state) => state.add);
  return (
    <article className="group relative w-[155px] shrink-0 sm:w-[190px] lg:w-[215px]">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="absolute inset-0 z-10 cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#050507]"
        aria-label={`Ver detalles de ${item.title}`}
      />
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900 transition duration-500 group-hover:-translate-y-2 group-hover:scale-[1.025] group-hover:shadow-[0_20px_55px_rgba(0,0,0,.8)]">
        <Image
          src={imageUrl(item.posterPath)}
          alt={`Póster de ${item.title}`}
          fill
          sizes="215px"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-50 group-hover:opacity-100" />
        <button
          type="button"
          disabled={Boolean(saved)}
          onClick={() => {
            if (!saved) add(item);
          }}
          className="absolute right-3 bottom-3 z-20 grid size-11 cursor-pointer place-items-center rounded-full bg-white text-black opacity-100 shadow-lg transition hover:scale-110 disabled:cursor-default sm:size-10 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          aria-label={saved ? "Ya está en tu lista" : "Añadir a mi lista"}
        >
          {saved ? <Check size={19} /> : <Plus size={20} />}
        </button>
        <span className="absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold tracking-widest uppercase backdrop-blur-md">
          {item.mediaType === "movie" ? "Película" : "Serie"}
        </span>
      </div>
      <h3 className="mt-3 truncate text-sm font-semibold text-zinc-100 sm:text-base">
        {item.title}
      </h3>
      <p className="mt-1 text-xs text-zinc-500">
        {item.year} <span className="px-1">·</span> ★ {item.rating.toFixed(1)}
      </p>
    </article>
  );
}
