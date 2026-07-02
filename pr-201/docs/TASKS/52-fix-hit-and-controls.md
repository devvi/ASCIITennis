# Issue 52 — Task Analysis

## Related Modules

- `src/input.js` — movement direction mapping
- `src/constants.js` — physics constants (GRAVITY, HIT_PARAMS)
- `src/ball.js` — vy calculation in hit function
- `tests/input.test.js` — new file for input tests
- `tests/ball.test.js` — update ball physics tests
- `tests/player.test.js` — update/verify player tests

## Summary

Two gameplay bugs: (1) W/S controls are reversed (W moves backward instead of
forward), and (2) the ball always flies above the player's maximum hit height
due to an excessively large initial vertical velocity.

## Implementation Phases

### Phase 1: Tests (TDD) — Issue #54
Write test cases that verify:
- `input.get_movement()` returns dz=1 for BTN_UP and dz=-1 for BTN_DOWN
- Ball trajectory stays within HIT_HEIGHT_MIN..HIT_HEIGHT_MAX for a full court crossing
- Player can_hit() returns true when ball arrives at realistic trajectory

### Phase 2: Fix controls reversal — Issue #55
- Swap dz values in `input.js` (`get_movement`: BTN_UP→dz=1, BTN_DOWN→dz=-1)

### Phase 3: Fix ball physics (can't hit) — Issue #56
- Reduce GRAVITY in `constants.js`: -0.04 → -0.006
- Fix vy in `ball.js` `hit()`: remove hardcoded 1.5 base, derive from arc param
  - Flat: vy = 0.04, Topspin: vy = 0.18, Slice: vy = -0.02, Lob: vy = 0.50

### Phase 4: Integrate & verify — Issue #57
- Run full test suite
- Manual verification of control feel and hit consistency
