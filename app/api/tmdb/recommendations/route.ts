import { NextRequest, NextResponse } from "next/server";
import { isAppLocale, routing } from "@/i18n/routing";
import { getRecommendations } from "@/lib/tmdb-server";
import type { MediaType } from "@/lib/types";

function isMediaType(value: string | null): value is MediaType {
  return value === "movie" || value === "tv";
}

export async function GET(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");
  const mediaTypeParam = request.nextUrl.searchParams.get("mediaType");
  const localeParam =
    request.nextUrl.searchParams.get("locale") || routing.defaultLocale;
  const locale = isAppLocale(localeParam) ? localeParam : routing.defaultLocale;
  const id = Number(idParam);

  if (
    !idParam ||
    !Number.isInteger(id) ||
    id <= 0 ||
    !isMediaType(mediaTypeParam)
  ) {
    return NextResponse.json(
      { error: "Valid id and mediaType parameters are required.", results: [] },
      { status: 400 },
    );
  }

  const result = await getRecommendations(locale, mediaTypeParam, id);
  if (!result.error) {
    return NextResponse.json({ results: result.results });
  }

  return NextResponse.json(
    {
      error:
        result.reason === "unconfigured"
          ? "TMDB_API_TOKEN is not configured."
          : "Failed to load recommendations from TMDB.",
      results: [],
    },
    { status: result.reason === "unconfigured" ? 503 : 502 },
  );
}
