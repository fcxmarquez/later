import type { HomeSection } from "@/lib/tmdb";
import type { MediaItem, SavedMedia } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_CATALOG_ROW_ITEMS = 4;

export function mediaIdentity(item: Pick<MediaItem, "id" | "mediaType">) {
  return `${item.mediaType}:${item.id}`;
}

export function selectDailyPick(
  items: SavedMedia[],
  offset = 0,
  dayNumber = Math.floor(Date.now() / DAY_MS),
) {
  if (items.length === 0) return null;

  const listSeed = items.reduce(
    (seed, item) => seed + item.id * (item.mediaType === "movie" ? 1 : 3),
    0,
  );
  const startIndex = (dayNumber + listSeed) % items.length;
  return items[(startIndex + offset) % items.length];
}

export function uniqueMedia(
  items: MediaItem[],
  excluded: Iterable<Pick<MediaItem, "id" | "mediaType">> = [],
) {
  const seen = new Set(Array.from(excluded, mediaIdentity));
  const results: MediaItem[] = [];

  for (const item of items) {
    const identity = mediaIdentity(item);
    if (seen.has(identity)) continue;
    seen.add(identity);
    results.push(item);
  }

  return results;
}

export function composeCatalogSections(
  sections: HomeSection[],
  excluded: Iterable<Pick<MediaItem, "id" | "mediaType">>,
  maxSections: number,
) {
  const seen = new Set(Array.from(excluded, mediaIdentity));
  const composed: HomeSection[] = [];

  for (const section of sections) {
    const results: MediaItem[] = [];
    const rowIdentities = new Set<string>();

    for (const item of section.results) {
      const identity = mediaIdentity(item);
      if (seen.has(identity) || rowIdentities.has(identity)) continue;
      rowIdentities.add(identity);
      results.push(item);
    }

    if (results.length < MIN_CATALOG_ROW_ITEMS) continue;
    for (const identity of rowIdentities) seen.add(identity);
    composed.push({ ...section, results });
    if (composed.length >= maxSections) break;
  }

  return composed;
}
