import "server-only";

import { cache } from "react";
import type { AppLocale } from "@/i18n/routing";
import { tmdbLanguage } from "@/i18n/routing";
import { getStreamingWatchProviders } from "@/lib/streaming-availability";
import { DEFAULT_PROVIDER_REGION } from "@/lib/tmdb-region";
import type {
  CastMember,
  MediaDetail,
  MediaSeason,
  MediaTrailer,
  MediaType,
  WatchProvider,
  WatchProviderRegion,
} from "@/lib/types";

const untitledByLocale = {
  es: "Sin título",
  en: "Untitled",
} as const;

const noOverviewByLocale = {
  es: "Sin descripción disponible.",
  en: "No description available.",
} as const;

type TmdbGenre = { id: number; name: string };
type TmdbCast = {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
};
type TmdbCrew = { name: string; job?: string };
type TmdbCreatedBy = { name: string };
type TmdbSeason = {
  id: number;
  name?: string;
  season_number: number;
  episode_count?: number;
  air_date?: string;
  poster_path?: string | null;
};
type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
};
type TmdbProviderRegion = {
  link?: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
  ads?: TmdbProvider[];
  free?: TmdbProvider[];
};
type TmdbVideo = {
  id: string;
  key?: string;
  name?: string;
  site?: string;
  type?: string;
  official?: boolean;
};
type TmdbReleaseDate = {
  release_date?: string;
  type?: number;
};
type TmdbDetailResponse = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  tagline?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  runtime?: number | null;
  episode_run_time?: number[];
  number_of_seasons?: number;
  status?: string;
  genres?: TmdbGenre[];
  created_by?: TmdbCreatedBy[];
  credits?: { cast?: TmdbCast[]; crew?: TmdbCrew[] };
  "watch/providers"?: {
    results?: Record<string, TmdbProviderRegion>;
  };
  videos?: { results?: TmdbVideo[] };
  release_dates?: {
    results?: Array<{
      iso_3166_1?: string;
      release_dates?: TmdbReleaseDate[];
    }>;
  };
  seasons?: TmdbSeason[];
};

export type TitleDetailResult =
  | { status: "success"; detail: MediaDetail }
  | { status: "not-found" }
  | { status: "unavailable" };

const THEATRICAL_RELEASE_TYPES = new Set([2, 3]);
const THEATRICAL_WINDOW_DAYS = 60;

function regionHasProviders(region: TmdbProviderRegion | undefined) {
  if (!region) return false;
  return [region.flatrate, region.ads, region.free, region.rent, region.buy]
    .filter(Boolean)
    .some((bucket) => (bucket?.length ?? 0) > 0);
}

