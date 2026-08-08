import { NextRequest, NextResponse } from "next/server";
import { isAppLocale, routing } from "@/i18n/routing";
import { getTitleDetail, resolveProviderRegion } from "@/lib/tmdb-detail";
import type { MediaType } from "@/lib/types";

export const dynamic = "force-dynamic";

function isMediaType(value: string | null): value is MediaType {
  return value === "movie" || value === "tv";
}

export async function GET(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");
  const typeParam = request.nextUrl.searchParams.get("type");
  const localeParam =
    request.nextUrl.searchParams.get("locale") || routing.defaultLocale;
  const locale = isAppLocale(localeParam) ? localeParam : routing.defaultLocale;
  const id = Number(idParam);

  if (!idParam || !Number.isInteger(id) || id <= 0 || !isMediaType(typeParam)) {
    return NextResponse.json(
      { error: "Parámetros id y type (movie|tv) requeridos." },
      { status: 400 },
    );
  }

  const preferredRegion = resolveProviderRegion(
    request.nextUrl.searchParams.get("region"),
    request.headers.get("x-vercel-ip-country"),
  );
  const result = await getTitleDetail(id, typeParam, locale, preferredRegion);

  if (result.status === "success") {
    return NextResponse.json({ detail: result.detail });
  }

  if (result.status === "not-found") {
    return NextResponse.json(
      { error: "Title details are unavailable." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { error: "Failed to load title details from TMDB." },
    { status: process.env.TMDB_API_TOKEN ? 502 : 503 },
  );
}
