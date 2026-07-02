# A/D Key Direction Feel Enhancement — Design

## Overview

Remove the residual random angle returned by `get_aim_angle()` when no mouse/Shift is held, making straight shots the default. Directional control becomes an explicit action via mouse hold (or Shift hold for P2) combined with A/D keys.

## Current State

After issue #152, `get_aim_angle()` was rewritten with:

```
get_aim_angle():
  t = clamp(mouse_hold_frames / MAX_MOUSE_HOLD_FRAMES, 0, 1)
  if t > 0:
    if held(BTN_LEFT)  → -sqrt(t)   // mouse-held directional
    if held(BTN_RIGHT) → +sqrt(t)
    else → 0
  // no mouse hold → (Math.random() - 0.5) * 0.1  ← RANDOM JITTER
```

The binary ±1 keyboard fallback is already gone. The remaining problem is the **random jitter** returned when `mouse_hold_frames === 0`. This makes keyboard-only play unpredictable — even standing still and pressing space produces a random off-center shot ±5% of court width.

## Design Change

### Target: `src/input.js:get_aim_angle()`

**Before (line 145):**
```js
return (Math.random() - 0.5) * 0.1;
```

**After:**
```js
return 0;
```

### Behavior Table

| Input | Current | Proposed |
|-------|---------|----------|
| A + space (no mouse) | random ±0.05 | 0 (straight) |
| D + space (no mouse) | random ±0.05 | 0 (straight) |
| space only (no mouse) | random ±0.05 | 0 (straight) |
| Mouse held + A + space | -sqrt(t) | -sqrt(t) — unchanged |
| Mouse held + D + space | +sqrt(t) | +sqrt(t) — unchanged |
| P2: Shift + ArrowLeft + Enter | -sqrt(t) | -sqrt(t) — unchanged |
| P2: Shift + ArrowRight + Enter | +sqrt(t) | +sqrt(t) — unchanged |
| P2: no Shift + Arrow + Enter | 0 | 0 — unchanged |

### `target_x` Formula (unchanged)

In `main.js:459`:
```js
const target_x = angle * SINGLES_WIDTH * 0.35;
```
With `angle = 0`, `target_x = 0` — ball goes straight down the center. No changes needed.

### Modules Affected

| Module | File | Change |
|--------|------|--------|
| Input | `src/input.js` | `get_aim_angle()` — replace random jitter with `return 0` |
| Tests | `tests/input.test.js` | Update tests that expected random ±0.05 to expect `0` |

### Not Affected

- `get_movement()` — completely unchanged. A/D still move the player.
- `get_shot_type()` — unchanged. Shot types unaffected by this change.
- `main.js` target calculation — `angle=0` already produces `target_x=0` correctly.
- P1/P2 key mappings — no changes.
- Constants — no new constants needed.
