# Issue 76: 重构视角 — Camera Perspective Refactor — Tasks

PLAN_ISSUE: TBD (will be created during /plan phase)

## Related Modules

- `src/constants.js` — tune `CAM_PITCH`, `CAM_HEIGHT`, `CAM_Z`, `HORIZON_Y`
- `src/camera.js` — verify pitch rotation logic works correctly at steeper angles (clipping, near-plane checks)
- `src/render.js` — update `drawPlayerFigure()` for GBC-style overhead rendering; verify court/net drawing at new angle
- `tests/camera.test.js` — update projection test expectations for new camera parameters
- `tests/render.test.js` — update if court/player rendering coordinates change

## Impacts

- Camera projection uses steeper pitch → all rendered elements shift vertically
- Player rendering characters may need updating for top-down readability
- Ball shadow must remain visible behind the ball
- `camera.draw_char()` and `camera.draw_line()` are unchanged — they call `project()` which handles the new pitch
- No changes to `main.js`, `ball.js`, `player.js`, `ai.js`, `input.js`, `court.js`, or `scoring.js`

---

## Phase 1: Tests (TDD)

Write/update test cases for the new camera parameters:

- `camera.project()` with GBC-style pitch (−0.6 rad) returns valid screen coordinates for both near and far court
- Landmark points (baselines, net, service lines) map to expected screen regions
- Steep pitch does not cause clipping or null-projections for valid court positions
- Player figures render at the expected screen coordinates under the new pitch
- Court surface and lines render correctly at the new perspective
- All existing camera and render tests pass with updated baseline values

**Files:** `tests/camera.test.js`, `tests/render.test.js`

---

## Phase 2: Camera Constants Tuning

Adjust camera constants in `src/constants.js` to match the GBC-style overhead perspective:

- `CAM_PITCH`: change from `-0.15` to `-0.6` (or tuned value between −0.5 and −0.7)
- `CAM_HEIGHT`: increase from `4` to `8`–`12` range
- `CAM_Z`: adjust from `-5` to move camera further back if needed
- `HORIZON_Y`: adjust to position the horizon correctly for the new pitch

---

## Phase 3: Rendering Update

In `src/render.js`:

- Update `drawPlayerFigure()` to use characters that read well from a steep overhead angle:
  - Current body: `/`, `|`, `+` (side-profile) → GBC style: use broader/shorter characters appropriate for top-down
  - Head `O` should be prominent
  - Racket arm should be visible from above
- Ensure `drawCourtSurface()` scanlines still fill correctly at steeper pitch
- Verify `drawNet()` renders cleanly (posts, tape, mesh) at the new angle
- Verify `ball()` rendering (ball `O` + shadow `@`) is clear at the new angle

---

## Phase 4: Visual Tuning & Verification

- Play-test to find the optimal `CAM_PITCH`/`CAM_HEIGHT` balance that:
  - Shows the full court clearly
  - Makes the landing marker readable on both sides
  - Keeps player figures recognizable
  - Maintains performance (no unnecessary scanline loops)
- Verify all tests pass with final values
- Commit with the tuned constants and rendering changes
