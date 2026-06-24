# Task Breakdown: Left/Right Key Shot Direction 优化 (左右键手感优化)

**Issue:** #152
**Related modules:** `src/input.js` (mouse duration, aim angle, shot type), `src/main.js` (targeting), `src/constants.js` (tunables), `tests/input.test.js`, `tests/main.test.js`

## Research Summary

### Root Cause

| Issue | Root Cause | Proposed Fix |
|-------|-----------|-------------|
| Holding A/D while returning produces high, far balls that always go out | `get_shot_type()` returns `HIT_LOB` when `BTN_LEFT` or `BTN_RIGHT` is held (`src/input.js:139`). `HIT_LOB` has `vy=0.50` (highest arc) and `speed=0.25` (slowest), making balls arc high and land far past the baseline. | Remove `HIT_LOB` from `get_shot_type()` when A/D held. Repurpose A/D to control shot direction. |
| Shot direction is ternary, not continuous | `get_aim_angle()` returns only `-1`, `0`, or `1` (`src/input.js:128-132`), giving only 3 possible target_x positions. | Track mouse hold duration; return continuous `[-1, 1]` value. |
| No mechanism to measure directional intensity | Input system has no frame-count or timestamp tracking for mouse button hold duration. | Add `mouse_hold_frames` counter incremented each frame while `BTN_A` is held, reset on release. |

### Current Implementation

- **`get_shot_type()`** (`src/input.js:134-142`): Returns `HIT_LOB` when `BTN_LEFT` or `BTN_RIGHT` is held and `BTN_B` is pressed. `HIT_LOB` params: `speed=0.25`, `vy=0.50`, `spin=0.1`.
- **`get_aim_angle()`** (`src/input.js:128-132`): Ternary output: `-1` (LEFT), `0` (none), `1` (RIGHT).
- **Mouse handling** (`src/input.js:53-63`): `mousedown` sets `BTN_A` and `BTN_B`; `mouseup` clears both. No duration tracking.
- **Hit targeting** (`src/main.js:290-293`): `target_x = angle * SINGLES_WIDTH * 0.35` → only 3 possible values: `±2.88`, `0`.

### Existing Test Coverage

| Module | Current Tests | Missing Tests |
|--------|--------------|---------------|
| `tests/input.test.js` | `pressed/held/released`, `get_movement()` directions, `get_aim_angle()` ternary output, `get_shot_type()` combinations, mouse events, update snapshots | Mouse hold duration tracking, continuous aim angle `[-1,1]`, shot type without A/D lob |
| `tests/main.test.js` | Human/AI target bounds, serve angle bounds, 2P mode | Directional target_x with continuous angle |

## Plan

### Phase 1: Tests (TDD)

#### 1a. Input tests — mouse hold duration
- Mouse down → 0 frames held → mouse up → duration = 0
- Mouse held for N update cycles → duration = N
- Duration resets to 0 on next mouse down
- Duration stops incrementing on mouse up

#### 1b. Input tests — continuous get_aim_angle()
- No A/D held → returns 0 regardless of mouse duration
- A held, short mouse hold → angle is small (near 0 but negative)
- A held, long mouse hold → angle approaches -1
- D held, short mouse hold → angle is small positive
- D held, long mouse hold → angle approaches 1
- Duration scaling formula produces results in [-1, 1]

#### 1c. Input tests — get_shot_type() without A/D lob
- Only A held + BTN_B pressed → returns HIT_FLAT
- Only D held + BTN_B pressed → returns HIT_FLAT
- W held + BTN_B pressed → returns HIT_TOPSPIN (unchanged)
- S held + BTN_B pressed → returns HIT_SLICE (unchanged)
- A+W held + BTN_B pressed → returns HIT_TOPSPIN (W takes priority)
- No keys + BTN_B pressed → returns HIT_FLAT (unchanged)

### Phase 2: Data structures

- Add `mouse_hold_frames` counter to input state (integer, 0 initially)
- Add `MAX_MOUSE_HOLD_FRAMES` constant in `src/constants.js` (e.g., 60 frames = ~1 second at 60fps)
- Add `MOUSE_ANGLE_MAX` constant for max directional offset (possibly reuse `SINGLES_WIDTH * 0.35`)

### Phase 3: Core logic

#### 3a. Track mouse hold duration in `createInput()`
- Initialize `mouse_hold_frames = 0`
- In `update()`: if `curr[BTN_A]` is true, increment `mouse_hold_frames`
- On `onMouseUp` / `onTouchEnd`: record final duration (but don't reset yet — value is read during hit detection)
- On next `onMouseDown` / `onTouchStart`: reset `mouse_hold_frames = 0`

#### 3b. Continuous `get_aim_angle()`
- Track `shot_direction_angle` set at moment of hit
- `get_aim_angle()` returns:
  - `0` if neither A nor D held
  - `(-1) * clamp(mouse_hold_frames / MAX_MOUSE_HOLD_FRAMES, 0, 1)` if A held
  - `(+1) * clamp(mouse_hold_frames / MAX_MOUSE_HOLD_FRAMES, 0, 1)` if D held
- The value is frozen at the moment `get_shot_type()` fires (i.e., when `BTN_B` is pressed)

#### 3c. Update `get_shot_type()` — remove A/D lob
- Remove `if (this.held(BTN_LEFT) || this.held(BTN_RIGHT)) return HIT_LOB;`
- A/D no longer affect shot type
- W → topspin, S → slice, default → flat
- Also remove the lob case for P2 input

#### 3d. Update `main.js:update_playing()` target calculation
- `target_x = get_aim_angle() * SINGLES_WIDTH * 0.35` — now a continuous value, no code change needed
- Ensure mouse duration is read at the correct frame (when `get_shot_type()` fires)

### Phase 4: UI / output

- Verify that A/D movement still works (player moves left/right during rallies)
- Verify that holding A/D + click produces directional shots with varying angles
- Verify that HIT_LOB is no longer triggered by A/D
- Verify that P2 controls work the same way in 2P mode

---

## Plan Issue Task Lists

**PLAN_ISSUE:** TBD (to be created)

### Phase 1: Tests (TDD)
- [ ] 1a. Mouse hold duration tracking tests
- [ ] 1b. Continuous get_aim_angle() tests with duration scaling
- [ ] 1c. get_shot_type() without A/D lob — verify HIT_FLAT default

### Phase 2: Data structures
- [ ] 2a. Add `mouse_hold_frames` to input state
- [ ] 2b. Add `MAX_MOUSE_HOLD_FRAMES` constant
- [ ] 2c. Add `MOUSE_ANGLE_MAX` (or reuse existing)

### Phase 3: Core logic
- [ ] 3a. Implement mouse hold duration tracking in createInput()
- [ ] 3b. Implement continuous get_aim_angle() with duration scaling
- [ ] 3c. Remove HIT_LOB from get_shot_type() when A/D held
- [ ] 3d. Update main.js targeting (already uses continuous angle, verify)

### Phase 4: UI / output
- [ ] 4a. Verify directional shots work at varying angles
- [ ] 4b. Verify A/D movement still functional
- [ ] 4c. Verify P2 parity in 2P mode
