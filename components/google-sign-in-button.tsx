"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LoaderCircle } from "lucide-react";
import { getAuthClient } from "@/lib/auth/client";

export function GoogleSignInButton() {
  const t = useTranslations("GoogleSignIn");
  const locale = useLocale();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setIsPending(true);
    setError(null);

    try {
      const origin = window.location.origin;
      const { error: authError } = await getAuthClient().signIn.social({
        provider: "google",
        callbackURL: `${origin}/${locale}`,
        newUserCallbackURL: `${origin}/${locale}`,
        errorCallbackURL: `${origin}/${locale}/auth/sign-in?error=oauth`,
      });

      if (authError) {
        setError(authError.message || t("failed"));
        setIsPending(false);
      }
    } catch {
      setError(t("connectFailed"));
      setIsPending(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={signIn}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3.5 font-semibold text-black transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-70"
      >
        {isPending ? (
          <LoaderCircle className="animate-spin" size={20} />
        ) : (
          <GoogleIcon />
        )}
        {isPending ? t("opening") : t("continue")}
      </button>
      {error && (
        <p className="mt-4 text-center text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.2L6.5 14Z"
      />
      <path
        fill="#EA4335"
        d="M12 6a5.4 5.4 0 0 1 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.4L6.5 10A5.9 5.9 0 0 1 12 6Z"
      />
    </svg>
  );
}
