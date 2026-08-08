import "server-only";

import type { AppLocale } from "@/i18n/routing";
import { tmdbLanguage } from "@/i18n/routing";
import type { MediaItem } from "@/lib/types";
import {
  HOME_SECTION_CONFIG,
  mapTmdbResults,
  type HomeSection,
  type TmdbListResult,
} from "@/lib/tmdb";

type TmdbErrorReason = "unconfigured" | "unavailable";

export type HomeCatalogResult = {
  sections: HomeSection[];
  error: boolean;
  reason?: TmdbErrorReason;
};

export type CatalogResult = {
  results: MediaItem[];
  error: boolean;
  reason?: TmdbErrorReason;
};

async function fetchTmdbList(
  path: string,
  {
    token,
    language,
    region,
    query,
  }: {
    token: string;
    language: string;
    region?: string;
    query?: string;
  },
): Promise<TmdbListResult[]> {
  const params = new URLSearchParams({ language });
  if (region) params.set("region", region);
  if (query) params.set("query", query);

  const response = await fetch(
    `https://api.themoviedb.org/3/${path}?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    throw new Error(`TMDB ${path} failed with ${response.status}`);
  }

  const data: { results?: TmdbListResult[] } = await response.json();
  return data.results ?? [];
}

export async function getHomeCatalog(
  locale: AppLocale,
  region?: string,
): Promise<HomeCatalogResult> {
  const token = process.env.TMDB_API_TOKEN;
  if (!token) {
    return { sections: [], error: true, reason: "unconfigured" };
  }

  const language = tmdbLanguage(locale);
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

  return sections.length > 0
    ? { sections, error: false }
    : { sections: [], error: true, reason: "unavailable" };
}

export async function getCatalog(
  locale: AppLocale,
  query?: string,
): Promise<CatalogResult> {
  const token = process.env.TMDB_API_TOKEN;
  if (!token) {
    return { results: [], error: true, reason: "unconfigured" };
  }

  try {
    const language = tmdbLanguage(locale);
    const results = query
      ? mapTmdbResults(
          await fetchTmdbList("search/multi", { token, language, query }),
          locale,
        )
      : mapTmdbResults(
          await fetchTmdbList("trending/all/week", { token, language }),
          locale,
        );

    return { results, error: false };
  } catch {
    return { results: [], error: true, reason: "unavailable" };
  }
}
