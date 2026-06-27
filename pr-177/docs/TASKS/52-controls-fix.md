# Issue 52: 打不到球 / Controls Inversion & Hitting Fix

## Related Modules

- `src/input.js` — fix `get_movement()` Z-axis direction (swap dz signs for BTN_UP/BTN_DOWN)
- `tests/input.test.js` — add/update tests verifying movement direction

## Impacts

- Single-line fix in `input.js` (`get_movement()`) that swaps two `dz` assignments
- The inverted control is the root cause of "can't hit the ball"; fixing it restores the value of the #43 hitting feel refactor
- No changes to physics, rendering, AI, or scoring required

---

## Phase 1: Tests (TDD)

Write test cases for movement direction before implementing the fix.

- `input.get_movement()` returns `dz = 1` when BTN_UP is held
- `input.get_movement()` returns `dz = -1` when BTN_DOWN is held

**File:** `tests/input.test.js`

---

## Phase 2: Fix movement direction in input.js

- In `input.get_movement()`, swap `dz` values: BTN_UP → `dz = 1`, BTN_DOWN → `dz = -1`

**File:** `src/input.js`

---

## Phase 1 Issue Tracking

- Create GitHub Issue for Phase 1: Tests

## Phase 2 Issue Tracking

- Create GitHub Issue for Phase 2: Fix movement
