# Design: 界面优化 (UI Optimization)

**Issue:** #164
**Parent:** #161 (duplicate request — same three fixes)

## Overview

Three UI issues from #161 that were never implemented: missing "SPECIAL MODES" in menu, wrong player scoring in two code paths, and missing in-game controls manual.

## Bug 1: Missing "SPECIAL MODES" in Main Menu

### Root Cause
`render.menu()` in `src/render.js:378-393` hardcodes only 3 menu items:
- `selected_diff === 1` → "1P EASY"
- `selected_diff === 2` → "1P HARD"
- `selected_diff === 3` → "2 PLAYERS"

But `update_menu()` in `src/main.js:349` defines 4 items: `["1P EASY", "1P HARD", "2 PLAYERS", "SPECIAL MODES"]`. Index 3 (`selected_mode_idx === 3`, `selected_diff === 4`) navigates to the special modes sub-menu but renders nothing visible.

### Design
Add `selected_diff === 4` rendering for "SPECIAL MODES" in `render.menu()`. Note that `selected_diff` is 1-indexed (1-4) while `selected_mode_idx` is 0-indexed (0-3). The render function should use the same approach as the existing three items.

### Data Structures
None needed.

### Files
- `src/render.js:389` — add line for SPECIAL MODES

## Bug 2a: Spectator Kill Awards Point to Hitter

### Root Cause
`scoring.award_kill(s, hitter)` in `src/scoring.js:91-93` passes `hitter` directly:
```js
award_kill(s, hitter) {
    return this.award_point(s, hitter);  // BUG: hitter hit ball OUT, opponent should get point
}
```

The hitter hit the ball out of bounds; their opponent should win the point.

### Design
Change `award_kill` to award point to `1 - hitter` (opponent):
```js
award_kill(s, hitter) {
    return this.award_point(s, 1 - hitter);
}
```

### Data Structures
None.

### Caller Analysis
`src/main.js:680` is the only caller:
```js
const result = scoring.award_kill(score, fly_out_hitter);
```
Here `fly_out_hitter` is the player who last hit the ball. With the fix, the opponent correctly receives the point.

### Files
- `src/scoring.js:92` — change `hitter` to `1 - hitter`

## Bug 2b: Double Bounce Always Awards Point to Opponent

### Root Cause
`src/main.js:697-699` — the `BALL_DOUBLE_BOUNCE` handler always calls `resolve_violation_point`, which awards the point to `1 - last_hit_by` (opponent). This is only correct when the ball bounces twice on the hitter's own side (a fault). When the ball bounces twice on the opponent's side (a winner), the hitter should win the point.

Two sub-cases:

