import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 — Later",
};

export default function GlobalNotFound() {
  return (
    <html lang={routing.defaultLocale} className="dark">
      <body className="safe-page-x grid min-h-screen place-items-center bg-[#050507] text-white supports-[height:100dvh]:min-h-dvh">
        <p className="text-sm text-zinc-400">404</p>
      </body>
    </html>
  );
}
