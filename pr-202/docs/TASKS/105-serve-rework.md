# Tasks: Serve & Controls Rework

## Parent Issue
#105

## Plan Issue
#107

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
| `src/main.js` | Auto re-toss on missed serve; serve target_z within service box |
| `src/ball.js` | Fix out-of-bounds check (move into bounce block); recalibrate serve vy; far-out z-bound with bounce guard |
| `tests/input.test.js` | Update `get_movement()` tests to expect dx from A/D |
| `tests/player.test.js` | Update "human cannot move laterally" test to expect lateral movement |
| `tests/ball.test.js` | Update out-of-bounds tests for new bounce-guarded logic; add serve trajectory tests |
| `tests/main.test.js` | Add serve auto-loop test; add serve-no-fault integration test |

## Phases

### Phase 1: Tests (TDD)
- [ ] Update `tests/input.test.js` — `get_movement()` should return dx for A/D (lines 80-100: change dx=0 expectations to dx=-1/+1)
- [ ] Update `tests/player.test.js` — change "human cannot move laterally" test to expect dx movement, add lateral movement test for human
- [ ] Update `tests/ball.test.js` — update out-of-bounds tests (ball past baseline should only trigger BALL_OUT when bounces > 0); add serve trajectory test (serve should land in service box); update z-bound tests
- [ ] Add `tests/main.test.js` tests — serve auto-loop behavior (ball falls, re-tosses without click); serve does not fault (integration: ball after serve does not trigger BALL_OUT)

### Phase 2: Data Structures (Constants)
- [ ] No new constants needed (existing SERVE_TOSS_HEIGHT, SERVE_TOSS_DURATION, etc. are fine)
- [ ] Update comments to document changed behavior

### Phase 3: Core Logic
- [ ] `src/input.js` — `get_movement()` add BTN_LEFT/BTN_RIGHT for dx
- [ ] `src/player.js` — Remove `if (!p.is_ai) dx = 0` line
- [ ] `src/main.js` — Auto-loop serve toss (when ball falls below 0.8, restart instead of requiring click); fix serve target_z to within service box (COURT_LENGTH * 0.85 instead of 0.7)
- [ ] `src/ball.js` — Move out-of-bounds check into bounce block; add bounce guard to z-bound far-out checks; recalibrate serve vy (normal: 0.14, S serve: 0.18)

### Phase 4: UI/Output
- [ ] No UI changes needed (text instructions remain the same, no charge bar to remove)
