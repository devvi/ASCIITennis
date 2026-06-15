# Issue 63: 调整手感 — Design

## Architecture

Two independent changes to the **hit → ball flight → outcome** pipeline:

```
Tighter Targeting:   target randomizer → ball.hit() → land in court
Serve Power:         input charge state → ball.serve(power) → variable speed/arc
```

## Data Structures

### New constants (`src/constants.js`)
```
SERVE_CHARGE_MAX_FRAMES = 30   // frames to reach full serve power
SERVE_SPEED_MIN = 0.25         // minimum serve speed (weak)
SERVE_SPEED_MAX = 0.55         // maximum serve speed (strong)
```

### Input module additions (`src/input.js`)
```
serve_charge_start: null        // frame count when charging began
is_charging: false              // currently charging serve
```

### No new data on ball or player objects
- `ball.serve()` gets a 5th optional parameter `power` (0–1)
- `render.serve_power_meter(power)` reads a float, draws ASCII bar

## Module Design

### `src/input.js` — Serve charge state machine

```
get_serve():
  if BTN_B held AND state is SERVING:
    if !is_charging → record serve_charge_start, set is_charging
    return false (while charging)
  if BTN_B released AND is_charging:
    return true (trigger serve)
  return false

get_serve_power():
  if !is_charging → return 0
  duration = currentFrame - serve_charge_start
  return min(duration / SERVE_CHARGE_MAX_FRAMES, 1.0)

reset_serve_charge():
  serve_charge_start = null
  is_charging = false
```

### `src/ball.js` — Variable speed serve

```
serve(b, from_x, from_z, target_x, target_z, power=1):
  speed = SERVE_SPEED_MIN + power * (SERVE_SPEED_MAX - SERVE_SPEED_MIN)
  vy = 0.08 + power * 0.12   // weaker = more arc, stronger = flatter
  // rest same as before
```

### `src/main.js` — Tight hit targeting + serve charge integration

**Hit target tightening (human):**
```
target_x = (Math.random() - 0.5) * SINGLES_WIDTH * 0.7  // ±2.88
target_z = COURT_LENGTH - 2 - Math.random() * 2          // 19.77–21.77
```

**Serve charge integration:**
```
update_serving():
  if server === 0:
    if input.get_serve():              // now returns true only on release after charge
      power = input.get_serve_power()
      ball.serve(ball_obj, ..., power)
      input.reset_serve_charge()
  else:
    // AI serve unchanged
```

### `src/ai.js` — Tight hit targeting

```
target_x = (Math.random() - 0.5) * COURT_WIDTH * (0.8 - config.accuracy * 0.3)
target_z = 1 + Math.random() * 3 * (1 - config.accuracy * 0.4)
```

Easy AI (accuracy 0.5): range coefficient = 0.65, giving tighter than current
Hard AI (accuracy 0.9): range coefficient = 0.53, even tighter

### `src/render.js` — Serve power meter

When charging (new global flag `is_serving_charging` or read from input):
```
draw power bar at screen (60, 125):
  filled = floor(power * 10)
  bar = "[" + "=".repeat(filled) + " ".repeat(10 - filled) + "]"
```

## Data Flow

### Serve charge flow:
```
input.get_serve() called each frame during SERVING state
  → BTN_B held → start charge, return false
  → BTN_B held next frames → charge accumulates, return false
  → BTN_B released → return true, power available via get_serve_power()
  → main.js calls ball.serve(..., power) → ball in play with variable speed
  → input.reset_serve_charge() clears state
```

### Hit target flow:
```
ball.hit() called
  → target_x / target_z computed with tighter ranges
  → ball velocity computed from target direction × speed
  → ball lands inside court boundaries more consistently
```

## Test Plan

See `docs/TASKS/63-adjust-feel.md` Phase 1.

Phases:
1. Tests (TDD)
2. Serve Charge Mechanic
3. Tighter Hit Targeting
4. CI & Verification
