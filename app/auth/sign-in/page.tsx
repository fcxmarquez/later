import Link from "next/link";
import { redirect } from "next/navigation";
import { Play } from "lucide-react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { isAllowedUser, isAuthConfigured } from "@/lib/auth/config";
import { getAuth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const authReady = isAuthConfigured();

  if (authReady) {
    const { data: session } = await getAuth().getSession();

    if (session?.user) {
      redirect(
        isAllowedUser(session.user) ? "/" : "/auth/unauthorized",
      );
    }
  }

  const { error } = await searchParams;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.22),transparent_35%),radial-gradient(circle_at_80%_75%,rgba(124,58,237,.18),transparent_38%),linear-gradient(145deg,#050507,#101017_52%,#050507)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:48px_48px]" />

      <section className="glass relative w-full max-w-md rounded-[32px] border border-white/10 p-7 shadow-2xl sm:p-10">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-black shadow-lg shadow-white/10">
          <Play size={24} fill="currentColor" />
        </div>
        <p className="mt-7 text-center text-xs font-bold uppercase tracking-[.32em] text-blue-300">
          later
        </p>
        <h1 className="mt-3 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Tu lista te espera.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-6 text-zinc-400">
          {authReady
            ? "Entra con Google para sincronizar en la nube, o continúa como invitado y guarda tu lista en este dispositivo."
            : "El login con Google aún no está configurado en este entorno. Puedes continuar como invitado y guardar tu lista en este dispositivo."}
        </p>

        <div className="mt-8 space-y-3">
          {authReady ? <GoogleSignInButton /> : null}
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-full bg-white/10 px-5 py-3.5 font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/15"
          >
            Continuar como invitado
          </Link>
        </div>

        {error && (
          <p
            className="mt-5 rounded-2xl bg-red-400/10 px-4 py-3 text-center text-sm text-red-200 ring-1 ring-red-400/20"
            role="alert"
          >
            Google no pudo completar el inicio de sesión. Inténtalo de nuevo.
          </p>
        )}

        <p className="mt-6 text-center text-xs leading-5 text-zinc-600">
          La sincronización en la nube requiere una cuenta autorizada.
        </p>
      </section>
    </main>
  );
}
