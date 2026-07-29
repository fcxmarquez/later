# Later

A private movie and TV watchlist built with Next.js, Tailwind CSS, Zustand, Neon Auth, and Postgres.

## Development

```bash
pnpm install
cp .env.example .env.local
pnpm run dev
```

Set `DATABASE_URL` to Neon’s pooled connection, `DATABASE_URL_UNPOOLED` to the direct URL (without `-pooler`, used by migrations), `NEON_AUTH_BASE_URL` to the branch Auth URL, generate `NEON_AUTH_COOKIE_SECRET` with `openssl rand -base64 32`, and set the allowed private account in `AUTH_ALLOWED_EMAIL`. To connect the live catalog, add a TMDB read token as `TMDB_API_TOKEN`; without it the demo catalog is used.

You can use the app as a guest without signing in: in that mode the watchlist is stored in the browser’s LocalStorage. Cloud sync (Neon Auth + Postgres) is limited to the account configured privately on the server. Users and sessions live in the managed `neon_auth` schema; the authenticated list and watched/pending state live in `public.watchlist_items`, keyed by user ID. The client keeps optimistic updates and, on sign-in, migrates LocalStorage data to Postgres once.

The Postgres schema is defined with Drizzle in `db/schema.ts`. After changing the schema:

1. Generate a migration with `pnpm run db:generate`.
2. Review the generated SQL and do not edit migrations that have already been applied.
3. Validate the history with `pnpm run db:check` and confirm the schema is
   in sync with `pnpm run db:check:drift`.
4. Apply pending migrations in development with `pnpm run db:migrate`.

Migrations are not generated when the app starts or when you run `pnpm run build`; only already-versioned SQL files are applied. Vercel runs `pnpm run db:migrate:vercel` as an explicit step before the build. Production requires a direct connection via `DATABASE_URL_UNPOOLED`; Preview migrates the isolated database when the Neon integration provides its variables, or keeps guest mode if no database is configured. The runner serializes concurrent deploys with a Postgres advisory lock, and Drizzle applies each pending batch inside a transaction.

`db/migrations/001_create_watchlist_items.sql` is kept unchanged as history from the previous manual flow. Drizzle only runs migrations registered in `db/migrations/meta/_journal.json`.

## Internationalization

The UI supports English and Spanish via route prefixes (`/en`, `/es`). English is the default fallback. The initial locale follows the browser `Accept-Language` header; the choice is persisted in the `NEXT_LOCALE` cookie. Switch languages from the profile menu.

## CI

GitHub Actions runs formatting, lint, typecheck, migration consistency,
sync between `db/schema.ts` and generated artifacts, and the build on every
pull request and push to `main`. The drift check runs Drizzle against a
temporary copy of the history and fails if `pnpm run db:generate` would
produce changes. On pull requests it also rejects changes, renames, or
deletions of existing migration SQL or snapshots and only allows new journal
entries: fixes must land in a new migration. A second job spins up a disposable
Postgres 16, applies the full history twice, and checks ledger hashes, the
foreign key, real watchlist CRUD, and cascade deletes (workflow
`.github/workflows/ci.yml`, checks `CI / ci` and `CI / migrations`).

To block merges to `main` until checks pass (requires repo admin; on personal private repos also GitHub Pro):

1. Settings → Branches → Add branch protection rule (or Rules → Rulesets)
2. Branch name pattern: `main`
3. Enable **Require status checks to pass before merging**
4. Find and select `CI / ci` and `CI / migrations`
5. Recommended: **Require branches to be up to date before merging**

With the CLI (replace owner/repo if needed):

```bash
gh api -X PUT repos/fcxmarquez/later/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["CI / ci", "CI / migrations"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

The check only appears in the list after the workflow has run at least once in the repo.
