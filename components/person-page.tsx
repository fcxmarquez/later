"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, MapPin, Play } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { getAuthClient } from "@/lib/auth/client";
import { imageUrl } from "@/lib/catalog";
import type {
  PersonCredit,
  PersonDetail,
  SavedMedia,
  WatchlistMode,
} from "@/lib/types";
import { useWatchlist } from "@/store/watchlist";
import { ExpandableText } from "./expandable-text";
import { MediaCard } from "./media-card";
import { ProfileMenu } from "./profile-menu";
import { WatchlistErrorToast } from "./watchlist-error-toast";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string, locale: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

function PersonPortrait({ person }: { person: PersonDetail }) {
  const t = useTranslations("Person");
  const [failed, setFailed] = useState(!person.profilePath);

  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-zinc-900 shadow-[0_30px_90px_rgba(0,0,0,.6)] ring-1 ring-white/10">
      {failed || !person.profilePath ? (
        <span className="grid size-full place-items-center bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950 text-5xl font-semibold tracking-wide text-zinc-200">
          {initials(person.name)}
        </span>
      ) : (
        <Image
          src={imageUrl(person.profilePath, "profileLarge")}
          alt={t("portraitAlt", { name: person.name })}
          fill
          priority
          sizes="(max-width: 767px) 70vw, 320px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function creditSubtitle(
  credit: PersonCredit,
  t: ReturnType<typeof useTranslations>,
) {
  const role = credit.character
    ? t("asCharacter", { character: credit.character })
    : null;
  const episodes = credit.episodeCount
    ? t("episodes", { count: credit.episodeCount })
    : null;
  return [role, episodes].filter(Boolean).join(" · ");
}

type PersonPageProps = {
  person: PersonDetail;
  mode: WatchlistMode;
  user: { name: string } | null;
  initialWatchlist: SavedMedia[];
};

export function PersonPage({
  person,
  mode,
  user,
  initialWatchlist,
}: PersonPageProps) {
  const t = useTranslations("Person");
  const locale = useLocale();
  const router = useRouter();
  const initialize = useWatchlist((state) => state.initialize);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileFailed, setProfileFailed] = useState(false);
  const isGuest = mode === "guest";

  useEffect(() => {
    initialize(initialWatchlist, mode);
  }, [initialWatchlist, initialize, mode]);

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await getAuthClient().signOut();
    } finally {
      window.location.assign(`/${locale}/auth/sign-in`);
    }
  };

  const lifeDates = [
    person.birthday ? formatDate(person.birthday, locale) : null,
    person.deathday ? formatDate(person.deathday, locale) : null,
  ].filter(Boolean);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050507] pb-[calc(5rem+env(safe-area-inset-bottom))] supports-[height:100dvh]:min-h-dvh">
      <header className="safe-page-x fixed inset-x-0 top-0 z-40 flex h-[calc(5rem+env(safe-area-inset-top))] items-center justify-between bg-gradient-to-b from-black/90 via-black/55 to-transparent pt-[env(safe-area-inset-top)]">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 rounded-full pr-2 text-sm font-semibold text-zinc-200 transition hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-white text-black">
            <Play size={17} fill="currentColor" />
          </span>
          <span className="text-xl font-bold tracking-tight">later</span>
        </Link>
        <ProfileMenu
          isGuest={isGuest}
          userName={user?.name ?? null}
          isSigningOut={isSigningOut}
          onSignOut={signOut}
        />
      </header>

      <section className="safe-page-x relative pt-28 sm:pt-32">
        <div className="pointer-events-none absolute inset-x-0 -top-20 h-[42rem] bg-[radial-gradient(circle_at_18%_25%,rgba(59,130,246,.18),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(124,58,237,.16),transparent_36%)]" />
        {person.profilePath && !profileFailed ? (
          <div
            className="pointer-events-none absolute inset-x-0 -top-16 h-[36rem] overflow-hidden opacity-[0.08] blur-3xl"
            aria-hidden
          >
            <Image
              src={imageUrl(person.profilePath, "profileLarge")}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-top"
              onError={() => setProfileFailed(true)}
            />
          </div>
        ) : null}

        <div className="relative mx-auto grid max-w-6xl items-start gap-9 md:grid-cols-[minmax(240px,320px)_1fr] md:gap-14 lg:gap-20">
          <div className="mx-auto w-[min(72vw,320px)] md:mx-0 md:w-full">
            <PersonPortrait person={person} />
          </div>

          <div className="pt-1 md:pt-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full text-sm text-zinc-400 transition hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <ArrowLeft size={17} /> {t("back")}
            </button>
            <p className="mt-8 text-xs font-bold tracking-[0.28em] text-blue-300 uppercase">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              {person.name}
            </h1>

            {(lifeDates.length > 0 || person.placeOfBirth) && (
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-zinc-400">
                {lifeDates.length > 0 && (
                  <span className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-zinc-500" />
                    {lifeDates.join(" — ")}
                  </span>
                )}
                {person.placeOfBirth && (
                  <span className="flex items-center gap-2">
                    <MapPin size={16} className="text-zinc-500" />
                    {person.placeOfBirth}
                  </span>
                )}
              </div>
            )}

            <section className="mt-10 max-w-3xl">
              <h2 className="text-xs font-bold tracking-[0.28em] text-zinc-500 uppercase">
                {t("biography")}
              </h2>
              <ExpandableText
                text={person.biography || t("noBiography")}
                showMoreLabel={t("showMore")}
                showLessLabel={t("showLess")}
                preserveWhitespace
              />
            </section>

            {person.alsoKnownAs.length > 0 && (
              <p className="mt-7 text-sm leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-400">
                  {t("alsoKnownAs")}
                </span>{" "}
                {person.alsoKnownAs.join(" · ")}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="safe-page-x relative mx-auto mt-20 max-w-[96rem] sm:mt-28">
        <p className="text-xs font-bold tracking-[0.28em] text-zinc-500 uppercase">
          {t("filmographyEyebrow")}
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
          {t("knownFor")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
          {t("knownForHint")}
        </p>

        {person.credits.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {person.credits.map((credit) => (
              <MediaCard
                key={`${credit.mediaType}-${credit.id}`}
                item={credit}
                layout="grid"
                subtitle={creditSubtitle(credit, t)}
              />
            ))}
          </div>
        ) : (
          <p className="mt-10 rounded-3xl bg-white/5 px-6 py-10 text-center text-sm text-zinc-500 ring-1 ring-white/10">
            {t("noCredits")}
          </p>
        )}
      </section>

      <WatchlistErrorToast />
    </main>
  );
}
