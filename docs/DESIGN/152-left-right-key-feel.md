# Left/Right Key Shot Direction Optimization — Design

## Overview

Repurpose A/D keys from triggering `HIT_LOB` to controlling shot direction angle, with mouse hold duration as an analog intensity modifier.

## Constants

| Constant | Value | Description |
|---|---|---|
| `MAX_MOUSE_HOLD_FRAMES` | 60 | Frames of mouse hold to reach full directional intensity (~1s at 60fps) |

## Data Flow

### Mouse hold duration tracking
1. `BTN_A` (left mouse button) down → start counting frames via `mouse_hold_frames += 1` each `update()` call
2. `BTN_A` released → hold duration freezes
3. Next `BTN_A` down → reset `mouse_hold_frames = 0`

### Continuous aim angle
```
get_aim_angle():
  if held(BTN_LEFT)  → -1 * clamp(mouse_hold_frames / MAX_MOUSE_HOLD_FRAMES, 0, 1)
  if held(BTN_RIGHT) → +1 * clamp(mouse_hold_frames / MAX_MOUSE_HOLD_FRAMES, 0, 1)
  else → 0
```

### Shot type — remove A/D lob
```
get_shot_type():
  if pressed(BTN_B):
    if held(BTN_UP)   → HIT_TOPSPIN
    if held(BTN_DOWN) → HIT_SLICE
    else → HIT_FLAT   (A/D no longer affect shot type)
  else → null
```

### Target calculation in main.js
```
target_x = get_aim_angle() * SINGLES_WIDTH * 0.35  // continuous [-2.88, 2.88]
```

## Modules Affected

- **constants.js** — +1 constant (`MAX_MOUSE_HOLD_FRAMES`)
- **input.js** — `mouse_hold_frames` state, duration tracking in `update()`, continuous `get_aim_angle()`, remove A/D lob from `get_shot_type()`
- **main.js** — targeting already uses `get_aim_angle() * SINGLES_WIDTH * 0.35`, no code change needed for continuous calc
- **tests/input.test.js** — new test cases for duration, continuous angle, shot type
