import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function TitleNotFound() {
  const t = await getTranslations("Detail");

  return (
    <main className="safe-page-x grid min-h-screen place-items-center bg-[#050507] text-center supports-[height:100dvh]:min-h-dvh">
      <section className="max-w-md">
        <p className="text-xs font-bold tracking-[0.28em] text-blue-300 uppercase">
          404
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {t("notFoundTitle")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          {t("notFoundBody")}
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex min-h-11 items-center rounded-full bg-white px-6 py-3 font-semibold text-black"
        >
          {t("back")}
        </Link>
      </section>
    </main>
  );
}
