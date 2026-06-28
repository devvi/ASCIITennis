# Task Breakdown: 界面优化 (UI Optimization)

**Issue:** #161
**Related modules:** `src/render.js`, `src/main.js`, `src/scoring.js`, `src/constants.js`, `tests/render.test.js`, `tests/main.test.js`

## Research Summary

### Bug 1: Missing "SPECIAL MODES" in Main Menu

| Aspect | Detail |
|--------|--------|
| Root Cause | `render.menu()` hardcodes 3 items; `update_menu()` has 4 |
| Location | `src/render.js:386-389` |
| Fix | Add "SPECIAL MODES" rendering for `selected_diff === 4` |
| Existing tests | `render.test.js:95-98` only checks menu doesn't throw (needs item count assertion) |

The `selected_diff` variable is used both as a difficulty selector (1=Easy, 2=Hard) and as a menu cursor (3="2 PLAYERS", 4="SPECIAL MODES"). A dedicated `selected_mode_idx` already exists (used in `update_menu`) but the render function still uses `selected_diff`. The render should use `selected_mode_idx` instead, or both should be synchronized.

### Bug 2: Score Points Awarded to Wrong Player

Two separate scoring bugs where the wrong player receives the point.

#### Bug 2a: Spectator Kill

| Aspect | Detail |
|--------|--------|
| Root Cause | `award_kill` passes `hitter` instead of `1 - hitter` to `award_point` |
| Location | `src/scoring.js:91-93` |
| Fix | `return this.award_point(s, 1 - hitter)` |
| Existing tests | `scoring.test.js` — no test for `award_kill` |
| Impact | Every kill-cam point is awarded to the wrong player |

#### Bug 2b: Double Bounce (Normal Point Scoring)

| Aspect | Detail |
|--------|--------|
| Root Cause | `main.js:697-699` — `BALL_DOUBLE_BOUNCE` always goes through `resolve_violation_point` which gives point to `1 - last_hit_by`. Does not distinguish between winner (ball bounced twice on opponent's side) vs fault (ball bounced twice on own side). |
| Location | `src/main.js:697-699` |
| Fix | Check `ball_obj.last_bounce_side` vs `ball_obj.last_hit_by`: if different → winner on opponent's side → `resolve_point(hitter)`; if same → fault on own side → `resolve_violation_point("double_bounce", hitter)` |
| Existing tests | `scoring.test.js` — `resolve_violation` for double_bounce tests opponent award (correct for fault case, but doesn't test winner case) |
| Impact | Every normal rally point that ends with a double bounce (i.e., virtually all of them) scores backwards |

### Feature 3: Controls Manual Screen

| Aspect | Detail |
|--------|--------|
| New state | `STATE_HEIGHT` / pause overlay |
| Input | ESC to toggle |
| Modules | New rendering in `render.js`, state handling in `main.js`, constant in `constants.js` |
| Existing tests | None for this feature |

---

## Plan

### Phase 1: Tests (TDD)

#### 1a. Menu rendering tests — verify all 4 items displayed
- `render.menu()` with `selected_diff=4` draws "SPECIAL MODES"
- All 4 items appear in the rendered output
- Cursor marker `>` appears on the correct item for each index

#### 1b. Scoring tests — `award_kill` awards point to opponent
- Mock score at 0-0, call `award_kill(score, 0)` → verifies `points[1]` incremented (opponent wins)
- Mock score at 0-0, call `award_kill(score, 1)` → verifies `points[0]` incremented

#### 1c. Help screen tests — rendering and state transition
- Help screen renders when game_state is new help state
- ESC key (pressed via `BTN_X` or dedicated key) transitions to help state during playing/serving
- ESC or Space dismisses help and returns to previous state
- Help does not activate during menu, game over, kill cam, or violation replay

### Phase 2: Data structures
- Add `STATE_HELP` constant to `src/constants.js`
- Add `help_prev_state` variable to `src/main.js` to track state before help was shown

### Phase 3: Core logic

#### 3a. Fix menu rendering
- Update `render.menu()` to show all 4 items (add "SPECIAL MODES" for `selected_diff === 4`)
- Use `selected_mode_idx` for cursor rendering to avoid `selected_diff` abuse

#### 3b. Fix `award_kill` scoring
- Change `return this.award_point(s, hitter)` to `return this.award_point(s, 1 - hitter)`
- Verify no other callers depend on the buggy behavior

#### 3c. Fix double bounce point award
- In `main.js` `BALL_DOUBLE_BOUNCE` handler: check `ball_obj.last_bounce_side` vs `ball_obj.last_hit_by`
- If different → winner on opponent's side → `resolve_point(hitter)` (hitter wins the point)
- If same → fault on own side → `resolve_violation_point("double_bounce", hitter)` (opponent wins, show violation)
- Update tests in `scoring.test.js` and `main.test.js` to cover both sub-cases

#### 3d. Implement help screen
- In `gameLoop()` / `draw_game()`: intercept ESC (mapped to `BTN_X` or new binding) to toggle help state
- Save current state before entering help
- Pause game updates while in help state
- On dismiss, restore previous state
- Prevent help during menu, special_menu, game_over, kill_cam, violation_replay

### Phase 4: UI/output

#### 4a. Help screen rendering
- Add `render.help(is2p)` function that draws key bindings overlay
- Semi-transparent background overlay
- Clear formatting with labeled sections

## Plan Issue Task Lists

**PLAN_ISSUE:** TBD

### Phase 1: Tests
- [ ] 1a. Menu rendering tests for all 4 items including SPECIAL MODES
- [ ] 1b. `award_kill` opponent award test
- [ ] 1c. Help screen rendering and state transition tests

### Phase 2: Data structures
- [ ] 2a. Add `STATE_HELP` constant
- [ ] 2b. Add `help_prev_state` tracking variable

### Phase 3: Core logic
- [ ] 3a. Fix menu rendering to show SPECIAL MODES
- [ ] 3b. Fix `award_kill` to award point to opponent
- [ ] 3c. Fix double bounce point award (check `last_bounce_side` vs `last_hit_by`)
- [ ] 3d. Implement ESC-to-help state transition logic

### Phase 4: UI/output
- [ ] 4a. Implement help screen rendering with key bindings
