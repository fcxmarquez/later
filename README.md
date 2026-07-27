# Later

Una watchlist cinematográfica privada para guardar películas y series, construida con Next.js, Tailwind CSS, Zustand, Neon Auth y Postgres.

## Desarrollo

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configura `DATABASE_URL` con la conexión agrupada (`pooler`) de Neon, `NEON_AUTH_BASE_URL` con la URL de Auth de la rama y genera `NEON_AUTH_COOKIE_SECRET` con `openssl rand -base64 32`. Para conectar el catálogo real, añade un token de lectura de TMDB a `TMDB_API_TOKEN`; sin él se usa el catálogo de demostración.

El acceso está limitado en el servidor a `francisco.marquez.solt@gmail.com`. Los usuarios y las sesiones se almacenan en el esquema administrado `neon_auth`; la lista y el estado visto/pendiente se almacenan en `public.watchlist_items`, relacionados por el ID del usuario. El cliente conserva actualizaciones optimistas y migra una sola vez los datos antiguos de LocalStorage a Postgres.

La migración versionada está en `db/migrations/001_create_watchlist_items.sql`.
