# Product Requirements: Audience Perspective & Referee Fix (观众席以及裁判优化)

**Issue:** #139
**Feature:** Fix spectator density to follow court perspective, repair referee rendering, implement spectator-hit-by-ball mechanic.

## Motivation

Three outstanding issues with the audience and referee systems:

1. **Spectator density is perspective-inverted.** The current `generate_positions()` distributes sideline seats evenly in world-space z (0 to COURT_LENGTH). Due to perspective projection, this causes far-end (opponent side) spectators to appear densely packed — even overlapping the far court sides — while near-end (player side) spectators appear sparse. The density should compensate for perspective so the crowd looks evenly distributed on screen.

2. **Referee character rendering is garbled.** The referee is rendered as individual projected body parts (`@`, `|`, `/`, `\`) at world positions with small offsets (±0.3m–0.4m). At the referee's distance from camera (z = COURT_LENGTH/2 ≈ 11.9m), these offsets produce only 2–3 pixels of screen separation — characters overlap and become unreadable. Additionally, the referee is only drawn during violation replay (`state.timer > 0`), but should be visible at all times during play.

3. **Spectator-hit-by-ball mechanic is non-functional.** PRD #133 specified this feature (out-of-bounds ball kills spectators for points) but it was never implemented in code. The `audience` module has no per-spectator `alive`/`dead` state, no hit detection, no kill tracking. This feature must be implemented so the mechanic can be tested and played.

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
- Far court lines are not occluded by spectators.
- Referee figure is clearly readable (no overlapping characters).
- Referee is visible during all game states (serving, playing, replay, point scored).
- Violation messages (`OUT!`, etc.) still display correctly during replay.
- Ball hit out of bounds continues into the audience zone.
- Ball passing near a living spectator hits and kills that spectator.
- Killed spectator shows death pose permanently.
- Kill awards 1 point, advances the score, shows "KILL +1" on HUD.
- No kill registered when ball misses all spectators (normal out rules apply).
- No kills possible after all spectators are dead.
- No performance regression from per-frame hit detection (max ~100 iterations).
