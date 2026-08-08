"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef } from "react";
import { Link, useRouter } from "@/i18n/navigation";

const FOCUSABLE_SELECTOR =
  "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function TitleUnavailable({
  presentation = "page",
}: {
  presentation?: "page" | "modal";
}) {
  const tHome = useTranslations("Home");
  const tDetail = useTranslations("Detail");
  const router = useRouter();
  const headingId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isModal = presentation === "modal";
  const Heading = isModal ? "h2" : "h1";

  const close = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    if (!isModal) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [close, isModal]);

  const content = (
    <>
      <p className="text-xs font-bold tracking-[0.28em] text-blue-300 uppercase">
        later
      </p>
      <Heading
        id={headingId}
        className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
      >
        {tHome("loadErrorTitle")}
      </Heading>
      <p id={descriptionId} className="mt-3 text-sm leading-6 text-zinc-500">
        {tHome("loadErrorBody")}
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex min-h-11 items-center rounded-full bg-white px-6 py-3 font-semibold text-black"
      >
        {tDetail("back")}
      </Link>
    </>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 grid min-h-screen place-items-center overflow-y-auto bg-black/70 px-6 py-12 text-white backdrop-blur-sm supports-[height:100dvh]:min-h-dvh"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          className="relative z-10 w-full max-w-md rounded-3xl bg-[#0b0b0f] px-8 py-12 text-center shadow-2xl ring-1 ring-white/10"
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label={tDetail("close")}
            className="absolute top-3 right-3 grid size-11 place-items-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <X size={20} />
          </button>
          {content}
        </section>
      </div>
    );
  }

  return (
    <main className="safe-page-x grid min-h-screen place-items-center bg-[#050507] text-white supports-[height:100dvh]:min-h-dvh">
      <section className="relative z-10 max-w-md text-center">
        {content}
      </section>
    </main>
  );
}
