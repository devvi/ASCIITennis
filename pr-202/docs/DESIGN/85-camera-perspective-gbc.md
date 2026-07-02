# Issue 85: 重构视角 — Camera Perspective Refactor (Mario Tennis GBC) — Design

## Architecture: Steep Overhead Camera (GBC-style)

Issue #75 introduced the pitch-rotated camera infrastructure (`CAM_PITCH` in `camera.project()`). This issue **tunes that same infrastructure** to match the Mario Tennis GBC overhead perspective (~40° downward) and updates player rendering to read well from above.

The render pipeline remains unchanged — only camera parameters and player figure characters are modified.

### Camera Parameter Changes

```
Current (Issue 75)              GBC Style (Issue 85)
────────────────────             ────────────────────
CAM_PITCH = -0.15  (~8.6°)  →   CAM_PITCH = -0.6  (~34°)
CAM_HEIGHT = 4                 →   CAM_HEIGHT = 10
CAM_Z = -5                     →   CAM_Z = -6
HORIZON_Y = 15                 →   HORIZON_Y = 25 (tuned)
```

With a steeper pitch and higher elevation:
- The **entire court** (both baselines, net, service boxes) is clearly visible
- The **landing marker `X`** is readable on the opponent's side
- The **ball arc** is visible from above (ball `O` + shadow `@`)
- The near (player) court is not overly compressed

### Player Figure Redesign (Top-Down)

Current side-profile (`/`, `|`, `+`) looks unnatural from a steep overhead angle. Redesign for GBC-style readability:

```
Current (side view):           GBC Style (top-down):
    O  (head)                      O  (head)
    /  (torso/arm)                 _  (shoulders)
    |  (body)                      .  (body/torso)
    +  (legs)                      :  (legs)
```

The racket arm is drawn separately as `\` or `/` beside the body when hitting.

### Module Changes

#### `src/constants.js`
- `CAM_PITCH`: `-0.15` → `-0.6` (tunable between -0.5 and -0.7)
- `CAM_HEIGHT`: `4` → `10` (tunable between 8–12)
- `CAM_Z`: `-5` → `-6` (tunable)
- `HORIZON_Y`: `15` → tuned value (starting at `25`)

#### `src/render.js` — Player figure update
- `drawPlayerFigure()`: replace body characters with overhead-friendly shapes
- Racket arm: unchanged logic, just character adjustment
- Shadow/baseline indicator: keep existing `camera.draw_char(p.x, 0.01, p.z, 'O')` for ground shadow

#### `tests/camera.test.js`
- Update projection test expectations to match new `CAM_PITCH`, `CAM_HEIGHT`, `CAM_Z`, `HORIZON_Y`
- Add test: GBC-style pitch maps full court (both baselines) to visible screen coordinates

#### `tests/render.test.js`
- Update if player figure character expectations change (currently only checks `fillText` was called, not character values — may not need changes)

### Data Flow (unchanged)

```
game loop
  → update() [unchanged]
  → beginFrame()
  → camera.init() [reads new constants]
  → render.court() [unchanged, uses new projection]
  → render.player() [updated figure chars]
  → render.ball() [unchanged]
  → render.net() [unchanged]
```

No changes to `main.js`, `ball.js`, `player.js`, `ai.js`, `input.js`, `court.js`, or `scoring.js`.

### Tuning Strategy

1. Set `CAM_PITCH = -0.6`, `CAM_HEIGHT = 10`, `CAM_Z = -6`, `HORIZON_Y = 25`
2. Verify both baselines are visible and court fills the screen
3. Verify the landing marker `X` is readable on the AI side
4. Verify player figures look natural from above
5. Adjust constants if the near court is too compressed or the far court is clipped
6. Finalize and update test expectations
