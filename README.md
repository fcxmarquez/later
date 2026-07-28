# Later

Una watchlist cinematográfica privada para guardar películas y series, construida con Next.js, Tailwind CSS, Zustand, Neon Auth y Postgres.

## Desarrollo

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configura `DATABASE_URL` con la conexión agrupada (`pooler`) de Neon, `DATABASE_URL_UNPOOLED` con la URL directa (sin `-pooler`, usada por migraciones), `NEON_AUTH_BASE_URL` con la URL de Auth de la rama, genera `NEON_AUTH_COOKIE_SECRET` con `openssl rand -base64 32` y define la cuenta privada permitida en `AUTH_ALLOWED_EMAIL`. Para conectar el catálogo real, añade un token de lectura de TMDB a `TMDB_API_TOKEN`; sin él se usa el catálogo de demostración.

Puedes usar la app como invitado sin iniciar sesión: en ese modo la watchlist se guarda en LocalStorage del navegador. La sincronización en la nube (Neon Auth + Postgres) está limitada a la cuenta configurada de forma privada en el servidor. Los usuarios y las sesiones se almacenan en el esquema administrado `neon_auth`; la lista autenticada y el estado visto/pendiente viven en `public.watchlist_items`, relacionados por el ID del usuario. El cliente conserva actualizaciones optimistas y, al iniciar sesión, migra una sola vez los datos de LocalStorage a Postgres.

El esquema Postgres se define con Drizzle en `db/schema.ts`. Tras cambiar el schema:

1. Genera una migración con `npm run db:generate`.
2. Revisa el SQL generado y no edites migraciones que ya se aplicaron.
3. Valida el historial con `npm run db:check` y confirma que el schema esté
   sincronizado con `npm run db:check:drift`.
4. Aplica las migraciones pendientes en desarrollo con `npm run db:migrate`.

Las migraciones no se generan al iniciar la app ni al ejecutar `npm run build`; solo se aplican archivos SQL ya versionados. Vercel ejecuta `npm run db:migrate:vercel` como paso explícito antes del build. En producción exige una conexión directa mediante `DATABASE_URL_UNPOOLED`; en Preview migra la base aislada cuando la integración de Neon proporciona sus variables, o conserva el modo invitado si no hay base configurada. El runner serializa despliegues concurrentes con un advisory lock de Postgres y Drizzle aplica cada lote pendiente dentro de una transacción.

`db/migrations/001_create_watchlist_items.sql` se conserva sin cambios como historial del flujo manual anterior. Drizzle solo ejecuta las migraciones registradas en `db/migrations/meta/_journal.json`.

## CI

GitHub Actions ejecuta formato, lint, typecheck, consistencia de migraciones,
sincronización entre `db/schema.ts` y los artefactos generados, y build en cada
pull request y push a `main`. El check de drift ejecuta Drizzle sobre una copia
temporal del historial y falla si `npm run db:generate` produciría cambios. En
pull requests también rechaza cambios, renombres o eliminaciones de SQL de
migraciones existentes: las correcciones deben ir en una migración nueva. Un
segundo job levanta un Postgres 16 desechable, aplica todo el historial dos
veces y comprueba el ledger, la llave foránea y el borrado en cascada (workflow
`.github/workflows/ci.yml`, checks `CI / ci` y `CI / migrations`).

Para bloquear merges a `main` hasta que pase el check (requiere admin del repo; en repos privados personales también GitHub Pro):

1. Settings → Branches → Add branch protection rule (o Rules → Rulesets)
2. Branch name pattern: `main`
3. Activa **Require status checks to pass before merging**
4. Busca y selecciona `CI / ci` y `CI / migrations`
5. Recomendado: **Require branches to be up to date before merging**

Con la CLI (sustituye el owner/repo si hace falta):

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

El check solo aparece en la lista después de que el workflow haya corrido al menos una vez en el repo.
