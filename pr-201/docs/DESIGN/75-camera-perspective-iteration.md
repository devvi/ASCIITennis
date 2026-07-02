# Issue 75: 视角迭代 — Camera Perspective Iteration — Design

## Architecture: Pitch-rotated Perspective Camera

The existing first-person camera projects 3D world points to 2D screen coordinates using a simple pinhole model. This design adds a **pitch rotation** around the camera's x-axis, tilting the view downward so more of the opponent's court surface is visible.

### Coordinate Systems

```
World space:
  x: left(-) / right(+)  (width)
  y: up(+) / down(-)      (height)
  z: forward (0 = human baseline, COURT_LENGTH = AI baseline)

Camera space:
  After translation: dx = x, dy = y - CAM_HEIGHT, dz = z - CAM_Z
  After pitch rotation: apply Rx(pitch) to (dy, dz)
  Perspective divide: scale = FOCAL / dz_rot
  Screen space: sx = SCREEN_W/2 + dx * scale, sy = HORIZON_Y - dy_rot * scale
```

### Math: Pitch Rotation (Rx)

Rotating around the camera's x-axis by angle `pitch`:

```
dy_rot = dy * cos(pitch) - dz * sin(pitch)
dz_rot = dy * sin(pitch) + dz * cos(pitch)
```

- A **negative pitch** (look down): points far away (large `dz`) get a positive `dy_rot` boost, pushing them upward on screen → more of the opponent's court visible.
- `pitch = 0` → identical to current projection (backward compatible).
- `pitch > 0` → look up (sky), not useful for gameplay.

### Module Changes

#### `src/constants.js`
- Add: `CAM_PITCH = -0.15` (radians, ~8.6° downward tilt). Tunable.

#### `src/camera.js` — Pitch integration
- `camera.init(pitch)` — store `this.pitch`. Defaults to `CAM_PITCH` from constants if not provided.
- `camera.project(x, y, z)` — insert pitch rotation step between translation and perspective divide:
  1. `dx = x`
  2. `dy = y - CAM_HEIGHT`
  3. `dz = z - CAM_Z`
  4. Apply Rx(pitch) to `dy`, `dz` → `dy_rot`, `dz_rot`
  5. If `dz_rot <= 0.01`, return null (behind camera)
  6. `scale = FOCAL / dz_rot`
  7. `sx = SCREEN_W/2 + dx * scale`
  8. `sy = HORIZON_Y - dy_rot * scale`
  9. Return `{ sx, sy, scale }`

#### `tests/camera.test.js` — Test updates
- Add test: `camera.init()` stores pitch
- Add test: zero pitch matches current output
- Add test: negative pitch shifts far-court points upward
- Add test: negative pitch shifts horizon line downward
- Add test: positive pitch shifts far-court points downward (mirror)
- Existing tests remain after updating `camera.init()` call if needed

### Data Flow (unchanged outside camera)

```
game loop
  → update() [unchanged]
  → beginFrame()
  → camera.draw_char/line (unchanged API, pitch handled inside project())
  → render functions (unchanged)
```

No changes to `render.js`, `main.js`, `ball.js`, `player.js`, `ai.js`, `input.js`, `court.js`, or `scoring.js`.

### Tuning Strategy

Start with `CAM_PITCH = -0.15`. The value should be steep enough to reveal the landing zone `X` clearly on the AI side, but not so steep that the near court (player's side) is compressed or the first-person feel is lost.
