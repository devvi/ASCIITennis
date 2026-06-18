# Audience Module Design

## Data Module: `src/audience.js`

### Data Structures
- `spectators`: Array of `{ x, z, offset_x, offset_z }` objects
  - Positions distributed around court perimeter:
    - Near sideline (z from 0 to COURT_LENGTH, x = ±COURT_WIDTH/2 - 1.5)
    - Far end (z = COURT_LENGTH + 1.5, x from -COURT_WIDTH/2 to COURT_WIDTH/2)
    - Behind baseline (z = -1.5, x from -COURT_WIDTH/2 to COURT_WIDTH/2)
  - Each position has small random offset for visual variety
- `cheer_level`: number (frames remaining, 0 = idle)
- Constants: `CHEER_DURATION = 60`, `RALLY_CHEER_THRESHOLD = 5`

### API
- `audience.init()` - generate spectators, reset cheer_level
- `audience.cheer(t)` - set cheer_level to CHEER_DURATION
- `audience.update()` - decrement cheer_level each frame, clamp to 0
- `audience.get_pose(i)` - return `["\\", "o", "/"]` if cheering, `[" ", "O", " "]` if idle

## Integration

### main.js
- Import audience
- Call `audience.init()` in `init_game()`
- Call `audience.cheer()` in `resolve_point()`, `resolve_violation_point()`
- Call `audience.cheer()` when `rally_hits >= RALLY_CHEER_THRESHOLD` (on threshold crossing)
- Call `audience.update()` in `gameLoop()` each frame

### render.js
- Add `render.audience(audience)` method
- For each spectator, project (x, 0, z) using `camera.project()`
- If visible, draw pose characters via `camera.draw_char()`
- Color: `#fff` for idle, `#ff0` for cheering
- Call `render.audience(audience)` in `draw_game()` after `render.net()` and before `render.player()`
