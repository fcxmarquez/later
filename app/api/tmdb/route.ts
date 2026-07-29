import { NextRequest, NextResponse } from "next/server";
import { fallbackCatalog } from "@/lib/catalog";
import { isAppLocale, tmdbLanguage } from "@/i18n/routing";
import { MediaItem } from "@/lib/types";

type TmdbResult = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path: string;
  backdrop_path?: string;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

const untitledByLocale = {
  es: "Sin título",
  en: "Untitled",
} as const;

const noOverviewByLocale = {
  es: "Sin descripción disponible.",
  en: "No description available.",
} as const;

export async function GET(request: NextRequest) {
  // Catalog is public so guest mode can browse and search.
  // Watchlist mutations remain authenticated-only.
  const query = request.nextUrl.searchParams.get("query")?.trim();
  const localeParam = request.nextUrl.searchParams.get("locale") || "es";
  const locale = isAppLocale(localeParam) ? localeParam : "es";
  const language = tmdbLanguage(locale);
  const token = process.env.TMDB_API_TOKEN;
  if (!token) {
    const results = query
      ? fallbackCatalog.filter((item) =>
          item.title.toLowerCase().includes(query.toLowerCase()),
        )
      : fallbackCatalog;
    return NextResponse.json({ results, fallback: true });
  }
  const endpoint = query
    ? `search/multi?query=${encodeURIComponent(query)}`
    : "trending/all/week?";
  const response = await fetch(
    `https://api.themoviedb.org/3/${endpoint}${query ? "&" : ""}language=${language}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    },
  );
  if (!response.ok)
    return NextResponse.json({ results: fallbackCatalog, fallback: true });
  const data: { results: TmdbResult[] } = await response.json();
  const results: MediaItem[] = data.results
    .filter(
      (item) =>
        (item.media_type === "movie" || item.media_type === "tv") &&
        item.poster_path,
    )
    .map((item) => ({
      id: item.id,
      title: item.title || item.name || untitledByLocale[locale],
      overview: item.overview || noOverviewByLocale[locale],
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path || item.poster_path,
      mediaType: item.media_type as "movie" | "tv",
      year: String(item.release_date || item.first_air_date || "").slice(0, 4),
      rating: Number(item.vote_average || 0),
      genres: [],
    }));
  return NextResponse.json({ results });
}
