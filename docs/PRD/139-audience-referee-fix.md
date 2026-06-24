# Product Requirements: Audience Perspective & Referee Fix (观众席以及裁判优化)

**Issue:** #139
**Feature:** Fix spectator density to follow court perspective, repair referee rendering, implement spectator-hit-by-ball mechanic.

## Motivation

Three outstanding issues with the audience and referee systems:

### 1. Spectator density is perspective-inverted

**Root cause:** The camera projection compresses far-end objects into fewer screen pixels. With `CAM_HEIGHT=10`, `CAM_Z=-6`, `FOCAL=120`, `CAM_PITCH=-0.5`, the screen-y derivative for a spectator at ground level (y=0) is:

```
d(sy)/dz = -1200 / (0.8776 z + 10.0596)²
```

At z=0 (near end): −11.86 px/m — very spread out on screen.  
At z=23.77 (far end): −1.26 px/m — severely compressed.

**Compression ratio: 9.45×** from near to far. Linear world-z spacing means the far-end spectators pack tightly while near-end looks sparse. With ~24 seats per row and 92px total screen-y range, far-end spacing drops below 2px — characters overlap.

**Before (linear world-z):** 24 seats, screen-y gaps: 11.2px (near) → 1.3px (far)  
**After (inverse-mapped):** seats bias heavily toward near-camera z (0.0, 0.35, 0.71, 1.11… 23.77m) producing even ~3.8px gaps

**Fix:** Use the analytic inverse projection to map desired even screen-y positions to world-z values:
```js
// Given desired screen-y, solve for z that projects to it:
const A, B, C, D = constants from camera geometry;
z = ((H - sy) * C - A * FOCAL) / (B * FOCAL - (H - sy) * D);
```

### 2. Referee character rendering is garbled

**Root cause (garbled):** Body parts at refZ = COURT_LENGTH/2 = 11.885m project to:

| Part | World (x, y, z) | Screen (sx, sy) |
|------|-----------------|-----------------|
| Head `@` | (6.485, 1.2, 11.885) | (159.1, 34.9) |
| Body `|` | (6.485, 0.9, 11.885) | (158.8, 36.5) |
| L-arm `/` | (6.085, 0.9, 11.885) | (156.4, 36.5) |
| R-arm `\` | (6.885, 0.9, 11.885) | (161.2, 36.5) |
| L-leg `/` | (6.185, 0.4, 11.885) | (156.6, 39.1) |
| R-leg `\` | (6.785, 0.4, 11.885) | (160.1, 39.1) |

Head-to-body vertical separation: only **1.6px** (34.9 → 36.5) — characters overlap since Courier New is ~7px tall. Arms and body share the same screen-y (36.5), colliding on the same row. The small offsets (±0.3m–0.4m) after perspective projection at z=11.9m produce sub-character-pixel separation.

**Root cause (not always visible):** Guard clause `if (!state || state.timer <= 0) return;` at `render.js:259` blocks rendering during all states except `STATE_VIOLATION_REPLAY` (the only state that sets `referee_state.timer > 0`).

**Fix option A (recommended):** Render referee as a fixed screen-space ASCII multi-line string at a chosen screen position, bypassing 3D projection entirely.  
**Fix option B:** Increase world-space offsets by ~9× so screen separation is adequate.

### 3. Spectator-hit-by-ball mechanic is non-functional

**Root cause:** PRD #133 specified the feature, the TASK doc references it, but **no implementation exists**. The `audience.js` module has:
- No `alive`/`dead` per-spectator state
- No `check_hit(x, z)` method
- No `kill(i)` method or `kill_count`
- No death pose rendering
- No `BALL_FLYING_OUT` state in `constants.js` or `ball.js`
- No `STATE_KILL_CAM` in `main.js`
- No `award_kill()` in `scoring.js`

The current ball-out flow jumps directly from `BALL_OUT` → `resolve_violation_point()` → point to opponent, with no opportunity for the ball to continue into the audience zone and hit a spectator.

## Feature List

### 1. Perspective-aware spectator distribution
- **Current:** Sideline bank seats evenly distributed in world z from 0 to COURT_LENGTH.
- **Fix:** Use perspective-compensated spacing so spectators appear evenly spread on screen.
  - Apply non-linear seat distribution: bias more seats toward near-camera z values, fewer toward far-camera z values.
  - Alternatively, use the inverse camera projection to map desired even screen-space positions back to world z.
  - Preserve the 4-row depth structure and jitter.
- Baseline banks (near/far): may need similar compensation but less pronounced since they span x only.
- Verify visually that sideline spectators no longer occlude the far court lines.

### 2. Referee rendering fix
- **Fix garbled characters:** Increase body-part separation or render referee as a fixed screen-space ASCII figure instead of projected 3D world-space parts.
  - Option A: Draw referee at a fixed screen position (e.g., top-right corner) as a multi-line string.
  - Option B: Use larger world-space offsets for body parts so they separate properly after projection.
  - Option C: Render referee as a single composited string at the projected position of a single anchor point.
- **Always visible:** Remove the `state.timer > 0` guard so referee figure renders during all play states (serving, playing, point scored, violation replay).
- Keep the violation message text (`OUT!`, `NET!`, `DOUBLE BOUNCE!`) as an overlay near the referee.

### 3. Spectator hit detection (implement #133)
- Per-spectator `alive`/`dead` state replacing the global `cheer_level` for death tracking.
- `audience.check_hit(x, z)` method returning nearest alive spectator index within `KILL_RADIUS` (1.0m).
- `audience.kill(i)` marks spectator dead, increments `kill_count`.
- Death pose: ` X ` (top, crossed eyes) / `|_|` (bottom, slumped body).
- Ball that goes out of bounds continues flying into the audience zone (new `BALL_FLYING_OUT` state).
- If ball passes near a living spectator → kill them → award point → brief kill-cam pause.
- If ball misses all spectators → fall back to normal violation flow (opponent gets point).
- Surviving spectators cheer on kill.
- All spectators dead → balls behave as normal out-of-bounds (no kills possible).

### 4. Scoring integration
- `scoring.award_kill(s, hitter)` increments game points by 1.
- Kills follow same 15→30→40→Game→Set→Match progression as normal points.
- HUD shows "KILL +1" flash on kill.

## Acceptance Criteria

- Sideline spectators appear evenly distributed on screen — not bunched at far end, not sparse at near end.
  - Quantitative: screen-y gaps between consecutive seats in a sideline row must vary by less than 3× across the full z range (near-to-far ratio < 3:1, vs current 9.45:1).
- Far court lines are not occluded by spectators.
- Referee figure is clearly readable (no overlapping characters).
  - Quantitative: minimum screen-space separation between any two referee body-part characters ≥ 4px.
- Referee is visible during all game states (serving, playing, replay, point scored).
- Violation messages (`OUT!`, etc.) still display correctly during replay.
- Ball hit out of bounds continues into the audience zone (new `BALL_FLYING_OUT` state).
- Ball passing within KILL_RADIUS (1.0m) of a living spectator kills that spectator.
- Killed spectator shows death pose (` X ` / `|_|`) permanently.
- Kill awards 1 point, advances the score through 15→30→40→Game→Set→Match progression.
- "KILL +1" flash text appears near HUD during kill-cam.
- No kill registered when ball misses all spectators (normal out rules, opponent gets point).
- No kills possible after all spectators are dead.
- `STATE_KILL_CAM` duration is exactly `KILL_CAM_DURATION` frames (30).
- After kill-cam ends, transitions to `STATE_POINT_SCORED`.
- No performance regression from per-frame hit detection (max ~100 spectators).
