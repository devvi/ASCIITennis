# Issue 90: 图形优化 — Court Surface Tearing — Tasks

PLAN_ISSUE: TBD (will be created during /plan phase)

## Related Modules

- `src/render.js` — `drawCourtSurface()` (line 36) and `drawServiceBoxes()` (line 56) — replace Z-step scanline with filled polygon
- `tests/render.test.js` — verify `fillRect` is called with solid coverage

## Impacts

- `drawCourtSurface()` will call `ctx.fill()` instead of multiple `ctx.fillRect()` calls
- `drawServiceBoxes()` will similarly use `ctx.fill()` for each half
- No changes to any other module

---

## Phase 1: Tests (TDD)

Write test cases that verify the court surface renders without gaps:

- Project the 4 court corners and verify they form a valid quadrilateral
- Verify `fillRect` calls (or `fill` calls) cover the full court screen area
- Verify `drawServiceBoxes()` covers both halves without gaps

**Files:** `tests/render.test.js`

---

## Phase 2: Court Surface Fill

Modify `drawCourtSurface()` in `src/render.js`:

- Project the 4 corners of the court rectangle `[(-W/2,0,0), (W/2,0,0), (W/2,0,L), (-W/2,0,L)]`
- Use `ctx.beginPath()`, `ctx.moveTo()`, `ctx.lineTo()`, `ctx.closePath()`, `ctx.fill()` to draw a solid filled quadrilateral
- Remove the Z-step scanline loop entirely

---

## Phase 3: Service Box Fill

Modify `drawServiceBoxes()` in `src/render.js`:

- For each half [0, mid] and [mid, L], project the 4 corners and fill as a quadrilateral
- Remove the Z-step scanline loop

---

## Phase 4: Verification

- Run all tests: `npm test`
- Verify no visual tearing in court or service boxes
- Confirm no regressions in any other render output
