import { NextRequest, NextResponse } from "next/server";
import { isAppLocale, routing, tmdbLanguage } from "@/i18n/routing";
import {
  HOME_SECTION_CONFIG,
  fetchTmdbList,
  mapTmdbResults,
  type HomeSection,
} from "@/lib/tmdb";

function resolveRegion(request: NextRequest): string | undefined {
  const override = request.nextUrl.searchParams.get("region");
  if (override && /^[A-Za-z]{2}$/.test(override)) {
    return override.toUpperCase();
  }
  const country = request.headers.get("x-vercel-ip-country");
  if (country && /^[A-Za-z]{2}$/.test(country)) {
    return country.toUpperCase();
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  const localeParam =
    request.nextUrl.searchParams.get("locale") || routing.defaultLocale;
  const locale = isAppLocale(localeParam) ? localeParam : routing.defaultLocale;
  const language = tmdbLanguage(locale);
  const token = process.env.TMDB_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "TMDB_API_TOKEN is not configured.", sections: [] },
      { status: 503 },
    );
  }

  const region = resolveRegion(request);

  const settled = await Promise.allSettled(
    HOME_SECTION_CONFIG.map(async (section): Promise<HomeSection> => {
      const results = await fetchTmdbList(section.path, {
        token,
        language,
        region: section.regional ? region : undefined,
      });
      return {
        id: section.id,
        results: mapTmdbResults(results, locale, section.mediaType),
      };
    }),
  );

  const sections = settled
    .filter(
      (result): result is PromiseFulfilledResult<HomeSection> =>
        result.status === "fulfilled" && result.value.results.length > 0,
    )
    .map((result) => result.value);

  if (!sections.length) {
    return NextResponse.json(
      { error: "Failed to load catalog from TMDB.", sections: [] },
      { status: 502 },
    );
  }

  return NextResponse.json({ sections });
}
