import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { isAuthConfigured } from "@/lib/auth/config";
import { getAuth } from "@/lib/auth/server";
import { isAppLocale, routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

function isGuestAllowedPath(pathname: string) {
  return pathname === "/" || /^\/person\/\d+$/.test(pathname);
}

function pathnameHasLocale(pathname: string) {
  return routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

function pathnameWithoutLocale(pathname: string) {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  if (!maybeLocale || !isAppLocale(maybeLocale)) {
    return pathname;
  }
  const rest = `/${segments.slice(2).join("/")}`;
  return rest === "/" ? "/" : rest.replace(/\/$/, "") || "/";
}

function localeFromPathname(pathname: string) {
  const maybeLocale = pathname.split("/")[1];
  return isAppLocale(maybeLocale) ? maybeLocale : routing.defaultLocale;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Negotiate / redirect locale first so unknown prefixes like `/fr` and
  // unprefixed paths like `/auth/sign-in` never hit auth as raw routes.
  if (!pathnameHasLocale(pathname) || !isAuthConfigured()) {
    return handleI18nRouting(request);
  }

  const locale = localeFromPathname(pathname);
  const pathWithoutLocale = pathnameWithoutLocale(pathname);
  const response = await getAuth().middleware({
    loginUrl: `/${locale}/auth/sign-in`,
  })(request);

  if (
    isGuestAllowedPath(pathWithoutLocale) &&
    response.status >= 300 &&
    response.status < 400
  ) {
    const location = response.headers.get("location") || "";
    if (location.includes("/auth/sign-in")) {
      return handleI18nRouting(request);
    }
  }

  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  // Preserve auth middleware side effects (e.g. refreshed cookies) on the
  // i18n response when the request is allowed through.
  const i18nResponse = handleI18nRouting(request);
  response.cookies.getAll().forEach((cookie) => {
    i18nResponse.cookies.set(cookie);
  });
  return i18nResponse;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
