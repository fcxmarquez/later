export const imageUrl = (
  path: string,
  size: "poster" | "backdrop" | "profile" | "logo" | "still" = "poster",
) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const sizeMap = {
    poster: "w500",
    backdrop: "original",
    profile: "w185",
    logo: "w154",
    still: "w500",
  } as const;
  return `https://image.tmdb.org/t/p/${sizeMap[size]}${path}`;
};

export const youtubeThumbUrl = (key: string) =>
  `https://i.ytimg.com/vi/${key}/hqdefault.jpg`;

export const youtubeEmbedUrl = (key: string) =>
  `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0`;
