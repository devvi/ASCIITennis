# Product Requirements: Item Usability Fix — Implementation

**Issue:** #176
**Parent Issue:** #173
**Feature:** Fix the item system so that all 5 item types produce their intended effects when used

## Motivation

Research (docs/PRD/173-item-usability-fix.md) identified that the item system implemented in #151 has a critical bug: only TIME_SLOW (Type `T`) activates its effect when a player presses E (BTN_X) to use an item. The other 4 item types (FIRE, BIG_RACKET, SHIELD, MULTI_BALL) are silently consumed with no gameplay impact. This makes the entire item system non-functional and confusing.

Additional issues found: P2 cannot collect items in 2P mode, item blink uses wall-clock time, and `player.use_item()` hardcodes a literal timer.

## Code Analysis

### Bugs Confirmed in Current Code (`main.js`)

| Location | Issue |
|----------|-------|
| `main.js:446-452` | Item use handler only activates TIME_SLOW; BIG_RACKET, SHIELD, MULTI_BALL ignored |
| `main.js:467` | FIRE effect check relies on `human_player.item === null` after `use_item()` clears it — fragile but functional |
| `main.js:555-566` | Item collection loop only checks `human_player`; P2 never collects in 2P mode |
| `main.js:504-519` | 2P block has no item use handler for P2 |
| `player.js:107` | `use_item()` uses literal `300` instead of `ITEM_ACTIVE_DURATION` |
| `render.js:456` | Item blink uses `Date.now()/500` — doesn't respect game pause or slow-motion |
| `render.js:225-230` | HUD only shows P1 item; no P2 item indicator in 2P mode |

### Affected Modules

| Module | Changes Required |
|--------|-----------------|
| `src/main.js` | Add effect activations for BIG_RACKET, SHIELD, MULTI_BALL; extend collection to P2; add P2 item use handler |
| `src/player.js` | Replace hardcoded `300` with `ITEM_ACTIVE_DURATION` |
| `src/render.js` | Use frame counter instead of `Date.now()` for item blink; add P2 item HUD |
| `tests/fun.test.js` | Add tests for all 5 item type effect activations |
| `tests/player.test.js` | Add tests for `use_item()`, `collect_item()`, `can_collect_item()` |

## Acceptance Criteria

1. BIG_RACKET sets `p.hit_range_mult = 2.0` when used, doubling hit range for 5 seconds
2. SHIELD sets `p.shield_active = true` when used, auto-returning one ball in range
3. MULTI_BALL spawns `second_ball` when used, active for 5 seconds
4. FIRE continues to apply 1.5x shot speed on next hit
5. TIME_SLOW continues to set `time_slow_active = true` and `time_slow_timer = ITEM_ACTIVE_DURATION`
6. `player.use_item()` uses `ITEM_ACTIVE_DURATION` constant (not hardcoded 300)
7. P2 can collect items from the court in 2P mode
8. P2 can use items via `input2.pressed(BTN_X)` in 2P mode
9. Item box blink uses frame counter (not `Date.now()`)
10. P2 item shown in HUD in 2P mode
11. All existing tests pass; new tests cover all item effects
