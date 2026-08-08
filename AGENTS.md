# AGENTS.md

## Instructions

`later-watchlist` is a single Next.js 16 (App Router) app — a Spanish-language movie/TV watchlist called "Later". There is only one service to run locally: the Next.js server. Node 22 and pnpm 10.34.5 are the toolchain (see `.github/workflows/ci.yml`).

Standard commands live in `package.json` scripts: `pnpm run dev` (http://localhost:3000), `pnpm run format` / `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run build`. There is no app unit-test runner; CI runs formatting, lint, typecheck, migration validation and smoke testing, and the production build. The dev server uses Turbopack.

### Branch workflow

- Before starting new feature work, inspect the worktree, switch to `main` once it is safe to do so, and run `git pull --ff-only` so the feature starts from the latest remote `main`.
- Never implement a feature directly on `main`. If a feature request begins while `main` is checked out, create and switch to a descriptively named feature branch from the freshly updated `main` before editing files.

### Before committing or pushing

Run these in order and fix any failures before you commit or push:

1. `pnpm run format` (or `pnpm run format:check` to verify without writing)
2. `pnpm run lint`
3. `pnpm run typecheck`
4. `pnpm run build`

### Guest mode vs. auth mode (non-obvious)

- The app has two modes. **Guest mode** (manage watchlist in LocalStorage; browse catalog when `TMDB_API_TOKEN` is set) needs no auth services. **Authenticated cloud sync** needs Neon Postgres + Neon Auth + Google OAuth.
- `isAuthConfigured()` in `lib/auth/config.ts` returns true when `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` (≥32 chars) are set. Copying `.env.example` verbatim into `.env.local` satisfies this check with placeholder values, which activates the auth proxy against a non-working Neon endpoint. For guest-mode local dev/testing, leave those auth vars UNSET in `.env.local` so `proxy.ts` short-circuits to guest access.
- `TMDB_API_TOKEN` is required for the live catalog and title details. Without it, `/api/tmdb` returns an empty catalog (503) and the UI shows loading skeletons then an error/empty state. Guest watchlist LocalStorage still works offline.

### Commit

- Always do commits following the conventional commit message format. Be brief, atomic and no body is needed.
