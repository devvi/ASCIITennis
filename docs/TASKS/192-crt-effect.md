# Task Breakdown: CRT Visual Effect

**Issue:** #192
**Related modules:** `index.html`, `src/styles.css` (new)

## Research Summary

### Current Rendering Pipeline

| Aspect | Detail |
|--------|--------|
| Canvas size | 240×136 px, scaled 4× via `ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)` |
| Render loop | `requestAnimationFrame(gameLoop)` → `beginFrame()` → draw calls → `requestAnimationFrame(gameLoop)` |
| Canvas element | `<canvas id="game">` in `index.html`, fills screen via CSS flexbox centering |
| Text rendering | Monospace "Courier New", 7px font, drawn with `ctx.fillText` |
| Background | `#111` on body, `#000` cleared each frame on canvas |

### CRT Effect Approach

CSS overlay is the recommended approach — simple, performant, no game loop changes:
- **Scanlines**: `repeating-linear-gradient` creating 4px-tall alternating dark rows
- **Vignette**: `radial-gradient` darkening corners
- **Curvature** (stretch): CSS `perspective()` transform
- **Chromatic aberration** (stretch): CSS `filter: drop-shadow()` or SVG filter
- **Phosphor glow** (stretch): CSS `filter: drop-shadow()`

This requires no changes to the game's JavaScript rendering code and maintains full performance.

## Implementation Plan

### Phase 1: Tests
No test changes needed — CRT effect is a pure visual overlay with no game logic. Manual visual verification required.

### Phase 2: CSS/HTML setup
- Create `src/styles.css` with CRT overlay CSS classes
- Update `index.html` to include overlay div and link CSS

### Phase 3: Core implementation
- Implement scanlines overlay using CSS `repeating-linear-gradient`
- Implement vignette overlay using CSS `radial-gradient`
- Ensure overlay covers the canvas correctly at all window sizes
- Ensure pointer events pass through the overlay (`pointer-events: none`)

### Phase 4: Stretch effects (optional)
- Add screen curvature via CSS `perspective()` transform
- Add chromatic aberration via CSS `filter`
- Add phosphor glow effect

## Plan Issue Reference

**PLAN_ISSUE:** #192

### Phase 1: Tests
- [ ] No test changes needed — visual effect only

### Phase 2: CSS/HTML setup
- [ ] Create `src/styles.css` with CRT overlay CSS classes
- [ ] Update `index.html` to include overlay div and link CSS

### Phase 3: Core implementation
- [ ] Implement scanlines overlay (`repeating-linear-gradient`)
- [ ] Implement vignette overlay (`radial-gradient`)
- [ ] Verify overlay alignment with canvas at various window sizes
- [ ] Verify pointer-events pass through overlay

### Phase 4: Stretch effects (optional)
- [ ] Add screen curvature effect (CSS perspective transform)
- [ ] Add chromatic aberration effect
- [ ] Add phosphor glow effect
