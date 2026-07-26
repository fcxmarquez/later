"use client";
import Image from "next/image";
import { Check, Plus } from "lucide-react";
import { imageUrl } from "@/lib/catalog";
import { MediaItem } from "@/lib/types";
import { useWatchlist } from "@/store/watchlist";

export function MediaCard({ item, onOpen }: { item: MediaItem; onOpen: (item: MediaItem) => void }) {
  const saved = useWatchlist((state) => state.items.find((entry) => entry.id === item.id));
  const add = useWatchlist((state) => state.add);
  return <article onClick={() => onOpen(item)} className="group relative w-[155px] shrink-0 cursor-pointer sm:w-[190px] lg:w-[215px]" aria-label={`Ver detalles de ${item.title}`}>
    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900 transition duration-500 group-hover:-translate-y-2 group-hover:scale-[1.025] group-hover:shadow-[0_20px_55px_rgba(0,0,0,.8)]">
      <Image src={imageUrl(item.posterPath)} alt={`Póster de ${item.title}`} fill sizes="215px" className="object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-50 group-hover:opacity-100" />
      <button onClick={(event) => { event.stopPropagation(); if (!saved) add(item); }} className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-white text-black opacity-0 shadow-lg transition hover:scale-110 group-hover:opacity-100" aria-label={saved ? "Ya está en tu lista" : "Añadir a mi lista"}>
        {saved ? <Check size={19} /> : <Plus size={20} />}
      </button>
      <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur-md">{item.mediaType === "movie" ? "Película" : "Serie"}</span>
    </div>
    <h3 className="mt-3 truncate text-sm font-semibold text-zinc-100 sm:text-base">{item.title}</h3>
    <p className="mt-1 text-xs text-zinc-500">{item.year} <span className="px-1">·</span> ★ {item.rating.toFixed(1)}</p>
  </article>;
}
