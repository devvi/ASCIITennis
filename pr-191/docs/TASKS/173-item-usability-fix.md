# Task Breakdown: 道具可用性修正 (Item Usability Fix)

**Issue:** #173
**Related modules:** `src/main.js` (item use handler), `src/player.js` (item state, use_item()), `src/render.js` (item rendering), `src/constants.js` (item constants)

## Impact Summary

| Module | Impact | Description |
|--------|--------|-------------|
| `src/main.js` | Medium | Fix item use handler to activate all 5 item type effects; extend collection to both players |
| `src/player.js` | Low | `use_item()` should use `ITEM_ACTIVE_DURATION` constant |
| `src/render.js` | Low | `item_box()` blink should use frame counter instead of `Date.now()` |
| `src/constants.js` | None | Constants correct as-is |
| `tests/fun.test.js` | Medium | Add tests for all 5 item type effect activations |
| `tests/main.test.js` | Low | Add integration test for item use lifecycle |

## Plan

Research complete — see `docs/PRD/173-item-usability-fix.md` for requirements.
Design — see `docs/DESIGN/173-item-usability-fix.md` for architecture and module design.
PLAN_ISSUE: #181

### Phase 1: Tests (TDD)

#### 1a. `player.use_item()` unit tests
- Add test: `use_item()` returns the correct item type when player has an item
- Add test: `use_item()` clears `p.item` after use
- Add test: `use_item()` sets `p.item_active = true`
- Add test: `use_item()` sets `p.item_timer = ITEM_ACTIVE_DURATION` (not hardcoded 300)
- Add test: `use_item()` returns `null` when player has no item

#### 1b. Item type effect activation tests (main.js handler)
- Add test: BIG_RACKET use sets `human_player.hit_range_mult = 2.0`
- Add test: SHIELD use sets `human_player.shield_active = true`
- Add test: MULTI_BALL use spawns `second_ball` with valid position and velocity
- Add test: TIME_SLOW use sets `time_slow_active = true` and `time_slow_timer = ITEM_ACTIVE_DURATION`
- Add test: FIRE shot gets 1.5x speed multiplier when `item_active` is true

#### 1c. P2 item collection & usage tests
- Add test: P2 can collect items in 2P mode
- Add test: P2 can use items in 2P mode
- Add test: Both players can each carry one item simultaneously

#### 1d. Item rendering tests
- Add test: `item_box()` blink uses frame-based timer (e.g. `Math.floor(frame / 15) % 2`)
- Add test: HUD displays P2 item when `opts.p2_item` is set

### Phase 2: Core logic — fix item use handler

#### 2a. Fix `update_playing()` item use handler (main.js:446-452)
Add `else if` branches for `BIG_RACKET` (`hit_range_mult = 2.0`), `SHIELD` (`shield_active = true`), and `MULTI_BALL` (spawn `second_ball` with proper position/velocity toward opponent).

`FIRE` remains implicitly handled by the existing `fire_mult` check at hit time.

#### 2b. Fix `player.use_item()` in player.js:107
Replace hardcoded `300` with `ITEM_ACTIVE_DURATION`. This requires importing the constant.

#### 2c. Extend item collection to P2 (main.js:555-566)
Add `else if` branch to check `p2_player` (if exists) for collection. Only one player may collect a given item.

#### 2d. Add P2 item use handler (main.js:504-519)
In the 2P block, add `input2.pressed(BTN_X)` handler with identical activation branches (BIG_RACKET, SHIELD, MULTI_BALL, TIME_SLOW), targeting `p2_player` instead of `human_player`.

### Phase 3: UI/output

#### 3a. Fix item blink rendering (render.js:456)
- Add `frame` parameter to `item_box(item, frame)`
- Replace `Math.floor(Date.now() / 500) % 2 === 0` with `Math.floor(frame / 15) % 2 === 0`
- Update caller in `draw_game()` (main.js:792-794) to pass frame counter

#### 3b. P2 item HUD (render.js:226-230)
- Accept `opts.p2_item` in HUD render function
- Display P2 item when in 2P mode
- Update caller in `draw_game()` to pass `p2_player.item`

### Phase 4: Verification

#### 4a. Run all existing tests
- `npm test` passes
- No regressions in non-item tests

#### 4b. Manual testing checklist
- Spawn items, collect as P1, verify all 5 item types produce correct effects
- In 2P mode, verify P2 can collect and use items
- Verify item timer cleanup works after effect expires
- Verify FIRE shot speed boost only applies on the next hit
