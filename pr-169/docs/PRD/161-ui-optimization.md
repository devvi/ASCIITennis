# Product Requirements: 界面优化 (UI Optimization)

**Issue:** #161

## Summary

Three UI issues affecting title screen, scoreboard, and game controls.

---

## Bug 1: Missing "SPECIAL MODES" in Main Menu

### Symptom
The main menu only shows 3 options (1P EASY, 1P HARD, 2 PLAYERS). The "SPECIAL MODES" item exists in the game logic but is never visually rendered. Users can navigate to it (cursor disappears) and press Enter/Space to enter the special modes menu, but there is no visual indication.

### Root Cause
`src/render.js:378-393` — `render.menu()` hardcodes only 3 menu items in its display:
```
1P EASY     (selected_diff === 1)
1P HARD     (selected_diff === 2)
2 PLAYERS   (selected_diff === 3)
```
But `src/main.js:349` defines 4 items: `["1P EASY", "1P HARD", "2 PLAYERS", "SPECIAL MODES"]`. The 4th item (index 3, `selected_diff === 4`) has no rendering code.

### Fix
Add `selected_diff === 4` rendering for "SPECIAL MODES" in `render.menu()`.

---

## Bug 2: Score Points Awarded to Wrong Player

Two separate scoring bugs exist where the wrong player receives the point.

### Bug 2a: Spectator Kill Awards Point to Hitter

#### Symptom
When the ball goes out of bounds and hits a spectator (triggering the kill cam), the point is awarded to the hitter instead of their opponent. This means:
- Player hits ball out → ball kills spectator → Player gets the point (should be AI)
- AI hits ball out → ball kills spectator → AI gets the point (should be Player)

This creates the appearance that "AI scores on P, Player scores on A" because ball trajectories out of bounds frequently pass through spectator seating areas.

#### Root Cause
`src/scoring.js:91-93` — `award_kill()` passes the hitter directly as the point winner:
```js
award_kill(s, hitter) {
    return this.award_point(s, hitter);  // BUG: should be 1 - hitter
}
```

The hitter hit the ball OUT; their opponent should win the point. `resolve_violation_point()` in `main.js` correctly uses `1 - hitter` for the non-kill out path.

#### Fix
Change `award_kill` to award the point to the opponent: `return this.award_point(s, 1 - hitter)`.

### Bug 2b: Double Bounce Always Awards Point to Opponent (Normal Point Scoring Wrong)

#### Symptom
During normal rally play, when the ball bounces twice on the opponent's side (i.e., a clean winner), the point is awarded to the player who failed to return the ball instead of the player who hit the winner. This makes all normal rally points score backwards.

#### Root Cause
`src/main.js:697-699` — `BALL_DOUBLE_BOUNCE` handling always goes through `resolve_violation_point`, which awards the point to `1 - last_hit_by` (the opponent of whoever last touched the ball):

```js
if (ball_obj.state === BALL_DOUBLE_BOUNCE) {
    if (ball_obj.last_hit_by !== null) {
      resolve_violation_point("double_bounce", ball_obj.last_hit_by);
    }
  }
```

The ball physics (`src/ball.js:86-91`) tracks which side the bounce occurs on via `last_bounce_side`. Two sub-cases exist:

| Scenario | `last_bounce_side` vs `last_hit_by` | Correct winner |
|----------|--------------------------------------|----------------|
| Hitter hits a winner (ball bounces twice on opponent's side) | `last_bounce_side ≠ last_hit_by` | `last_hit_by` (hitter) |
| Hitter faults (ball bounces twice on own side) | `last_bounce_side = last_hit_by` | `1 - last_hit_by` (opponent) |

The current code always uses the second case, so winners are scored backwards.

#### Fix
In `src/main.js`, check `ball_obj.last_bounce_side`:

If `ball_obj.last_bounce_side !== ball_obj.last_hit_by` → winner on opponent's side → use `resolve_point(hitter)` (normal point, no violation message).

If `ball_obj.last_bounce_side === ball_obj.last_hit_by` → fault on own side → use `resolve_violation_point("double_bounce", hitter)` (violation, opponent gets point, show "DOUBLE BOUNCE" message).

---

## Feature 3: Controls Manual Screen (ESC During Game)

### Request
Add a controls help screen showing key bindings, accessible by pressing ESC during gameplay. Pressing ESC should pause the game and display the manual; pressing ESC again (or Space/Enter) should dismiss it and resume.

### Required Controls Display
#### Player 1
| Action | Key |
|--------|-----|
| Move | W/A/S/D |
| Hit / Confirm | Space |
| Serve toss | Mouse click (hold to charge) |
| Aim | A/D + mouse hold duration |
| Shot type | W (topspin), S (slice), default (flat) |
| Use item | E |

#### Player 2 (2P mode)
| Action | Key |
|--------|-----|
| Move | Arrow keys |
| Hit / Confirm | Enter |
| Serve toss | Shift |
| Aim | A/D + Shift hold duration |
| Shot type | ArrowUp (topspin), ArrowDown (slice) |

### Acceptance Criteria
- ESC during `STATE_SERVING`, `STATE_PLAYING`, or `STATE_POINT_SCORED` shows the manual overlay
- Game loop pauses while manual is displayed
- ESC or Space/Enter dismisses the manual and resumes the game
- Manual shows all key bindings for P1 (and P2 in 2P mode)
- Manual does NOT show during menus, special menu, game over, kill cam, or violation replay
- A new game state `STATE_HELP` (or equivalent) is added for the manual screen

## Related Modules
- `src/render.js` — menu rendering, add help screen rendering
- `src/main.js` — game state machine, add help state and ESC input handling
- `src/constants.js` — add `STATE_HELP` constant
- `tests/render.test.js` — test help screen rendering
- `tests/main.test.js` — test help state transitions
