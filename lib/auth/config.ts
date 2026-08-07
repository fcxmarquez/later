import "server-only";

export function isAuthConfigured() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;
  return Boolean(baseUrl && cookieSecret && cookieSecret.length >= 32);
}
