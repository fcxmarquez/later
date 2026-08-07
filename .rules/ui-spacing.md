# UI and Spacing Guidelines

These rules apply to every screen and reusable component in Later. Treat them
as acceptance criteria for UI work, not as optional visual suggestions.

## Spacing system

- Use a 4px base grid. Prefer Tailwind spacing values that resolve to 4, 8, 12,
  16, 20, 24, 32, 40, 48, or 64px.
- Reuse an existing spacing value before introducing an arbitrary value.
- Reserve large gaps such as 64–96px for separation between major content
  sections, not for controls or related content.
- Keep related label, title, description, metadata, and action groups visually
  closer to each other than to the next section.

## Page gutters and breakpoints

- Use the app's standard horizontal gutters:
  - Default/mobile: 20px (`px-5`)
  - `sm` and `md`: 40px (`sm:px-10`)
  - `lg` and above: 56px (`lg:px-14`)
- Use the Tailwind breakpoints already established by the project: `sm` 640px,
  `md` 768px, `lg` 1024px, `xl` 1280px, and `2xl` 1536px.
- Do not solve a breakpoint problem at only one reference width. Check the
  beginning and end of the affected breakpoint range.

## Grids, rails, and cards

- Horizontal media rails may use fixed-width, non-shrinking cards.
- Search and watchlist grids must use fluid cards (`w-full min-w-0`) that fit
  their assigned grid tracks.
- Never place a fixed-width card inside a fractional grid track. This causes
  overlapping cards at narrower widths and oversized gutters at wider widths.
- Media grids use a 16px horizontal gap and a 36px vertical gap unless a design
  change explicitly establishes a new shared rhythm.
- Keep the responsive grid progression consistent: 2, 3, 4, 5, 6, then 7
  columns from mobile through `2xl`.
- Responsive image `sizes` values must match the actual rail or grid layout.
- A grid must not create document-level horizontal overflow.

## Vertical rhythm

Use these existing relationships as the default:

- Eyebrow to heading: 12px
- Heading to supporting copy: 12–20px
- Supporting copy to primary actions: 24–32px
- Page heading to a major control such as search: 40px
- Major control or heading group to a results grid: 48px
- Poster to card title: 12px
- Card title to metadata: 4px
- Separate major home content sections by approximately 64px.

Avoid stacking padding and margin that accidentally doubles the intended gap.

## Controls and touch targets

- Every interactive control must expose at least a 44×44px target. The visible
  icon may be smaller, but the clickable area may not be.
- Mobile bottom-navigation controls remain 48×48px.
- Related controls use an 8–12px gap. Segmented controls may use a 4px internal
  inset around their options.
- Pill-button labels should remain on one line. At widths below 360px, reduce
  horizontal padding, gap, or font size before allowing a label to wrap.
- If compact sizing cannot preserve readability, stack actions vertically
  instead of shrinking them below the minimum touch target.

## Fixed and overlay UI

- Fixed mobile navigation requires sufficient page-bottom padding so the final
  content cannot be obscured. The current app shell uses 112px (`pb-28`).
- Toasts and alerts must clear the mobile navigation, but should return to a
  normal 24px edge offset on `sm` and larger screens.
- Modals must fit within the viewport, scroll internally, preserve at least 24px
  mobile content padding, and keep the final action clear of the bottom edge.
- Fixed headers must not overlap the first page heading or hero controls.

## Authentication and compact screens

- Authentication surfaces use 20px outer page gutters.
- Use 24px card padding below 360px, 28–32px at normal mobile widths, and 40px
  from `sm` upward.
- Primary and secondary authentication actions should remain single-line and
  at least 48px tall at 320px width.
- Compact screens may scroll vertically; they must not clip actions or footer
  content.

## Implementation rules

- Prefer shared component variants for layout differences. For example, a
  media card should expose explicit `grid` and `rail` behavior instead of
  relying on parent-specific CSS accidents.
- Keep spacing in Tailwind classes near the affected component. Add global CSS
  only for a genuinely global primitive.
- Do not change typography, card sizing, or padding in isolation when that
  change alters surrounding alignment at another breakpoint.
- Preserve keyboard focus visibility and disabled states while adjusting
  spacing or target size.

## Required visual verification

For changes that affect layout or reusable UI, verify at least these viewports:

- 320×568 compact mobile
- 390×844 standard mobile
- 768×800 tablet
- 1024×768 small desktop
- 1280×720 desktop breakpoint edge
- 1440×900 standard desktop
- 1920×1080 wide desktop

Exercise Home, Explore, My List, populated and empty states, the detail modal,
sign-in, and restricted-access screens when those surfaces are affected.

Before finishing, confirm:

- Grid gutters equal their declared value and cards never overlap.
- `document.documentElement.scrollWidth` does not exceed `clientWidth`.
- Pill labels do not wrap unexpectedly at 320px.
- Interactive targets are at least 44×44px.
- Fixed navigation, dialogs, and alerts do not obscure content.
- There are no new browser console errors or warnings.
- `pnpm run format`, `pnpm run lint`, `pnpm run typecheck`, and
  `pnpm run build` pass.
