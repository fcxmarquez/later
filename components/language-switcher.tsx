"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className="glass flex items-center gap-0.5 rounded-full p-1"
      role="group"
      aria-label={t("language")}
    >
      {routing.locales.map((nextLocale) => {
        const active = nextLocale === locale;
        return (
          <button
            key={nextLocale}
            type="button"
            disabled={active}
            onClick={() => router.replace(pathname, { locale: nextLocale })}
            className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold tracking-wide uppercase transition ${
              active
                ? "bg-white text-black"
                : "text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}
            aria-label={nextLocale === "en" ? t("switchToEn") : t("switchToEs")}
            aria-current={active ? "true" : undefined}
          >
            {nextLocale}
          </button>
        );
      })}
    </div>
  );
}
