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
    if (this.held(BTN_LEFT)) return -Math.sqrt(t);   // proportional (mouse held) — good
    if (this.held(BTN_RIGHT)) return Math.sqrt(t);
    return 0;
  }
  // KEYBOARD FALLBACK — small random angle, no mouse needed
  return (Math.random() - 0.5) * 0.1;
}
```

The mouse-hold branch (`t > 0`) already works well — it provides proportional sqrt-based direction based on hold duration. The problem is the **keyboard fallback** (`t === 0`): it returns a small random angle `±0.05`, making keyboard-only shots slightly unpredictable while moving.

### 2. No way to hit straight while moving

In `src/main.js:update_playing()`, the hit flow is:

1. `get_movement()` → moves player with A/D
2. Later: `get_aim_angle()` → reads mouse hold state for direction
3. If no mouse is held, angle = small random `±0.05`

The random jitter means keyboard-only shots are slightly unpredictable — there is no way to guarantee a straight shot without mouse directional input.

### 3. Inconsistent experience

- **Mouse + keyboard**: hold to aim via `-√t`/`+√t` — proportional, skill-based control
- **Keyboard only** (space to hit): every shot has tiny random drift — feels imprecise and unintentional
- **P2 keyboard only** (Enter/Shift): Shift provides proportional control when held, but quick tap (no hold) still adds random drift

## Proposed Solution

### Core change: Replace random drift with straight default

`get_aim_angle()` should return `0` (straight) when no mouse is held, instead of the current `(Math.random() - 0.5) * 0.1`. Directional control is exclusively available through mouse hold (or Shift hold for P2), which provides proportional sqrt-based control via `-√t` / `+√t`.

**New behavior table:**

| Input | Current | Proposed |
|-------|---------|----------|
| Press A, hit space | angle = random ±0.05 (drift) | angle = 0 (straight) |
| Press D, hit space | angle = random ±0.05 (drift) | angle = 0 (straight) |
| Mouse held + A + space | angle = -√t (proportional left) | angle = -√t (proportional left) — unchanged |
| Mouse held + D + space | angle = +√t (proportional right) | angle = +√t (proportional right) — unchanged |
| No keys, no mouse | angle = random ±0.05 (drift) | angle = 0 (straight) |

This makes straight shots the default. Directional shots require an explicit action (hold mouse/Shift while hitting), which is more intentional and skill-based.

### Impact on P2

P2 uses `KEY_MAP_P2` where `Shift` maps to `BTN_A`. In `update()`, `mouse_hold_frames` increments when `curr[BTN_A]` is true, so Shift hold already frames the mouse hold counter. With the random drift replaced by `0`, P2 gets:
- Hold Shift + ArrowLeft → proportional left direction via `-√t`
- Hold Shift + ArrowRight → proportional right direction via `+√t`
- No modifier → straight shot (angle=0)

No P2-specific wiring is needed — this "just works" once the random drift is removed.

## Feature List

### 1. Replace random drift with `0` in `get_aim_angle()`
- When `mouse_hold_frames === 0`, return `0` instead of `(Math.random() - 0.5) * 0.1`
- Mouse hold + A/D remains the only directional control path (via `-√t` / `+√t`)
- `get_aim_angle()` signature and contract unchanged — deterministic when no mouse is held

### 2. Update P2 directional control
- Verify P2 (Shift + ArrowLeft/Right) works for proportional direction via `mouse_hold_frames`
- Add test coverage for P2 direction with Shift hold
- P2 quick tap (no Shift hold) should now produce straight (angle=0) instead of random drift

### 3. Update game loop integration (minor)
- In `main.js`, the `target_x = angle * SINGLES_WIDTH * 0.35` formula already works with angle = 0 for straight shots
- No changes needed to the scoring formula itself, just verify it works with angle = 0

### 4. Update test cases
- `get_aim_angle` no-mouse tests must be updated to expect `0` instead of `Math.abs(angle) ≤ 0.05`
- Add P2 direction tests: Shift held + ArrowLeft/ArrowRight → proportional angle
- Add P2 no-modifier test: ArrowLeft + Enter without Shift returns 0
- Add integration test: `target_x === 0` when hit with movement keys but no mouse

## Acceptance Criteria

- Pressing A/D + space (no mouse) always hits straight (angle = 0)
- No keys + space (no mouse) always hits straight (angle = 0)
- Mouse hold + A + space produces proportional left angle via `-√t`
- Mouse hold + D + space produces proportional right angle via `+√t`
- Shift hold + ArrowLeft + Enter (P2) produces proportional left angle
- Shift hold + ArrowRight + Enter (P2) produces proportional right angle
- No Shift + ArrowLeft + Enter (P2) returns 0 (straight)
- Movement (A/D walk) is unaffected; `get_movement()` continues to work as before
- All existing tests pass after updating no-mouse expectations
- New tests cover: P2 Shift-based direction, integration of angle=0 in hit targeting
