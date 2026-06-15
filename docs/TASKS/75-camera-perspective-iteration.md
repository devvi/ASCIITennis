# Issue 75: Camera Perspective Iteration — Tasks

## Related Modules

- `src/camera.js` — add pitch rotation to `project()`, add `init()` to compute rotation matrix if needed
- `src/constants.js` — add `CAM_PITCH` angle constant
- `tests/camera.test.js` — update projection tests with pitch-affected coordinates; add pitch-specific test cases
- `tests/render.test.js` — update if baseline screen coordinates change due to pitch

## Impacts

- Camera projection now includes a rotation step → all rendered elements shift vertically (more of the far court visible)
- `camera.draw_char()` and `camera.draw_line()` are unaffected — they call `project()` which will use the new pitch
- `render.js` methods are unaffected — they only call camera methods
- No changes to `main.js`, `ball.js`, `player.js`, `ai.js`, `input.js`, `court.js`, or `scoring.js`

---

## Phase 1: Tests (TDD)

Write/update test cases for camera with pitch. Tests must pass after implementation.

- `camera.init()` accepts a pitch angle and stores it
- `camera.project()` with zero pitch behaves identically to current code (backward compatibility)
- `camera.project()` with positive pitch tilts view downward: far-court points map to higher screen y (more visible)
- `camera.project()` with pitch: the horizon line shifts downward
- Negative pitch tilts view upward (mirror of positive)
- All existing camera tests continue to pass after pitch integration

**File:** `tests/camera.test.js`

---

## Phase 2: Constants

- Add `CAM_PITCH` to `src/constants.js` — represents camera pitch in radians (negative = look down, positive = look up)

Initial value to be tuned during development. Suggested starting point: `CAM_PITCH = -0.15` (~8.6° downward tilt).

---

## Phase 3: Core Logic (camera projection)

In `src/camera.js`:

1. Make `camera.init(pitch)` store the pitch angle. If called without argument, default to the constant.
2. In `project(x, y, z)`:
   a. Translate world point relative to camera: `dx = x`, `dy = y - CAM_HEIGHT`, `dz = z - CAM_Z`
   b. Apply pitch rotation around the camera's x-axis:
      ```
      dy_rot = dy * cos(pitch) - dz * sin(pitch)
      dz_rot = dy * sin(pitch) + dz * cos(pitch)
      ```
   c. Use `dz_rot` as depth for perspective divide pre-clipping
   d. Use `dy_rot` for vertical screen coordinate:
      ```
      scale = FOCAL / dz_rot
      sx = SCREEN_W/2 + dx * scale
      sy = HORIZON_Y - dy_rot * scale
      ```

This rotates the view direction so the camera looks more downward, expanding the visible portion of the opponent's court.

---

## Phase 4: Tune & Verify

- Play-test to find the optimal `CAM_PITCH` value that makes the landing marker clearly visible while maintaining a natural feel
- Verify all tests pass with the final value
- Commit with the tuned constant
