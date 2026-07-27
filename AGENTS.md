# AGENTS.md

## Cursor Cloud specific instructions

`later-watchlist` is a single Next.js 16 (App Router) app — a Spanish-language movie/TV watchlist called "Later". There is only one service to run locally: the Next.js server. Node 22 and npm are the toolchain (see `.github/workflows/ci.yml`).

Standard commands live in `package.json` scripts: `npm run dev` (http://localhost:3000), `npm run lint`, `npm run typecheck`, `npm run build`. There is no test runner; CI is lint + typecheck + build only. The dev server uses Turbopack.

### Guest mode vs. auth mode (non-obvious)
- The app has two modes. **Guest mode** (browse catalog + manage watchlist in LocalStorage) needs no external services and works with no env vars set. **Authenticated cloud sync** needs Neon Postgres + Neon Auth + Google OAuth.
- `isAuthConfigured()` in `lib/auth/config.ts` returns true when `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` (≥32 chars), and `AUTH_ALLOWED_EMAIL` are all set. Copying `.env.example` verbatim into `.env.local` satisfies this check with placeholder values, which activates the auth proxy against a non-working Neon endpoint. For guest-mode local dev/testing, leave those auth vars UNSET in `.env.local` so `proxy.ts` short-circuits to guest access.
- `TMDB_API_TOKEN` is optional; without it `/api/tmdb` serves the built-in demo catalog from `lib/catalog.ts` (e.g. Interstellar), so the catalog and watchlist flows are fully testable offline.
- The DB migration is `db/migrations/001_create_watchlist_items.sql` and must be applied manually to Neon only for the authenticated mode.
