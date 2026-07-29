import { routing } from "@/i18n/routing";

export default function GlobalNotFound() {
  return (
    <html lang={routing.defaultLocale}>
      <body className="grid min-h-screen place-items-center bg-[#050507] text-white">
        <p className="text-sm text-zinc-400">404</p>
      </body>
    </html>
  );
}
