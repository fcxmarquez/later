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

export type MediaDetail = MediaItem & {
  tagline?: string;
  runtime?: number | null;
  seasons?: number | null;
  status?: string | null;
  cast: CastMember[];
  providers: WatchProvider[];
  director?: string | null;
  creators?: string[];
};

export type SavedMedia = MediaItem & { watched: boolean; addedAt: number };
