"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LoaderCircle, LockKeyhole, RotateCcw } from "lucide-react";
import { getAuthClient } from "@/lib/auth/client";

export function RestrictedAccess() {
  const t = useTranslations("Restricted");
  const locale = useLocale();
  const [isSigningOut, setIsSigningOut] = useState(true);

  useEffect(() => {
    getAuthClient()
      .signOut()
      .finally(() => setIsSigningOut(false));
  }, []);

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="glass w-full max-w-md rounded-[32px] border border-white/10 p-8 text-center shadow-2xl max-[359px]:p-6 sm:p-10">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/20">
          <LockKeyhole size={25} />
        </span>
        <p className="mt-7 text-xs font-bold tracking-[.3em] text-amber-200 uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">{t("body")}</p>
        <button
          type="button"
          disabled={isSigningOut}
          onClick={() => window.location.assign(`/${locale}/auth/sign-in`)}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 font-semibold text-black transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-70 max-[359px]:gap-1.5 max-[359px]:px-3 max-[359px]:text-sm"
        >
          {isSigningOut ? (
            <LoaderCircle className="animate-spin" size={19} />
          ) : (
            <RotateCcw size={19} />
          )}
          {isSigningOut ? t("signingOut") : t("tryAnother")}
        </button>
        <button
          type="button"
          disabled={isSigningOut}
          onClick={() => window.location.assign(`/${locale}`)}
          className="mt-3 flex w-full items-center justify-center rounded-full bg-white/10 px-5 py-3.5 font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-70 max-[359px]:px-3 max-[359px]:text-sm"
        >
          {t("continueGuest")}
        </button>
      </section>
    </main>
  );
}
