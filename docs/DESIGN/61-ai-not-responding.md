# Issue 61 — AI Not Responding: Design

## Root Cause

In `src/ai.js:87`, the hit check requires `ai_player.state === PLAYER_IDLE`:

- Lines 66-74 set `state = PLAYER_MOVING` whenever the AI is >0.3 units from its target (nearly always, since targets include random jitter)
- Lines 76-77 only set `state = PLAYER_IDLE` when within 0.3 units
- Result: the AI is almost always `PLAYER_MOVING` when the ball passes through its reachable zone, so the hit check at line 87 always fails

Note: the tracking condition (`ball.vz > 0`) on line 34 was already correct.

## Fix

One change in `src/ai.js:87`:

| Line | Current | Fixed |
|------|---------|-------|
| 87 | `can_reach && ai_player.state === PLAYER_IDLE` | `can_reach` |

## Data Structures

No new data structures. The existing `ai_player` object and `ball` object remain unchanged.

## Module Design

### `src/ai.js` — `update()` function

```
update(ai_player, ball):
  if hit_timer > 0 → decrement, return null

  if ball.state === BALL_IN_PLAY:
    if ball.vz > 0 AND ball.z > COURT_LENGTH * 0.4:
      → tracked approach (aim for intercept)
    else:
      → fallback recovery position

  compute movement toward target_x/target_z

  if ball.state === BALL_IN_PLAY AND can_reach:   ← REMOVED state check
    → swing & return hit action
```

## Verification

- Existing tests in `tests/ai.test.js` that use `vz > 0` and expect tracking should now work
- New tests should verify AI tracks ball with `vz > 0` in its half
- Manual playtest: AI should return balls
