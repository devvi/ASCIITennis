# Task Breakdown: 道具可用性修正 (Item Usability Fix)

**Issue:** #174
**Related modules:** `src/main.js` (item use handler), `src/player.js` (item state, use_item()), `src/render.js` (item rendering, HUD), `src/constants.js` (item constants)
**Parent design doc:** `docs/DESIGN/174-item-usability-fix.md`

## Impact Summary

| Module | Impact | Description |
|--------|--------|-------------|
| `src/main.js` | Medium | Fix item use handler to activate all 5 item type effects; extend collection & usage to both players; pass frame to item_box |
| `src/player.js` | Low | `use_item()` should use `ITEM_ACTIVE_DURATION` constant |
| `src/render.js` | Low | `item_box()` blink should use frame counter instead of `Date.now()`; add P2 item HUD |
| `src/constants.js` | None | Constants correct as-is |
| `tests/fun.test.js` | Medium | Add tests for all 5 item type effect activations, use_item(), P2 collection & usage |

PLAN_ISSUE: #176

### Phase 1: Tests (TDD)

#### 1a. Item type effect activation tests
- `player.use_item()` returns the correct item type and clears `p.item`
- `player.use_item()` sets `p.item_active = true` and `p.item_timer = ITEM_ACTIVE_DURATION`
- BIG_RACKET: `use_item()` caller sets `p.hit_range_mult = 2.0`
- SHIELD: `use_item()` caller sets `p.shield_active = true`
- MULTI_BALL: `use_item()` caller spawns `second_ball` with proper position/velocity
- FIRE: next shot gets 1.5x speed multiplier
- TIME_SLOW: sets `time_slow_active = true` and `time_slow_timer = ITEM_ACTIVE_DURATION`
- P2 can collect and use items (collection loop checks both players)

#### 1b. Item rendering tests
- Item box blink uses frame-based timer, not wall clock

### Phase 2: Core logic — fix item use handler

#### 2a. Fix `update_playing()` item use handler (main.js:446-452)
Add effect activation for BIG_RACKET, SHIELD, MULTI_BALL after `player.use_item()`.

#### 2b. Fix `player.use_item()` in player.js:107
Replace hardcoded `300` with `ITEM_ACTIVE_DURATION`.

#### 2c. Extend item collection & usage to P2
- Collection loop checks `human_player` AND `p2_player` (if exists)
- Add P2 item use handler (input2.pressed(BTN_X)) in the 2P block

#### 2d. Multi-ball second ball spawn
- Initialize `second_ball = ball.new()` on MULTI_BALL use
- Set position near player, velocity toward opponent's court

### Phase 3: UI/output

#### 3a. Fix item blink rendering
- Pass frame counter to `render.item_box()` instead of using `Date.now()`

#### 3b. P2 item HUD
- Show collected item on P2 HUD indicator in 2P mode

### Phase 4: Verification

#### 4a. Manual testing checklist
- Spawn items, collect as P1, verify all 5 item types produce correct effects
- In 2P mode, verify P2 can collect and use items
- Verify item timer cleanup works after effect expires

#### 4b. Automated test verification
- All existing tests pass
- New item effect tests pass
