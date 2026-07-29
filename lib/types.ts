export type MediaType = "movie" | "tv";

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

export type WatchProvider = {
  id: number;
  name: string;
  logoPath: string;
};

export type WatchProviderRegion = "MX" | "US";

export type MediaTrailer = {
  id: string;
  key: string;
  name: string;
  site: "YouTube";
  type: "Trailer" | "Teaser";
  official: boolean;
};

export type MediaDetail = MediaItem & {
  tagline?: string;
  runtime?: number | null;
  seasons?: number | null;
  status?: string | null;
  cast: CastMember[];
  providers: WatchProvider[];
  providersRegion?: WatchProviderRegion | null;
  director?: string | null;
  creators?: string[];
  trailers: MediaTrailer[];
};

export type SavedMedia = MediaItem & { watched: boolean; addedAt: number };
