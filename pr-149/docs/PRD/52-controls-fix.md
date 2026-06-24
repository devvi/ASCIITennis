# Issue 52: 打不到球 / Controls Inversion & Hitting Fix

## Product Requirements

Users report two interrelated issues preventing normal gameplay:

1. **Inverted Z-axis movement** — pressing W (ArrowUp) moves the player toward the baseline (decreasing z), while S (ArrowDown) moves toward the net (increasing z). This is the opposite of intuitive top-down sports-game convention where "up" advances toward the opponent's side.

2. **Can't hit the ball** — the hitting feel refactor (issue #43) expanded hit range and added prediction, but the inverted controls prevent the player from positioning correctly to use these mechanics. The control bug must be fixed first, then any remaining hitting feel issues can be addressed.

## Features

1. **Fix Z-axis movement direction** — swap `dz` signs in `input.get_movement()` so BTN_UP moves toward the net (positive z) and BTN_DOWN moves toward the baseline (negative z)
2. **Verify hitting works post-fix** — ensure that with correct controls, the expanded hit range from #43 allows the player to consistently hit the ball

## Acceptance Criteria

1. Pressing W (or ArrowUp) moves the player toward the net
2. Pressing S (or ArrowDown) moves the player toward the baseline
3. With corrected controls, the player can consistently position under the ball and hit it using Space/Enter
4. All existing tests pass
5. No regressions in AI movement or physics
