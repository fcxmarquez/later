export type MediaType = "movie" | "tv";

export type WatchlistMode = "guest" | "authenticated";

export type MediaItem = {
  id: number;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  mediaType: MediaType;
  year: string;
  rating: number;
  genres: string[];
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
};

export type PersonCredit = MediaItem & {
  character: string;
  episodeCount: number | null;
};

export type PersonDetail = {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  placeOfBirth: string | null;
  profilePath: string | null;
  alsoKnownAs: string[];
  credits: PersonCredit[];
};

export type WatchProvider = {
  id: string;
  name: string;
  logoPath: string | null;
  logoUrl: string | null;
  /** Provider-specific deep link. Null for TMDB/JustWatch fallback data. */
  link: string | null;
};

export type WatchProviderSource = "streaming-availability" | "tmdb";

/** ISO 3166-1 alpha-2 country code used for TMDB watch providers. */
export type WatchProviderRegion = string;

export type MediaTrailer = {
  id: string;
  key: string;
  name: string;
  site: "YouTube";
  type: "Trailer" | "Teaser";
  official: boolean;
};

export type MediaSeason = {
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
  airDate: string;
  posterPath: string | null;
};

export type MediaEpisode = {
  id: number;
  name: string;
  overview: string;
  episodeNumber: number;
  seasonNumber: number;
  airDate: string;
  runtime: number | null;
  stillPath: string | null;
  rating: number;
};

export type MediaSeasonDetail = {
  id: number;
  name: string;
  overview: string;
  seasonNumber: number;
  airDate: string;
  posterPath: string | null;
  episodes: MediaEpisode[];
};

export type MediaDetail = MediaItem & {
  tagline?: string;
  runtime?: number | null;
  seasons?: number | null;
  status?: string | null;
  cast: CastMember[];
  providers: WatchProvider[];
  providersRegion?: WatchProviderRegion | null;
  providersSource: WatchProviderSource | null;
  watchProvidersLink: string | null;
  /** True when the title is currently in theatrical release for the resolved region. */
  inCinemas?: boolean;
  director?: string | null;
  creators?: string[];
  trailers: MediaTrailer[];
  seasonList: MediaSeason[];
};

export type SavedMedia = MediaItem & { watched: boolean; addedAt: number };
