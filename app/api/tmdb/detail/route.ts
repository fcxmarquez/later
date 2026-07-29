import { NextRequest, NextResponse } from "next/server";
import { fallbackCatalog, getFallbackDetail } from "@/lib/catalog";
import { isAppLocale, routing, tmdbLanguage } from "@/i18n/routing";
import type {
  CastMember,
  MediaDetail,
  MediaItem,
  MediaType,
  WatchProvider,
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
type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority?: number;
};
type TmdbWatchProviders = {
  results?: Record<
    string,
    {
      link?: string;
      flatrate?: TmdbProvider[];
      rent?: TmdbProvider[];
      buy?: TmdbProvider[];
      ads?: TmdbProvider[];
      free?: TmdbProvider[];
    }
  >;
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
};

function isMediaType(value: string | null): value is MediaType {
  return value === "movie" || value === "tv";
}

function regionHasProviders(
  region:
    | {
        flatrate?: TmdbProvider[];
        rent?: TmdbProvider[];
        buy?: TmdbProvider[];
        ads?: TmdbProvider[];
        free?: TmdbProvider[];
      }
    | undefined,
) {
  if (!region) return false;
  return [region.flatrate, region.ads, region.free, region.rent, region.buy]
    .filter(Boolean)
    .some((bucket) => (bucket?.length ?? 0) > 0);
}

function mapProviders(detail: TmdbDetailResponse): {
  providers: WatchProvider[];
  providersRegion: "MX" | "US" | null;
} {
  const results = detail["watch/providers"]?.results;
  const mx = results?.MX;
  const us = results?.US;
  const providersRegion = regionHasProviders(mx)
    ? "MX"
    : regionHasProviders(us)
      ? "US"
      : null;
  const region =
    providersRegion === "MX" ? mx : providersRegion === "US" ? us : {};
  const buckets = [
    region?.flatrate,
    region?.ads,
    region?.free,
    region?.rent,
    region?.buy,
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

function mapDetail(
  detail: TmdbDetailResponse,
  mediaType: MediaType,
  locale: "es" | "en",
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

  const { providers, providersRegion } = mapProviders(detail);

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
  };
}

export async function GET(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");
  const typeParam = request.nextUrl.searchParams.get("type");
  const localeParam =
    request.nextUrl.searchParams.get("locale") || routing.defaultLocale;
  const locale = isAppLocale(localeParam) ? localeParam : routing.defaultLocale;
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
    const response = await fetch(
      `https://api.themoviedb.org/3/${typeParam}/${id}?language=${language}&append_to_response=credits,watch/providers`,
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
      detail: mapDetail(data, typeParam, locale),
    });
  } catch {
    return NextResponse.json({
      detail: getFallbackDetail(baseItem),
      fallback: true,
    });
  }
}
