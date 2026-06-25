# Task Breakdown: Spectator Elimination (观众击杀)

**Issue:** #133
**Related modules:** `src/ball.js` (out-of-bounds trajectory), `src/audience.js` (individual states, hit detection), `src/scoring.js` (kill-point award), `src/render.js` (death pose rendering), `src/main.js` (game flow, kill-cam state), `src/constants.js` (config)

## Impact Summary

| Module | Impact | Description |
|--------|--------|-------------|
| `src/constants.js` | Add 5 constants | `KILL_RADIUS`, `KILL_CAM_DURATION`, ball state `BALL_FLYING_OUT`, spectator state constants |
| `src/ball.js` | Medium | Extend out-of-bounds handling: add `BALL_FLYING_OUT` state, continue trajectory post-bounce, provide ball position query for hit detection |
| `src/audience.js` | High | Refactor from monolithic `cheer_level` to per-spectator `alive`/`dead` state; add `check_hit(ball_x, ball_y, ball_z)` method; add `kill_count` tracking |
| `src/scoring.js` | Low | Add `award_kill(s, hitter)` method that increments game points by 1 |
| `src/main.js` | High | New state `STATE_KILL_CAM`; modify violation flow to continue ball into audience; trigger kill detection; score update |
| `src/render.js` | Medium | Add death pose rendering to `render.audience()`; add kill-flash HUD element; render ball during fly-out phase |
| `tests/audience.test.js` | Update | Tests for per-spectator alive/dead state, hit detection |
| `tests/scoring.test.js` | Update | Tests for `award_kill()` |
| `tests/ball.test.js` | Update | Tests for `BALL_FLYING_OUT` state and post-out trajectory |
| `tests/main.test.js` | Update | Tests for kill-cam state transition, kill scoring integration |

## Plan

Research complete — see `docs/PRD/133-spectator-elimination.md` for requirements.

### Phase 1: Tests (TDD)

#### 1a. audience.js tests
- `audience.init()` creates spectators with `alive: true` by default
- `audience.check_hit(x, z)` returns the index of the nearest spectator within `KILL_RADIUS`, or `-1` if none
- `check_hit` ignores dead spectators
- `audience.kill(i)` sets spectator `i` to `alive: false`
- `audience.get_pose(i)` returns death pose for dead spectators
- `audience.kill_count` increments on each kill
- `audience.update()` properly handles per-spectator state (existing cheer behavior preserved for alive spectators)

#### 1b. scoring.js tests
- `scoring.award_kill(s, hitter)` increments `s.points[hitter]` by 1
- `scoring.award_kill` returns the same point/game/set/match result as `award_point`
- Multiple kills correctly advance through 15→30→40→game

#### 1c. ball.js tests
- `ball.update()` with ball past court bounds but still moving transitions to `BALL_FLYING_OUT` instead of immediate `BALL_OUT`
- `BALL_FLYING_OUT` ball continues physics simulation without bounce/out detection
- Ball trajectory stays consistent through the fly-out phase

#### 1d. main.js tests
- `STATE_KILL_CAM` pauses game for `KILL_CAM_DURATION` frames
- After kill-cam, transitions to `STATE_POINT_SCORED` (or `STATE_SERVING` if game ended)
- Ball going out and hitting a spectator triggers kill flow instead of normal violation flow
- Ball going out and missing all spectators falls back to normal violation flow

### Phase 2: Data structures

#### 2a. constants.js additions
```js
export const BALL_FLYING_OUT = "flying_out";  // ball continuing past bounds into audience
export const KILL_RADIUS = 1.0;                // meters — hit detection range
export const KILL_CAM_DURATION = 30;           // frames — pause on kill
export const SPECTATOR_ALIVE = "alive";
export const SPECTATOR_DEAD = "dead";
```

#### 2b. audience.js refactor
- Change `spectators` from `[{ x, z }]` to `[{ x, z, alive: true, pose: 'idle' }]`
- Remove global `cheer_level` in favor of per-spectator state
- Add `kill_count: 0` tracking
- New methods:
  - `kill(i)` — marks spectator dead, increments `kill_count`
  - `check_hit(ball_x, ball_z)` — finds nearest alive spectator within `KILL_RADIUS`
- `update()` — per-spectator cheer decrement (for alive spectators only)
- `get_pose(i)` — returns death pose if dead, existing idle/cheer logic if alive

#### 2c. ball.js additions
- Add `BALL_FLYING_OUT` handling in `update()`:
  - Continue physics (gravity, velocity) but skip bounce/out/net detection
  - Stop when ball y < -10 (fell below world) or z > COURT_LENGTH + 20 (far past court)

### Phase 3: Core logic

#### 3a. main.js — violation flow modification
In `update_playing()` where `BALL_OUT` is detected:
- Instead of immediately transitioning to violation replay:
  - Set `ball.state = BALL_FLYING_OUT`
  - Store the hitter information
  - Continue game loop in `STATE_PLAYING` with ball flying out

When `ball.state === BALL_FLYING_OUT`:
- Each frame, call `audience.check_hit(ball.x, ball.z)`
- If hit index >= 0:
  - Call `audience.kill(hitIndex)`
  - Call `scoring.award_kill(score, hitter)`
  - Set `point_winner = hitter`
  - Transition to `STATE_KILL_CAM`
  - Set `replay_timer = KILL_CAM_DURATION`
- If ball falls below world or goes too far:
  - Fall back to normal violation flow (opponent gets point)

#### 3b. main.js — STATE_KILL_CAM
```js
function update_kill_cam() {
  replay_timer--;
  if (replay_timer <= 0) {
    game_state = STATE_POINT_SCORED;
    point_timer = 60;
  }
}
```

#### 3c. scoring.js — award_kill
```js
award_kill(s, hitter) {
  // Same logic as award_point — increments points, checks deuce/game/set/match
  return this.award_point(s, hitter);
}
```

### Phase 4: UI / output

#### 4a. render.js — death pose
- Dead spectator pose: ` X ` (top, crossed eyes) and `|_|` (bottom, slumped)
- Rendered in `render.audience()` when `spectator.alive === false`

#### 4b. render.js — kill flash HUD
- When a kill occurs, display "KILL +1" text near the score for `KILL_CAM_DURATION` frames
- Use a `kill_flash_timer` variable in render state to control display duration

#### 4c. render.js — ball during fly-out
- Ball continues to render as yellow `O` during `BALL_FLYING_OUT` state
- Add a subtle trail effect (fading `o` characters behind the ball path)

#### 4d. kill-cam visual
- During `STATE_KILL_CAM`, briefly center view on the killed spectator's position
- Use a simple camera pan or just a highlight marker (e.g. `!` above the dead spectator)
