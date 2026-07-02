# Task Breakdown: CRT Visual Effect (CRT视觉效果)

**Issue:** #186
**Related modules:** `index.html`, `src/styles.css` (new), `src/main.js`

## Research Summary

### Current Rendering Pipeline

| Aspect | Detail |
|--------|--------|
| Canvas size | 240×136 px, scaled 4× via `ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)` |
| Render loop | `requestAnimationFrame(gameLoop)` → `beginFrame()` → draw calls → `requestAnimationFrame(gameLoop)` |
| Canvas element | `<canvas id="game">` in `index.html`, fills screen via CSS flexbox centering |
| Text rendering | Monospace "Courier New", 7px font, drawn with `ctx.fillText` |
| Background | `#111` on body, `#000` cleared each frame on canvas |

### CRT Effect Feasibility

The game canvas is 240×136 logical pixels, scaled 4× via canvas transform. This means effects can be applied either:

1. **CSS overlay** — simple, performant, no game loop changes
   - Scanlines: `repeating-linear-gradient` or SVG pattern
   - Vignette: `radial-gradient` 
   - Curvature: CSS `transform: perspective()` + `rotateX`/`rotateY`
   - Chroma: CSS `filter: url()` with feColorMatrix or SVG filter

2. **Canvas post-processing** — more control but heavier
   - Read back canvas pixels, apply effects, draw result
   - Would need a second canvas or offscreen canvas

The recommended approach is **CSS overlay** for scanlines + vignette (core effects), with optional CSS transforms for curvature. This requires no changes to the game's JavaScript rendering code and maintains full performance.

### Scanline Pattern

For a 240×136 canvas at 4× scale (960×544 actual):
```
.repeating-linear-gradient(
  0deg,
  transparent 0px,
  transparent 3px,
  rgba(0,0,0,0.15) 3px,
  rgba(0,0,0,0.15) 4px
)
```
This creates 4px-tall alternating dark rows (3px transparent, 1px dark), simulating CRT scanlines. At 4× pixel scale, each logical pixel is 4×4 actual pixels, so the pattern repeats naturally.

### Vignette

```
radial-gradient(
  ellipse at center,
  transparent 60%,
  rgba(0,0,0,0.4) 100%
)
```

## Plan

### Phase 1: Tests
No test changes needed — CRT effect is a pure visual overlay with no game logic. Manual visual verification required.

### Phase 2: Data structures / CSS setup
- Create `src/styles.css` with CRT effect CSS classes
- Add overlay HTML structure in `index.html`

### Phase 3: Core implementation
- Implement scanlines overlay using CSS `repeating-linear-gradient`
- Implement vignette overlay using CSS `radial-gradient`
- Ensure overlay covers the canvas correctly at all window sizes
- Ensure pointer events pass through the overlay (`pointer-events: none`)

### Phase 4: Stretch effects (optional)
- Add screen curvature via CSS `perspective()` / `transform`
- Add chromatic aberration via CSS `filter: drop-shadow()` or SVG filter
- Add phosphor glow on bright elements

## Plan Issue Task Lists

**PLAN_ISSUE:** TBD

### Phase 1: Tests
- [ ] No test changes needed — visual effect only

### Phase 2: Data structures
- [ ] Create `src/styles.css` with CRT overlay CSS classes
- [ ] Update `index.html` to include overlay div and link CSS

### Phase 3: Core implementation
- [ ] Implement scanlines overlay (repeating-linear-gradient)
- [ ] Implement vignette overlay (radial-gradient)
- [ ] Verify overlay alignment with canvas at various window sizes
- [ ] Verify pointer-events pass through overlay

### Phase 4: UI/output (stretch)
- [ ] Add screen curvature effect (CSS perspective transform)
- [ ] Add chromatic aberration effect
- [ ] Add phosphor glow effect
