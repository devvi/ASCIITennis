# Issue 63: 调整手感 — Tasks

## Related Modules

- `src/constants.js` — add serve charge constants
- `src/input.js` — add serve charge state (charge_start_time, is_charging)
- `src/ball.js` — modify `serve()` to accept variable speed; `hit()` unchanged
- `src/main.js` — tighten human hit target zone; integrate serve charge mechanic; pass charge info to render
- `src/ai.js` — tighten AI hit target zone per accuracy
- `src/render.js` — render serve power meter
- `tests/ball.test.js` — new tests for serve with variable speed
- `tests/input.test.js` — new tests for serve charge state
- `tests/main.test.js` — new tests (or extend test file) for hit target zone

## Impacts

- Hit targeting becomes safer, reducing unforced errors
- Serve gains depth with charge mechanic, making it more strategic
- AI will also play more consistently with tighter targeting
- No changes to ball physics, scoring, court, camera, or player hit detection

---

## Phase 1: Tests (TDD)

Write test cases for all new/modified behavior. Tests must pass before implementation code is written.

1. `ball.serve(b, x, z, tx, tz, power)` — speed scales with power (power 0→min speed, power 1→max speed)
2. `ball.serve(b, ..., 0)` uses minimum serve speed (~0.25)
3. `ball.serve(b, ..., 1)` uses maximum serve speed (~0.55)
4. `ball.serve(b, ..., 0.5)` uses medium serve speed (scales linearly)
5. `input.serve_power()` returns 0 when not charging
6. `input.serve_power()` increases over time when BTN_B/A held during serve state
7. Human hit target_x is bounded within `SINGLES_WIDTH * 0.7` (well inside sidelines)
8. Human hit target_z is bounded within `[COURTH_LENGTH - 4, COURTH_LENGTH - 2]` (safe before baseline)
9. AI hit target_x for easy difficulty well inside singles width
10. AI hit target_z for easy targets safe zone before service line

**File:** `tests/ball.test.js` (extend), `tests/input.test.js` (extend)

---

## Phase 2: Serve Charge Mechanic

### input.js
- Add `serve_charge_start: null` variable
- In `get_serve()`: when BTN_B held and state is SERVING, record charge start time on first frame; return `false` while charging
- When BTN_B released after charging, return `true` and store charge duration
- Add `get_serve_power()`: returns value 0.0–1.0 based on charge duration (clamp at max ~30 frames)
- Add `reset_serve_charge()`: clear charge state after serve

### constants.js
- Add `SERVE_CHARGE_MAX_FRAMES = 30` (frames to reach full power)
- Add `SERVE_SPEED_MIN = 0.25`
- Add `SERVE_SPEED_MAX = 0.55`

### ball.js
- Update `serve(b, from_x, from_z, target_x, target_z)` → `serve(b, from_x, from_z, target_x, target_z, power=1)`
- Speed = `SERVE_SPEED_MIN + power * (SERVE_SPEED_MAX - SERVE_SPEED_MIN)`
- vy scales too: `0.08 + power * 0.12` (weaker = more arc, stronger = flatter)

### main.js
- In `update_serving()`: call `input.get_serve()` which now handles charge
- On serve: get power from `input.get_serve_power()`, pass to `ball.serve()`
- Call `input.reset_serve_charge()` after serve

### render.js
- In `hud()` or serve state: draw power bar (e.g. `[====>     ]`) when charging

**File:** `src/input.js`, `src/constants.js`, `src/ball.js`, `src/main.js`, `src/render.js`

---

## Phase 3: Tighter Hit Targeting

### main.js
- Human hit target_x: `(Math.random() - 0.5) * SINGLES_WIDTH * 0.7` (range ±2.88)
- Human hit target_z: `COURT_LENGTH - 2 - Math.random() * 2` (range 19.77–21.77)

### ai.js
- AI hit target_x: `(Math.random() - 0.5) * SINGLES_WIDTH * (0.8 - config.accuracy * 0.3)`
- AI hit target_z: `1 + Math.random() * 3 * (1 - config.accuracy * 0.4)`

**File:** `src/main.js`, `src/ai.js`

---

## Phase 4: CI & Verification

- Run full test suite: `npm test`
- Verify all existing tests still pass
- Verify new tests pass
- Manual sanity check: ball should land in court >80% of the time on normal hits

**File:** N/A (verification only)

---

## Progress Tracking

**PLAN_ISSUE: #81**

- [ ] Phase 1: Tests (TDD)
- [ ] Phase 2: Serve Charge Mechanic
- [ ] Phase 3: Tighter Hit Targeting
- [ ] Phase 4: CI & Verification
