# Design: Add Audience / Spectators

**Issue:** #111
**Feature:** ASCII-art audience figures around the court perimeter that react to gameplay.

## Architecture

### Module: `src/audience.js` (new)

A standalone state object holding an array of spectator positions and a global cheer timer.

```
audience = {
  spectators: [{ x, z }, ...],   // 20-30 positions around court perimeter
  cheer_level: 0                  // remaining frames of cheer animation; 0 = idle
}
```

### Coordinate System

- Spectators are placed in world space (x, z) around the doubles court bounds.
- Perimeter bands:
  - **Behind near baseline:** `z ∈ [-1.5, -0.5]`, `x ∈ [-COURT_WIDTH/2 - 1, -COURT_WIDTH/2 - 0.5]` (left sideline) and `x ∈ [COURT_WIDTH/2 + 0.5, COURT_WIDTH/2 + 1]` (right sideline)
  - **Behind far baseline:** `z ∈ [COURT_LENGTH + 0.5, COURT_LENGTH + 1.5]`, same x offsets as near baseline
  - **Along sidelines:** `x ∈ [-COURT_WIDTH/2 - 1.5, -COURT_WIDTH/2 - 0.5]` and `x ∈ [COURT_WIDTH/2 + 0.5, COURT_WIDTH/2 + 1.5]`, `z ∈ [0, COURT_LENGTH]`
- Positions have slight random jitter (±0.3m) for natural variety.
- All spectators sit on the ground plane (y = 0).

### Data Structures

```js
// In src/audience.js
const DEFAULT_COUNT = 24;
const CHEER_DURATION = 75;  // frames (~1.25s at 60fps)

audience.init(count = DEFAULT_COUNT)
  // Generate `count` positions around court perimeter.
  // Populate this.spectators = [{ x, z }, ...]
  // Set this.cheer_level = 0

audience.cheer()
  // Set this.cheer_level = CHEER_DURATION
  // Called when a point is scored.

audience.update()
  // Decrement this.cheer_level by 1, clamp to 0.

audience.get_pose(i)
  // Return \{ idle_char, cheer_char \}
  // If cheer_level > 0: { body: '\\o/', legs: ' - ' }  (cheering)
  // Else:              { body: ' O ', legs: ' _ ' }    (idle)
```

### Pose/Character Design

Each spectator is 2 lines tall:
```
 O     ← head/body (idle)
 _     ← legs (idle)
```
vs
```
\o/   ← arms raised (cheer)
 -    ← body/legs (cheer)
```

### Rendering Integration (`src/render.js`)

Add `render.audience(ctx, audience)` method:
1. For each spectator `{ x, z }`:
   - Project `(x, 0, z)` using `camera.project()`
   - If projection returns non-null and `sx, sy` are within screen bounds:
     - Use `camera.draw_char(x, 0, z, pose_line1_char)` for line 1
     - Use `camera.draw_char(x, 0.5, z, pose_line2_char)` for line 2
     - Actually draw both characters at the same projected position but offset on sy by one character height for line 2

Actually, simpler: project once, then draw two characters offset vertically by ~7px (font height).

Insert call in `draw_game()` right after `render.net()` and before `render.ball()`.

### Integration with Scoring (`src/main.js`)

In `resolve_point(winner)` (line ~116):
- After existing logic, call `audience.cheer()`

In `resolve_violation_point(violation_type, hitter)` (line ~137):
- After existing logic, call `audience.cheer()`

In the game loop (`gameLoop()` or the state dispatch):
- Call `audience.update()` each frame (ideally in a state-agnostic position, e.g., before or after `input.update()`).

### Constants (`src/constants.js`)

Add:
```js
AUDIENCE_COUNT = 24
AUDIENCE_CHEER_DURATION = 75
```

## Module Impact Matrix

| Module | Change | Description |
|--------|--------|-------------|
| `src/constants.js` | +2 constants | `AUDIENCE_COUNT`, `AUDIENCE_CHEER_DURATION` |
| `src/audience.js` | New file | Audience state, init, update, cheer, get_pose |
| `src/render.js` | +1 method | `render.audience(ctx, audience)`, insert in draw_game() |
| `src/main.js` | +import, +state, +calls | Import audience, add `audience_obj` state, call .cheer() in resolve_point/resolve_violation_point, call .update() in game loop |
| `src/camera.js` | None | Reuse existing `draw_char()` and `project()` |

## Test Plan

- `tests/audience.test.js`:
  - `audience.init()` creates N spectators at valid perimeter positions
  - Spectator positions are outside court bounds
  - `audience.update()` transitions cheer level from >0 down to 0
  - `audience.cheer()` sets cheer level to max
  - `audience.get_pose(i)` returns cheer or idle based on state
  - All spectators render within screen coordinates after projection
