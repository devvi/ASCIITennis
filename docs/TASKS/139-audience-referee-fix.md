# Task Breakdown: Audience Perspective & Referee Fix (观众席以及裁判优化)

**Issue:** #139
**Related modules:** `src/audience.js` (generation, hit detection), `src/render.js` (audience rendering, referee rendering), `src/camera.js` (projection), `src/ball.js` (fly-out state), `src/main.js` (game flow), `src/scoring.js` (kill points), `src/constants.js` (config), `src/court.js` (bounds)

## Research Summary

### Root Causes Found

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Perspective density | Linear world-z distribution; camera compresses z-range 9.45× at far end | Use inverse projection mapping: given desired even screen-y, compute exact world-z |
| Referee garbled | Body-part offsets (±0.3–0.4m) at z=11.9m produce ≤2px screen separation; head/body overlap | Screen-space ASCII figure (no projection) or 9× larger offsets |
| Referee not visible | `if (state.timer <= 0) return;` guard blocks all states except violation_replay | Remove guard for figure, keep only for violation message |
| Hit detection missing | Feature from PRD #133 never coded; no alive/dead state, no check_hit(), no kill() | Add per-spectator state + methods + BALL_FLYING_OUT state + game flow |
| Ball fly-out missing | Ball jumps directly from BALL_OUT → resolve_violation_point(), no opportunity to continue into audience | Add BALL_FLYING_OUT state that continues physics past court bounds |

### Camera Math Verified

Using exact computation of the inverse projection, sideline seats can be perfectly evenly spaced on screen:
```
d(sy)/dz = -1200 / (0.8776·z + 10.0596)²  (px/m)
At z=0:   -11.86 px/m
At z=23.77: -1.26 px/m
Ratio: 9.45×
```

The inverse formula for z given desired screen-y `sy`:
```
z = ((H - sy)·C - A·FOCAL) / (B·FOCAL - (H - sy)·D)
```
where `{A,B,C,D}` are derived from camera constants and pitch.

### Existing Test Coverage

| Module | Current Tests | Missing Tests |
|--------|--------------|---------------|
| audience.test.js | Init, positions, poses, sorting, cheering | Perspective density, per-spectator state, check_hit, kill, death pose |
| ball.test.js | All current states + replay + serve | BALL_FLYING_OUT state physics and termination |
| scoring.test.js | Point/game/set/match, violation resolution | award_kill() |
| main.test.js | Targeting bounds, violation flow | Kill-cam flow, fly-out → hit → kill → point |
| render.test.js | Court, net, player, ball, HUD, referee | Death pose rendering, kill flash HUD, referee always visible |

## Impact Summary

| Module | Impact | Description |
|--------|--------|-------------|
| `src/constants.js` | Low | Add `KILL_RADIUS`, `KILL_CAM_DURATION`, `BALL_FLYING_OUT`, `SPECTATOR_ALIVE`, `SPECTATOR_DEAD` |
| `src/audience.js` | High | Fix perspective density in `generate_positions()`; add per-spectator `alive`/`dead` state; add `check_hit()`, `kill()` |
| `src/render.js` | High | Fix referee rendering (screen-space or larger offsets, always visible); add death pose rendering; add kill-flash HUD |
| `src/ball.js` | Medium | Add `BALL_FLYING_OUT` state — continue physics post-out, skip bound/net checks |
| `src/main.js` | High | Add `STATE_KILL_CAM`; modify violation flow for fly-out → hit→kill → point_scored |
| `src/scoring.js` | Low | Add `award_kill(s, hitter)` |
| `tests/audience.test.js` | High | Tests for perspective density, per-spectator state, hit detection |
| `tests/render.test.js` | Medium | Tests for referee rendering, death pose |
| `tests/ball.test.js` | Medium | Tests for `BALL_FLYING_OUT` state |
| `tests/scoring.test.js` | Low | Tests for `award_kill()` |
| `tests/main.test.js` | Medium | Tests for kill-cam flow, fly-out → hit → kill → point |

## Plan

### Phase 1: Tests (TDD)

#### 1a. Audience perspective density tests
- `generate_positions()` sideline bank spectators have z values biased toward 0 (near camera) vs. evenly spread
- Ratio of spectators in near half (z < COURT_LENGTH/2) vs. far half is > 1 for sideline banks
- After projection, sideline spectators appear roughly evenly spaced in screen y
- Sideline spectators do not project to screen positions overlapping far court sidelines
- (Optional) Verify spectator screen bounding box does not cover court lines

