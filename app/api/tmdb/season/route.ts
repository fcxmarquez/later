import { NextRequest, NextResponse } from "next/server";
import { isAppLocale, routing, tmdbLanguage } from "@/i18n/routing";
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

const noOverviewByLocale = {
  es: "Sin descripción disponible.",
  en: "No description available.",
} as const;

export const dynamic = "force-dynamic";

function fallbackSeasonName(seasonNumber: number, locale: "es" | "en") {
  if (seasonNumber === 0) return locale === "es" ? "Especiales" : "Specials";
  return locale === "es"
    ? `Temporada ${seasonNumber}`
    : `Season ${seasonNumber}`;
}

function fallbackEpisodeName(episodeNumber: number, locale: "es" | "en") {
  return locale === "es"
    ? `Capítulo ${episodeNumber}`
    : `Episode ${episodeNumber}`;
}

function mapSeason(
  data: TmdbSeasonResponse,
  locale: "es" | "en",
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

export async function GET(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");
  const seasonParam = request.nextUrl.searchParams.get("season");
  const localeParam =
    request.nextUrl.searchParams.get("locale") || routing.defaultLocale;
  const locale = isAppLocale(localeParam) ? localeParam : routing.defaultLocale;
  const id = Number(idParam);
  const seasonNumber = Number(seasonParam);

  if (
    !idParam ||
    !Number.isInteger(id) ||
    id <= 0 ||
    !seasonParam ||
    !Number.isInteger(seasonNumber) ||
    seasonNumber < 0
  ) {
    return NextResponse.json(
      { error: "Parámetros id y season requeridos." },
      { status: 400 },
    );
  }

  const token = process.env.TMDB_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "TMDB_API_TOKEN is not configured." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?language=${tmdbLanguage(locale)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to load season details from TMDB." },
        { status: response.status === 404 ? 404 : 502 },
      );
    }

    const data: TmdbSeasonResponse = await response.json();
    return NextResponse.json({ season: mapSeason(data, locale) });
  } catch {
    return NextResponse.json(
      { error: "Failed to load season details from TMDB." },
      { status: 502 },
    );
  }
}
