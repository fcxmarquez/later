# Later

Una watchlist cinematográfica privada para guardar películas y series, construida con Next.js, Tailwind CSS, Zustand, Neon Auth y Postgres.

## Desarrollo

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configura `DATABASE_URL` con la conexión agrupada (`pooler`) de Neon, `NEON_AUTH_BASE_URL` con la URL de Auth de la rama, genera `NEON_AUTH_COOKIE_SECRET` con `openssl rand -base64 32` y define la cuenta privada permitida en `AUTH_ALLOWED_EMAIL`. Para conectar el catálogo real, añade un token de lectura de TMDB a `TMDB_API_TOKEN`; sin él se usa el catálogo de demostración.

Puedes usar la app como invitado sin iniciar sesión: en ese modo la watchlist se guarda en LocalStorage del navegador. La sincronización en la nube (Neon Auth + Postgres) está limitada a la cuenta configurada de forma privada en el servidor. Los usuarios y las sesiones se almacenan en el esquema administrado `neon_auth`; la lista autenticada y el estado visto/pendiente viven en `public.watchlist_items`, relacionados por el ID del usuario. El cliente conserva actualizaciones optimistas y, al iniciar sesión, migra una sola vez los datos de LocalStorage a Postgres.

La migración versionada está en `db/migrations/001_create_watchlist_items.sql`.

## CI

GitHub Actions ejecuta `lint`, `typecheck` y `build` en cada pull request y en pushes a `main` (workflow `.github/workflows/ci.yml`, check `CI / ci`).

Para bloquear merges a `main` hasta que pase el check (requiere admin del repo; en repos privados personales también GitHub Pro):

1. Settings → Branches → Add branch protection rule (o Rules → Rulesets)
2. Branch name pattern: `main`
3. Activa **Require status checks to pass before merging**
4. Busca y selecciona `CI / ci`
5. Recomendado: **Require branches to be up to date before merging**

Con la CLI (sustituye el owner/repo si hace falta):

```bash
gh api -X PUT repos/fcxmarquez/later/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["CI / ci"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

El check solo aparece en la lista después de que el workflow haya corrido al menos una vez en el repo.
