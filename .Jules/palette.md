## 2026-10-15 - Hover-only poster actions disappear on touch

**Learning:** The poster save button was hidden with `sm:opacity-0` and revealed on `group-hover`. Any viewport at least 640px wide that cannot hover — a phone in landscape, a tablet — kept the control invisible. It still occupied the corner hit target, so the action felt missing.

**Action:** Hide hover-revealed controls only under `pointer-fine`, and include the title in an icon button's accessible name when several of them sit in one list.

## 2026-10-15 - Dialog focus lands on an unmarked close control

**Learning:** Title and trailer dialogs call `.focus()` on an icon-only glass close button that sits on photography. Without an explicit `focus-visible` ring, keyboard users who open those dialogs cannot see where focus went.

**Action:** Any control that receives initial focus in a dialog or lightbox needs `focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none` alongside its `aria-label`. Use `ring-inset` when the control sits inside `overflow-hidden`.
