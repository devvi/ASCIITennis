# Design: Serve Power Meter (parent #127)

## Architecture

The power meter adds a **hold-to-charge** axis to the serve. During the toss, the player holds the button to build charge (0–100%). Releasing fires the serve at the current charge level. If the player holds through the entire toss cycle without releasing, the serve auto-fires at max charge.

Charge is independent of the toss loop — the ball tosses up/down in a loop as long as the button is held, allowing charge to accumulate across multiple toss cycles up to the `SERVE_CHARGE_DURATION` cap (45 frames = ~0.75s).

## Data Structures

### New constants (`constants.js`)
| Constant | Value | Description |
|---|---|---|
| `SERVE_SPEED_MIN` | `0.25` | Minimum serve speed (0% charge) |
| `SERVE_CHARGE_DURATION` | `45` | Frames to reach 100% charge |

Constants already present (no change needed):
- `SERVE_SPEED_MAX = 0.55` — speed at 100% charge
- `SERVE_S_SPEED_MULT = 1.5` — multiplier applied on top for s_serve timing
- `SERVE_NORMAL_SPEED = 0.35` — currently unused in new model (replaced by interpolation)

### New state variable (`main.js`)
```js
let serve_charge;  // 0.0 to 1.0, percentage of charge
```

### `ball.serve()` signature change
```js
serve(b, from_x, from_z, target_x, target_z, timing_quality = "normal", power = 0)
```

## Module-by-module changes

### 1. `src/constants.js`
- Add `SERVE_SPEED_MIN = 0.25`
- Add `SERVE_CHARGE_DURATION = 45`

### 2. `src/ball.js`
- `serve()` accepts 6th parameter `power` (0–1)
- Speed interpolation: `SERVE_SPEED_MIN + power * (SERVE_SPEED_MAX - SERVE_SPEED_MIN)`
- If `timing_quality === "s_serve"`: multiply speed by `SERVE_S_SPEED_MULT`
- Vertical velocity scales similarly: `vy = 0.10 + power * 0.08`
- Same structure for vx/vz direction calculation

### 3. `src/main.js`
- Add `serve_charge` to state variables
- `setup_serve()` resets `serve_charge = 0`
- `update_serving()` — human branch:
  - On toss start: `serve_charge = 0`
  - Each frame while toss active AND button held: increment `serve_charge += 1/SERVE_CHARGE_DURATION`, cap at 1.0
  - Auto-fire when `serve_charge >= 1.0`
  - On button release OR auto-fire: call `do_serve(timing_quality, angle, serve_charge)` then reset charge
- `update_serving()` — AI branch:
  - When serve timer expires, select power based on difficulty before calling `do_serve()`
  - Hard AI: `0.8 + Math.random() * 0.2` (80–100%)
  - Easy AI: `0.3 + Math.random() * 0.3` (30–60%)
- `do_serve(timing_quality, angle, power)` — passes `power` to `ball.serve()`

### 4. `src/render.js`
- New method `render.serve_meter(charge)`:
  - Only draws during `STATE_SERVING` when charge > 0
  - Horizontal bar, 40px wide, 5px tall, centered at (100, 25)
  - Bar fill: left-to-right proportional to charge
  - Color: green (#0f0) for charge < 0.6, yellow (#ff0) for 0.6–0.85, red (#f00) for > 0.85
  - Called from `draw_game()` after HUD during serving state

### 5. `src/ai.js`
- No structural changes. AI charge selection happens in `main.js` `update_serving()`.

### 6. `src/input.js`
- No changes needed. `held()` tracking already works for charge duration.

## Flow

```
setup_serve() → serve_charge = 0
                ↓
update_serving():
  ┌─ Human: press button → toss starts, charge = 0
  │  Each frame while held: charge += 1/45, cap at 1.0
  │  Release button → do_serve(timing, angle, charge)
  │  charge >= 1.0 → auto-fire at max
  │
  └─ AI: serve_timer-- → select power by difficulty → do_serve(...)

do_serve(timing, angle, power):
  ball.serve(ball_obj, ..., timing, power)

ball.serve(..., timing, power):
  base = SERVE_SPEED_MIN + power * (SERVE_SPEED_MAX - SERVE_SPEED_MIN)
  if s_serve: base *= SERVE_S_SPEED_MULT
  vx/vz = direction * base, vy = 0.10 + power * 0.08
```

## Test Plan

### Phase 1 — Tests (14 test cases)

**ball.serve() power param (4 tests):**
1. `serve` accepts power param and produces different speed
2. power=0 → speed = SERVE_SPEED_MIN
3. power=1 → speed = SERVE_SPEED_MAX
4. power=0.5 → speed at midpoint

**render.serve_meter (3 tests):**
5. serve_meter(0) draws empty bar
6. serve_meter(1) draws full bar
7. serve_meter(0.5) draws half bar with correct color

**main.js update_serving charge (4 tests):**
8. Starts charge on first press
9. Charge increments each frame
10. Charge caps at 100%
11. Release fires serve at current charge

**AI charge selection (2 tests):**
12. Hard AI range 80–100%
13. Easy AI range 30–60%

**Charge reset (1 test):**
14. Charge resets to 0 on new serve
