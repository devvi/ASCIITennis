# Tasks: A/D Key Direction Feel Enhancement

**Parent Issue:** #162
**PRD:** docs/PRD/162-a-d-feel-enhancement.md
**PLAN_ISSUE:** #167

## Related Modules

| Module | File(s) | Impact |
|--------|---------|--------|
| Input | `src/input.js` | **Primary** — `get_aim_angle()` logic change; remove keyboard fallback |
| Game loop | `src/main.js` | Minor — verify `target_x` formula works with angle=0 |
| Tests | `tests/input.test.js` | Update keyboard fallback expectations; add P2 direction tests |

## Summary

A/D keys are used for both movement (`get_movement()`) and shot direction (`get_aim_angle()`). The current keyboard fallback in `get_aim_angle()` returns binary ±1 when A/D is held without mouse hold, making it impossible to hit straight while moving. The fix removes this fallback, defaulting to straight (angle=0) unless the mouse (or Shift for P2) is held. Directional control becomes a deliberate action via mouse/shift hold + A/D, providing proportional control based on hold duration.

## Phased Plan

### Phase 1: Tests
- [ ] Update `tests/input.test.js`:
  - Change `get_aim_angle returns -1 when A held without mouse hold` to expect `0`
  - Change `get_aim_angle returns 1 when D held without mouse hold` to expect `0`
  - Add test: `get_aim_angle returns 0 when A held + mouse just pressed (fresh mousedown)`
  - Add test: P2 Shift held + ArrowLeft → proportional angle
  - Add test: P2 Shift held + ArrowRight → proportional angle
  - Add test: P2 no Shift + ArrowLeft → angle=0 (straight)
- [ ] Add `tests/main.test.js`:
  - Integration test: `target_x` should be `0` when hit with movement keys held but no mouse

### Phase 2: Core logic (`src/input.js`)
- [ ] Modify `get_aim_angle()`: remove the `else` branch that returns ±1 when `mouse_hold_frames === 0`
- [ ] When `t === 0` (no mouse hold), return `0` regardless of A/D state
- [ ] Verify mouse-hold branch (`t > 0`) is unchanged and still returns `-t`/`+t`

### Phase 3: P2 direction parity
- [ ] P2 Shift already maps to BTN_A, so `mouse_hold_frames` increments on Shift hold
- [ ] Verify P2 can aim left/right by holding Shift + Arrow keys
- [ ] Add any needed wiring if P2 direction doesn't propagate to `target_x` in `main.js`

### Phase 4: Verification
- [ ] Run `npm test` — all tests must pass
- [ ] Manual smoke test: keyboard-only play — hitting while moving should go straight
- [ ] Manual smoke test: mouse hold + A/D → proportional direction
- [ ] Manual smoke test: P2 mode — Shift + arrow for direction, no Shift = straight
