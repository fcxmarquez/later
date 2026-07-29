import { NextRequest, NextResponse } from "next/server";
import { isAppLocale, routing, tmdbLanguage } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/routing";
import { fetchTmdbList, mapTmdbResults, type TmdbListResult } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  // Catalog is public so guest mode can browse and search.
  // Watchlist mutations remain authenticated-only.
  const query = request.nextUrl.searchParams.get("query")?.trim();
  const localeParam =
    request.nextUrl.searchParams.get("locale") || routing.defaultLocale;
  const locale = isAppLocale(localeParam) ? localeParam : routing.defaultLocale;
  const language = tmdbLanguage(locale);
  const token = process.env.TMDB_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "TMDB_API_TOKEN is not configured.", results: [] },
      { status: 503 },
    );
  }

  try {
    const results = query
      ? await fetchSearch(token, language, locale, query)
      : mapTmdbResults(
          await fetchTmdbList("trending/all/week", { token, language }),
          locale,
        );

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Failed to load catalog from TMDB.", results: [] },
      { status: 502 },
    );
  }
}

async function fetchSearch(
  token: string,
  language: string,
  locale: AppLocale,
  query: string,
) {
  const params = new URLSearchParams({ language, query });
  const response = await fetch(
    `https://api.themoviedb.org/3/search/multi?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    },
  );
  if (!response.ok) {
    throw new Error(`TMDB search failed with ${response.status}`);
  }
  const data: { results?: TmdbListResult[] } = await response.json();
  return mapTmdbResults(data.results, locale);
}
