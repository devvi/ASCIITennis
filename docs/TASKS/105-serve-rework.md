# Tasks: Serve & Controls Rework

## Parent Issue
#105

## Related Modules
- `src/main.js` — serve toss loop (auto re-toss), fault detection removal
- `src/input.js` — restore A/D lateral movement in `get_movement()`
- `src/player.js` — remove `dx = 0` forcing for human players
- `src/ball.js` — calibrate serve trajectory, fix out-of-bounds detection
- `src/constants.js` — may add/remove constants
- `tests/input.test.js` — update `get_movement()` A/D expectations
- `tests/player.test.js` — update human lateral movement expectations
- `tests/ball.test.js` — update out-of-bounds serve expectations

## Summary
Fix three bugs in the GBC-style serve: auto-loop toss on miss, restore A/D lateral movement during rallies, and eliminate serve faults by recalibrating ball physics and out-of-bounds detection.

## Impact Analysis

| Module | Impact |
|--------|--------|
| `src/input.js` | `get_movement()` returns `dx` from BTN_LEFT/BTN_RIGHT again |
| `src/player.js` | Remove `if (!p.is_ai) dx = 0` constraint |
| `src/main.js` | Auto re-toss on missed serve; no z-bound fault after serve bounce |
| `src/ball.js` | Fix out-of-bounds check (only before bounce); increase vy for serve; far-out safety threshold |
| `tests/input.test.js` | Update `get_movement()` tests to accept dx from A/D |
| `tests/player.test.js` | Remove "human cannot move laterally" test, add lateral move test |
| `tests/ball.test.js` | Update out-of-bounds tests for new threshold |
