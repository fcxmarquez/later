import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PersonPage } from "@/components/person-page";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { isAuthConfigured } from "@/lib/auth/config";
import { getAuth } from "@/lib/auth/server";
import { getPersonDetail } from "@/lib/tmdb-person";
import type { SavedMedia } from "@/lib/types";
import { getWatchlist } from "@/lib/watchlist";
import type { WatchlistMode } from "@/store/watchlist";

export const dynamic = "force-dynamic";

type PersonRouteProps = {
  params: Promise<{ locale: string; id: string }>;
};

type WatchlistContext = {
  mode: WatchlistMode;
  user: { name: string } | null;
  initialWatchlist: SavedMedia[];
};

async function getWatchlistContext(): Promise<WatchlistContext> {
  if (!isAuthConfigured()) {
    return { mode: "guest", user: null, initialWatchlist: [] };
  }

  const { data: session } = await getAuth().getSession();
  if (!session?.user) {
    return { mode: "guest", user: null, initialWatchlist: [] };
  }

  return {
    mode: "authenticated",
    user: { name: session.user.name },
    initialWatchlist: await getWatchlist(session.user.id),
  };
}

function parsePersonId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({
  params,
}: PersonRouteProps): Promise<Metadata> {
  const { locale: localeParam, id: idParam } = await params;
  const locale = resolveLocale(localeParam);
  const id = parsePersonId(idParam);
  const t = await getTranslations({ locale, namespace: "Person" });

  if (!id) return { title: t("metadataFallback") };

  const result = await getPersonDetail(id, locale);
  if (result.status !== "success") {
    return { title: t("metadataFallback") };
  }

  const description = result.detail.biography
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  return {
    title: t("metadataTitle", { name: result.detail.name }),
    description:
      description || t("metadataDescription", { name: result.detail.name }),
  };
}

export default async function PersonRoute({ params }: PersonRouteProps) {
  const { locale: localeParam, id: idParam } = await params;
  const locale = resolveLocale(localeParam);
  const id = parsePersonId(idParam);
  if (!id) notFound();

  setRequestLocale(locale);
  const [result, watchlist] = await Promise.all([
    getPersonDetail(id, locale),
    getWatchlistContext(),
  ]);

  if (result.status === "not-found") notFound();

  if (result.status === "unavailable") {
    const t = await getTranslations("Person");
    return (
      <main className="safe-page-x grid min-h-screen place-items-center bg-[#050507] text-center supports-[height:100dvh]:min-h-dvh">
        <section className="max-w-md">
          <p className="text-xs font-bold tracking-[0.28em] text-blue-300 uppercase">
            later
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("loadErrorTitle")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            {t("loadErrorBody")}
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex min-h-11 items-center rounded-full bg-white px-6 py-3 font-semibold text-black"
          >
            {t("back")}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <PersonPage
      person={result.detail}
      mode={watchlist.mode}
      user={watchlist.user}
      initialWatchlist={watchlist.initialWatchlist}
    />
  );
}
