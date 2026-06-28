# Design: Advanced Returns (高级回球)

**Parent Issue:** #185

## Architecture Overview

The perfect shot speed boost and net smash features extend existing game systems without restructuring core physics, rendering, or game state machines. The implementation touches four modules by adding new constants, wiring timing quality into hit speed calculation, detecting net proximity for smash, and enhancing trail/particle rendering.

### Data Flow

```
main.js: update_playing()
  ├─ player.swing_with_timing() → timing_quality ('PERFECT'|'GOOD'|'LATE')
  ├─ Compute speed_mult = combo_mult × fire_mult × timing_mult × smash_mult
  │    ├─ timing_mult = (timing_quality === 'PERFECT') ? PERFECT_SPEED_MULT : 1.0
  │    └─ smash_mult  = near_net && y > NET_HEIGHT ? SMASH_SPEED_MULT : 1.0
  ├─ Build trail_opts based on shot type
  ├─ ball.hit(..., final_speed_mult, trail_opts)
  │    └─ sets b.trail_max, b.trail_char, b.trail_color
  ├─ Spawn particles (count depends on shot type)
  └─ render.ball_trail(ball.trail) → reads trail_char, trail_color, trail_max from ball
```

### New Constants

| Constant | Value | Purpose |
|---|---|---|
| `PERFECT_SPEED_MULT` | 1.3 | Speed multiplier when timing is PERFECT |
| `SMASH_SPEED_MULT` | 1.6 | Speed multiplier for net smash |
| `NET_VOLLEY_RANGE` | 1.5 | Distance from net centerline for smash activation |
| `PERFECT_TRAIL_LENGTH` | 10 | Trail positions for perfect shots |
| `SMASH_TRAIL_LENGTH` | 14 | Trail positions for smash shots |
| `PERFECT_TRAIL_COLOR` | `'#4f4'` | Trail color for perfect shots (green) |
| `SMASH_TRAIL_COLOR` | `'#f44'` | Trail color for smash shots (red) |
| `PERFECT_TRAIL_CHAR` | `'*'` | Trail character for perfect shots |
| `SMASH_TRAIL_CHAR` | `'#'` | Trail character for smash shots |
| `PERFECT_PARTICLES` | 10 | Particle count on perfect hit |
| `SMASH_PARTICLES` | 14 | Particle count on smash hit |

### Module Impact

| Module | Changes |
|---|---|
| `src/constants.js` | Add 11 new constants |
| `src/ball.js` | Accept `trail_opts` in `hit()`; use configurable max in `update()` trail push |
| `src/main.js` | Wire timing/smash multipliers; pass trail_opts; enhance particle count |
| `src/render.js` | Use ball's `trail_char`, `trail_color` in `ball_trail()` |
| `tests/main.test.js` | Integration tests for perfect/smash speed |
| `tests/ball.test.js` | Tests for trail config in hit() |
| `tests/render.test.js` | Tests for variable trail rendering |

## Phase 1: Tests (TDD)

Write test cases before implementation:

1. **`tests/ball.test.js`**
   - `ball.hit()` with `speed_mult = 1.5` → speed ~1.5x higher than `speed_mult = 1.0`
   - `ball.hit()` with `trail_opts.length = 10` → `b.trail_max = 10`
   - Trail char and color are set from `trail_opts`

2. **`tests/main.test.js`**
   - PERFECT timing produces `speed_mult` including `PERFECT_SPEED_MULT`
   - Net smash activates when player is within `NET_VOLLEY_RANGE` and ball above `NET_HEIGHT`
   - Smash shots produce higher `speed_mult` than non-smash
   - Smash shots produce `trail_opts` with smash-specific values

3. **`tests/render.test.js`**
   - `ball_trail()` uses ball's `trail_char` for rendering
   - `ball_trail()` uses ball's `trail_color` for fill style

## Phase 2: Data Structures & Constants

Add constants to `src/constants.js` (see table above).

## Phase 3: Core Logic

### `src/ball.js`
- `hit()`: accept optional `trail_opts = {}` parameter; set `b.trail_max_length = trail_opts.length || 5`; `b.trail_char = trail_opts.char || 'o'`; `b.trail_color = trail_opts.color || '#ff0'`
- `update()`: replace hardcoded `> 5` with `> (b.trail_max_length || 5)`

### `src/main.js`
- After timing quality, compute `timing_mult = timing_quality === 'PERFECT' ? PERFECT_SPEED_MULT : 1.0`
- Detect smash: `is_smash = Math.abs(human_player.z - COURT_LENGTH/2) < NET_VOLLEY_RANGE && ball_obj.y > NET_HEIGHT && timing_quality !== null`
- Compute `smash_mult = is_smash ? SMASH_SPEED_MULT : 1.0`
- Build `trail_opts` based on smash/perfect/normal
- Pass `trail_opts` to `ball.hit()`
- Spawn `PERFECT_PARTICLES` or `SMASH_PARTICLES` particles for special shots

### `src/render.js`
- `ball_trail(trail, ball)`: use `ball.trail_char` instead of `'o'`; use `ball.trail_color` instead of `'#ff0'`

## Phase 4: UI/Output

No structural UI changes. Existing timing feedback already displays "PERFECT"/"GOOD"/"LATE". The enhanced visual effects (longer/colored trail, more particles) render through existing systems.
