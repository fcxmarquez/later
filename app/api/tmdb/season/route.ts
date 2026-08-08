import { NextRequest, NextResponse } from "next/server";
import { isAppLocale, routing } from "@/i18n/routing";
import { getSeasonDetail } from "@/lib/tmdb-season";

export const dynamic = "force-dynamic";

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

  const result = await getSeasonDetail(id, seasonNumber, locale);

  if (result.status === "success") {
    return NextResponse.json({ season: result.season });
  }

  if (result.status === "unconfigured") {
    return NextResponse.json(
      { error: "TMDB_API_TOKEN is not configured." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { error: "Failed to load season details from TMDB." },
    { status: result.status === "not-found" ? 404 : 502 },
  );
}
