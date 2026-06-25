# Issue 100: Mario Tennis GBC-style Serve & Angle Control — Design

## Architecture

### Current State
- Serve uses a charge-bar mechanic (hold button → release at full power for S serve).
- Service faults exist — `VIOLATION_SERVE_FAULT` triggers when serve lands outside service box.
- A/D keys control lateral player movement.
- Shot target_x is randomized (`Math.random()`) during both rallies and serves.
- AI serves go through `do_serve()` with random target_x but power hardcoded to 1.

### Target State
1. **GBC-style serve toss** — Left click tosses ball upward; player must time swing to hit at peak for S serve.
2. **No service faults** — Serve always lands in service box; quality expressed as speed (S serve vs normal) + angle.
3. **A/D angle control** — A/D keys control shot/serve horizontal aim angle instead of player movement.
4. **Movement** — W/S controls forward/backward only for human player.

---

## Data Structures

### New Constants (`constants.js`)
```js
SERVE_TOSS_HEIGHT = 2.5        // peak height of serve toss
SERVE_TOSS_DURATION = 30       // frames to reach peak (used for timing)
SERVE_S_SPEED_MULT = 1.5       // multiplier for S serve speed over normal SERVE_SPEED_MAX
SERVE_NORMAL_SPEED = 0.35      // speed when not at peak
SERVE_ANGLE_MAX = SINGLES_WIDTH * 0.4  // max angle deviation with A/D
```

### Removed Constants
```js
SERVE_CHARGE_MAX_FRAMES = 30   // REMOVE
SERVE_SPEED_MIN = 0.25         // REMOVE (replaced by fixed normal speed)
```

### Removed Violation
```js
VIOLATION_SERVE_FAULT = "serve_fault"  // REMOVE
```

### New serve state (`main.js` — added to game state)
```js
serve_toss_started: false   // true once ball is tossed
serve_toss_frames: 0        // frames since toss started
serve_toss_peak: false      // true when ball is at peak height
```

---

## Module Design

### 1. `input.js` — Serve toss trigger & angle input

**Serve trigger:**
- `pressed(BTN_A)` (left click/mouse down) → starts serve toss (sets `serve_toss_started = true` in main).
- No more `get_serve()` charge logic, `get_serve_power()`, `reset_serve_charge()`.
- Remove `_serve_charge_start`, `_serve_charge_frames` state.
- Remove `SERVE_CHARGE_MAX_FRAMES` import.

**Angle input:**
- Add `get_aim_angle()` → returns `-1` (A held), `0` (none), or `+1` (D held).
- `get_movement()` → no longer reads `BTN_LEFT`/`BTN_RIGHT` for human player.

### 2. `main.js` — New serve flow

**Serve state machine:**
```
STATE_SERVING:
  1. Player presses mouse button → serve_toss_started = true, serve_toss_frames = 0
  2. Each frame while tossing: serve_toss_frames++, ball rises with lerp toward Y = SERVE_TOSS_HEIGHT
  3. At peak (frame = SERVE_TOSS_DURATION/2): ball reaches max height, starts falling
  4. Player must press mouse button (BTN_A) while ball is in the air to swing
     - If hit at peak (± small window) → S serve (full speed SERVE_SPEED_MAX * SERVE_S_SPEED_MULT)
     - If hit before/after peak → normal serve (SERVE_NORMAL_SPEED)
  5. If ball falls below hit height without swing → miss (rare; should re-serve)
  6. AI serve: same logic but auto-timed based on difficulty
```

**Serve resolution:**
- `do_serve(timing_quality, angle)`:
  - `timing_quality`: `"s_serve"` or `"normal"`
  - `angle`: value from `[-1, 1]` mapped to `[-SERVE_ANGLE_MAX, SERVE_ANGLE_MAX]`
  - `target_x = player.x + angle * SERVE_ANGLE_MAX`
  - `target_z` = service box depth (fixed)
  - **No fault check** — serve always lands in service box via hardcoded target z within bounds

**Removed:**
- `serve_fault_checked` variable
- `resolve_violation_point("serve_fault", ...)` calls
- `VIOLATION_MESSAGES.serve_fault`
- Line 229-236 in current `update_playing()` (serve fault check)