| Scenario | `last_bounce_side` vs `last_hit_by` | Correct winner |
|----------|--------------------------------------|----------------|
| Winner (ball bounces twice on opponent's side) | `last_bounce_side ≠ last_hit_by` | `last_hit_by` (hitter) |
| Fault (ball bounces twice on own side) | `last_bounce_side = last_hit_by` | `1 - last_hit_by` (opponent) |

### Design
In `src/main.js`, check `ball_obj.last_bounce_side` vs `ball_obj.last_hit_by`:
- Different → winner → `resolve_point(hitter)` (normal point, no violation message)
- Same → fault → `resolve_violation_point("double_bounce", hitter)` (violation, opponent gets point, "DOUBLE BOUNCE" message)

### Data Structures
None needed — `ball_obj` already tracks `last_bounce_side`.

### Files
- `src/main.js:697-700` — split into two branches

## Feature 3: Controls Manual Screen (ESC During Game)

### Requirements
- ESC during `STATE_SERVING`, `STATE_PLAYING`, or `STATE_POINT_SCORED` shows a help overlay
- Game loop pauses while help is displayed
- ESC or Space/Enter dismisses help and resumes previous state
- Help shows key bindings for P1 (and also P2 in 2P mode)
- Help does NOT show during menu, special menu, game over, kill cam, or violation replay

### Design

#### State Machine
Add `STATE_HELP = "help"` constant. When ESC is pressed during active game states:
1. Save current state → `help_prev_state`
2. Set `game_state = STATE_HELP`
3. In `gameLoop()`, skip update logic when `STATE_HELP` (pause game)
4. In `draw_game()`, render existing game frame behind a semi-transparent overlay, then render help text
5. On ESC/Space/Enter → restore `help_prev_state`

#### ESC Input Handling
Currently, ESC is not bound in any key map. For the help screen:
- Add "Escape" to `KEY_MAP_BOTH` mapping to a new virtual button, or handle directly in `gameLoop()`
- Simplest approach: handle ESC keydown directly in `gameLoop()` via a global keydown listener or by adding it to `input1`'s key map.

Since we need ESC to work for both P1 and P2 input controllers, the cleanest approach is:
- Add ESC mapping to `BTN_X` in `KEY_MAP_BOTH` for P1 (or create a separate mechanism)
- But `BTN_X` is already used for "E" (use item). ESC should be independent.
- Best approach: Add a standalone `esc_just_pressed` flag to the input module, or handle it as a special case in `gameLoop()` by adding a direct `keydown` listener.

**Decision:** Add ESC to `KEY_MAP_P1` as a separate check. Create a new input helper `input1.pressed_esc()` or simply check a global `esc_pressed` flag. But the simplest approach: bind ESC to BTN_X only in the context of the help screen (since BTN_X is "use item" during play but ESC is "show help", and they're distinct keys). Or use a new button mapping.

Simplest implementation: In `gameLoop()`, before the state dispatch, check if ESC is pressed (via `input1.pressed(BTN_X)` or a dedicated `keydown` listener for Escape key) and game state is a playing state, then toggle help. However, BTN_X is "E" which means using an item also toggles help. That's a conflict.

Better approach: Handle ESC via a separate `window` keydown event listener that sets a flag `esc_just_pressed`, consumed each frame. Or add `"Escape"` to `KEY_MAP_BOTH` as a new button, but that would require adding a new button constant.

**Final Decision:** Add `"Escape"` to `KEY_MAP_BOTH` mapped to a new button `BTN_HELP = 8` (extend `NUM_BUTTONS` to 9). This is clean, extensible, and avoids conflicts.

Actually, even simpler: Since we already have `BTN_X` which is triggered by `E` key, we can't reuse it. Let me reconsider.

Looking at the existing code more carefully:
- `BTN_X` (mapped to "e") is used for "Use item"
- ESC is only relevant for help screen

Simplest approach without modifying input constants: add a direct keyboard listener for Escape in `main.js` that sets a `help_requested` flag, consumed in `gameLoop()`. This is a one-off and avoids bloat.

Even cleaner: Handle ESC pressed detection by adding a direct `keydown` listener in `init_game()` (or at module level) that toggles a flag. This is the simplest approach.

#### Rendering
Add `render.help(is2p)` that draws:
- Semi-transparent overlay (`rgba(0,0,0,0.7)` over full screen)
- Title "CONTROLS" at top
- P1 key bindings table (left column)
- P2 key bindings table (right column, only if `is2p`)
- "Press ESC to resume" at bottom

Key bindings to display:

**Player 1**
| Action | Key |
|--------|-----|
| Move | W/A/S/D |
| Hit / Confirm | Space |
| Serve toss | Mouse click (hold to charge) |
| Aim | A/D + mouse hold duration |
| Shot type | W (topspin), S (slice), default (flat) |
| Use item | E |

**Player 2 (2P mode)**
| Action | Key |
|--------|-----|
| Move | Arrow keys |
| Hit / Confirm | Enter |
| Serve toss | Shift |
| Aim | A/D + Shift hold duration |
| Shot type | ArrowUp (topspin), ArrowDown (slice) |

#### Data Structures
- Add `STATE_HELP = "help"` to `src/constants.js`
- Add `help_prev_state` variable to `src/main.js` (module-level)
- Import `STATE_HELP` in `src/main.js`

#### Files
- `src/constants.js` — add `STATE_HELP`
- `src/main.js` — add ESC handler, help state machine, `help_prev_state` tracking
- `src/render.js` — add `render.help(is2p)` function

## Acceptance Criteria

1. Menu shows "SPECIAL MODES" as 4th item with cursor
2. Selecting "SPECIAL MODES" enters the special modes sub-menu
3. `award_kill` awards point to opponent (fixes scoreboard swap)
4. Double bounce winner awards point to hitter (fixes scoreboard swap)
5. Double bounce fault awards point to opponent with "DOUBLE BOUNCE" message
6. ESC during serving/playing/point_scored shows help overlay
7. Game pauses during help
8. ESC/Space/Enter dismisses help
9. Help shows P1 controls; in 2P mode also shows P2 controls
10. Help does not activate during menu, special_menu, game_over, kill_cam, violation_replay
