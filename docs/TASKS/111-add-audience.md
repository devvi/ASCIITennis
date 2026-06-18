# Tasks: Add Audience

Related modules: src/main.js, src/audience.js (new), src/render.js, src/constants.js

## Phase 1: Tests (TDD)
- [ ] Write `tests/audience.test.js`:
  - `audience.init()` creates N spectators at valid perimeter positions
  - Spectator positions are outside court bounds
  - `audience.update()` transitions cheer level from >0 down to 0
  - `audience.cheer()` sets cheer_level to CHEER_DURATION
  - `audience.get_pose(spec)` returns `\\o/` when cheering, ` O ` when idle
  - Audience cheer on rally threshold (e.g., 5+ hits)

## Phase 2: Data Structures
- [ ] Create `src/audience.js` with init, constants, spectator generation

## Phase 3: Core Logic
- [ ] Implement audience.cheer(), audience.update(), audience.get_pose()
- [ ] Hook into main.js (init_game, resolve_point, resolve_violation_point, rally_hits, gameLoop)

## Phase 4: UI/Output
- [ ] Add render.audience() in render.js
- [ ] Wire into draw_game() in main.js

PLAN_ISSUE=117
