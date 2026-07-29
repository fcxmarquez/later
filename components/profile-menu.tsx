"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LoaderCircle, LogIn, LogOut } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

type ProfileMenuProps = {
  isGuest: boolean;
  userName: string | null;
  isSigningOut: boolean;
  onSignOut: () => void;
};

type MenuPhase = "closed" | "open" | "exit";

export function ProfileMenu({
  isGuest,
  userName,
  isSigningOut,
  onSignOut,
}: ProfileMenuProps) {
  const t = useTranslations("Nav");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<MenuPhase>("closed");
  const phaseRef = useRef<MenuPhase>("closed");
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const isOpen = phase === "open";

  const setMenuPhase = (next: MenuPhase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const openMenu = () => {
    if (phaseRef.current === "open") return;
    setMenuPhase("open");
  };

  const closeMenu = () => {
    if (phaseRef.current !== "open") return;
    setMenuPhase("exit");
  };

  const toggleMenu = () => {
    if (phaseRef.current === "open") closeMenu();
    else if (phaseRef.current === "closed") openMenu();
  };

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        if (phaseRef.current === "open") setMenuPhase("exit");
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && phaseRef.current === "open") {
        setMenuPhase("exit");
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const initial = isGuest ? "I" : userName?.charAt(0).toUpperCase() || "F";
  const label = isGuest ? t("guest") : userName || t("signedIn");

  const switchLocale = (nextLocale: AppLocale) => {
    if (nextLocale === locale) return;
    closeMenu();
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="glass flex items-center gap-2 rounded-full p-1 transition hover:bg-white/5 lg:pr-3"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        title={isGuest ? t("guestMode") : t("signedIn")}
        onClick={toggleMenu}
      >
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
            isGuest ? "bg-white/15 text-white" : "bg-white text-black"
          }`}
        >
          {initial}
        </span>
        <span className="hidden max-w-36 truncate text-xs text-zinc-300 lg:block">
          {label}
        </span>
      </button>

      {phase !== "closed" && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget) return;
            if (phaseRef.current === "exit") setMenuPhase("closed");
          }}
          className={`profile-menu glass absolute top-full right-0 z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-white/10 p-1.5 shadow-2xl ${
            phase === "open" ? "is-open" : "is-exit"
          }`}
        >
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
            {t("language")}
          </p>
          <div
            className="flex flex-col gap-0.5"
            role="group"
            aria-label={t("language")}
          >
            {routing.locales.map((nextLocale) => {
              const active = nextLocale === locale;
              return (
                <button
                  key={nextLocale}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  disabled={active}
                  onClick={() => switchLocale(nextLocale)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-white text-black"
                      : "text-zinc-200 hover:bg-white/10"
                  }`}
                >
                  <span>
                    {nextLocale === "en" ? t("switchToEn") : t("switchToEs")}
                  </span>
                  <span className="text-[11px] font-semibold tracking-wide uppercase opacity-70">
                    {nextLocale}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="my-1.5 h-px bg-white/10" />

          {isGuest ? (
            <Link
              href="/auth/sign-in"
              role="menuitem"
              onClick={closeMenu}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-white/10"
            >
              <LogIn size={16} />
              {t("signIn")}
            </Link>
          ) : (
            <button
              type="button"
              role="menuitem"
              disabled={isSigningOut}
              onClick={() => {
                closeMenu();
                onSignOut();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-70"
            >
              {isSigningOut ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <LogOut size={16} />
              )}
              {t("signOut")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
