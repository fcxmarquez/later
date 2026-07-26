# Later

Una watchlist cinematográfica para guardar películas y series, construida con Next.js, Tailwind CSS y Zustand.

## Desarrollo

```bash
npm install
cp .env.example .env.local
npm run dev
```

La aplicación funciona con un catálogo de demostración si no se configura ninguna credencial. Para conectar el catálogo real, añade un token de lectura de TMDB a `TMDB_API_TOKEN`.

La lista y el estado visto/pendiente se guardan en LocalStorage mediante el middleware `persist` de Zustand.
