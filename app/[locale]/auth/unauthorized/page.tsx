import { RestrictedAccess } from "@/components/restricted-access";
import { resolveLocale } from "@/i18n/locale";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function UnauthorizedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  setRequestLocale(locale);
  return <RestrictedAccess />;
}
