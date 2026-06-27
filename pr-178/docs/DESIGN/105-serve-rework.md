# Issue 105: Serve & Controls Rework — Design

## Problem Analysis

Three bugs were introduced by the GBC-style serve refactoring (issue #100):

### Bug 1: No Auto-loop Serve Toss
When the ball falls below hit height (y < 0.8) without being struck, `serve_toss_started` is set to `false`, requiring another mouse click to re-toss. The player must re-click every time they miss, which is tedious.

**Root cause:** `main.js:215-219` — the `else if (ball_obj.y <= 0.8)` branch resets `serve_toss_started = false`.

### Bug 2: A/D Keys Don't Move Player During Rallies
`input.get_movement()` always returns `dx = 0` (no horizontal input), and `player.move()` forces `dx = 0` for human players. A/D keys only work for `get_aim_angle()`, meaning the player cannot move laterally during rallies.

**Root cause:** Two places:
- `input.js:93-98` — `get_movement()` ignores BTN_LEFT/BTN_RIGHT
- `player.js:26` — `if (!p.is_ai) dx = 0;`

### Bug 3: Serve Always Faults
The serve ball crosses the z-bound threshold (`COURT_LENGTH + 2`) after bouncing, triggering a BALL_OUT violation. Two issues:
1. The z-bound checks (`b.z > COURT_LENGTH + 2`, `b.z < -2`) have no bounce guard — they fire regardless of whether the ball has bounced.
2. After the first bounce, `!court.is_in_bounds()` combined with `b.bounces > 0` triggers BALL_OUT on every subsequent frame if the ball leaves the court, even after a valid in-bounds bounce.

**Root cause:** `ball.js:67-78` — out-of-bounds check fires every frame after first bounce, not just at bounce time.

---

## Architecture Changes

### 1. Serve Toss Auto-loop (`main.js`)

**Change:** In `update_serving()`, when the ball falls below 0.8, auto-restart the toss instead of requiring a new click.

```js
// Before:
} else if (ball_obj.y <= 0.8) {
  serve_toss_started = false;
  serve_toss_frames = 0;
  ball_obj.y = 1.0;
}

// After:
} else if (ball_obj.y <= 0.8) {
  serve_toss_frames = 0;         // restart toss immediately
  ball_obj.y = 1.0;
}
```

Keep `serve_toss_started = true`, so the toss loops automatically.

### 2. Restore A/D Lateral Movement (`input.js`, `player.js`)

**`input.js`**: `get_movement()` reads BTN_LEFT/BTN_RIGHT for dx:

```js
get_movement() {
  let dx = 0, dz = 0;
  if (this.held(BTN_LEFT)) dx = -1;
  if (this.held(BTN_RIGHT)) dx = 1;
  if (this.held(BTN_UP)) dz = 1;
  if (this.held(BTN_DOWN)) dz = -1;
  return [dx, dz];
}
```

**`player.js`**: Remove the `dx = 0` forcing for human players:

```js
move(p, dx, dz) {
  // Remove: if (!p.is_ai) dx = 0;
  const new_x = p.x + dx * p.speed;
  const new_z = p.z + dz * p.speed;
  // ...
}
```

**Impact during serve state:** `update_serving()` does NOT call `player.move()`, so A/D has no movement effect during serve. They only affect `get_aim_angle()` for serve aim.

**Impact during rally:** A/D moves the player AND sets aim angle for the swing at the moment of hit. This is intentional — same keys serve dual purpose naturally.

### 3. Fix Serve Faults (`ball.js`, `main.js`)

#### 3a. Out-of-bounds detection (ball.js)

Move the `is_in_bounds` check INSIDE the bounce block so it only fires when a bounce occurs, not on every subsequent frame:

```js
if (b.y < BALL_RADIUS) {
  b.y = BALL_RADIUS;
  b.vy = -b.vy * BOUNCE_FACTOR;
  b.vx = b.vx * 0.8;
  b.vz = b.vz * 0.8;
  b.bounces += 1;

  if (!is_replay) {
    if (!court.is_in_bounds(b.x, b.z)) {
      b.state = BALL_OUT;            // bounced out of bounds
    } else {
      const side = b.z < COURT_LENGTH / 2 ? 0 : 1;
      if (b.last_bounce_side !== null && b.last_bounce_side === side) {
        b.state = BALL_DOUBLE_BOUNCE;
      } else {
        b.last_bounce_side = side;
      }
    }
  }
}

// Remove the old !court.is_in_bounds() block outside the bounce block
```

#### 3b. Far-out safety thresholds (ball.js)

Add bounce guard to the z-bound far-out checks:

```js
if (b.bounces > 0 && b.z > COURT_LENGTH + 5) {
  b.state = BALL_OUT;
}
if (b.bounces > 0 && b.z < -5) {
  b.state = BALL_OUT;
}
```

Extended threshold from ±2 to ±5 for generous safety margin.

#### 3c. Serve trajectory recalibration (ball.js)

Increase normal serve vy so the ball arcs deep enough to reach the service box:

```js
b.vy = is_s ? 0.18 : 0.14;
```

With vy=0.14 and speed=0.35:
- Air time: 2 * 0.14 / 0.006 ≈ 46.7 frames
- Air distance: 46.7 * 0.35 ≈ 16.3 z-units
- Landing z: 2 + 16.3 ≈ 18.3 (within service box: 17.8 to 23.8)

With vy=0.18 and speed=0.825 (S serve):
- Air time: 2 * 0.18 / 0.006 = 60 frames
- Air distance: 60 * 0.825 ≈ 49.5 z-units
- This overshoots the court, but after the first bounce out-of-bounds detection catches it — this is acceptable for a power serve that goes long.

#### 3d. Serve target_z within service box (main.js)

Change serve target to land within the opponent's service box:

```js
// Before:
const target_z = COURT_LENGTH * 0.7;

// After: service box for side 1 is 3*COURT_LENGTH/4 to COURT_LENGTH
const target_z = COURT_LENGTH * 0.85;  // ~20.2, within service box
```

---

## Module Impact Summary

| Module | Change |
|--------|--------|
| `src/input.js` | `get_movement()` includes A/D for dx |
| `src/player.js` | Remove `dx = 0` forcing for human players |
| `src/main.js` | Auto-loop serve toss; fix serve target_z |
| `src/ball.js` | Fix out-of-bounds detection; fix z-bound thresholds; recalibrate serve vy |
| `tests/input.test.js` | Update `get_movement()` tests — A/D should return dx |
| `tests/player.test.js` | Update — human player CAN move laterally now |
| `tests/ball.test.js` | Update out-of-bounds tests; update z-bound tests; add serve trajectory tests |
| `tests/main.test.js` | Add serve auto-loop tests; add serve-no-fault integration tests |

---

## Data Flow

### Serve Toss Loop
```
STATE_SERVING → click → toss started → ball rises → ball falls
  → player clicks at right moment → do_serve() → STATE_PLAYING
  → ball falls below 0.8 without click → auto re-toss (no click needed)
  → (loop)
```

### Rally Movement
```
update_playing()
  → input.get_movement() → returns dx from A/D, dz from W/S
  → player.move(human, dx, dz) → moves laterally/vertically
  → player.can_hit()? → swing → input.get_aim_angle() for shot aim
```

### Ball Out Detection
```
ball.update()
  → physics step
  → ball hits ground (y < BALL_RADIUS)?
    → bounce handling → bounces++
    → check is_in_bounds() → if out → BALL_OUT
    → else → check double bounce
  → check far-out safety (z > COURT_LENGTH+5 && bounces > 0) → BALL_OUT
  → check net collision
```
