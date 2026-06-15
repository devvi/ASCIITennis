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

## Summary

A one-condition inversion bug in `src/ai.js:35` causes the AI to never track balls coming toward it. The tracking branch only activates when the ball moves away from the AI, but the hit check requires the ball to be approaching. Fixing the direction check and prediction math restores AI functionality.

## Phases

### Phase 1: Tests
- [ ] Update existing AI tests to reflect correct ball-tracking direction
- [ ] Add test: AI tracks ball approaching (vz > 0) in AI half
- [ ] Add test: AI tracks ball with different difficulty levels
- [ ] Add test: AI returns hit command with valid action object

### Phase 2: Fix tracking condition
- [ ] Change `ball.vz < 0` to `ball.vz > 0` on line 35 of `src/ai.js`
- [ ] Remove `-ball.vz` negation (use `ball.vz` directly)
- [ ] Fix `time_to_reach_z` to predict time for ball to reach AI position (`base_z - ball.z`)

### Phase 3: Verify
- [ ] Run `npm test` — all tests pass
- [ ] Manual verification: game runs, AI returns balls
