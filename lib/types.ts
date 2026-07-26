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

export type SavedMedia = MediaItem & { watched: boolean; addedAt: number };
