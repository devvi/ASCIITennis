# Issue 43: 击球手感重构 — Tasks

## Related Modules

- `src/constants.js` — adjust HIT_PARAMS speed/arc/spin values, add HIT_RADIUS constant
- `src/player.js` — expand and restructure `can_hit()` with separate horizontal/vertical range
- `src/ball.js` — add landing position prediction function
- `src/render.js` — draw hit indicator on player, landing marker on court
- `src/main.js` — integrate prediction display, pass context to render
- `src/ai.js` — adjust AI hit detection params to match new ranges
- `tests/player.test.js` — new tests for expanded can_hit
- `tests/ball.test.js` — new tests for landing prediction
- `tests/render.test.js` — new tests for hit indicator / landing marker
- `tests/ai.test.js` — update AI hit behavior tests

## Impacts

- Hit detection becomes more forgiving (larger radius, height-bounded instead of 3D distance)
- Visual feedback adds clarity without changing game logic
- Ball physics feels more deliberate and readable
- AI must use the same `can_hit` logic (or equivalent) for consistency

---

## Phase 1: Tests (TDD)

Write test cases for all new/modified behavior. Tests must pass before implementation code is written.

- `player.can_hit()` returns true within expanded horizontal radius and valid height range (e.g. ball.y between 0.1 and 2.5)
- `player.can_hit()` returns false when ball is beyond horizontal range
- `player.can_hit()` returns false when ball is too high or too low
- `ball.predict_landing(b)` returns {x, z} where ball will hit ground (accounting for gravity, vz, vx)
- `ball.predict_landing(b)` returns null if ball already on ground or moving away
- `render.can_hit_indicator()` draws a special character (e.g. bright `P`) when player can hit
- `render.landing_marker()` draws an `X` at predicted landing position
- AI `can_reach` updates to match player's expanded `can_hit` range

**File:** `tests/player.test.js` (extend), `tests/ball.test.js` (extend), `tests/render.test.js` (extend), `tests/ai.test.js` (extend)

---

## Phase 2: Constants & Player Hit Range

- Add `HIT_RANGE_H = 2.5` — horizontal hit radius in constants.js
- Add `HIT_HEIGHT_MIN = 0.1`, `HIT_HEIGHT_MAX = 2.5` — vertical hit window
- Restructure `player.can_hit(p, ball)` to use horizontal distance + height bounds instead of 3D distance
- Increase hit radius from 1.5 to 2.5
- Add `player.in_hit_range(p, ball)` that checks the same bounds without checking player state (for rendering the indicator)

**File:** `src/constants.js`, `src/player.js`

---

## Phase 3: Ball Speed & Prediction

- Reduce HIT_PARAMS speeds: flat 0.55→0.40, topspin 0.45→0.35, slice 0.40→0.30, lob 0.30→0.25
- Add `ball.predict_landing(b)` to calculate predicted landing (x, z) based on current trajectory and gravity
  - Solve for time when y reaches BALL_RADIUS (quadratic)
  - Return (x, z) at that time, or null if ball is moving away / already on ground
- Adjust SPIN_FACTOR / AIR_RESISTANCE if needed for predictable arcs

**File:** `src/constants.js`, `src/ball.js`

---

## Phase 4: Visual Feedback (Renderer)

- `render.player(p, label)` — when `p.can_hit_this_frame` is true, draw with bright color + `*` prefix or glow effect
- `render.landing_marker(x, z)` — draw `X` character at predicted landing position on court
- Pass predicted landing and hit indicator flags from `main.js` update to render calls

**File:** `src/render.js`, `src/main.js`

---

## Phase 5: AI Alignment

- Update AI `can_reach` check in `ai.js` to use same constants as player (`HIT_RANGE_H`, `HIT_HEIGHT_MIN/MAX`)
- Ensure AI hit behavior is consistent with new ball speeds

**File:** `src/ai.js`

---

## Phase 1 Issue Tracking

- [x] Created GitHub Issue: [#44 Phase 1: Tests](https://github.com/devvi/ASCIITennis/issues/44)

## Phase 2 Issue Tracking

- [x] Created GitHub Issue: [#45 Phase 2: Constants & Hit Range](https://github.com/devvi/ASCIITennis/issues/45)

## Phase 3 Issue Tracking

- [x] Created GitHub Issue: [#46 Phase 3: Ball Speed & Prediction](https://github.com/devvi/ASCIITennis/issues/46)

## Phase 4 Issue Tracking

- [x] Created GitHub Issue: [#47 Phase 4: Visual Feedback](https://github.com/devvi/ASCIITennis/issues/47)

## Phase 5 Issue Tracking

- [x] Created GitHub Issue: [#48 Phase 5: AI Alignment](https://github.com/devvi/ASCIITennis/issues/48)