**Human player shot aim during rallies:**
- `input.get_aim_angle()` used in `update_playing()` to determine `target_x`:
  ```js
  const angle = input.get_aim_angle();
  const target_x = angle * SINGLES_WIDTH * 0.35; // no randomness
  ```
- AI shot aim continues using existing `Math.random()` logic unchanged.

### 3. `player.js` — Remove lateral movement

- `move(p, dx, dz)`: for human players, `dx` is always 0 (no lateral movement from input).
- AI still uses both dx/dz from its own internal target logic.
- No structural changes — AI player movement unaffected.

### 4. `ball.js` — Serve with angle param

- `serve(b, from_x, from_z, target_x, target_z, timing_quality)`:
  - Accept `timing_quality` instead of `power` number.
  - `timing_quality === "s_serve"` → speed = `SERVE_SPEED_MAX * SERVE_S_SPEED_MULT`
  - `timing_quality === "normal"` → speed = `SERVE_NORMAL_SPEED`
  - `target_x` already passed in; no change to function signature beyond swap of `power` → `timing_quality`.

### 5. `ai.js` — AI serve

- AI serve in `do_serve()`:
  - Random chance of S serve based on difficulty (easy: 10%, hard: 50%).
  - target_x uses existing random logic but always lands in service box.
  - AI angle control unchanged.

### 6. `render.js` — UI updates

- Remove charge bar rendering (lines 316-321 in current `draw_game()`).
- Show toss animation: ball rendered at computed toss Y during serve preparation.
- Show "Click to toss" / "Click to swing" text during serve phases.
- S serve indicator (e.g., "S SERVE!" text flash).
- Remove "FAULT!" from referee messages.

### 7. `constants.js` — Cleanup

- Add: `SERVE_TOSS_HEIGHT`, `SERVE_TOSS_DURATION`, `SERVE_S_SPEED_MULT`, `SERVE_NORMAL_SPEED`, `SERVE_ANGLE_MAX`
- Remove: `SERVE_CHARGE_MAX_FRAMES`, `SERVE_SPEED_MIN`
- Keep: `SERVE_SPEED_MAX` (still used as base for S serve multiplier)
- Remove: `VIOLATION_SERVE_FAULT` from violation constants

---

## Data Flow

### Serve Flow (human player)
```
STATE_SERVING
  → input: pressed(BTN_A) → serve_toss_started = true
  → each frame: serve_toss_frames++, ball.y = lerp(1.0, SERVE_TOSS_HEIGHT, t)
  → at peak (t=0.5): ball.y = SERVE_TOSS_HEIGHT, starts descent
  → input: pressed(BTN_A) during ball rise/fall:
    → calc timing_quality based on proximity to peak frame
    → angle = input.get_aim_angle() → target_x = player.x + angle * SERVE_ANGLE_MAX
    → ball.serve(from, target, timing_quality)
    → STATE_PLAYING
  → ball falls below hit height without input → re-serve (reset toss)
```

### Rally Shot Aim (human player)
```
update_playing()
  → input.get_aim_angle() → -1/0/1
  → target_x = angle * SINGLES_WIDTH * 0.35 (instead of Math.random())
  → ball.hit(hit_x, hit_y, hit_z, target_x, target_z, shot, 0)
```

---

## Module Impact Summary

| Module | Change |
|--------|--------|
| `src/constants.js` | Add 5 new constants; remove 2; remove `VIOLATION_SERVE_FAULT` |
| `src/input.js` | Remove charge state; add `get_aim_angle()`; `get_movement()` no longer reads left/right; remove `get_serve_power()`, `reset_serve_charge()` |
| `src/main.js` | New serve state machine with toss/timing/angle; remove fault checking; use `get_aim_angle()` for rally shots; remove charge bar calls |
| `src/player.js` | `move()` ignores dx for human player |
| `src/ball.js` | `serve()` accepts `timing_quality` string instead of `power` number; speed selection updated |
| `src/ai.js` | AI serve randomly may get S serve; otherwise unchanged |
| `src/render.js` | Replace charge bar with toss visual; show serve timing text; remove FAULT message |
| `tests/input.test.js` | Rewrite serve-related tests; add angle tests |
| `tests/main.test.js` | Remove fault tests; add serve toss/timing tests; add angle control tests |
| `tests/ball.test.js` | Update serve tests for new timing_quality param |
| `tests/player.test.js` | Update move tests for no lateral human movement |
