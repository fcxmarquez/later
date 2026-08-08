# Frontend Architecture Review — 2026-08-08

Short description: Architecture and good-practices review of Later after synchronizing `main`, recorded as a baseline for future refactors or architecture redefinitions. It covers the Next.js App Router, server/client data boundaries, TMDB services, watchlist state, accessibility, and live browser behavior.

## Context

- Repository: `later-watchlist`, a localized Next.js 16 App Router application.
- Git synchronization: `main` was fast-forwarded from `cad3cc9` to `00b2f03` and matched `origin/main` before the review changes.
- Review approach: parallel server/App Router and client/state audits, followed by an independent evaluation of the combined changes.
- Current state: the architecture improvements described below are present in the worktree but have not been committed or pushed.

## How to use this log

Use this report as the comparison point for future structural changes. A proposed refactor should identify which boundary below it changes, why that responsibility needs to move, what coupling it removes or introduces, and how the verification baseline will be preserved.

| Boundary                 | Current responsibility                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| App Router pages/layouts | Parse route input, resolve locale and metadata, coordinate server data, and choose page/modal/not-found presentation.    |
| Server-only TMDB modules | Own authenticated upstream requests, caching policy, response mapping, and upstream failure classification.              |
| API route handlers       | Validate browser-originated input and translate service results into HTTP responses; they do not duplicate TMDB mapping. |
| Client components        | Own interaction, animation, focus, and transient view state while consuming server-resolved initial data.                |
| Zustand watchlist store  | Own guest/authenticated watchlist state, optimistic mutations, per-item pending state, and rollback behavior.            |
| Guest storage module     | Own the versioned LocalStorage format and safe browser persistence only.                                                 |

Architecture redefinitions should update this table, document any deliberately changed tradeoffs, and append fresh static, build, and browser evidence rather than overwriting the historical result.

## Architecture assessment

The application already had strong foundations: localized route segments, canonical and intercepted title routes, reusable media types, server-side TMDB credentials, and a clear guest-versus-authenticated watchlist model.

The review found the following improvement areas:

- The root layout contract was split between a fragment-only top-level layout and the localized document layout.
- The home catalog loaded after hydration through a client effect, causing a visible request waterfall and duplicating server fetch behavior in route handlers.
- TMDB transport, mapping, and route-handler responsibilities were mixed across shared modules.
- Title details were already resolved by the route but were merged and optionally fetched again inside the client modal.
- Watchlist mutations lacked per-item concurrency guards and reliable rollback when API or LocalStorage persistence failed.
- Guest LocalStorage parsing and writes needed explicit client boundaries, versioning, and failure handling.
- Several interactive controls needed stronger ARIA state, keyboard navigation, reduced-motion handling, and modal focus management.

## Improvements implemented

### App Router and server data flow

- Made `app/[locale]/layout.tsx` the actual root document layout and replaced the former top-level 404 with `app/global-not-found.tsx`.
- Enabled Next.js global not-found handling in `next.config.ts`.
- Moved home catalog loading into the localized Server Component and streamed its existing skeleton through Suspense.
- Loaded catalog and watchlist context concurrently before rendering `AppShell`.
- Added focused, server-only TMDB catalog and season services.
- Reduced API handlers to validation and HTTP response translation.
- Removed the unused `/api/tmdb/home` and `/api/tmdb/detail` handlers.
- Reused the shared watchlist context in home, title, and person routes.
- Distinguished genuine TMDB 404 responses from configuration or upstream outages; unavailable title responses use a localized fallback and noindex metadata.

### Client components and state

- Changed `DetailModal` to require one resolved `MediaDetail`, removing its redundant detail-fetch effect and merge state.
- Moved `WatchlistMode` into the shared type layer so server modules do not import from the client store.
- Added a focused `useWatchlistItem` selector for media-card, hero, and detail actions.
- Added per-item pending locks, optimistic UI rollback, disabled/busy states, and mode-aware store reinitialization.
- Made guest storage explicitly client-only, preserved legacy data, added a versioned envelope, and handled unavailable LocalStorage safely.
- Corrected carousel-dot semantics and added explicit button types and selected/current states to navigation and filters.

### Accessibility review fixes

The independent evaluation found two regressions in the first combined implementation, and both were corrected:

- The intercepted unavailable-title state now behaves as a real modal with a close action, Escape and backdrop dismissal, initial focus, a focus loop, scroll locking, and focus restoration.
- The profile menu now closes immediately when reduced motion disables its exit animation, supports standard arrow/Home/End navigation, and restores trigger focus after Escape.

## Verification

All repository gates passed with Node 22 and pnpm 10.34.5:

| Check                   | Result |
| ----------------------- | ------ |
| `pnpm run format:check` | Passed |
| `pnpm run lint`         | Passed |
| `pnpm run typecheck`    | Passed |
| `pnpm run build`        | Passed |
| `git diff --check`      | Passed |

The first sandboxed production build could not bind a Turbopack helper port (`EPERM`); the authorized local-process rerun passed without source changes.

Live browser verification covered:

- Server-rendered English home catalog with meaningful initial content.
- Intercepted title modal, direct title page, close behavior, focus, and body scroll restoration.
- Genuine unavailable title response with localized 404 and noindex metadata.
- Live catalog search for `Dune`.
- Direct actor detail routing and filmography links.
- Guest watchlist add, reload persistence, list rendering, and cleanup.
- Profile-menu focus and Escape dismissal.
- No browser console warnings, framework error overlays, or failed application requests in the tested flows.

## Remaining recommendations

1. Split `components/detail-modal.tsx` and `components/app-shell.tsx` into feature-focused components after introducing component-level tests; they remain the main concentration of UI complexity.
2. Decide explicitly whether authenticated proxy policy should redirect unknown localized paths to sign-in or allow them to reach the global 404.
3. Add focused store and interaction tests before further large state or modal refactors. The repository currently relies on static gates, production builds, and browser smoke verification.

## Handoff

No commit or push was created. The worktree contains the reviewed architecture changes and this report for final inspection and intentional commit scoping.