#### 1b. Referee rendering tests
- Referee char positions (head, body, arms, legs) have minimum screen-space separation ≥ 4px
- Referee is rendered in all states (mock camera projection, check printChar calls)
- Violation message (OUT!, NET!, etc.) still renders during violation replay
- Referee does not render outside screen bounds

#### 1c. Spectator hit detection tests (audience)
- `audience.init()` creates spectators with `alive: true` by default
- `audience.check_hit(x, z)` returns index of nearest alive spectator within `KILL_RADIUS`, or `-1` if none
- `check_hit` ignores dead spectators
- `audience.kill(i)` sets spectator `i` to `alive: false`
- `audience.kill_count` increments on each kill
- `audience.get_pose(i)` returns death pose for dead spectators

#### 1d. Ball fly-out tests
- `ball.update()` with ball past court bounds transitions to `BALL_FLYING_OUT` instead of immediate `BALL_OUT`
- Ball in `BALL_FLYING_OUT` continues physics (gravity, velocity) without bounce/out/net detection
- `BALL_FLYING_OUT` ball stops when y < -10 or z > COURT_LENGTH + 20

#### 1e. Scoring kill tests
- `scoring.award_kill(s, hitter)` increments `s.points[hitter]` by 1
- `award_kill` returns same point/game/set/match result progression as `award_point`
- Multiple kills correctly advance 15→30→40→game

#### 1f. Main game flow tests
- Ball going out and hitting a spectator triggers kill flow (STATE_KILL_CAM)
- Ball going out and missing all spectators falls back to normal violation flow
- `STATE_KILL_CAM` duration matches `KILL_CAM_DURATION`
- After kill-cam, transitions to `STATE_POINT_SCORED`

### Phase 2: Data structures

#### 2a. constants.js additions
```js
export const BALL_FLYING_OUT = "flying_out";
export const KILL_RADIUS = 1.0;
export const KILL_CAM_DURATION = 30;
export const STATE_KILL_CAM = "kill_cam";
```

AUDIENCE_ROWS stays at 4, ROW_SPACING at 0.8 — these are fine for the depth structure. The fix is in the **distribution function** within `generate_positions()`, not in the constants.

#### 2b. audience.js — per-spectator state
- Add `alive: true` default to each spectator in `generate_positions()`
- Add `kill_count: 0` tracking on audience object (separate from `cheer_level`)
- New methods:
  - `kill(i)` — marks spectator `alive: false`, increments `kill_count`
  - `check_hit(x, z)` — iterates alive spectators, returns nearest index within KILL_RADIUS, or -1
  - `get_pose(i)` already exists — will need modification in Phase 4 for death pose

#### 2c. ball.js — BALL_FLYING_OUT state
- In `ball.update()`: If state is `BALL_FLYING_OUT`, apply gravity and air resistance but skip:
  - Bounce/out-of-bounds detection (no `court.is_in_bounds`, no `BALL_OUT` transition)
  - Net collision detection (no `court.hits_net`)
  - Stop simulation when termination conditions: y < -10 or z > COURT_LENGTH + 20 or z < -5
- Ball continues to move with same physics as `BALL_IN_PLAY` but without game-state transitions
- Reuses the same early-return pattern as `BALL_REPLAY`

### Phase 3: Core logic

#### 3a. audience.js — perspective density fix
- In `generate_positions()`, for sideline banks (indices 4-5), replace linear seat distribution along z with the analytic inverse projection:
  - For each seat index `k` in `[0, seatsInRow-1]`, compute desired screen-y as `sy = sy_near + (sy_far - sy_near) * k/(seatsInRow-1)`
  - Use the inverse projection formula to convert `sy` → world `z`:
    ```
    z = ((H - sy) * C - A * FOCAL) / (B * FOCAL - (H - sy) * D)
    ```
    where `A = -CAM_HEIGHT·cosP + CAM_Z·sinP`, `B = -sinP`, `C = -CAM_HEIGHT·sinP - CAM_Z·cosP`, `D = cosP`, `H = HORIZON_Y`.
  - Verified: this produces screen-y gaps of exactly `(sy_far - sy_near) / (seatsInRow-1)` px — perfectly even.
