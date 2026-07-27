export const ALLOWED_EMAIL = "francisco.marquez.solt@gmail.com";

export function isAllowedEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === ALLOWED_EMAIL;
}

export function isAllowedUser(user: {
  email: string | null | undefined;
  emailVerified: boolean;
}) {
  return isAllowedEmail(user.email) && user.emailVerified;
}
