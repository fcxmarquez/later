# Later

Una watchlist cinematográfica privada para guardar películas y series, construida con Next.js, Tailwind CSS, Zustand y Neon Auth.

## Desarrollo

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configura `NEON_AUTH_BASE_URL` con la URL de Auth de la rama de Neon y genera `NEON_AUTH_COOKIE_SECRET` con `openssl rand -base64 32`. Para conectar el catálogo real, añade un token de lectura de TMDB a `TMDB_API_TOKEN`; sin él se usa el catálogo de demostración.

El acceso está limitado en el servidor a `francisco.marquez.solt@gmail.com`. Los usuarios y las sesiones se almacenan en el esquema `neon_auth` de Neon. La lista y el estado visto/pendiente continúan guardándose en LocalStorage mediante el middleware `persist` de Zustand.
