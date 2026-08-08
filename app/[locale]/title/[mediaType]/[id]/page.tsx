import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RoutedDetailPage } from "@/components/title-detail-route";
import { resolveLocale } from "@/i18n/locale";
import { getTitleDetail, resolveProviderRegion } from "@/lib/tmdb-detail";
import type { MediaType } from "@/lib/types";
import { getWatchlistContext } from "@/lib/watchlist-context";

export const dynamic = "force-dynamic";

type TitleRouteProps = {
  params: Promise<{ locale: string; mediaType: string; id: string }>;
};

function parseMediaType(value: string): MediaType | null {
  return value === "movie" || value === "tv" ? value : null;
}

async function getRequestRegion() {
  const requestHeaders = await headers();
  return resolveProviderRegion(null, requestHeaders.get("x-vercel-ip-country"));
}

export async function generateMetadata({
  params,
}: TitleRouteProps): Promise<Metadata> {
  const {
    locale: localeParam,
    mediaType: typeParam,
    id: idParam,
  } = await params;
  const locale = resolveLocale(localeParam);
  const mediaType = parseMediaType(typeParam);
  const id = Number(idParam);
  const t = await getTranslations({ locale, namespace: "Detail" });
  if (!mediaType || !Number.isInteger(id) || id <= 0) {
    return { title: t("metadataFallback") };
  }

  const result = await getTitleDetail(
    id,
    mediaType,
    locale,
    await getRequestRegion(),
  );
  if (result.status !== "success") {
    return { title: t("metadataFallback") };
  }

  const description = result.detail.overview
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  return {
    title: t("metadataTitle", { title: result.detail.title }),
    description:
      description || t("metadataDescription", { title: result.detail.title }),
  };
}

export default async function TitleRoute({ params }: TitleRouteProps) {
  const {
    locale: localeParam,
    mediaType: typeParam,
    id: idParam,
  } = await params;
  const locale = resolveLocale(localeParam);
  const mediaType = parseMediaType(typeParam);
  const id = Number(idParam);
  if (!mediaType || !Number.isInteger(id) || id <= 0) notFound();

  setRequestLocale(locale);
  const [result, watchlist] = await Promise.all([
    getTitleDetail(id, mediaType, locale, await getRequestRegion()),
    getWatchlistContext(),
  ]);
  if (result.status !== "success") notFound();

  return (
    <RoutedDetailPage
      detail={result.detail}
      mode={watchlist.mode}
      initialWatchlist={watchlist.initialWatchlist}
    />
  );
}
