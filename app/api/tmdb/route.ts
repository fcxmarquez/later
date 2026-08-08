import { NextRequest, NextResponse } from "next/server";
import { isAppLocale, routing } from "@/i18n/routing";
import { getCatalog } from "@/lib/tmdb-server";

export async function GET(request: NextRequest) {
  // Catalog is public so guest mode can browse and search.
  // Watchlist mutations remain authenticated-only.
  const query = request.nextUrl.searchParams.get("query")?.trim();
  const localeParam =
    request.nextUrl.searchParams.get("locale") || routing.defaultLocale;
  const locale = isAppLocale(localeParam) ? localeParam : routing.defaultLocale;
  const result = await getCatalog(locale, query);

  if (!result.error) {
    return NextResponse.json({ results: result.results });
  }

  return NextResponse.json(
    {
      error:
        result.reason === "unconfigured"
          ? "TMDB_API_TOKEN is not configured."
          : "Failed to load catalog from TMDB.",
      results: [],
    },
    { status: result.reason === "unconfigured" ? 503 : 502 },
  );
}
