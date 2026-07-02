# Issue 90: 图形优化 — Court Surface Tearing — Design

## Architecture

### Current Problem

`drawCourtSurface()` in `src/render.js:36` iterates 80 evenly-spaced Z-steps from `z=0` to `z=COURT_LENGTH`, projecting the left/right court edge points to screen coordinates and drawing a 1-pixel-high `fillRect` strip at each step. Due to perspective projection, near-court (player side) Z-steps map to screen Y positions that are widely spaced, leaving visible horizontal gaps (tearing). The far court appears dense with minimal gaps.

The same problem exists in `drawServiceBoxes()` at line 56, which uses 40 Z-steps per service box half.

### Solution

Replace the Z-step scanline approach with filled quadrilateral polygons for both the court surface and service boxes:

1. **Court surface** — Project the 4 corners of the court rectangle `[(-W/2, 0, 0), (W/2, 0, 0), (W/2, 0, L), (-W/2, 0, L)]` to screen coordinates. Use `ctx.beginPath()` + `ctx.moveTo()` + `ctx.lineTo()` + `ctx.closePath()` + `ctx.fill()` to draw a single filled polygon. This guarantees no gaps because the polygon rasterizer fills all interior pixels.

2. **Service boxes** — For each half `[0, L/2]` and `[L/2, L]`, project the 4 corners and fill as a quadrilateral polygon using the same approach.

### Data Flow

```
render.court()
  → drawCourtSurface()
    → project 4 court corners to screen space
    → ctx.beginPath() + ctx.moveTo() + ctx.lineTo() × 4 + ctx.closePath() + ctx.fill()
  → drawServiceBoxes()
    → for each half [0, mid], [mid, L]:
      → project 4 corners to screen space
      → ctx.beginPath() + ctx.moveTo() + ctx.lineTo() × 4 + ctx.closePath() + ctx.fill()
  → drawCourtLines() (unchanged)
```

### Module Changes

| Module | Change |
|--------|--------|
| `src/render.js` | Replace `drawCourtSurface()` and `drawServiceBoxes()` Z-step loops with filled polygon calls |
| `tests/render.test.js` | Add mocks for `ctx.beginPath`, `ctx.moveTo`, `ctx.lineTo`, `ctx.closePath`, `ctx.fill`; add tests that verify polygon fill calls |
| No other modules | Game logic, physics, AI, scoring, input unchanged |

### Polygon Corner Order

Each quadrilateral is defined using screen-space projected points in clockwise order:

```
project(-W/2, 0, zStart)  → top-left
project( W/2, 0, zStart)  → top-right
project( W/2, 0, zEnd)    → bottom-right
project(-W/2, 0, zEnd)    → bottom-left
```

For the court surface: `zStart = 0`, `zEnd = COURT_LENGTH`.
For near service box: `zStart = 0`, `zEnd = COURT_LENGTH / 2`.
For far service box: `zStart = COURT_LENGTH / 2`, `zEnd = COURT_LENGTH`.

### Y-Clipping

If any projected corner is outside `[HUD_HEIGHT, SCREEN_H)`, the polygon should still be drawn since the canvas `fill()` clips automatically.