- Keep the 4-row depth structure (was AUDIENCE_ROWS), jitter (±0.3m), and all other bank logic unchanged.
- Baseline banks (0-3) span x only — their x spacing is not affected by z-perspective since they're at fixed z. Verify they don't overlap court lines (z offset uses STAND_MARGIN_Z = 1.5m, which should be sufficient).

#### 3b. referee rendering fix
- **Screen-space rendering (recommended):** Render referee as a fixed screen-position ASCII figure instead of 3D-projected characters.
  - Anchor at projected position of umpire chair (`refX = COURT_WIDTH/2 + 1.0`, `refZ = COURT_LENGTH/2`), then draw as a multi-line string with screen-space offsets (e.g., 0px, 7px, 14px vertical).
  - Alternatively: keep world-space but use much larger body-part offsets (multiply by ~9× to compensate for perspective). This is simpler but fragile — minor camera changes break it again.
- **Always visible:** Remove the `if (!state || state.timer <= 0) return;` guard at `render.js:259` — the referee figure should render during all play states (menu, serving, playing, point_scored, violation_replay, kill_cam).
- Keep violation message text overlay (shown during replay only) near the referee — use `state.timer > 0` only for the message, not for the figure.

#### 3c. spectator hit detection — audience integration
- Implement `audience.check_hit(x, z)` — linear scan of alive spectators, compute 2D distance √(Δx² + Δz²), return nearest index within KILL_RADIUS or -1.
- Implement `audience.kill(i)` — mark spectator `alive: false`, increment `kill_count`.

#### 3d. main.js — game flow for fly-out → kill
- Modify `resolve_violation_point` or add dedicated path in `update_playing()`:
  - When `BALL_OUT` is detected and `rally_hits > 0` (ball was in play), instead of immediately calling `resolve_violation_point()`, set `ball.state = BALL_FLYING_OUT`
  - Store the hitter from `ball_obj.last_hit_by`
  - Continue in STATE_PLAYING
- In `update_playing()`, add branch after ball update for `ball.state === BALL_FLYING_OUT`:
  - Each frame call `audience.check_hit(ball.x, ball.z)`
  - If hit (`>= 0`): `audience.kill(hitIndex)`, flip killer to hitter side, `scoring.award_kill()`, set `point_winner`, transition to STATE_KILL_CAM with timer = KILL_CAM_DURATION
  - If ball expired (y < -10 or z > COURT_LENGTH + 20): transition to normal violation flow (`resolve_violation_point`)
- Add `update_kill_cam()`:
  - Decrement `point_timer` (reuse existing timer variable)
  - When timer hits 0, transition to STATE_POINT_SCORED
- Register STATE_KILL_CAM in the `gameLoop()` dispatch.

#### 3e. scoring.js — award_kill
```js
award_kill(s, hitter) {
  return this.award_point(s, hitter);
}
```

### Phase 4: UI / output

#### 4a. death pose rendering
- Death pose: ` X ` (top, crossed eyes), `|_|` (bottom, slumped body)
- In `render.audience()`, after getting `pose = audience_obj.get_pose(i)`, check `spec.alive === false` — override with death pose
- Death pose must persist across frames (it's permanent, not animated)
- Surviving spectators still use `get_pose(i)` (idle or cheer variants)

#### 4b. kill flash HUD
- When kill occurs (transition to STATE_KILL_CAM), set a `kill_flash_timer` to `KILL_CAM_DURATION` (30 frames)
- In `render.hud()` or as a separate overlay, display `"KILL +1"` text near the scoreboard (e.g., at screen position 2, 16) while `kill_flash_timer > 0`
- Decrement `kill_flash_timer` each frame during STATE_KILL_CAM (reuse `point_timer` or use dedicated variable)

#### 4c. referee always visible + correct rendering
- Implement the screen-space or fixed-position referee figure from Phase 3b
  - **Option A (screen-space multi-line):** Draw at fixed screen coords, e.g. top-right (sx=205, sy=15) using `print()`:
    ```
    print(" @ ", 205, 15);
    print("/|\\", 205, 22);
    print("/ \\", 205, 29);
    ```
  - **Option B (increased offsets):** Multiply world-space offsets by ~9× within render.referee()
- Remove the `state.timer <= 0` guard for the *figure* rendering
- Keep `state.timer > 0` guard only for the *violation message text* — message should only show during replay
- Verify: referee must render during serving, playing, point_scored, kill_cam, and (still) violation_replay
