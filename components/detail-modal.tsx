"use client";
import Image from "next/image";
import { Check, Eye, Plus, X } from "lucide-react";
import { imageUrl } from "@/lib/catalog";
import { MediaItem } from "@/lib/types";
import { useWatchlist } from "@/store/watchlist";

export function DetailModal({ item, close }: { item: MediaItem; close: () => void }) {
  const saved = useWatchlist((state) => state.items.find((entry) => entry.id === item.id));
  const { add, remove, toggleWatched } = useWatchlist();
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-6" onClick={close}>
    <section onClick={(event) => event.stopPropagation()} className="relative max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-[30px] bg-[#111114] shadow-2xl sm:rounded-[30px]">
      <div className="relative h-[40vh] min-h-[320px]">
        <Image src={imageUrl(item.backdropPath, "backdrop")} alt="" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-[#111114]/20 to-black/25" />
      </div>
      <button onClick={close} className="glass absolute right-5 top-5 grid size-11 place-items-center rounded-full transition hover:bg-white hover:text-black" aria-label="Cerrar"><X /></button>
      <div className="relative -mt-24 px-6 pb-9 sm:px-10">
        <span className="text-xs font-bold uppercase tracking-[.25em] text-blue-400">{item.mediaType === "movie" ? "Película" : "Serie"}</span>
        <h2 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">{item.title}</h2>
        <p className="mt-4 text-sm text-zinc-400">{item.year} <span className="mx-2">·</span> ★ {item.rating.toFixed(1)} {item.genres.length > 0 && <><span className="mx-2">·</span>{item.genres.join(" · ")}</>}</p>
        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">{item.overview}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          {!saved ? <button onClick={() => add(item)} className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:scale-105"><Plus size={19}/> Añadir a mi lista</button> : <>
            <button onClick={() => toggleWatched(item.id)} className={`flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition hover:scale-105 ${saved.watched ? "bg-emerald-400 text-black" : "bg-white text-black"}`}>{saved.watched ? <Check size={19}/> : <Eye size={19}/>} {saved.watched ? "Ya la viste" : "Marcar como vista"}</button>
            <button onClick={() => remove(item.id)} className="rounded-full bg-white/10 px-6 py-3 font-semibold hover:bg-white/20">Quitar de mi lista</button>
          </>}
        </div>
      </div>
    </section>
  </div>;
}
