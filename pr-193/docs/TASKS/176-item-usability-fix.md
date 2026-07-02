# Task Breakdown: Item Usability Fix — Implementation

**Issue:** #176
**Parent:** #173
**Related modules:** `src/main.js`, `src/player.js`, `src/render.js`, `tests/player.test.js`, `tests/fun.test.js`

## Impact Summary

| Module | Impact | Description |
|--------|--------|-------------|
| `src/main.js` | Medium | Fix item use handler to activate all 5 item types; extend collection to P2; add P2 item use |
| `src/player.js` | Low | Replace hardcoded `300` with `ITEM_ACTIVE_DURATION` in `use_item()` |
| `src/render.js` | Low | Item blink uses frame counter; add P2 item HUD |
| `tests/player.test.js` | Medium | Add tests for `use_item()`, `collect_item()`, `can_collect_item()` with all item types |
| `tests/fun.test.js` | Low | Add integration tests for item effect lifecycle |

## Implementation Plan

### Phase 1: Tests

Write test cases first (TDD):

1. **`tests/player.test.js` — Item state management**
   - `player.use_item()` returns correct item type when `p.item` is set
   - `player.use_item()` clears `p.item` to null after use
   - `player.use_item()` sets `p.item_active = true` and `p.item_timer = ITEM_ACTIVE_DURATION`
   - `player.use_item()` returns null when `p.item` is null
   - `player.collect_item()` sets `p.item` to the given type
   - `player.can_collect_item()` returns true when player is within `ITEM_COLLECT_RANGE`
   - `player.can_collect_item()` returns false when player is far from item

2. **`tests/fun.test.js` — Item effect activation**
   - BIG_RACKET: use handler sets `p.hit_range_mult = 2.0`
   - SHIELD: use handler sets `p.shield_active = true`
   - MULTI_BALL: use handler spawns `second_ball` with `ball.new()`
   - FIRE: next shot speed multiplied by 1.5 via `fire_mult`
   - TIME_SLOW: sets `time_slow_active = true` and `time_slow_timer = ITEM_ACTIVE_DURATION`

3. **`tests/render.test.js` or `tests/fun.test.js` — Item blink**
   - Item box blink uses frame-based timer, not `Date.now()`

### Phase 2: Core Logic — `main.js` & `player.js`

1. **Fix `player.use_item()` in `player.js:107`**
   - Replace `p.item_timer = 300` with `p.item_timer = ITEM_ACTIVE_DURATION`

2. **Fix `update_playing()` item use handler in `main.js:446-452`**
   - Add `else if` branches for BIG_RACKET, SHIELD, MULTI_BALL:
     ```js
     if (item_type === ITEM_TYPES.BIG_RACKET) {
       human_player.hit_range_mult = 2.0;
     } else if (item_type === ITEM_TYPES.SHIELD) {
       human_player.shield_active = true;
     } else if (item_type === ITEM_TYPES.MULTI_BALL) {
       second_ball = ball.new();
       second_ball.x = human_player.x;
       second_ball.z = human_player.z + 1;
       second_ball.y = 1.0;
       second_ball.vx = (Math.random() - 0.5) * 0.1;
       second_ball.vz = -0.15;
       second_ball.state = BALL_IN_PLAY;
     }
     ```

3. **Extend item collection to P2 in `main.js:555-566`**
   - Add P2 check after the human_player check:
     ```js
     if (p2_player && player.can_collect_item(p2_player, item) && !p2_player.item) {
       player.collect_item(p2_player, item.type);
       items.splice(i, 1);
     }
     ```

4. **Add P2 item use handler in the 2P block (`main.js:504-519`)**
   - After player movement and shot handling, add:
     ```js
     if (input2.pressed(BTN_X)) {
       const item_type = player.use_item(p2_player);
       if (item_type === ITEM_TYPES.BIG_RACKET) {
         p2_player.hit_range_mult = 2.0;
       } else if (item_type === ITEM_TYPES.SHIELD) {
         p2_player.shield_active = true;
       } else if (item_type === ITEM_TYPES.MULTI_BALL) {
         // spawn second ball
       }
     }
     ```

### Phase 3: UI/Output — `render.js`

1. **Fix item blink to use frame counter (`render.js:456`)**
   - Accept a `frame_count` parameter or use a frame-based blink
   - Replace `Date.now() / 500` with `Math.floor(frame_count / 30) % 2 === 0`

2. **Add P2 item HUD indicator**
   - In `render.hud()`, add P2 item display when `game_mode === "2p"` and P2 has an item
   - Add `opts.item_p2` parameter to the HUD options

### Phase 4: Verification

1. Run all existing tests: `npm test`
2. Run new item effect tests
3. Manual testing checklist:
   - Spawn items, collect as P1, use each item type → verify correct effect
   - In 2P mode, verify P2 can collect and use items
   - Verify item timer cleanup works after ITEM_ACTIVE_DURATION expires
   - Verify item blink is frame-based (consistent during slow-motion)
