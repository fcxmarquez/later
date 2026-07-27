import { AppShell } from "@/components/app-shell";
import { isAllowedUser } from "@/lib/auth/config";
import { getAuth } from "@/lib/auth/server";
import { getWatchlist } from "@/lib/watchlist";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: session } = await getAuth().getSession();

  if (session?.user) {
    if (!isAllowedUser(session.user)) redirect("/auth/unauthorized");

    const initialWatchlist = await getWatchlist(session.user.id);

    return (
      <AppShell
        mode="authenticated"
        initialWatchlist={initialWatchlist}
        user={{
          email: session.user.email,
          name: session.user.name,
        }}
      />
    );
  }

  return <AppShell mode="guest" initialWatchlist={[]} user={null} />;
}
