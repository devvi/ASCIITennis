# Tasks: Direction Optimization for A/D Keys

**Parent Issue:** #172
**PRD:** docs/PRD/172-direction-optimization.md

## Related Modules

| Module | File(s) | Impact |
|--------|---------|--------|
| Constants | `src/constants.js` | Add `DIRECTIONAL_ANGLE` constant |
| Input | `src/input.js` | **Primary** — `get_aim_angle()` add keyboard directional fallback |
| Tests | `tests/input.test.js` | Update/restore A/D directional tests; add keyboard-only direction tests |
| Game loop | `src/main.js` | No changes needed — `target_x` formula already works with any angle value |

## Summary

Issue #162 removed the binary ±1 keyboard fallback from `get_aim_angle()` to fix the problem of accidentally hitting aggressive angles while moving. However, this also removed all keyboard-only directional control — every shot now goes straight. This issue restores A/D directional control with a moderate angle (`DIRECTIONAL_ANGLE = √0.4 ≈ 0.63`) so keyboard players can intentionally aim shots without the old ±1 aggressiveness. Mouse hold behavior is unchanged.

## Phased Plan

### Phase 1: Tests
- [ ] Add constant import: `DIRECTIONAL_ANGLE` in test file
- [ ] Add test: `get_aim_angle returns -DIRECTIONAL_ANGLE when A held without mouse`
- [ ] Add test: `get_aim_angle returns DIRECTIONAL_ANGLE when D held without mouse`
- [ ] Add test: `get_aim_angle returns 0 when no direction held without mouse`
- [ ] Add test: `get_aim_angle returns 0 when mouse just pressed (mouse_hold_frames still 0)`
- [ ] Add test: P2 ArrowLeft + Enter returns `-DIRECTIONAL_ANGLE`
- [ ] Add test: P2 ArrowRight + Enter returns `+DIRECTIONAL_ANGLE`
- [ ] Add test: P2 no direction + Enter returns `0`
- [ ] Verify existing mouse-hold directional tests are unchanged

### Phase 2: Constants (`src/constants.js`)
- [ ] Add `export const DIRECTIONAL_ANGLE = Math.sqrt(0.4);`

### Phase 3: Core logic (`src/input.js`)
- [ ] Modify `get_aim_angle()`: when `mouse_hold_frames === 0`, check A/D state and return ±`DIRECTIONAL_ANGLE`
- [ ] When neither A nor D held, return `0`
- [ ] Import `DIRECTIONAL_ANGLE` from constants
- [ ] Verify mouse-hold branch (`t > 0`) is completely unchanged

### Phase 4: Verification
- [ ] Run `npm test` — all tests must pass
- [ ] Manual smoke test: A + space → ball goes left at moderate angle
- [ ] Manual smoke test: D + space → ball goes right at moderate angle
- [ ] Manual smoke test: space only → ball goes straight
- [ ] Manual smoke test: mouse hold + A/D → proportional direction (unchanged)
- [ ] Manual smoke test: P2 mode — Arrow keys for direction
- [ ] Manual smoke test: serve placement with A/D
