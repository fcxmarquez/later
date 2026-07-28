# AGENTS.md

## Instructions

`later-watchlist` is a single Next.js 16 (App Router) app — a Spanish-language movie/TV watchlist called "Later". There is only one service to run locally: the Next.js server. Node 22 and pnpm 10.34.5 are the toolchain (see `.github/workflows/ci.yml`).

Standard commands live in `package.json` scripts: `pnpm run dev` (http://localhost:3000), `pnpm run format` / `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run build`. There is no app unit-test runner; CI runs formatting, lint, typecheck, migration validation and smoke testing, and the production build. The dev server uses Turbopack.

### Before committing or pushing

Run these in order and fix any failures before you commit or push:

1. `pnpm run format` (or `pnpm run format:check` to verify without writing)
2. `pnpm run lint`
3. `pnpm run typecheck`
4. `pnpm run build`

### Guest mode vs. auth mode (non-obvious)

- The app has two modes. **Guest mode** (browse catalog + manage watchlist in LocalStorage) needs no external services and works with no env vars set. **Authenticated cloud sync** needs Neon Postgres + Neon Auth + Google OAuth.
- `isAuthConfigured()` in `lib/auth/config.ts` returns true when `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` (≥32 chars), and `AUTH_ALLOWED_EMAIL` are all set. Copying `.env.example` verbatim into `.env.local` satisfies this check with placeholder values, which activates the auth proxy against a non-working Neon endpoint. For guest-mode local dev/testing, leave those auth vars UNSET in `.env.local` so `proxy.ts` short-circuits to guest access.
- `TMDB_API_TOKEN` is optional; without it `/api/tmdb` serves the built-in demo catalog from `lib/catalog.ts` (e.g. Interstellar), so the catalog and watchlist flows are fully testable offline.

### Commit

- Always do commits following the conventional commit message format. Be brief, atomic and no body is needed.
