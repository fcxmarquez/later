import { getAuth } from "@/lib/auth/server";

type AuthRouteContext = {
  params: Promise<{ path: string[] }>;
};

export function GET(request: Request, context: AuthRouteContext) {
  return getAuth().handler().GET(request, context);
}

export async function POST(request: Request, context: AuthRouteContext) {
  const { path } = await context.params;
  const authPath = path.join("/");

  if (authPath === "sign-in/social") {
    const payload = (await request.clone().json().catch(() => null)) as {
      provider?: string;
    } | null;

    if (payload?.provider !== "google") {
      return Response.json(
        { error: "Solo se permite iniciar sesión con Google." },
        { status: 403 },
      );
    }
  } else if (authPath !== "sign-out") {
    return Response.json(
      { error: "Método de autenticación no permitido." },
      { status: 403 },
    );
  }

  return getAuth().handler().POST(request, context);
}
