# Issue 62: 球场以及球场规则制定 (Court and Court Rules)

## Related Modules

- `src/constants.js` — add violation type constants, referee position constant
- `src/court.js` — fix `is_in_bounds()` to use `SINGLES_WIDTH`; add `is_in_service_box()` for serve validation
- `src/ball.js` — add `last_hit_by` field to ball state; detect double bounce per side
- `src/scoring.js` — add violation-based point resolution helper
- `src/main.js` — add referee state, track last-hitter in update_playing, update point resolution to use last-hitter + violation type
- `src/render.js` — add `render.referee()` function drawing referee + judgment text
- `tests/ball.test.js` — add tests for last_hit_by, double bounce detection, singles boundary out
- `tests/court.test.js` — add tests for singles boundary, service box containment
- `tests/scoring.test.js` — add tests for violation-based scoring
- `tests/render.test.js` — add tests for referee rendering with violation messages

## Impacts

- Changes boundary detection to use singles court width (affects ball out-of-bounds and scoring)
- Adds last_hit_by tracking to ball state (affects ball.js, main.js)
- Adds referee render logic (new rendering in render.js)
- No changes to AI, input, camera, player movement

---

## Phase 1: Tests (TDD)

Write test cases before implementation.

### ball.test.js additions:
- `new()` creates ball with `last_hit_by` = null
- `hit()` sets `last_hit_by` correctly
- double bounce on same side detected and sets state to DOUBLE_BOUNCE
- ball beyond singles sideline with bounce is OUT
- ball between singles and doubles sideline is OUT

### court.test.js additions:
- `is_in_bounds()` with singles width rejects ball in doubles alley
- `is_in_service_box()` returns true for ball inside a service box, false otherwise

### scoring.test.js additions:
- `resolve_violation(score, last_hitter, violation)` awards point correctly for OUT/NET/DOUBLE_BOUNCE

### render.test.js additions:
- `referee()` draws referee character
- `referee()` with violation message displays correct text

**File:** `tests/ball.test.js`, `tests/court.test.js`, `tests/scoring.test.js`, `tests/render.test.js`

---

## Phase 2: Data structures

- Add violation type constants to `constants.js`: `VIOLATION_NONE`, `VIOLATION_OUT`, `VIOLATION_NET`, `VIOLATION_DOUBLE_BOUNCE`, `VIOLATION_SERVE_FAULT`
- Add `last_hit_by` field to ball object in `ball.new()` (initialize to null)
- Add referee state object: `{ message, timer, violation_type }` to main.js
- Fix `court.is_in_bounds()` to check against `SINGLES_WIDTH` / 2 instead of `COURT_WIDTH` / 2
- Add `court.is_in_service_box(x, z, side)` method

**File:** `src/constants.js`, `src/ball.js`, `src/court.js`

---

## Phase 3: Core logic

- In `ball.hit()`, set `last_hit_by` to the hitter index (0 = player, 1 = AI)
- In `ball.update()`, detect double bounce: when ball bounces, check if it's the same side as before
- Add `scoring.resolve_violation()` that takes `(score, last_hitter, violation_type)` and returns the winner index + result string
- In `main.js` `update_playing()`:
  - Replace the simple side-based resolution with last_hitter + violation logic
  - When ball goes OUT, NET, or DOUBLE_BOUNCE, determine winner and set referee state
  - Track rally hits and which side the ball is on for double bounce detection

**File:** `src/ball.js`, `src/scoring.js`, `src/main.js`

---

## Phase 4: UI/output

- Add `render.referee(referee_state)` that:
  - Draws a referee ASCII figure near the net post
  - Shows violation text (e.g. "OUT!", "NET!", "DOUBLE BOUNCE!", "FAULT!")
  - Text is visible during POINT_SCORED state, fades or disappears when timer ends
- Update `draw_game()` to call `render.referee()` when referee state is active
- Update POINT_SCORED display to include referee judgment

**File:** `src/render.js`, `src/main.js`

**PLAN_ISSUE:** #70
