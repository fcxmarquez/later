import "server-only";

function getAllowedEmail() {
  return process.env.AUTH_ALLOWED_EMAIL?.trim().toLowerCase();
}

export function isAuthConfigured() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;
  return Boolean(
    baseUrl &&
      cookieSecret &&
      cookieSecret.length >= 32 &&
      getAllowedEmail(),
  );
}

export function isAllowedEmail(email: string | null | undefined) {
  const allowedEmail = getAllowedEmail();
  return Boolean(
    allowedEmail && email?.trim().toLowerCase() === allowedEmail,
  );
}

export function isAllowedUser(user: {
  email: string | null | undefined;
  emailVerified: boolean;
}) {
  return isAllowedEmail(user.email) && user.emailVerified;
}
