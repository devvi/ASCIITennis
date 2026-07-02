# Design: CRT Visual Effect (CRT视觉效果)

**Parent Issue:** #192

## Architecture Overview

The CRT effect is implemented as a pure CSS overlay on top of the game canvas. No changes to the JavaScript game loop are required. The overlay sits in an absolutely-positioned `div` that covers the canvas exactly, using `pointer-events: none` to pass all input through to the canvas underneath.

### Layer Stack

```
Game canvas (#000 background)
  └─ CRT overlay div (pointer-events: none)
       ├─ Scanlines (repeating-linear-gradient)
       ├─ Vignette (radial-gradient)
       └─ [Stretch] Curvature (CSS perspective transform)
```

### Data Flow

```
index.html
  └─ <div id="crt-overlay">
       └─ CSS pseudo-elements ::before (scanlines), ::after (vignette)
          └─ pointer-events: none → passes through to <canvas>
```

### Module Impact

| Module | Changes |
|---|---|
| `index.html` | Add `<div id="crt-overlay">` after the canvas, link `styles.css` |
| `src/styles.css` (new) | All CRT overlay CSS: scanlines, vignette, stretch effects |

## Phase 1: Tests

No automated tests needed — CRT effect is a pure visual overlay with no game logic. Manual visual verification required.

## Phase 2: CSS/HTML Setup

- Create `src/styles.css` with CRT overlay CSS classes
- Add overlay HTML structure in `index.html`

## Phase 3: Core Implementation

- Scanlines: `repeating-linear-gradient` with alternating transparent/dark rows
- Vignette: `radial-gradient` with darkening at screen corners
- Ensure overlay covers canvas at all window sizes
- Ensure `pointer-events: none` so game input passes through

## Phase 4: Stretch Effects (Optional)

- Screen curvature via CSS `perspective()` + `rotateX`/`rotateY`
- Chromatic aberration via CSS `filter` (drop-shadow or SVG filter)
- Phosphor glow on bright elements
