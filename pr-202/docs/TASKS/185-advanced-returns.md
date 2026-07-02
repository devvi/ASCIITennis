# Task Breakdown: Advanced Returns (高级回球)

**Issue:** #185
**Plan Issue:** #187
**Related modules:** `src/constants.js`, `src/player.js`, `src/ball.js`, `src/main.js`, `src/render.js`, `tests/ball.test.js`, `tests/player.test.js`, `tests/main.test.js`, `tests/fun.test.js`, `tests/render.test.js`

## Impact Summary

| Module | Impact | Description |
|--------|--------|-------------|
| `src/constants.js` | Low | Add new constants for perfect speed mult, smash speed mult, net volley range, trail lengths |
| `src/player.js` | Low | Return timing quality from `swing_with_timing()` — already done; no change needed |
| `src/ball.js` | Low | Accept per-shot trail config in `hit()`; allow variable trail length |
| `src/main.js` | Medium | Wire timing quality into `speed_mult`; detect net proximity for smash; pass enhanced trail config to ball; spawn more particles for special shots |
| `src/render.js` | Medium | Support variable trail length; color differentiation; character variation |
| `tests/ball.test.js` | Medium | Tests for speed mult applied correctly, trail config |
| `tests/player.test.js` | Low | Tests for timing quality return values (already tested? check) |
| `tests/main.test.js` | Low | Integration tests for perfect shot → speed increase |
| `tests/fun.test.js` | Medium | Tests for smash activation, enhanced visuals |
| `tests/render.test.js` | Low | Tests for enhanced trail rendering |

## Implementation Plan

### Phase 1: Tests (TDD)

Write test cases first:

1. **`tests/player.test.js` — Timing quality verification**
   - `swing_with_timing()` returns `'PERFECT'` when ball.z is within 0.5 of player.z
   - `swing_with_timing()` returns `'GOOD'` when ball.z is within 1.5 of player.z
   - `swing_with_timing()` returns `'LATE'` when ball.z is further than 1.5
   - `swing_with_timing()` returns `null` when player is already swinging (hit_timer > 0)

2. **`tests/ball.test.js` — Speed multiplier in hit()**
   - `ball.hit()` with `speed_mult = 1.5` produces ball speed 1.5x higher than `speed_mult = 1.0`
   - `ball.hit()` with `speed_mult = 1.0` produces standard speed per HIT_PARAMS
   - Trail length is set correctly after `hit()` (configurable)
   - Trail is cleared on `hit()` then refilled during update

3. **`tests/main.test.js` — Integration tests**
   - When `swing_with_timing()` returns `'PERFECT'`, the ball speed_mult includes `PERFECT_SPEED_MULT`
   - When player is within `NET_VOLLEY_RANGE` of net, shot is treated as smash with `SMASH_SPEED_MULT`
   - Smash shots have flatter vy trajectory

4. **`tests/render.test.js` — Enhanced trail rendering**
   - `ball_trail()` accepts configurable trail length
   - Trail color changes based on shot type (perfect = green, smash = red)
   - Different trail characters render correctly

### Phase 2: Data Structures & Constants

1. **Add new constants in `src/constants.js`:**
   ```js
   export const PERFECT_SPEED_MULT = 1.3;
   export const SMASH_SPEED_MULT = 1.6;
   export const NET_VOLLEY_RANGE = 1.5;
   export const SMASH_TRAIL_LENGTH = 12;
   export const PERFECT_TRAIL_LENGTH = 8;
   export const SMASH_PARTICLES = 12;
   export const PERFECT_PARTICLES = 10;
   export const SMASH_TRAIL_COLOR = '#f44';
   export const PERFECT_TRAIL_COLOR = '#4f4';
   export const SMASH_TRAIL_CHAR = '#';
   export const PERFECT_TRAIL_CHAR = '*';
   ```

### Phase 3: Core Logic

1. **Modify `main.js:update_playing()` — Wire timing into speed_mult**
   - After getting `timing_quality` from `swing_with_timing()`:
   ```js
   const timing_mult = timing_quality === 'PERFECT' ? PERFECT_SPEED_MULT : 1.0;
   const total_speed_mult = combo_mult * fire_mult * timing_mult;
   ```

2. **Add smash detection**
   - Check if player is within `NET_VOLLEY_RANGE` of the net (`COURT_LENGTH / 2`)
   - Check if ball height is above `NET_HEIGHT` (smash only possible above net)
   - If both true, override shot behavior with smash params:
     ```js
     const is_smash = Math.abs(human_player.z - COURT_LENGTH/2) < NET_VOLLEY_RANGE
       && ball_obj.y > NET_HEIGHT
       && timing_quality !== null;
     const smash_mult = is_smash ? SMASH_SPEED_MULT : 1.0;
     const final_speed_mult = total_speed_mult * smash_mult;
     // For smash: override vy to be lower (flatter/downward)
     ```

3. **Modify `ball.hit()` — Accept trail config**
   - Add optional `trail_opts` parameter with `{ length, char, color }`
   - Set `b.trail_max_length = trail_opts.length || 5`
   - Set `b.trail_char = trail_opts.char || 'o'`
   - Set `b.trail_color = trail_opts.color || '#ff0'`

4. **Modify `ball.update()` — Use configurable trail max length**
   - Replace `if (b.trail.length > 5) b.trail.shift()` with configurable max

5. **Pass enhanced trail config in `main.js` based on shot type:**
   - Perfect: `{ length: PERFECT_TRAIL_LENGTH, char: PERFECT_TRAIL_CHAR, color: PERFECT_TRAIL_COLOR }`
   - Smash: `{ length: SMASH_TRAIL_LENGTH, char: SMASH_TRAIL_CHAR, color: SMASH_TRAIL_COLOR }`
   - Normal: defaults

6. **Enhanced particles in `main.js`**
   - Spawn `PERFECT_PARTICLES` or `SMASH_PARTICLES` instead of 6 for special shots
   - Particle color could match the trail color

### Phase 4: UI/Output

1. **Modify `render.ball_trail()` — Accept trail options**
   - Use `trail_char` from ball object (default `'o'`)
   - Use `trail_color` from ball object (default `'#ff0'`)
   - Support varying trail lengths

2. **Add visual indicator for smash** (optional)
   - Display "SMASH!" text similar to timing feedback
   - Could add screen shake for smash impact

3. **Timing feedback enhancement**
   - In addition to "PERFECT" text, could show a speed boost indicator

### Phase 5: Verification

1. Run all existing tests: `npm test`
2. Verify perfect shots produce faster ball speed
3. Verify smash only activates near net with ball above net height
4. Verify enhanced trails appear for perfect and smash shots
5. Verify particle count increases for special shots
6. Verify no regressions in AI behavior (AI doesn't accidentally trigger smash)
