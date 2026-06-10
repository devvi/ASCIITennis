# Issue 11 — Math Utility: Architecture & Design

## Architecture

Minimal two-file addition: a single pure function exported from `src/math.js`, tested by `tests/math.test.js` via Vitest.

## Data Flow

```
src/math.js          → exports add(a, b)
tests/math.test.js   → imports add(), runs assertions
npm test             → Vitest discovers tests/*.test.js
```

## Module Design

### `src/math.js`

```js
export function add(a, b) {
  return a + b;
}
```

- Pure function, no side effects, no state
- Handles all number types (positive, negative, zero, floats)

## Test Design

### `tests/math.test.js`

| Test Case | Input | Expected |
|-----------|-------|----------|
| Positive numbers | `add(2, 3)` | `5` |
| Negative numbers | `add(-1, -2)` | `-3` |
| With zero | `add(0, 5)` | `5` |

## Phased Plan

1. **Tests first (TDD)**: Write `tests/math.test.js` with 3 failing tests
2. **Implementation**: Create `src/math.js` with `add()` — tests pass
3. **Verify**: `npm test` passes cleanly
