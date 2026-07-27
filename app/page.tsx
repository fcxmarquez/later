import { AppShell } from "@/components/app-shell";
import { isAllowedUser } from "@/lib/auth/config";
import { getAuth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: session } = await getAuth().getSession();

  if (!session?.user) redirect("/auth/sign-in");
  if (!isAllowedUser(session.user)) redirect("/auth/unauthorized");

  return (
    <AppShell
      user={{
        email: session.user.email,
        name: session.user.name,
      }}
    />
  );
}
