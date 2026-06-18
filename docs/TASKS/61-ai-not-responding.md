# Issue 61 — Task Analysis: AI Not Responding

## Related Modules

- `src/ai.js` — AI opponent behavior, ball tracking, hit decision
- `src/constants.js` — AI difficulty configs, hit range constants
- `src/player.js` — Player swing/timing, hit range detection
- `tests/ai.test.js` — AI unit tests (need updates for fixed behavior)

## Impacts

- Single-line condition fix (`ball.vz < 0` → `ball.vz > 0`) in the tracking branch
- Requires adjusting prediction math (`-ball.vz` negation removal, `ball.z - 2` → `base_z - ball.z`)
- Existing tests for AI behavior may need updated expectations

## PLAN_ISSUE: 68

## Summary

A state-condition lock bug in `src/ai.js:87` causes the AI to never swing. The hit check requires `state === PLAYER_IDLE`, but the movement logic (lines 66-74) sets `state = PLAYER_MOVING` whenever the AI is >0.3 units from its jitter-injected target. Since the AI almost never reaches within 0.3 units of its target while the ball passes through its reachable zone, it stays `PLAYER_MOVING` and never passes the hit check. The fix is to remove the state requirement — `can_reach` (distance + height + direction) is sufficient.

Note: the tracking condition (`ball.vz > 0`) was already correct. The original issue docs incorrectly claimed a `vz` inversion.

## Phases

### Phase 1: Tests
- [ ] Remove `p.state = PLAYER_IDLE` masking in existing "returns hit action" test
- [ ] Add test: AI swings while in PLAYER_MOVING state (realistic scenario)
- [ ] Add test: AI swings from different positions with ball in range

### Phase 2: Fix hit check
- [ ] Remove `ai_player.state === PLAYER_IDLE` from the condition on line 87 of `src/ai.js`

### Phase 3: Verify
- [ ] Run `npm test` — all tests pass
- [ ] Manual verification: game runs, AI returns balls
