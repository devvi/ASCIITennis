# Issue 92: 犯规判定优化 — Design Document

## Architecture

### New Constants (`src/constants.js`)

| Constant | Value | Description |
|---|---|---|
| `BALL_REPLAY` | `"replay"` | Ball state allowing physics continuation after violation |
| `STATE_VIOLATION_REPLAY` | `"violation_replay"` | Game state for replay phase |
| `REPLAY_FRAME_COUNT` | `90` | Number of frames (~1.5s at 60fps) for replay duration |

### Ball State Machine Extension

Current states: `HELD → IN_PLAY → (OUT | NET | BOUNCE | DOUBLE_BOUNCE)`

New path: when violation is detected, ball transitions from its current state (OUT/NET/DOUBLE_BOUNCE or detected in update_playing) to `BALL_REPLAY`, which allows physics to continue (gravity, movement, bounce) while skipping net/out-of-bounds detection.

After replay timer expires, ball transitions to a terminal state (the ball update freezes in place — stops updating position when it goes far enough out of bounds).

### Game State Machine Extension

Current: `MENU → SERVING → PLAYING → POINT_SCORED → SERVING (or GAME_OVER)`

New: `MENU → SERVING → PLAYING → VIOLATION_REPLAY → POINT_SCORED → SERVING (or GAME_OVER)`

### Data Flow

```
update_playing()
  → violation detected
  → set ball.state = BALL_REPLAY
  → record replay_landing_x, replay_landing_z (first out-of-bounds point)
  → set game_state = STATE_VIOLATION_REPLAY
  → start replay_timer = REPLAY_FRAME_COUNT

update_violation_replay()
  → replay_timer--
  → ball.update(ball_obj)   // physics continues in REPLAY mode
  → if replay_timer <= 0:
      → ball.state = BALL_HELD (or other terminal)
      → game_state = STATE_POINT_SCORED
      → (existing point_scored flow follows)
```

### Ball Physics in REPLAY Mode

In `ball.update()`:
- Guard changed from `if (state !== BALL_IN_PLAY) return` to `if (state !== BALL_IN_PLAY && state !== BALL_REPLAY) return`
- In REPLAY mode:
  - Apply gravity, air resistance, spin, position update (same as IN_PLAY)
  - Apply bounce on ground contact (same as IN_PLAY)
  - **Skip** net collision detection (already violated)
  - **Skip** out-of-bounds detection (already violated)
  - When ball goes far beyond court (z < -5 or z > COURT_LENGTH + 5), freeze velocity (stop updating position) to prevent infinite drift

## Module Impacts

### `src/constants.js`
- Add `BALL_REPLAY`, `STATE_VIOLATION_REPLAY`, `REPLAY_FRAME_COUNT`

### `src/ball.js`
- Modify `update()` guard to accept `BALL_REPLAY`
- In REPLAY mode: full physics, bounce, skip net/OOB checks, freeze at extreme boundaries

### `src/main.js`
- Add `replay_timer`, `replay_landing_x`, `replay_landing_z` state variables
- Modify `resolve_violation_point()` → split into violation detection + replay entry
- Add `update_violation_replay()` function
- Update `gameLoop()` to dispatch `STATE_VIOLATION_REPLAY`
- Update `draw_game()` to render during `STATE_VIOLATION_REPLAY` (court, net, players, ball, landing marker, referee)
- Remove referee timer decrement from `update_point_scored()` (handled in update_violation_replay)

### `src/render.js`
- Update `render.ball()` to render ball when state is `BALL_REPLAY` (in addition to `in_play`/`bounce`)
- No other rendering changes needed — existing render path already draws all elements

### `tests/ball.test.js`
- Add tests for `BALL_REPLAY` state: physics continuation, bounce, multiple bounces, freeze at extreme boundaries

### `tests/main.test.js`
- Add integration tests: violation → replay → point_scored flow, replay timer, referee message displayed during replay
