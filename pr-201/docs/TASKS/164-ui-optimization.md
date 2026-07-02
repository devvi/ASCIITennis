# Task Breakdown: 界面优化 (UI Optimization)

**Issue:** #164
**Related modules:** `src/render.js`, `src/main.js`, `src/scoring.js`, `src/constants.js`, `tests/render.test.js`, `tests/main.test.js`, `tests/scoring.test.js`

**Plan Issue:** #165

---

## Phase 1: Tests

### 1a. Menu rendering — verify all 4 items displayed
- `render.menu(4)` draws "SPECIAL MODES" text
- All 4 items appear in rendered output
- Cursor `>` appears on correct item for each `selected_diff` value (1-4)
- File: `tests/render.test.js`

### 1b. `award_kill` opponent award test
- `scoring.award_kill(score, 0)` increments `score.points[1]` (opponent)
- `scoring.award_kill(score, 1)` increments `score.points[0]`
- File: `tests/scoring.test.js`

### 1c. Help screen rendering and state transition tests
- `render.help(false)` draws P1 controls (W, A, S, D, Space, etc)
- `render.help(true)` draws both P1 and P2 controls
- `STATE_HELP` constant exists and equals `"help"`
- ESC transitions to help state during serving/playing/point_scored
- ESC or Space/Enter dismisses help and restores previous state
- Help does not activate during menu, game_over, kill_cam, violation_replay
- File: `tests/render.test.js`, `tests/main.test.js`

---

## Phase 2: Data structures
- Add `STATE_HELP = "help"` to `src/constants.js`
- Add `help_prev_state` variable to `src/main.js` (init = null)
- Add ESC key handler in `main.js` (direct keydown listener or input extension)

---

## Phase 3: Core logic

### 3a. Fix menu rendering to show SPECIAL MODES
- In `src/render.js:389`, add line for `selected_diff === 4` → "SPECIAL MODES"
- Verify cursor rendering for all 4 positions

### 3b. Fix `award_kill` to award point to opponent
- `src/scoring.js:92` — change `hitter` to `1 - hitter`

### 3c. Fix double bounce point award
- `src/main.js:697-700` — split into two branches:
  - `last_bounce_side !== last_hit_by` → winner → `resolve_point(hitter)`
  - `last_bounce_side === last_hit_by` → fault → `resolve_violation_point("double_bounce", hitter)`
- Import may need `resolve_point` (already available in scope)

### 3d. Implement ESC-to-help state transition logic
- Add keydown listener for "Escape" in `main.js` (at module level or in init)
- In `gameLoop()`: if ESC pressed and state in (serving, playing, point_scored) → save prev state, set to help
- If in help state → skip all update logic
- On ESC/Space/Enter during help → restore prev state
- Block help during menu, special_menu, game_over, kill_cam, violation_replay

---

## Phase 4: UI/output

### 4a. Implement help screen rendering
- Add `render.help(is2p)` to `src/render.js`
- Semi-transparent dark overlay (`rgba(0,0,0,0.7)`)
- Title "CONTROLS" at top center
- P1 controls section (left half)
- P2 controls section (right half, only if is2p)
- "Press ESC to resume" at bottom
- Call `render.help(is2p)` in `draw_game()` when `game_state === STATE_HELP`
