# Handoff: configurar env vars de Neon Auth en Vercel (proyecto Later)

## Contexto

- Repo: https://github.com/fcxmarquez/later
- PR abierto: https://github.com/fcxmarquez/later/pull/2 (`cursor/guest-mode-localstorage-d846`)
- Proyecto Vercel: `later`
- Team: `franciscos-projects-72b51bef`
- Project ID: `prj_NsUVU2RII2DY00zvHs3PbM6hJT0J`
- Dominio production: `later-tau.vercel.app`
- También hay alias de preview de la rama del PR

## Problema

En Vercel, las requests fallaban con:

```text
Error: NEON_AUTH_BASE_URL is not configured.
```

Ese error salía en el middleware (`proxy.ts` / Neon Auth) y provocaba `Internal Server Error` (500) en la preview.

En el entorno del agente cloud de Cursor sí existen:

- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_COOKIE_SECRET`
- `DATABASE_URL`

Pero en el runtime de Vercel (al menos en Preview) `NEON_AUTH_BASE_URL` no estaba disponible.

## Fix temporal ya hecho en el PR

Se añadió degradación a modo invitado si faltan las env de Neon Auth, para que la app no pete con 500. El preview actual carga en guest mode.

Eso no sustituye configurar bien las variables: sin ellas no funciona el login con Google ni la sync a Postgres.

## Qué necesito que hagas

1. Abre el proyecto `later` en Vercel → Settings → Environment Variables.
2. Verifica o crea estas variables en **Production** y **Preview** (y Development si aplica):

| Variable | Notas |
| --- | --- |
| `NEON_AUTH_BASE_URL` | URL Auth de la rama Neon. Formato: `https://….neonauth….aws.neon.tech/…/auth` |
| `NEON_AUTH_COOKIE_SECRET` | Mínimo 32 caracteres. Generar con: `openssl rand -base64 32` |
| `DATABASE_URL` | Connection string pooler de Neon |
| `TMDB_API_TOKEN` | Opcional. Sin él usa catálogo demo |

3. Confirma que los nombres coinciden exactamente (case-sensitive).
4. Si ya existían solo en Production, añádelas también a Preview. Las PRs usan Preview.
5. Redeploy del preview del PR (y production si hace falta) para que cojan las vars.
6. Verifica:
   - Abrir la preview → ya no da 500
   - `/auth/sign-in` muestra “Continuar con Google” (no el mensaje de “login no configurado”)
   - Login con la cuenta autorizada `francisco.marquez.solt@gmail.com` funciona
   - Tras login, la watchlist usa Postgres (no solo localStorage)

## Criterio de éxito

- Sin 500 en preview/production
- Guest mode sigue funcionando sin sesión
- Login Google + sync Postgres funcionan con las env correctas
- No hace falta más código salvo que descubras que el problema es otro (nombre distinto, secret corto, URL Auth incorrecta, etc.)

## No hace falta

- Rehacer el modo invitado ni el workflow de CI (ya están en el PR)
- Cambiar branch protection salvo que el usuario lo pida
