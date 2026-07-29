import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { type AppLocale, routing } from "./routing";

export function resolveLocale(locale: string): AppLocale {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  return locale;
}
