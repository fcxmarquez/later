import "server-only";

import { cache } from "react";
import type { AppLocale } from "@/i18n/routing";
import { tmdbLanguage } from "@/i18n/routing";
import type { MediaType, PersonCredit, PersonDetail } from "@/lib/types";

type TmdbPersonCredit = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  character?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  episode_count?: number;
};

type TmdbPersonResponse = {
  id: number;
  name?: string;
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  profile_path?: string | null;
  also_known_as?: string[];
  combined_credits?: { cast?: TmdbPersonCredit[] };
};

export type PersonDetailResult =
  | { status: "success"; detail: PersonDetail }
  | { status: "not-found" }
  | { status: "unavailable" };

const untitledByLocale = {
  es: "Sin título",
  en: "Untitled",
} as const;

const noOverviewByLocale = {
  es: "Sin descripción disponible.",
  en: "No description available.",
} as const;

const UNSCRIPTED_APPEARANCE = /^(self|himself|herself|archive footage)\b/i;

function isMediaType(value: string | undefined): value is MediaType {
  return value === "movie" || value === "tv";
}

function creditScore(credit: TmdbPersonCredit) {
  const popularity = Number(credit.popularity || 0);
  const votes = Number(credit.vote_count || 0);
  const score = popularity * 100 + Math.min(votes, 100_000);
  return UNSCRIPTED_APPEARANCE.test(credit.character || "")
    ? score * 0.05
    : score;
}

function mapCredits(
  credits: TmdbPersonCredit[] | undefined,
  locale: AppLocale,
): PersonCredit[] {
  if (!credits?.length) return [];

  const sorted = credits.slice().sort((left, right) => {
    const scoreDifference = creditScore(right) - creditScore(left);
    if (scoreDifference !== 0) return scoreDifference;
    const rightDate = right.release_date || right.first_air_date || "";
    const leftDate = left.release_date || left.first_air_date || "";
    return rightDate.localeCompare(leftDate);
  });
  const mapped: PersonCredit[] = [];
  const seen = new Set<string>();

  for (const credit of sorted) {
    if (!isMediaType(credit.media_type) || !credit.poster_path) continue;
    const identity = `${credit.media_type}-${credit.id}`;
    if (seen.has(identity)) continue;
    seen.add(identity);

    mapped.push({
      id: credit.id,
      title: credit.title || credit.name || untitledByLocale[locale],
      overview: credit.overview || noOverviewByLocale[locale],
      posterPath: credit.poster_path,
      backdropPath: credit.backdrop_path || credit.poster_path,
      mediaType: credit.media_type,
      year: String(credit.release_date || credit.first_air_date || "").slice(
        0,
        4,
      ),
      rating: Number(credit.vote_average || 0),
      genres: [],
      character: credit.character?.trim() || "",
      episodeCount:
        credit.media_type === "tv" && credit.episode_count
          ? credit.episode_count
          : null,
    });

    if (mapped.length >= 30) break;
  }

  return mapped;
}

async function fetchPerson(
  id: number,
  language: string,
  token: string,
): Promise<Response> {
  const params = new URLSearchParams({
    language,
    append_to_response: "combined_credits",
  });
  return fetch(`https://api.themoviedb.org/3/person/${id}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  });
}

export const getPersonDetail = cache(
  async (id: number, locale: AppLocale): Promise<PersonDetailResult> => {
    const token = process.env.TMDB_API_TOKEN;
    if (!token) return { status: "unavailable" };

    try {
      const response = await fetchPerson(id, tmdbLanguage(locale), token);
      if (response.status === 404) return { status: "not-found" };
      if (!response.ok) return { status: "unavailable" };

      const localized: TmdbPersonResponse = await response.json();
      let biography = localized.biography?.trim() || "";

      if (!biography && locale !== "en") {
        const fallbackResponse = await fetchPerson(id, "en-US", token);
        if (fallbackResponse.ok) {
          const fallback: TmdbPersonResponse = await fallbackResponse.json();
          biography = fallback.biography?.trim() || "";
        }
      }

      return {
        status: "success",
        detail: {
          id: localized.id,
          name: localized.name?.trim() || untitledByLocale[locale],
          biography,
          birthday: localized.birthday || null,
          deathday: localized.deathday || null,
          placeOfBirth: localized.place_of_birth?.trim() || null,
          profilePath: localized.profile_path || null,
          alsoKnownAs: (localized.also_known_as || [])
            .map((name) => name.trim())
            .filter(Boolean)
            .slice(0, 6),
          credits: mapCredits(localized.combined_credits?.cast, locale),
        },
      };
    } catch {
      return { status: "unavailable" };
    }
  },
);
