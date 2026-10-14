## 2026-09-20 - Featured carousel pause must survive Embla resume

**Learning:** The featured carousel autoplays with `stopOnInteraction: false` and `stopOnMouseEnter: true`. Touch users never hover, so nothing pauses the slides. Calling `autoplay.stop()` is also not sticky: mouse leave and focus leaving the carousel call `startAutoplay()` again, and `stop()` is a no-op during the `autoplay:play` event because playback is not marked active until that handler returns.

**Action:** Keep an explicit paused flag outside the plugin. Re-stop on a microtask after `autoplay:play`, and treat reduced motion as paused so hover cannot restart it.
