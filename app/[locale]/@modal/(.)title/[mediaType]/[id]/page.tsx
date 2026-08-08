import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TitleUnavailable } from "@/app/[locale]/_components/title-unavailable";
import { RoutedDetailModal } from "@/components/title-detail-route";
import { resolveLocale } from "@/i18n/locale";
import { getTitleDetail } from "@/lib/tmdb-detail";
import { resolveProviderRegion } from "@/lib/tmdb-region";
import type { MediaType } from "@/lib/types";

export const dynamic = "force-dynamic";

type InterceptedTitleRouteProps = {
  params: Promise<{ locale: string; mediaType: string; id: string }>;
};

function parseMediaType(value: string): MediaType | null {
  return value === "movie" || value === "tv" ? value : null;
}

export default async function InterceptedTitleRoute({
  params,
}: InterceptedTitleRouteProps) {
  const {
    locale: localeParam,
    mediaType: typeParam,
    id: idParam,
  } = await params;
  const locale = resolveLocale(localeParam);
  const mediaType = parseMediaType(typeParam);
  const id = Number(idParam);
  if (!mediaType || !Number.isInteger(id) || id <= 0) notFound();

  const requestHeaders = await headers();
  const region = resolveProviderRegion(
    null,
    requestHeaders.get("x-vercel-ip-country"),
  );
  const result = await getTitleDetail(id, mediaType, locale, region);
  if (result.status === "not-found") notFound();
  if (result.status === "unavailable") {
    return <TitleUnavailable presentation="modal" />;
  }

  return <RoutedDetailModal detail={result.detail} />;
}
