# Issue 185 — Advanced Returns (高级回球) Design

## Architecture Overview

The advanced returns feature enhances the existing hit/timing system by wiring timing quality into speed multiplication and adding net smash detection. Visual effects are upgraded with configurable trail length/color/character and more particles for special shots.

### Data Flow (modified paths in bold)

```
main.js: update_playing()
  ├─ player.swing_with_timing() → timing_quality (PERFECT/GOOD/LATE)
  ├─ **timing_mult = PERFECT_SPEED_MULT if PERFECT else 1.0**
  ├─ **is_smash = near_net && ball_above_net**
  ├─ **smash_mult = SMASH_SPEED_MULT if is_smash**
  ├─ final_mult = combo_mult * fire_mult * timing_mult * smash_mult
  ├─ **ball.hit(..., final_mult, { trail_opts })**
  │   └─ ball stores trail_max_length, trail_char, trail_color
  │   └─ ball.update() uses configurable trail max length
  ├─ **particles: count based on shot type (PERFECT/SMASH → more)**
  └─ render.ball_trail(trail, trail_opts)
      └─ **uses ball.trail_char, ball.trail_color, configurable length**
```

### State Changes

No new game states. All changes are within the existing `STATE_PLAYING` update flow. The net smash check is a simple distance + height test in `main.js:update_playing()`.

## Module Changes

### src/constants.js — New constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `PERFECT_SPEED_MULT` | 1.3 | Speed multiplier for PERFECT timing |
| `SMASH_SPEED_MULT` | 1.6 | Speed multiplier for net smash |
| `NET_VOLLEY_RANGE` | 1.5 | Distance from net to trigger smash |
| `SMASH_TRAIL_LENGTH` | 12 | Trail positions for smash shots |
| `PERFECT_TRAIL_LENGTH` | 8 | Trail positions for perfect shots |
| `SMASH_PARTICLES` | 12 | Particles on smash |
| `PERFECT_PARTICLES` | 11 | Particles on perfect shot |
| `SMASH_TRAIL_COLOR` | '#f44' | Red trail for smash |
| `PERFECT_TRAIL_COLOR` | '#4f4' | Green trail for perfect |
| `SMASH_TRAIL_CHAR` | '#' | Trail character for smash |
| `PERFECT_TRAIL_CHAR` | '*' | Trail character for perfect |

### src/ball.js — Configurable trail options in hit()

- `hit()` accepts new optional parameter `trail_opts = { length, char, color }`
- Sets `b.trail_max_length`, `b.trail_char`, `b.trail_color` on ball
- `update()` replaces `if (b.trail.length > 5)` with `if (b.trail.length > (b.trail_max_length || 5))`
- Ball initialized with `trail_max_length: 5`, `trail_char: 'o'`, `trail_color: '#ff0'`

### src/main.js — Wire timing and smash into hit()

In `update_playing()` where human hits:
1. Compute `timing_mult = timing_quality === 'PERFECT' ? PERFECT_SPEED_MULT : 1.0`
2. Detect smash: player within `NET_VOLLEY_RANGE` of net line (`COURT_LENGTH/2`) AND ball above `NET_HEIGHT`
3. Compute `smash_mult = is_smash ? SMASH_SPEED_MULT : 1.0`
4. Build `trail_opts` object based on shot type (perfect/smash/normal)
5. Pass `total_speed_mult = combo_mult * fire_mult * timing_mult * smash_mult` to `ball.hit()`
6. Spawn more particles for perfect/smash shots

For smash: override `vy` to flatter trajectory (e.g., 0.08 instead of shot-type default)
For AI hits: no change needed — AI doesn't get timing or smash bonuses

### src/render.js — Configurable trail rendering

- `ball_trail()` reads per-ball trail properties: `trail_char`, `trail_color`
- Trail length determined by actual trail array length (ball already limits by `trail_max_length`)
- Each trail position uses `ball.trail_color` and `ball.trail_char`

### Particles

- Normal: 6 particles (unchanged)
- Perfect: `PERFECT_PARTICLES` (11)
- Smash: `SMASH_PARTICLES` (12)
- Particle colors can match trail color for special shots
- `MAX_PARTICLES` cap still applies

## Key Design Decisions

1. **Timing mult multiplies with combo and fire** — all multipliers stack multiplicatively for natural scaling
2. **Smash detection is per-hit, not persistent state** — each swing checks proximity + ball height independently
3. **Ball stores trail config** rather than passing to render — cleaner architecture, render just reads ball properties
4. **No new ball state needed** — smash is purely a speed/trajectory modifier at hit time
5. **AI and 2P use same swing path** — only human player gets timing quality + smash detection (2P could optionally use the same path in future)

## Test Plan

See `docs/TASKS/185-advanced-returns.md` for phased test cases.
