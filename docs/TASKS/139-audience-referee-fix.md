# Task Breakdown: Audience Perspective & Referee Fix (观众席以及裁判优化)

**Issue:** #139
**Related modules:** `src/audience.js` (generation, hit detection), `src/render.js` (audience rendering, referee rendering), `src/camera.js` (projection), `src/ball.js` (fly-out state), `src/main.js` (game flow), `src/scoring.js` (kill points), `src/constants.js` (config), `src/court.js` (bounds)

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
export const SPECTATOR_ALIVE = "alive";
export const SPECTATOR_DEAD = "dead";
```

#### 2b. audience.js — per-spectator state
- Add `alive: true` default to each spectator in `generate_positions()`
- Add `kill_count: 0` tracking on audience object
- New methods:
  - `kill(i)` — marks spectator `alive: false`, increments `kill_count`
  - `check_hit(x, z)` — iterates alive spectators, returns nearest index within KILL_RADIUS, or -1

#### 2c. ball.js — BALL_FLYING_OUT state
- In `ball.update()`: If state is `BALL_FLYING_OUT`, apply gravity and air resistance but skip:
  - Bounce/out-of-bounds detection
  - Net collision detection
  - Stop simulation when y < -10 or z > COURT_LENGTH + 20

### Phase 3: Core logic

#### 3a. audience.js — perspective density fix
- In `generate_positions()`, for sideline banks (indices 4-5), replace linear seat distribution along z with perspective-compensated distribution:
  - For each seat, compute the z value that results in even screen-y spacing after projection
  - Approximation: `z = COURT_LENGTH * (1 - (1 - t)^power)` where `power > 1` biases seats toward near-camera
  - Tune so that projected screen-y distance between consecutive seats in a row is approximately uniform
- Keep the 4-row depth structure, jitter, and all other bank logic unchanged.
- Baseline banks (0-3) span x only — their spacing is less affected by z-perspective, but verify they don't overlap court.

#### 3b. referee rendering fix
- **Screen-space rendering:** Render referee as a fixed screen-position ASCII figure instead of 3D-projected characters.
  - Anchor the referee figure at an appropriate screen position (e.g., projected position of the umpire chair).
  - Draw the full figure as a pre-defined string block.
- OR keep world-space rendering but increase body-part offsets proportionally to compensate for perspective compression at z=COURT_LENGTH/2.
- **Always visible:** Remove the `if (!state || state.timer <= 0) return;` guard at the top of `render.referee()` — the referee figure should render during all play states.
- Keep violation message text overlay (shown during replay only) near the referee.

#### 3c. spectator hit detection — audience integration
- Implement `audience.check_hit(x, z)` — linear scan of alive spectators, distance check, return nearest index or -1.
- Implement `audience.kill(i)` — mark dead, increment kill_count.

#### 3d. main.js — game flow for fly-out → kill
- In `update_playing()`, when `BALL_OUT` is detected:
  - Instead of immediately calling `resolve_violation_point()`, set `ball.state = BALL_FLYING_OUT`
  - Store the hitter
  - Continue in STATE_PLAYING
- In `update_playing()`, add branch for `ball.state === BALL_FLYING_OUT`:
  - Each frame call `audience.check_hit(ball.x, ball.z)`
  - If hit: `audience.kill()`, `scoring.award_kill()`, transition to STATE_KILL_CAM
  - If ball expired (y < -10 etc.): transition to normal violation flow
- Add `update_kill_cam()`:
  - Decrement kill_cam timer
  - When timer hits 0, transition to STATE_POINT_SCORED
- Register STATE_KILL_CAM in the game loop dispatch.

#### 3e. scoring.js — award_kill
```js
award_kill(s, hitter) {
  return this.award_point(s, hitter);
}
```

### Phase 4: UI / output

#### 4a. death pose rendering
- Death pose: ` X ` (top), `|_|` (bottom)
- In `render.audience()`, check `spectator.alive` — if false, use death pose instead of `get_pose(i)`

#### 4b. kill flash HUD
- When kill occurs, display "KILL +1" text near score for `KILL_CAM_DURATION` frames
- Use a simple counter variable in render state

#### 4c. referee always visible + correct rendering
- Implement the screen-space or fixed-offset referee figure from 3b
- Ensure it renders during serving, playing, and point-scored states (not just violation replay)
- Verify no character overlap

---

## Plan Issue Task Lists

**PLAN_ISSUE:** #141

### Phase 1: Tests (TDD)
- [ ] 1a. Audience perspective density tests — sideline bank z values biased toward near-camera
- [ ] 1b. Referee rendering tests — minimum screen-space separation, always-visible, violation message
- [ ] 1c. Spectator hit detection tests — `check_hit()`, `kill()`, `alive`/`dead` state, death pose
- [ ] 1d. Ball fly-out tests — `BALL_FLYING_OUT` state, physics continuation, termination
- [ ] 1e. Scoring kill tests — `award_kill()` progression
- [ ] 1f. Main game flow tests — kill cam, fly-out → hit → kill → point, miss fallback

### Phase 2: Data structures
- [ ] 2a. constants.js additions — `BALL_FLYING_OUT`, `KILL_RADIUS`, `KILL_CAM_DURATION`, `STATE_KILL_CAM`
- [ ] 2b. audience.js — per-spectator `alive` state, `kill_count`, `check_hit()`, `kill()` methods
- [ ] 2c. ball.js — `BALL_FLYING_OUT` branch in `update()` (skip bounds/net, continue physics)

### Phase 3: Core logic
- [ ] 3a. audience.js — perspective density fix for sideline banks (power-function z distribution)
- [ ] 3b. referee rendering fix — screen-space ASCII figure, always visible
- [ ] 3c. spectator hit detection — implement `check_hit()` with linear scan, `kill()` logic
- [ ] 3d. main.js — game flow: `BALL_OUT` → `BALL_FLYING_OUT`, hit→kill→cam, miss→violation_replay
- [ ] 3e. scoring.js — `award_kill()` delegation to `award_point()`

### Phase 4: UI / output
- [ ] 4a. death pose rendering — ` X ` / `|_|` for dead spectators in `render.audience()`
- [ ] 4b. kill flash HUD — `"KILL +1"` text near scoreboard during kill-cam
- [ ] 4c. referee always visible — remove timer guard, render during all game states
