"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
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

  const closeMenu = useCallback((restoreFocus = false) => {
    if (phaseRef.current !== "open") return;
    const nextPhase = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? "closed"
      : "exit";
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const toggleMenu = () => {
    if (phaseRef.current === "open") closeMenu();
    else if (phaseRef.current === "closed") openMenu();
  };

  useEffect(() => {
    if (!isOpen) return;

    const focusFrame = requestAnimationFrame(() => {
      menuRef.current
        ?.querySelector<HTMLElement>(
          "[role='menuitem']:not([disabled]), [role='menuitemradio']:not([disabled])",
        )
        ?.focus();
    });

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
        return;
      }

      if (event.key === "Tab") {
        closeMenu();
        return;
      }

      if (
        event.key !== "ArrowDown" &&
        event.key !== "ArrowUp" &&
        event.key !== "Home" &&
        event.key !== "End"
      )
        return;

      const menuItems = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>(
          "[role='menuitem']:not([disabled]), [role='menuitemradio']:not([disabled])",
        ) ?? [],
      );
      if (menuItems.length === 0) return;

      event.preventDefault();
      const currentIndex = menuItems.indexOf(
        document.activeElement as HTMLElement,
      );
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? menuItems.length - 1
            : event.key === "ArrowUp"
              ? (currentIndex - 1 + menuItems.length) % menuItems.length
              : (currentIndex + 1) % menuItems.length;
      menuItems[nextIndex]?.focus();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, isOpen]);

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
        ref={triggerRef}
        type="button"
        className="glass flex min-h-11 min-w-11 items-center gap-2 rounded-full p-1 transition hover:bg-white/5 lg:pr-3"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        title={isGuest ? t("guestMode") : t("signedIn")}
        onClick={toggleMenu}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown") return;
          event.preventDefault();
          openMenu();
        }}
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
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          inert={phase === "exit"}
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
                  className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
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
              onClick={() => closeMenu()}
              className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-white/10"
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
              className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-70"
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
