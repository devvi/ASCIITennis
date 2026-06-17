# Issue 92: 犯规判定优化 (Violation Judgment Optimization)

## Related Modules

- `src/constants.js` — add `BALL_REPLAY` ball state constant, `STATE_VIOLATION_REPLAY` game state constant, `REPLAY_FRAME_COUNT` duration constant
- `src/ball.js` — modify `update()` to continue physics simulation for `BALL_REPLAY` state; stop updating position only after replay timer expires or ball exits visible area
- `src/main.js` — add `STATE_VIOLATION_REPLAY` game state; modify violation detection to enter replay instead of immediately transitioning to POINT_SCORED; add replay update logic; add replay timer
- `src/render.js` — update `render.ball()` to render ball in `BALL_REPLAY` state; add landing zone highlighting during replay; keep referee message visible throughout replay
- `tests/ball.test.js` — add tests for ball physics continuation during replay state
- `tests/main.test.js` — add integration tests for violation → replay → point_scored flow

## Impacts

- Ball physics continues after violations (changes ball.js update behavior)
- Violation detection flow modified in main.js (enters replay before point_scored)
- Ball rendering updated to support replay state
- No changes to AI, input, camera, player movement

---

## Phase 1: Tests (TDD)

Write test cases before implementation.

### ball.test.js additions:
- `BALL_REPLAY` state allows physics to continue updating
- Ball in replay state still applies gravity, air resistance, bounce
- Ball in replay state can bounce multiple times
- Ball in replay state transitions to stopped state after replay timer expires

### main.test.js additions:
- Violation detection enters replay state instead of immediate point_scored
- Replay state displays referee message
- After replay timer expires, transitions to POINT_SCORED
- Replay timer countdown works correctly

**File:** `tests/ball.test.js`, `tests/main.test.js`

---

## Phase 2: Data structures

- Add `BALL_REPLAY = "replay"` constant to `constants.js`
- Add `STATE_VIOLATION_REPLAY = "violation_replay"` game state constant to `constants.js`
- Add `REPLAY_FRAME_COUNT = 90` constant (frames for replay duration) to `constants.js`
- Add `replay_timer` variable to main.js state
- Add `replay_landing_x`, `replay_landing_z` to store first-out-of-bounds landing position

**File:** `src/constants.js`

---

## Phase 3: Core logic

- In `ball.js`, modify `update()`:
  - Allow `BALL_REPLAY` state to continue physics (gravity, movement, bounce)
  - In replay mode, when ball goes beyond extreme boundaries (z < -5 or z > COURT_LENGTH + 5), stop updating position
  - In replay mode, skip net collision detection (already violated)
  - In replay mode, skip out-of-bounds detection (already violated)
- In `main.js`:
  - In `update_playing()`, when violation is detected, set `ball_obj.state = BALL_REPLAY`, record `replay_landing_x/z`, set `game_state = STATE_VIOLATION_REPLAY`, start `replay_timer`
  - Add `update_violation_replay()`: decrement `replay_timer`, call `ball.update()` to continue physics, when timer reaches 0, transition to POINT_SCORED
  - In `gameLoop()`, add dispatch for `STATE_VIOLATION_REPLAY`

**File:** `src/ball.js`, `src/main.js`

---

## Phase 4: UI/output

- Update `render.ball()` to render ball when state is `BALL_REPLAY` (or any state that's not `BALL_HELD`)
- During replay phase, keep the landing marker 'X' displayed at the recorded `replay_landing_x/z`
- Keep referee violation message displayed throughout the replay phase
- In `draw_game()`, during `STATE_VIOLATION_REPLAY`, continue rendering court, net, players, ball, landing marker, and referee

**File:** `src/render.js`, `src/main.js`
