import type { AppLocale } from "@/i18n/routing";
import type { MediaItem, MediaType } from "@/lib/types";

export type TmdbListResult = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

export const HOME_SECTION_IDS = [
  "trending",
  "nowPlaying",
  "popularMovies",
  "popularTv",
  "topRatedMovies",
  "onTheAir",
  "upcoming",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

export type HomeSection = {
  id: HomeSectionId;
  results: MediaItem[];
};

const untitledByLocale = {
  es: "Sin título",
  en: "Untitled",
} as const;

const noOverviewByLocale = {
  es: "Sin descripción disponible.",
  en: "No description available.",
} as const;

type HomeSectionConfig = {
  id: HomeSectionId;
  path: string;
  mediaType?: MediaType;
  /** Include `region` when the list is region-sensitive (now playing / upcoming). */
  regional?: boolean;
};

export const HOME_SECTION_CONFIG: readonly HomeSectionConfig[] = [
  { id: "trending", path: "trending/all/week" },
  {
    id: "nowPlaying",
    path: "movie/now_playing",
    mediaType: "movie",
    regional: true,
  },
  { id: "popularMovies", path: "movie/popular", mediaType: "movie" },
  { id: "popularTv", path: "tv/popular", mediaType: "tv" },
  { id: "topRatedMovies", path: "movie/top_rated", mediaType: "movie" },
  { id: "onTheAir", path: "tv/on_the_air", mediaType: "tv" },
  {
    id: "upcoming",
    path: "movie/upcoming",
    mediaType: "movie",
    regional: true,
  },
];

export function mapTmdbResult(
  item: TmdbListResult,
  locale: AppLocale,
  forcedMediaType?: MediaType,
): MediaItem | null {
  const mediaType =
    forcedMediaType ??
    (item.media_type === "movie" || item.media_type === "tv"
      ? item.media_type
      : null);
  if (!mediaType || !item.poster_path) return null;

  return {
    id: item.id,
    title: item.title || item.name || untitledByLocale[locale],
    overview: item.overview || noOverviewByLocale[locale],
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path || item.poster_path,
    mediaType,
    year: String(item.release_date || item.first_air_date || "").slice(0, 4),
    rating: Number(item.vote_average || 0),
    genres: [],
  };
}

export function mapTmdbResults(
  results: TmdbListResult[] | undefined,
  locale: AppLocale,
  forcedMediaType?: MediaType,
): MediaItem[] {
  if (!results?.length) return [];
  const mapped: MediaItem[] = [];
  for (const item of results) {
    const media = mapTmdbResult(item, locale, forcedMediaType);
    if (media) mapped.push(media);
  }
  return mapped;
}
