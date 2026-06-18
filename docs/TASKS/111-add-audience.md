# Tasks: Add Audience

## Parent Issue
#111

## Plan Issue
#117

## Related Modules
- `src/audience.js` (new) — audience data and state management
- `src/render.js` — `render.audience(ctx, audience)` rendering function
- `src/main.js` — hook audience.cheer() into resolve_point(), resolve_violation_point(); call audience.update() in gameLoop; call render.audience() in draw_game()
- `src/constants.js` — add CHEER_DURATION, AUDIENCE_COUNT, AUDIENCE_POSITIONS or related constants
- `tests/audience.test.js` (new) — unit tests for audience module

## Summary
Add ASCII-art spectators around the court perimeter who cheer on good plays (points won, violations, long rallies). Pure visual/atmospheric feature with no gameplay impact. Plan issue #117 already defines the phased breakdown.

## Impact Analysis

| Module | Impact |
|--------|--------|
| `src/audience.js` (new) | Audience data structure: positions, cheer_level, init/update/cheer/get_pose |
| `src/render.js` | New `render.audience()` function; insert call into `draw_game()` |
| `src/main.js` | Hook audience.cheer() into resolve_point, resolve_violation_point; audience.update() in gameLoop; audience render in draw_game |
| `src/constants.js` | Add CHEER_DURATION, AUDIENCE_COUNT, cheering thresholds |
| `tests/audience.test.js` (new) | Unit tests for all audience module functions |

## Phases

### Phase 1: Tests (TDD)
- [ ] Write `tests/audience.test.js`:
  - `audience.init()` creates N spectators at valid perimeter positions
  - Spectator positions are outside court bounds (x < -COURT_WIDTH/2 or x > COURT_WIDTH/2 or z < -1 or z > COURT_LENGTH + 1)
  - `audience.update()` transitions cheer level from >0 down to 0 over CHEER_DURATION frames
  - `audience.cheer()` sets cheer_level to CHEER_DURATION
  - `audience.get_pose(spec)` returns `\o/` when cheering, ` O ` when idle
  - Audience cheer on rally threshold (e.g., 5+ hits)

### Phase 2: Data Structures
- [ ] Create `src/audience.js`:
  - `audience.init()` — generate ~25 spectators around court perimeter
  - Each spectator: `{ x, z, offset_x, offset_z }` with small random position variation
  - `cheer_level` scalar (frames remaining, 0 = idle)
  - `CHEER_DURATION` constant (~60 frames)
  - `RALLY_CHEER_THRESHOLD` constant (~5 hits)
  - Positions distributed: near sideline, far sideline, left/right sidelines

### Phase 3: Core Logic
- [ ] `audience.cheer()` — set `cheer_level` to `CHEER_DURATION`
- [ ] `audience.update()` — decrement `cheer_level` each frame, clamp to 0
- [ ] `audience.get_pose(i)` — return `["\\", "o", "/"]` if cheering else `[" ", "O", " "]`
- [ ] Hook into `main.js`:
  - Call `audience.cheer()` in `resolve_point()`
  - Call `audience.cheer()` in `resolve_violation_point()`
  - Call `audience.cheer()` in game loop when `rally_hits >= RALLY_CHEER_THRESHOLD` (on threshold crossing)
  - Call `audience.update()` in `gameLoop()` each frame

### Phase 4: UI/Output
- [ ] Add `render.audience(audience)` in `src/render.js`:
  - For each spectator, project (x, 0, z) using `camera.project()`
  - If visible (within screen bounds), draw pose characters via `camera.draw_char()`
  - Use `ctx.fillStyle = '#fff'` for idle, `'#ff0'` (yellow) for cheering
  - Insert `render.audience(audience)` call in `draw_game()` after `render.net()` and before `render.player()`
