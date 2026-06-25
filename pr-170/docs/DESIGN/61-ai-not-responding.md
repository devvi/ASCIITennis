# Issue 61 — AI Not Responding: Design

## Root Cause

In `src/ai.js:35`, the ball-tracking condition uses `ball.vz < 0`, which only triggers when the ball moves **away** from the AI (toward the human player). The hit detection at line 86 requires `ball.vz > 0` (ball coming toward AI). These conditions are mutually exclusive, so the AI never actively tracks an approaching ball and never positions itself for a hit.

## Fix

Three changes in `src/ai.js`, all in the ball-tracking branch (lines 35-49):

| Line | Current | Fixed |
|------|---------|-------|
| 35 | `ball.vz < 0` | `ball.vz > 0` |
| 41 | `const relative_vz = -ball.vz;` | `const relative_vz = ball.vz;` |
| 43 | `(ball.z - 2) / rvz` | `(base_z - ball.z) / rvz` |

## Data Structures

No new data structures. The existing `ai_player` object and `ball` object remain unchanged.

## Module Design

### `src/ai.js` — `update()` function

```
update(ai_player, ball):
  if hit_timer > 0 → decrement, return null

  if ball.state === BALL_IN_PLAY:
    if ball.vz > 0 AND ball.z > COURT_LENGTH * 0.4:   ← FIXED CONDITION
      → tracked approach (aim for intercept)
    else:
      → fallback recovery position

  compute movement toward target_x/target_z

  if ball.state === BALL_IN_PLAY AND can_reach AND state === PLAYER_IDLE:
    → swing & return hit action
```

## Verification

- Existing tests in `tests/ai.test.js` that use `vz > 0` and expect tracking should now work
- New tests should verify AI tracks ball with `vz > 0` in its half
- Manual playtest: AI should return balls
