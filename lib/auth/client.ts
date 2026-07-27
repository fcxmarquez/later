"use client";

import { createAuthClient } from "@neondatabase/auth/next";

type AuthClient = ReturnType<typeof createAuthClient>;

let authClient: AuthClient | null = null;

export function getAuthClient() {
  if (!authClient) authClient = createAuthClient();
  return authClient;
}
