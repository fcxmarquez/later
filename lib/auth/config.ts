export const ALLOWED_EMAIL = "francisco.marquez.solt@gmail.com";

export function isAuthConfigured() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;
  return Boolean(baseUrl && cookieSecret && cookieSecret.length >= 32);
}

export function isAllowedEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === ALLOWED_EMAIL;
}

export function isAllowedUser(user: {
  email: string | null | undefined;
  emailVerified: boolean;
}) {
  return isAllowedEmail(user.email) && user.emailVerified;
}
