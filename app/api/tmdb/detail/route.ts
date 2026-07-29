import { NextRequest, NextResponse } from "next/server";
import { fallbackCatalog, getFallbackDetail } from "@/lib/catalog";
import { isAppLocale, routing, tmdbLanguage } from "@/i18n/routing";
import type {
  CastMember,
  MediaDetail,
  MediaItem,
  MediaTrailer,
  MediaType,
  WatchProvider,
  WatchProviderRegion,
} from "@/lib/types";

const DEFAULT_PROVIDER_REGION: WatchProviderRegion = "US";

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
type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority?: number;
};
type TmdbProviderRegion = {
  link?: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
  ads?: TmdbProvider[];
  free?: TmdbProvider[];
};
type TmdbWatchProviders = {
  results?: Record<string, TmdbProviderRegion>;
};
type TmdbVideo = {
  id: string;
  key?: string;
  name?: string;
  site?: string;
  type?: string;
  official?: boolean;
  published_at?: string;
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
  "watch/providers"?: TmdbWatchProviders;
  videos?: { results?: TmdbVideo[] };
};

export const dynamic = "force-dynamic";

function isMediaType(value: string | null): value is MediaType {
  return value === "movie" || value === "tv";
}

function isCountryCode(value: string | null | undefined): value is string {
  return Boolean(value && /^[A-Za-z]{2}$/.test(value));
}

function resolvePreferredRegion(request: NextRequest): WatchProviderRegion {
  const override = request.nextUrl.searchParams.get("region");
  if (isCountryCode(override)) {
    return override.toUpperCase();
  }

  const geoCountry = request.headers.get("x-vercel-ip-country");
  if (isCountryCode(geoCountry) && geoCountry.toUpperCase() !== "XX") {
    return geoCountry.toUpperCase();
  }

  return DEFAULT_PROVIDER_REGION;
}

function regionHasProviders(region: TmdbProviderRegion | undefined) {
  if (!region) return false;
  return [region.flatrate, region.ads, region.free, region.rent, region.buy]
    .filter(Boolean)
    .some((bucket) => (bucket?.length ?? 0) > 0);
}

function mapProviders(
  detail: TmdbDetailResponse,
  preferredRegion: WatchProviderRegion,
): {
  providers: WatchProvider[];
  providersRegion: WatchProviderRegion | null;
} {
  const results = detail["watch/providers"]?.results;
  const preferred = results?.[preferredRegion];
  const us = results?.[DEFAULT_PROVIDER_REGION];
  const providersRegion = regionHasProviders(preferred)
    ? preferredRegion
    : regionHasProviders(us)
      ? DEFAULT_PROVIDER_REGION
      : null;
  const region: TmdbProviderRegion =
    providersRegion === preferredRegion
      ? (preferred ?? {})
      : providersRegion === DEFAULT_PROVIDER_REGION
        ? (us ?? {})
        : {};
  const buckets = [
    region.flatrate,
    region.ads,
    region.free,
    region.rent,
    region.buy,
  ];
  const providers: WatchProvider[] = [];
  const seen = new Set<number>();
  for (const bucket of buckets) {
    for (const provider of bucket || []) {
      if (seen.has(provider.provider_id) || !provider.logo_path) continue;
      seen.add(provider.provider_id);
      providers.push({
        id: provider.provider_id,
        name: provider.provider_name.trim(),
        logoPath: provider.logo_path,
      });
      if (providers.length >= 8) {
        return { providers, providersRegion };
      }
    }
  }
  return { providers, providersRegion };
}

function trailerRank(video: MediaTrailer) {
  const typeScore = video.type === "Trailer" ? 0 : 1;
  const officialScore = video.official ? 0 : 1;
  return typeScore * 10 + officialScore;
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

  return trailers.sort((a, b) => trailerRank(a) - trailerRank(b)).slice(0, 6);
}

function mapDetail(
  detail: TmdbDetailResponse,
  mediaType: MediaType,
  locale: "es" | "en",
  preferredRegion: WatchProviderRegion,
): MediaDetail {
  const cast: CastMember[] = (detail.credits?.cast || [])
    .slice()
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
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
  const runtime =
    mediaType === "movie"
      ? (detail.runtime ?? null)
      : (detail.episode_run_time?.[0] ?? detail.runtime ?? null);

  const { providers, providersRegion } = mapProviders(detail, preferredRegion);

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
    director,
    creators,
    trailers: mapTrailers(detail),
  };
}

export async function GET(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");
  const typeParam = request.nextUrl.searchParams.get("type");
  const localeParam =
    request.nextUrl.searchParams.get("locale") || routing.defaultLocale;
  const locale = isAppLocale(localeParam) ? localeParam : routing.defaultLocale;
  const preferredRegion = resolvePreferredRegion(request);
  const language = tmdbLanguage(locale);
  const id = Number(idParam);

  if (!idParam || !Number.isFinite(id) || id <= 0 || !isMediaType(typeParam)) {
    return NextResponse.json(
      { error: "Parámetros id y type (movie|tv) requeridos." },
      { status: 400 },
    );
  }

  const baseItem: MediaItem = fallbackCatalog.find(
    (entry) => entry.id === id && entry.mediaType === typeParam,
  ) ?? {
    id,
    title: untitledByLocale[locale],
    overview: noOverviewByLocale[locale],
    posterPath: "",
    backdropPath: "",
    mediaType: typeParam,
    year: "",
    rating: 0,
    genres: [],
  };

  const token = process.env.TMDB_API_TOKEN;
  if (!token) {
    return NextResponse.json({
      detail: getFallbackDetail(baseItem),
      fallback: true,
    });
  }

  try {
    const videoLanguage = `${locale},en,null`;
    const response = await fetch(
      `https://api.themoviedb.org/3/${typeParam}/${id}?language=${language}&append_to_response=credits,watch/providers,videos&include_video_language=${videoLanguage}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      return NextResponse.json({
        detail: getFallbackDetail(baseItem),
        fallback: true,
      });
    }

    const data: TmdbDetailResponse = await response.json();
    if (!data.poster_path && !data.backdrop_path) {
      return NextResponse.json({
        detail: getFallbackDetail(baseItem),
        fallback: true,
      });
    }

    return NextResponse.json({
      detail: mapDetail(data, typeParam, locale, preferredRegion),
    });
  } catch {
    return NextResponse.json({
      detail: getFallbackDetail(baseItem),
      fallback: true,
    });
  }
}
