import "server-only";

import type {
  MediaType,
  WatchProvider,
  WatchProviderRegion,
} from "@/lib/types";

const STREAMING_AVAILABILITY_BASE_URL = "https://api.movieofthenight.com/v4";
const STREAMING_AVAILABILITY_REVALIDATE_SECONDS = 24 * 60 * 60;
const MAX_PROVIDERS = 8;

const optionPriority = {
  free: 0,
  subscription: 1,
  addon: 2,
  rent: 3,
  buy: 4,
} as const;

type StreamingOptionType = keyof typeof optionPriority;

type StreamingOption = {
  service?: {
    id?: unknown;
    name?: unknown;
    imageSet?: {
      lightThemeImage?: unknown;
    };
  };
  type?: unknown;
  link?: unknown;
  videoLink?: unknown;
};

type StreamingAvailabilityResponse = {
  tmdbId?: unknown;
  streamingOptions?: unknown;
};

function normalizeHttpsUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeLogoUrl(value: unknown) {
  const normalized = normalizeHttpsUrl(value);
  if (!normalized) return null;

  return new URL(normalized).hostname === "media.movieofthenight.com"
    ? normalized
    : null;
}

function isStreamingOptionType(value: unknown): value is StreamingOptionType {
  return typeof value === "string" && value in optionPriority;
}

function mapStreamingOptions(value: unknown): WatchProvider[] {
  if (!Array.isArray(value)) return [];

  const options = value
    .filter((option): option is StreamingOption => {
      if (!option || typeof option !== "object") return false;
      const candidate = option as StreamingOption;
      return isStreamingOptionType(candidate.type);
    })
    .sort(
      (left, right) =>
        optionPriority[left.type as StreamingOptionType] -
        optionPriority[right.type as StreamingOptionType],
    );
  const providers: WatchProvider[] = [];
  const seen = new Set<string>();

  for (const option of options) {
    const id =
      typeof option.service?.id === "string" ? option.service.id.trim() : "";
    const name =
      typeof option.service?.name === "string"
        ? option.service.name.trim()
        : "";
    const link =
      normalizeHttpsUrl(option.videoLink) ?? normalizeHttpsUrl(option.link);

    if (!id || !name || !link || seen.has(id)) continue;
    seen.add(id);
    providers.push({
      id: `streaming-${id}`,
      name,
      logoPath: null,
      logoUrl: normalizeLogoUrl(option.service?.imageSet?.lightThemeImage),
      link,
    });

    if (providers.length >= MAX_PROVIDERS) break;
  }

  return providers;
}

export async function getStreamingWatchProviders(
  id: number,
  mediaType: MediaType,
  region: WatchProviderRegion,
): Promise<WatchProvider[] | null> {
  const apiKey = process.env.STREAMING_AVAILABILITY_API_KEY?.trim();
  if (!apiKey) return null;

  const tmdbId = `${mediaType}/${id}`;
  const params = new URLSearchParams({
    country: region.toLowerCase(),
    series_granularity: "show",
  });

  try {
    const response = await fetch(
      `${STREAMING_AVAILABILITY_BASE_URL}/shows/${tmdbId}?${params}`,
      {
        headers: { "X-API-Key": apiKey },
        next: { revalidate: STREAMING_AVAILABILITY_REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(5_000),
      },
    );

    if (response.status === 404) return [];
    if (!response.ok) return null;

    const data = (await response.json()) as StreamingAvailabilityResponse;
    if (data.tmdbId !== tmdbId || !data.streamingOptions) return null;
    if (
      typeof data.streamingOptions !== "object" ||
      Array.isArray(data.streamingOptions)
    ) {
      return null;
    }

    const options = (data.streamingOptions as Record<string, unknown>)[
      region.toLowerCase()
    ];
    return mapStreamingOptions(options);
  } catch {
    return null;
  }
}
