# Product Requirements: A/D Key Direction Feel Enhancement (手感优化)

**Issue:** #162
**Feature:** Decouple A/D movement from directional aiming so players can easily hit straight shots or add direction via mouse hold.

## Motivation

After issue #152 resolved the A/D-lob problem, `get_aim_angle()` was improved with continuous mouse-hold-based directional control. However, a keyboard fallback remains: when A/D is held without mouse hold, the angle returns binary `-1` or `+1` (full direction). Since A/D are also the movement keys, **every shot hit while pressing A/D to move goes full left or right — there is no way to hit straight without releasing all movement keys.**

This makes keyboard play feel unresponsive and unpredictable. The player cannot distinguish "I'm moving to the ball" from "I'm aiming my shot."

## Root Cause

### 1. A/D dual purpose — movement and aim are conflated

In `src/input.js`, `get_movement()` and `get_aim_angle()` both read `BTN_LEFT`/`BTN_RIGHT`:

```js
get_movement() {
  let dx = 0, dz = 0;
  if (this.held(BTN_LEFT)) dx = -1;   // ← A key
  if (this.held(BTN_RIGHT)) dx = 1;   // ← D key
  ...
}

get_aim_angle() {
  const t = Math.min(1, mouse_hold_frames / MAX_MOUSE_HOLD_FRAMES);
  if (t > 0) {
    if (this.held(BTN_LEFT)) return -t;   // proportional (mouse held) — good
    if (this.held(BTN_RIGHT)) return t;
    return 0;
  }
  // KEYBOARD FALLBACK — BINARY, NO MOUSE NEEDED
  if (this.held(BTN_LEFT)) return -1;    // ← full left even for movement
  if (this.held(BTN_RIGHT)) return 1;    // ← full right even for movement
  return 0;
}
```

The mouse-hold branch (`t > 0`) already works well — it provides proportional direction based on hold duration. The problem is the **keyboard fallback** (`t === 0`): it returns binary ±1, making directional control unusably aggressive for keyboard players.

### 2. No way to hit straight while moving

In `src/main.js:update_playing()`, the hit flow is:

1. `get_movement()` → moves player with A/D
2. Later: `get_aim_angle()` → reads A/D state for direction
3. If A/D is still held (player is still moving), angle = ±1

The only way to hit straight is to release all movement keys before pressing space — an unnatural and frustrating constraint.

### 3. Inconsistent experience

- **Mouse + keyboard**: short click = subtle angle; long hold = sharp angle — this is great
- **Keyboard only** (space to hit): A/D always gives full angle — unusable for precise play
- **P2 keyboard only** (Enter/Shift): same problem, Shift (BTN_A) should provide proportional control but the keyboard fallback overrides it

## Proposed Solution

### Core change: Remove the binary keyboard fallback

`get_aim_angle()` should return `0` (straight) when no mouse is held, regardless of A/D state. Directional control is exclusively available through mouse hold (or Shift hold for P2).

**New behavior table:**

| Input | Current | Proposed |
|-------|---------|----------|
| Press A, hit space | angle = -1 (full left) | angle = 0 (straight) |
| Press D, hit space | angle = +1 (full right) | angle = 0 (straight) |
| Mouse held + A + space | angle = -t (proportional left) | angle = -t (proportional left) — unchanged |
| Mouse held + D + space | angle = +t (proportional right) | angle = +t (proportional right) — unchanged |
| A only, no hit | returns -1 (used for movement) | returns 0 (get_aim_angle is only called on hit) |

This makes straight shots the default. Directional shots require an explicit action (hold mouse/Shift while hitting), which is more intentional and skill-based.

### Impact on P2

P2 uses `KEY_MAP_P2` where `Shift` maps to `BTN_A`. This means `mouse_hold_frames` is already incremented for Shift hold (via `update()`). So P2 can:
- Hold Shift + ArrowLeft → proportional left direction
- Hold Shift + ArrowRight → proportional right direction
- No modifier → straight shot

This "just works" once the keyboard fallback is removed.

## Feature List

### 1. Remove binary keyboard fallback from `get_aim_angle()`
- When `mouse_hold_frames === 0`, return `0` regardless of A/D state
- Mouse hold + A/D remains the only directional control path
- `get_aim_angle()` signature and contract unchanged

### 2. Update P2 directional control
- Verify P2 (Shift + ArrowLeft/Right) works for proportional direction
- Add test coverage for P2 direction with Shift hold

### 3. Update game loop integration (minor)
- In `main.js`, the `target_x = angle * SINGLES_WIDTH * 0.35` formula already works with angle = 0 for straight shots
- No changes needed to the scoring formula itself, just verify it works with the new angle range

### 4. Update test cases
- `get_aim_angle` keyboard fallback tests must be updated to expect `0` instead of `±1`
- Add tests for P2 directional control with Shift hold
- Add integration test: player hits while moving → ball goes straight

## Acceptance Criteria

- Pressing A/D + space (no mouse) always hits straight (angle = 0)
- Mouse hold + A + space produces proportional left angle in (0, -1]
- Mouse hold + D + space produces proportional right angle in (0, 1]
- Shift hold + ArrowLeft + Enter (P2) produces proportional left angle
- Shift hold + ArrowRight + Enter (P2) produces proportional right angle
- Movement (A/D walk) is unaffected; `get_movement()` continues to work as before
- All existing tests pass after updating keyboard fallback expectations
- New tests cover: P2 Shift-based direction, integration of angle=0 in hit targeting
