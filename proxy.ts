import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthConfigured } from "@/lib/auth/config";
import { getAuth } from "@/lib/auth/server";

const GUEST_ALLOWED_PATHS = new Set(["/", "/auth/unauthorized"]);

export default async function proxy(request: NextRequest) {
  // Without Neon Auth env vars, skip middleware and let the app run as guest.
  if (!isAuthConfigured()) {
    return NextResponse.next();
  }

  const response = await getAuth().middleware({ loginUrl: "/auth/sign-in" })(
    request,
  );

  // Keep Neon Auth session refresh / OAuth exchange, but allow guest access
  // to the home page (and unauthorized) without forcing login.
  if (
    GUEST_ALLOWED_PATHS.has(request.nextUrl.pathname) &&
    response.status >= 300 &&
    response.status < 400
  ) {
    const location = response.headers.get("location") || "";
    if (location.includes("/auth/sign-in")) {
      return NextResponse.next();
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
