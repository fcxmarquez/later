import { AppShell } from "@/components/app-shell";
import { isAuthConfigured } from "@/lib/auth/config";
import { getAuth } from "@/lib/auth/server";
import { getWatchlist } from "@/lib/watchlist";
import { resolveLocale } from "@/i18n/locale";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  setRequestLocale(locale);

  if (!isAuthConfigured()) {
    return <AppShell mode="guest" initialWatchlist={[]} user={null} />;
  }

  const { data: session } = await getAuth().getSession();

  if (session?.user) {
    const initialWatchlist = await getWatchlist(session.user.id);

    return (
      <AppShell
        mode="authenticated"
        initialWatchlist={initialWatchlist}
        user={{
          name: session.user.name,
        }}
      />
    );
  }

  return <AppShell mode="guest" initialWatchlist={[]} user={null} />;
}
