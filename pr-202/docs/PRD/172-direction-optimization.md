# Product Requirements: Direction Optimization for A/D Keys (方向求优化)

**Issue:** #172
**Feature:** Restore and optimize A/D key directional shot control, inspired by Mario Tennis GBC's unified movement-and-aim system.

## Motivation

After issue #162, `get_aim_angle()` returns `0` (straight) whenever no mouse/Shift is held. This means keyboard-only players cannot hit directional shots at all — every shot goes straight down the center regardless of whether A or D is held. While #162 fixed the problem of accidentally hitting aggressive angles while moving, it also removed the ability to intentionally aim shots with keyboard-only controls.

In Mario Tennis GBC, movement and aiming are unified via the D-pad: the direction you press at the moment of the hit determines the shot's trajectory. This creates an intuitive, skill-based system where positioning and directional input feel natural.

## Root Cause

### 1. `get_aim_angle()` returns 0 when no mouse is held

In `src/input.js:138`:

```js
get_aim_angle() {
  const t = Math.min(1, mouse_hold_frames / MAX_MOUSE_HOLD_FRAMES);
  if (t > 0) {
    if (this.held(BTN_LEFT)) return -Math.sqrt(t);
    if (this.held(BTN_RIGHT)) return Math.sqrt(t);
    return 0;
  }
  return 0;  // ← always straight, no directional control
}
```

### 2. Previous binary ±1 was too aggressive

Before #162, the fallback returned `-1` or `+1` when A/D was held without mouse. This produced `target_x = ±1 * 8.23 * 0.35 = ±2.88`, covering ~70% of court width. Players couldn't hit straight while moving, making every shot while running wildly off-center.

### 3. Mario Tennis GBC approach

Mario Tennis GBC unifies movement direction with shot direction naturally:
- D-pad direction at hit time determines ball trajectory
- Players develop muscle memory for releasing direction when they want center shots
- The system feels responsive because the direction you're pressing is the direction you intend

## Proposed Solution

### Core change: Restore A/D directional control with moderate angle

Modify `get_aim_angle()` to return a moderate angle when A/D is held without mouse hold:

| Input | Current | Proposed |
|-------|---------|----------|
| A held, no mouse | `0` (straight) | `-DIRECTIONAL_ANGLE` (moderate left) |
| D held, no mouse | `0` (straight) | `+DIRECTIONAL_ANGLE` (moderate right) |
| Neither held, no mouse | `0` (straight) | `0` (straight — unchanged) |
| Mouse/Shift held + A | `-sqrt(t)` (proportional) | `-sqrt(t)` (unchanged) |
| Mouse/Shift held + D | `+sqrt(t)` (proportional) | `+sqrt(t)` (unchanged) |

### Angle magnitude selection

The constant `DIRECTIONAL_ANGLE` should produce a noticeable but not overpowering angle:
- At `target_x = angle * SINGLES_WIDTH * 0.35`:
  - `±1` → `±2.88` (70% court width — too aggressive, this was the old problem)
  - `±0.5` → `±1.44` (35% court width — moderate, good default)
  - `±0.7` → `±2.02` (49% court width — strong but controllable)

**Recommended value: `√0.4 ≈ 0.63`** — produces `target_x ≈ ±1.82` (~44% court width). This is enough to hit cross-court or down-the-line while keeping straight shots achievable by releasing A/D before pressing space.

Using `Math.sqrt(0.4)` makes it consistent with the existing sqrt curve used for mouse-hold aiming.

### Impact on gameplay

- **Keyboard-only players regain directional control** — hold A for left shot, D for right shot, release for straight
- **Straight shots require deliberate input** — release A/D before pressing space (easy to learn)
- **Mouse users unaffected** — mouse hold still provides proportional control
- **P2 (keyboard-only) gains direction** — ArrowLeft/ArrowRight work the same way without needing Shift hold
- **Serves** — `get_aim_angle()` is also called during serve; A/D will now influence serve placement

## Feature List

### 1. Add keyboard directional fallback to `get_aim_angle()` in `src/input.js`
- When `mouse_hold_frames === 0` and A is held → return `-DIRECTIONAL_ANGLE`
- When `mouse_hold_frames === 0` and D is held → return `+DIRECTIONAL_ANGLE`
- When `mouse_hold_frames === 0` and neither held → return `0`
- Define `DIRECTIONAL_ANGLE = Math.sqrt(0.4)` (or similar constant)

### 2. Add new constant to `src/constants.js`
- `export const DIRECTIONAL_ANGLE = Math.sqrt(0.4);`

### 3. Update test cases
- Restore A/D directional angle tests (removed in #162)
- Verify moderate angle value, not aggressive ±1
- Add tests for P2 keyboard-only direction (Arrow keys)
- Add integration test: hit while moving → ball goes in pressed direction
- Verify mouse hold branch is completely unaffected

### 4. Documentation
- Update any references to `get_aim_angle()` behavior

## Acceptance Criteria

- Holding A + space (no mouse) → angle = `-DIRECTIONAL_ANGLE` (moderate left)
- Holding D + space (no mouse) → angle = `+DIRECTIONAL_ANGLE` (moderate right)
- No direction + space (no mouse) → angle = `0` (straight)
- Mouse hold + A/D → proportional angle via sqrt(t) — completely unchanged
- P2: ArrowLeft + Enter → angle = `-DIRECTIONAL_ANGLE`
- P2: ArrowRight + Enter → angle = `+DIRECTIONAL_ANGLE`
- P2: no arrow + Enter → angle = `0`
- Movement (A/D walk) is completely unaffected
- Serve placement responds to A/D direction
- All existing tests pass
- `DIRECTIONAL_ANGLE` is configurable via a single constant in `constants.js`
