# Product Requirements: Left/Right Key Shot Direction 优化 (左右键手感优化)

**Issue:** #152
**Feature:** Repurpose A/D keys from triggering lob shots to controlling shot direction angle via mouse hold duration.

## Motivation

Currently, holding A or D while returning the ball triggers `HIT_LOB` (via `get_shot_type()`), which has a high arc (`vy=0.50`) and low speed (`0.25`). This consistently produces high, far shots that land out of bounds, making A/D keys feel unusable during rallies.

The player needs A/D to control shot direction/angle, not shot type. The desired mechanism uses mouse hold duration as an analog directional force modifier.

## Root Cause

1. **`get_shot_type()` returns `HIT_LOB` when A/D held** (`src/input.js:139`): Holding `BTN_LEFT` or `BTN_RIGHT` during a hit triggers `HIT_LOB` — the highest-arc, slowest shot type — which almost always flies out of bounds.
2. **`get_aim_angle()` returns discrete values only** (`src/input.js:128-132`): Returns `-1`, `0`, or `1` — no continuous/analog control.
3. **No mouse hold duration tracking**: The input system has no mechanism to measure time between mouse down and mouse up, which is needed for the proposed directional intensity.

## Feature List

### 1. Mouse hold duration tracking
- Track the time (in frames or ms) between `BTN_A` (mouse left button) press and release
- Store the hold duration as a value accessible by other input functions
- Reset on each press cycle

### 2. Continuous aim angle
- `get_aim_angle()` should return a continuous value in `[-1, 1]` when A or D is held, scaled by mouse hold duration
- The longer the mouse is held, the closer the angle approaches ±1 (full left/right)
- If neither A nor D is held, return 0 (center)
- Short mouse clicks produce subtle angles; long holds produce extreme angles

### 3. Remove HIT_LOB on A/D press
- `get_shot_type()` should no longer return `HIT_LOB` when `BTN_LEFT` or `BTN_RIGHT` is held
- Shot type should be determined by other keys (W/S) or default to `HIT_FLAT`
- A/D exclusively control shot direction

### 4. Update game loop targeting
- `main.js:update_playing()` should use the new continuous `get_aim_angle()` value (scaled by mouse duration) to compute `target_x` as a smooth range, not just 3 discrete positions
- The target_x should range between `-SINGLES_WIDTH * 0.35` and `+SINGLES_WIDTH * 0.35` based on the continuous angle value

### 5. 2P mode parity
- Apply the same changes to Player 2 input
- P2 should also use mouse hold duration (or keyboard equivalent via Shift) for directional intensity

## Acceptance Criteria

- Holding A or D while hitting no longer triggers HIT_LOB shots
- `get_aim_angle()` returns a continuous value in [-1, 1] proportional to mouse hold duration
- Brief mouse click + A = slight left angle; long mouse hold + A = sharp left angle
- `get_shot_type()` returns `null` when only A/D is held (no W/S), defaulting to `HIT_FLAT`
- Ball target_x varies smoothly across the full court width based on angle value
- Mouse hold duration resets correctly on each press cycle
- Existing movement (A/D for left/right movement) still works when not in a hit state
- All existing tests pass; new tests cover mouse duration, continuous angle, and directionally varied shots
