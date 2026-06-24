# Task Breakdown: Add Audience / Spectators

**Issue:** #111
**Related modules:** `src/court.js` (position boundaries), `src/render.js` (rendering), `src/main.js` (trigger points), `src/constants.js` (config), `src/camera.js` (projection)

## Impact Summary

| Module | Impact | Description |
|--------|--------|-------------|
| `src/constants.js` | Add 2 constants | `AUDIENCE_COUNT`, `AUDIENCE_CHEER_DURATION` |
| `src/court.js` | Low | Audience positions derived from court bounds |
| `src/render.js` | New `audience()` method | Draw spectator figures using camera projection |
| `src/main.js` | +state in game state | Add audience object, trigger on point scored |
| `src/camera.js` | None | Reuse existing `project()` and `draw_char()` |

## Plan

Research complete — see `docs/PRD/111-add-audience.md` for requirements.

**PLAN_ISSUE:** #117

### Phase 1: Tests (TDD)
- Write `tests/audience.test.js`:
  - `audience.init()` creates N spectators at valid perimeter positions
  - Spectator positions are outside court bounds (|x| > COURT_WIDTH/2 or z < 0 or z > COURT_LENGTH)
  - `audience.update()` transitions cheer level from >0 down to 0 over CHEER_DURATION frames
  - `audience.cheer()` sets cheer level to max
  - `audience.get_pose(spec)` returns `\o/` or `o/_` based on cheer state
  - All spectators render within screen coordinates after projection

### Phase 2: Data structures
- Create `src/audience.js`:
  - `audience.init()` — generate positions around court perimeter
  - Position list with x, z coordinates + random variation
  - `cheer_level` timer (frames remaining for cheer)
  - Each spectator has `state`: idle or cheering

### Phase 3: Core logic
- `audience.cheer(t)` — set cheer_level to CHEER_DURATION
- `audience.update()` — decrement cheer_level each frame, clamp to 0
- `audience.get_pose(i)` — return idle or cheer character based on cheer_level > 0
- Hook into `main.js`:
  - Call `audience.cheer()` in `resolve_point()`
  - Call `audience.cheer()` in `resolve_violation_point()`
  - Call `audience.update()` each frame in game loop

### Phase 4: UI / rendering
- Add `render.audience(ctx, audience)` in `src/render.js`:
  - For each spectator, project (x, 0, z) using `camera.project()`
  - If visible (on screen), draw the pose characters
  - Insert render call after net but before players/ball in `draw_game()`
