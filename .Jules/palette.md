## 2026-10-15 - Hover-only poster actions disappear on touch

**Learning:** The poster save button was hidden with `sm:opacity-0` and revealed on `group-hover`. Any viewport at least 640px wide that cannot hover — a phone in landscape, a tablet — kept the control invisible. It still occupied the corner hit target, so the action felt missing.

**Action:** Hide hover-revealed controls only under `pointer-fine`, and include the title in an icon button's accessible name when several of them sit in one list.
