## 2026-10-15 - Dialog focus lands on an unmarked close control

**Learning:** Title and trailer dialogs call `.focus()` on an icon-only glass close button that sits on photography. Without an explicit `focus-visible` ring, keyboard users who open those dialogs cannot see where focus went.

**Action:** Any control that receives initial focus in a dialog or lightbox needs `focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none` alongside its `aria-label`. Use `ring-inset` when the control sits inside `overflow-hidden`.