function normalizeWatchProvidersLink(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !["themoviedb.org", "www.themoviedb.org"].includes(url.hostname)
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function parseReleaseDay(value: string | undefined): Date | null {
  if (!value) return null;
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfUtcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function isInCinemas(
  detail: TmdbDetailResponse,
  mediaType: MediaType,
  preferredRegion: WatchProviderRegion,
) {
  if (mediaType !== "movie" || !detail.release_dates?.results?.length) {
    return { inCinemas: false, region: null };
  }

  const results = detail.release_dates.results;
  const preferred =
    results.find((entry) => entry.iso_3166_1 === preferredRegion) ||
    results.find((entry) => entry.iso_3166_1 === DEFAULT_PROVIDER_REGION) ||
    results[0];
  const region = preferred?.iso_3166_1 || null;
  if (!preferred?.release_dates?.length || !region) {
    return { inCinemas: false, region: null };
  }

  const today = startOfUtcDay(new Date());
  const windowMs = THEATRICAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const inCinemas = preferred.release_dates.some((release) => {
    if (!release.type || !THEATRICAL_RELEASE_TYPES.has(release.type)) {
      return false;
    }
    const releaseDay = parseReleaseDay(release.release_date);
    if (!releaseDay) return false;
    const releasedAt = startOfUtcDay(releaseDay);
    return releasedAt <= today && today - releasedAt <= windowMs;
  });

  return { inCinemas, region: inCinemas ? region : null };
}

function mapProviders(
  detail: TmdbDetailResponse,
  preferredRegion: WatchProviderRegion,
) {
  const results = detail["watch/providers"]?.results;
  const preferred = results?.[preferredRegion];
  const us = results?.[DEFAULT_PROVIDER_REGION];
  const providersRegion = regionHasProviders(preferred)
    ? preferredRegion
    : regionHasProviders(us)
      ? DEFAULT_PROVIDER_REGION
      : null;
  const region =
    providersRegion === preferredRegion
      ? (preferred ?? {})
      : providersRegion === DEFAULT_PROVIDER_REGION
        ? (us ?? {})
        : {};
  const providers: WatchProvider[] = [];
  const watchProvidersLink = normalizeWatchProvidersLink(region.link);
  const seen = new Set<number>();

  for (const bucket of [
    region.flatrate,
    region.ads,
    region.free,
    region.rent,
    region.buy,
  ]) {
    for (const provider of bucket || []) {
      if (seen.has(provider.provider_id) || !provider.logo_path) continue;
      seen.add(provider.provider_id);
      providers.push({
        id: `tmdb-${provider.provider_id}`,
        name: provider.provider_name.trim(),
        logoPath: provider.logo_path,
        logoUrl: null,
        link: null,
      });
      if (providers.length >= 8) {
        return { providers, providersRegion, watchProvidersLink };
      }
    }
  }

  return { providers, providersRegion, watchProvidersLink };
}

function mapTrailers(detail: TmdbDetailResponse): MediaTrailer[] {
  const seen = new Set<string>();
  const trailers: MediaTrailer[] = [];

  for (const video of detail.videos?.results || []) {
    if (video.site !== "YouTube" || !video.key) continue;
    if (video.type !== "Trailer" && video.type !== "Teaser") continue;
    if (seen.has(video.key)) continue;
    seen.add(video.key);
    trailers.push({
      id: video.id || video.key,
      key: video.key,
      name: video.name?.trim() || video.type,
      site: "YouTube",
      type: video.type,
      official: Boolean(video.official),
    });
  }

  return trailers
    .sort((left, right) => {
      const leftRank =
        (left.type === "Trailer" ? 0 : 10) + (left.official ? 0 : 1);
      const rightRank =
        (right.type === "Trailer" ? 0 : 10) + (right.official ? 0 : 1);
      return leftRank - rightRank;
    })
    .slice(0, 6);
}

function mapDetail(
  detail: TmdbDetailResponse,
  mediaType: MediaType,
  locale: AppLocale,
  preferredRegion: WatchProviderRegion,
  streamingProviders: WatchProvider[] | null,
): MediaDetail {
  const cast: CastMember[] = (detail.credits?.cast || [])
    .slice()
    .sort((left, right) => (left.order ?? 99) - (right.order ?? 99))
    .slice(0, 12)
    .map((member) => ({
      id: member.id,
      name: member.name,
      character: member.character || "",
      profilePath: member.profile_path || null,
    }));
  const director =
    detail.credits?.crew?.find((member) => member.job === "Director")?.name ||
    null;
  const creators = (detail.created_by || []).map((creator) => creator.name);
  const seasonList: MediaSeason[] = (detail.seasons || [])
    .filter(
      (season) =>
        Number.isInteger(season.season_number) && season.season_number >= 0,
    )
    .map((season) => ({
      id: season.id,
      name:
        season.name?.trim() ||
        (season.season_number === 0
          ? locale === "es"
            ? "Especiales"
            : "Specials"
          : locale === "es"
            ? `Temporada ${season.season_number}`
            : `Season ${season.season_number}`),
      seasonNumber: season.season_number,
      episodeCount: season.episode_count ?? 0,
      airDate: season.air_date || "",
      posterPath: season.poster_path || null,
    }))
    .sort((left, right) => left.seasonNumber - right.seasonNumber);
  const runtime =
    mediaType === "movie"
      ? (detail.runtime ?? null)
      : (detail.episode_run_time?.[0] ?? detail.runtime ?? null);
  const { inCinemas, region: cinemaRegion } = isInCinemas(
    detail,
    mediaType,
    preferredRegion,
  );
  const tmdbProviders = mapProviders(detail, preferredRegion);
  const { providers, providersRegion, providersSource, watchProvidersLink } =
    inCinemas
      ? {
          providers: [] as WatchProvider[],
          providersRegion: cinemaRegion,
          providersSource: null,
          watchProvidersLink: null,
        }
      : streamingProviders?.length
        ? {
            providers: streamingProviders,
            providersRegion: preferredRegion,
            providersSource: "streaming-availability" as const,
            watchProvidersLink: tmdbProviders.watchProvidersLink,
          }
        : {
            ...tmdbProviders,
            providersSource: tmdbProviders.providers.length
              ? ("tmdb" as const)
              : null,
          };

  return {
    id: detail.id,
    title: detail.title || detail.name || untitledByLocale[locale],
    overview: detail.overview || noOverviewByLocale[locale],
    posterPath: detail.poster_path || "",
    backdropPath: detail.backdrop_path || detail.poster_path || "",
    mediaType,
    year: String(detail.release_date || detail.first_air_date || "").slice(
      0,
      4,
    ),
    rating: Number(detail.vote_average || 0),
    genres: (detail.genres || []).map((genre) => genre.name),
    tagline: detail.tagline || undefined,
    runtime,
    seasons: mediaType === "tv" ? (detail.number_of_seasons ?? null) : null,
    status: detail.status || null,
    cast,
    providers,
    providersRegion,
    providersSource,
    watchProvidersLink,
    inCinemas,
    director,
    creators,
    trailers: mapTrailers(detail),
    seasonList: mediaType === "tv" ? seasonList : [],
  };
}

export const getTitleDetail = cache(
  async (
    id: number,
    mediaType: MediaType,
    locale: AppLocale,
    preferredRegion: WatchProviderRegion = DEFAULT_PROVIDER_REGION,
  ): Promise<TitleDetailResult> => {
    const token = process.env.TMDB_API_TOKEN;
    if (!token) return { status: "unavailable" };

    try {
      const params = new URLSearchParams({
        language: tmdbLanguage(locale),
        append_to_response: "credits,watch/providers,videos,release_dates",
        include_video_language: `${locale},en,null`,
      });
      const [response, streamingProviders] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/${mediaType}/${id}?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          next: { revalidate: 3600 },
        }),
        getStreamingWatchProviders(id, mediaType, preferredRegion),
      ]);

      if (response.status === 404) return { status: "not-found" };
      if (!response.ok) return { status: "unavailable" };

      const data: TmdbDetailResponse = await response.json();
      if (!data.poster_path && !data.backdrop_path) {
        return { status: "not-found" };
      }

      return {
        status: "success",
        detail: mapDetail(
          data,
          mediaType,
          locale,
          preferredRegion,
          streamingProviders,
        ),
      };
    } catch {
      return { status: "unavailable" };
    }
  },
);
