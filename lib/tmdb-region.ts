import type { WatchProviderRegion } from "@/lib/types";

export const DEFAULT_PROVIDER_REGION: WatchProviderRegion = "US";

function isCountryCode(value: string | null | undefined): value is string {
  return Boolean(value && /^[A-Za-z]{2}$/.test(value));
}

export function resolveProviderRegion(
  override?: string | null,
  geoCountry?: string | null,
): WatchProviderRegion {
  if (isCountryCode(override)) return override.toUpperCase();
  if (isCountryCode(geoCountry) && geoCountry.toUpperCase() !== "XX") {
    return geoCountry.toUpperCase();
  }
  return DEFAULT_PROVIDER_REGION;
}
