# Tasks: Direction Optimization Sprint 4 — Mario Tennis GBC-style Directional Shots

**Parent Issue:** #173
**PRD:** docs/PRD/173-direction-optimization-sprint4.md

## Related Modules

| Module | File(s) | Impact |
|--------|---------|--------|
| Constants | `src/constants.js` | Add timing angle multipliers |
| Game loop | `src/main.js` | **Primary** — position-relative target_x, timing modulation, court bounds clamping |
| Tests | `tests/main.test.js`, `tests/input.test.js` | Add position-relative aim tests, timing modulation tests |

## Summary

Issue #172 restores basic A/D keyboard directional control with a fixed moderate angle. This sprint builds on that by making the directional system **position-relative** (like Mario Tennis GBC — the same key press produces different absolute trajectories depending on court position) and **timing-sensitive** (better swing timing grants wider angle control). The changes are primarily in `src/main.js`, not in `src/input.js`.

## Phased Plan

### Phase 1: Tests (TDD)
- [ ] Add test: position-relative target_x — player at x=-2, A held → target_x near -3.82
- [ ] Add test: position-relative target_x — player at x=-2, D held → target_x near -0.18
- [ ] Add test: position-relative target_x — player at x=2, A held → target_x near 0.18
- [ ] Add test: position-relative target_x — player at x=2, D held → target_x near 3.82
- [ ] Add test: no direction held → target_x equals player.x
- [ ] Add test: PERFECT timing → full angle multiplier (1.0×)
- [ ] Add test: GOOD timing → reduced angle multiplier (0.75×)
- [ ] Add test: LATE timing → weak angle multiplier (0.5×)
- [ ] Add test: target_x clamped within [-SINGLES_WIDTH/2 + 0.5, SINGLES_WIDTH/2 - 0.5]
- [ ] Add test: P2 mode has same position-relative behavior
- [ ] Add test: mouse hold aiming is completely unchanged
- [ ] Add test: serve position-relative target

### Phase 2: Constants (`src/constants.js`)
- [ ] Add `TIMING_ANGLE_PERFECT = 1.0`
- [ ] Add `TIMING_ANGLE_GOOD = 0.75`
- [ ] Add `TIMING_ANGLE_LATE = 0.5`

### Phase 3: Core logic (`src/main.js`)
- [ ] Import timing constants in main.js
- [ ] `update_playing()`: Change human player target_x to `human_player.x + angle * timing_mult * SINGLES_WIDTH * 0.35`
- [ ] `update_playing()`: Apply timing quality multiplier to angle
- [ ] `update_playing()`: Clamp target_x within court bounds
- [ ] `update_playing()`: Apply same changes to P2 shot path
- [ ] `update_serving()`: Change serve target_x to be relative to server position
- [ ] Verify mouse-hold branch is completely unchanged

### Phase 4: Verification
- [ ] Run `npm test` — all tests pass
- [ ] Manual smoke test: position-relative aiming feels natural
- [ ] Manual smoke test: timing affects angle control
- [ ] Manual smoke test: mouse hold aiming still works correctly
- [ ] Manual smoke test: P2 mode position-relative aiming
- [ ] Manual smoke test: serve placement with position-relative aiming
- [ ] Manual smoke test: court bounds — shots never go wildly outside court
