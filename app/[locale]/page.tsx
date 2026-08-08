import { headers } from "next/headers";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/app-shell";
import {
  FeaturedHeroSkeleton,
  MediaRowSkeleton,
} from "@/components/media-skeletons";
import { resolveLocale } from "@/i18n/locale";
import type { AppLocale } from "@/i18n/routing";
import { HOME_SECTION_IDS } from "@/lib/tmdb";
import { resolveProviderRegion } from "@/lib/tmdb-region";
import { getHomeCatalog } from "@/lib/tmdb-server";
import { getWatchlistContext } from "@/lib/watchlist-context";

export const dynamic = "force-dynamic";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  return (
    <Suspense
      fallback={
        <main className="min-h-screen pb-[calc(7rem+env(safe-area-inset-bottom))] supports-[height:100dvh]:min-h-dvh">
          <FeaturedHeroSkeleton />
          {HOME_SECTION_IDS.map((sectionId) => (
            <MediaRowSkeleton
              key={sectionId}
              title={t(`sections.${sectionId}.title`)}
              subtitle={t(`sections.${sectionId}.subtitle`)}
            />
          ))}
        </main>
      }
    >
      <HomeContent locale={locale} />
    </Suspense>
  );
}

async function HomeContent({ locale }: { locale: AppLocale }) {
  const requestHeaders = await headers();
  const region = resolveProviderRegion(
    null,
    requestHeaders.get("x-vercel-ip-country"),
  );
  const [catalog, watchlist] = await Promise.all([
    getHomeCatalog(locale, region),
    getWatchlistContext(),
  ]);

  return (
    <AppShell
      key={locale}
      mode={watchlist.mode}
      user={watchlist.user}
      initialWatchlist={watchlist.initialWatchlist}
      initialHomeSections={catalog.sections}
      initialHomeError={catalog.error}
    />
  );
}
