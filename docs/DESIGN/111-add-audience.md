# Design: Add Audience

## Issue
#111/#117 — Add Audience (加入观众席)

## Architecture

A new `audience` module manages ~25 spectator positions, a global `cheer_level` counter, and per-spectator pose queries. Rendering hooks into the existing `render` object. Integration points in `main.js` trigger cheer at point/violation/rally events.

### Module Dependencies

```
audience.js   → depends on: constants.js (COURT_LENGTH, COURT_WIDTH, CHEER_DURATION, RALLY_CHEER_THRESHOLD)
render.js     → depends on: camera.js (project, draw_char), audience.js (spectator data)
main.js       → depends on: audience.js (cheer, update), render.js (audience rendering)
```

### Data Structures

**Spectator object:**
```
{
  x: number,      // world x-coordinate (outside court bounds)
  z: number,      // world z-coordinate (outside court bounds)
}
```
Positions are generated once in `audience.init()` and never moved.

**Global state in audience module:**
```
{
  spectators: Spectator[],  // array of ~25 spectator positions
  cheer_level: number,      // frames remaining in cheer (0 = idle)
}
```

### Spectator Placement

~25 spectators distributed around the court perimeter:
- **Near sideline** (z < 0): rows at z = -2, z = -4, clustered left/right of center
- **Far sideline** (z > COURT_LENGTH + 2): rows at z = COURT_LENGTH + 2, COURT_LENGTH + 4
- **Left sideline** (x < -(COURT_WIDTH/2 + 1)): clustered along x = -(COURT_WIDTH/2 + 2) to -(COURT_WIDTH/2 + 4)
- **Right sideline** (x > COURT_WIDTH/2 + 1): clustered along opposite side

Each position includes ±0.3m random jitter for natural variety.

### Rendering

**Idle pose:** ` O ` (3 chars: space, capital O, space) — rendered at y=0 (ground level)

**Cheer pose:** `\o/` (3 chars: backslash, lowercase o, forward slash) — rendered at y=0

**Color:**
- Idle: `#fff` (white)
- Cheering: `#ff0` (yellow)

Each spectator renders as 3 characters via `camera.draw_char()` from left offset (-0.3, 0, z), center (x, 0, z), right offset (x+0.3, 0, z). This allows the arms `\` and `/` to flank the head `o`.

**Rendering order (in `draw_game()`):**
1. Court surface & lines
2. Net
3. **Audience** ← new, renders after net but before players
4. Ball
5. Players
6. Referee
7. HUD, scores, messages

### Cheer Triggers

| Event | Trigger Point | Effect |
|-------|--------------|--------|
| Point scored | `resolve_point()` in main.js:117 | `audience.cheer()` |
| Violation replay | `resolve_violation_point()` in main.js:137 | `audience.cheer()` |
| Rally >= 5 hits | `update_playing()` in main.js, after `rally_hits += 1` | `audience.cheer()` on threshold crossing |

**Cheer behavior:**
- `audience.cheer()` sets `cheer_level = CHEER_DURATION` (60 frames ≈ 1s at 60fps)
- `audience.update()` decrements `cheer_level` each frame, clamped to ≥ 0
- `audience.get_pose(i)` returns `["\\", "o", "/"]` if `cheer_level > 0`, else `[" ", "O", " "]`
- All spectators cheer simultaneously (single global `cheer_level`)

### Constants

```
CHEER_DURATION = 60          // frames (~1s at 60fps)
RALLY_CHEER_THRESHOLD = 5    // rally hits to trigger cheer
AUDIENCE_COUNT = 25          // number of spectators
```

### Integration Points (main.js)

1. `resolve_point()` — after `scoring.award_point()`, add `audience.cheer()`
2. `resolve_violation_point()` — before referee_state setup, add `audience.cheer()`
3. `update_playing()` — after `rally_hits += 1`, if `rally_hits >= RALLY_CHEER_THRESHOLD`, add `audience.cheer()`
4. `gameLoop()` — add `audience.update()` before `draw_game()`
5. `draw_game()` — add `render.audience(audience)` after `render.net()` and before ball/player rendering

### Performance

- 25 spectators × 3 `draw_char` calls each = 75 character draws per frame
- No per-frame allocations in hot path
- `get_pose()` returns references to static arrays
- All positions pre-computed in `init()`
