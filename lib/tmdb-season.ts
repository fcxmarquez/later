import "server-only";

import type { AppLocale } from "@/i18n/routing";
import { tmdbLanguage } from "@/i18n/routing";
import type { MediaEpisode, MediaSeasonDetail } from "@/lib/types";

type TmdbEpisode = {
  id: number;
  name?: string;
  overview?: string;
  episode_number: number;
  season_number: number;
  air_date?: string;
  runtime?: number | null;
  still_path?: string | null;
  vote_average?: number;
};

type TmdbSeasonResponse = {
  id: number;
  name?: string;
  overview?: string;
  season_number: number;
  air_date?: string;
  poster_path?: string | null;
  episodes?: TmdbEpisode[];
};

export type SeasonDetailResult =
  | { status: "success"; season: MediaSeasonDetail }
  | { status: "not-found" }
  | { status: "unconfigured" }
  | { status: "unavailable" };

const noOverviewByLocale = {
  es: "Sin descripción disponible.",
  en: "No description available.",
} as const;

function fallbackSeasonName(seasonNumber: number, locale: AppLocale) {
  if (seasonNumber === 0) return locale === "es" ? "Especiales" : "Specials";
  return locale === "es"
    ? `Temporada ${seasonNumber}`
    : `Season ${seasonNumber}`;
}

function fallbackEpisodeName(episodeNumber: number, locale: AppLocale) {
  return locale === "es"
    ? `Capítulo ${episodeNumber}`
    : `Episode ${episodeNumber}`;
}

function mapSeason(
  data: TmdbSeasonResponse,
  locale: AppLocale,
): MediaSeasonDetail {
  const episodes: MediaEpisode[] = (data.episodes || [])
    .filter(
      (episode) =>
        Number.isInteger(episode.episode_number) && episode.episode_number > 0,
    )
    .map((episode) => ({
      id: episode.id,
      name:
        episode.name?.trim() ||
        fallbackEpisodeName(episode.episode_number, locale),
      overview: episode.overview?.trim() || noOverviewByLocale[locale],
      episodeNumber: episode.episode_number,
      seasonNumber: episode.season_number,
      airDate: episode.air_date || "",
      runtime: episode.runtime ?? null,
      stillPath: episode.still_path || null,
      rating: Number(episode.vote_average || 0),
    }))
    .sort((a, b) => a.episodeNumber - b.episodeNumber);

  return {
    id: data.id,
    name: data.name?.trim() || fallbackSeasonName(data.season_number, locale),
    overview: data.overview?.trim() || "",
    seasonNumber: data.season_number,
    airDate: data.air_date || "",
    posterPath: data.poster_path || null,
    episodes,
  };
}

export async function getSeasonDetail(
  id: number,
  seasonNumber: number,
  locale: AppLocale,
): Promise<SeasonDetailResult> {
  const token = process.env.TMDB_API_TOKEN;
  if (!token) return { status: "unconfigured" };

  try {
    const params = new URLSearchParams({ language: tmdbLanguage(locale) });
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      },
    );

    if (response.status === 404) return { status: "not-found" };
    if (!response.ok) return { status: "unavailable" };

    const data: TmdbSeasonResponse = await response.json();
    return { status: "success", season: mapSeason(data, locale) };
  } catch {
    return { status: "unavailable" };
  }
}
