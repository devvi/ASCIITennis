# Task Breakdown: Item Usability Fix

**Issue:** #181
**Parent:** #173
**Related modules:** `src/main.js`, `src/player.js`, `src/render.js`, `src/constants.js`
**Design:** `docs/DESIGN/174-item-usability-fix.md`

## Impact Summary

| Module | Impact | Description |
|--------|--------|-------------|
| `src/main.js` | Medium | Fix item use handler (add BIG_RACKET/SHIELD/MULTI_BALL activation); extend collection & usage to both players; pass frame to item_box |
| `src/player.js` | Low | Use `ITEM_ACTIVE_DURATION` constant in `use_item()` |
| `src/render.js` | Low | Frame-based blink instead of `Date.now()`; add P2 item HUD |
| `src/constants.js` | None | Constants correct as-is |
| `tests/fun.test.js` | Medium | Add tests for all 5 item activations, `use_item()` contract, P2 flow, rendering |

### Phase 1: Tests (TDD)

#### 1a. Item use and effect activation tests
- `player.use_item()` returns correct item type and clears `p.item`
- `player.use_item()` sets `p.item_active = true` and `p.item_timer = ITEM_ACTIVE_DURATION`
- BIG_RACKET: caller sets `p.hit_range_mult = 2.0`
- SHIELD: caller sets `p.shield_active = true`
- MULTI_BALL: caller spawns `second_ball` with proper position/velocity
- FIRE: next shot gets 1.5x speed multiplier (implicit)
- TIME_SLOW: sets `time_slow_active = true` and `time_slow_timer = ITEM_ACTIVE_DURATION`
- P2 collection: collection loop checks both players
- P2 usage: `input2.pressed(BTN_X)` triggers item use for P2

#### 1b. Item rendering tests
- Item box blink uses frame-based timer, not wall clock
- P2 HUD shows collected item in 2P mode

### Phase 2: Core logic — fix item use handler

#### 2a. Fix `update_playing()` item use handler (main.js:446-452)
Add `else if` branches for BIG_RACKET, SHIELD, MULTI_BALL after `player.use_item()`.

#### 2b. Fix `player.use_item()` in player.js:107
Replace hardcoded `300` with `ITEM_ACTIVE_DURATION`.

#### 2c. Extend item collection to P2 (main.js:555-566)
Collection loop checks `human_player` AND `p2_player` (if exists).

#### 2d. Add P2 item use handler (main.js:504-519)
In 2P block, add `input2.pressed(BTN_X)` handler with same effect activation logic as P1.

#### 2e. Multi-ball second ball spawn
Initialize `second_ball = ball.new()` on MULTI_BALL use. Set position near player, velocity toward opponent's court.

### Phase 3: UI/output

#### 3a. Fix item blink rendering (render.js:456)
Replace `Date.now() / 500` with `frame` parameter for blink calculation.

#### 3b. P2 item HUD (render.js:226-230)
Show collected item on P2 HUD indicator in 2P mode.

### Phase 4: Verification

#### 4a. Manual testing
- Spawn items, collect as P1, verify all 5 item types produce correct effects
- In 2P mode, verify P2 can collect and use all item types
- Verify item timer cleanup after effect expires

#### 4b. Automated tests
- All existing tests pass
- All new item effect tests pass
