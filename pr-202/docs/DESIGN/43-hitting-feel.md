# Issue 43: 击球手感重构 — Design

## Architecture

The hitting feel refactor touches the **input → detection → physics → output** pipeline:

```
Player Input → can_hit() check → ball.hit() → ball.update() → render
                    ↑                    ↑
              Hit Range           Speed / Prediction
              Constants           Landing calc
              Visual flag
```

New data flows:
- `player.in_hit_range(p, ball)` → boolean, used by render for visual indicator
- `ball.predict_landing(b)` → `{x, z}` or null, used by render for landing marker
- `player.can_hit_this_frame` flag set during update, read by render

## Data Structures

### New constants (`src/constants.js`)
```
HIT_RANGE_H = 2.5        // horizontal hit radius
HIT_HEIGHT_MIN = 0.1     // minimum ball height to hit
HIT_HEIGHT_MAX = 2.5     // maximum ball height to hit
```

### Modified `HIT_PARAMS` speeds (reduced ~30%)
```
HIT_FLAT:   speed 0.55 → 0.40
HIT_TOPSPIN: speed 0.45 → 0.35
HIT_SLICE:  speed 0.40 → 0.30
HIT_LOB:    speed 0.30 → 0.25
```

### Player object additions
```
can_hit_this_frame: false  // set by main.js, read by render.js
```

## Module Design

### `src/constants.js`
- Add `HIT_RANGE_H`, `HIT_HEIGHT_MIN`, `HIT_HEIGHT_MAX`
- Reduce all `HIT_PARAMS.speed` values

### `src/player.js`
- `can_hit(p, ball)` — restructure: use horizontal distance check with `HIT_RANGE_H` + height bounds `HIT_HEIGHT_MIN`/`HIT_HEIGHT_MAX` instead of 3D distance
- `in_hit_range(p, ball)` — same geometry check without requiring `PLAYER_IDLE` state (for rendering indicator)

### `src/ball.js`
- `predict_landing(b)` — solve quadratic for time when `y == BALL_RADIUS` under current gravity, return `(x, z)` at that time; return null if ball is on ground or moving away from player side

### `src/main.js`
- After `player.update()`, call `player.in_hit_range()` and store result on player as `can_hit_this_frame`
- Call `ball.predict_landing()` and pass predicted position to render

### `src/render.js`
- `render.player(p, label)` — when `p.can_hit_this_frame` is true, draw with bright color + `*` prefix or glow effect
- `render.landing_marker(predicted)` — draw `X` at predicted landing position on court

### `src/ai.js`
- Replace inline `can_reach` check (lines 80-83) with same constants: `Math.abs(dx) < HIT_RANGE_H && ball.y < HIT_HEIGHT_MAX && ball.y > HIT_HEIGHT_MIN`
- Keeps AI and player hit logic consistent

## Data Flow

```
main.js update_playing():
  player.update(human)          → tick hit timer
  in_range = player.in_hit_range(human, ball)
  human.can_hit_this_frame = in_range

  if shot && player.can_hit(human, ball):
    player.swing()
    ball.hit(...)

  landing = ball.predict_landing(ball_obj)

draw_game():
  render.player(human, "P")    → uses can_hit_this_frame
  render.landing_marker(landing)  → draws X
```

## Test Plan

See `docs/TASKS/43-hitting-feel.md` Phase 1.

Phases:
1. Tests (TDD)
2. Constants & Player Hit Range
3. Ball Speed & Prediction
4. Visual Feedback
5. AI Alignment
