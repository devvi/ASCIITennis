# Product Requirements: Audience & Referee Rendering Fix (观众席和裁判渲染修改)

**Issue:** #145
**Feature:** Fix uneven spectator distribution along court sidelines and correct referee rendering (currently shows "SET GAM" due to scoreboard overlap).

## Motivation

Two visual bugs remain after the #139 audience/referee overhaul:

### 1. Sideline spectator distribution still uneven

**Root cause:** Sideline banks (indices 4-5) generate spectators spanning the full court length (`z = 0` to `z = COURT_LENGTH = 23.77`). Despite the `power=1.8` bias toward the near-camera end, perspective compression still produces a visible imbalance:

- **Near end (player side, z ≈ 0):** Fewer spectators per screen pixel because the camera maps world-z to screen-y at −11.86 px/m — spectators appear spread out.
- **Far end (opponent side, z ≈ 23.77):** Even with fewer total seats, perspective compression (−1.26 px/m, 9.45× compression ratio) packs them tightly, appearing dense.
- **Opponent court occlusion:** Sideline spectators that extend to `z = COURT_LENGTH` overlap with the opponent's playing area, visually blocking the far side of the court.

The `power=1.8` function (`tAdj = Math.pow(t, 1.8)`) only shifts the distribution within `[0, COURT_LENGTH]` — it doesn't remove spectators from the far end or fully compensate for perspective.

### 2. Referee renders as "SET GAM"

**Root cause:** The scoreboard drawn in `render.venue()` and the referee figure drawn in `render.referee()` occupy overlapping screen areas:

- **Scoreboard:** Dark rectangle at `(155, 22, 40, 18)` — covers `x ∈ [155, 195]`, `y ∈ [22, 40]`. Green text `"SET"` at `(160, 24)` and `"GAM"` at `(160, 32)`.
- **Referee (screen-space from projected anchor):** Anchor at world `(COURT_WIDTH/2 + 1.0, 0, COURT_LENGTH/2)` projects to approximately `sx ≈ 158, sy ≈ 41`. The head `@` is at `(155, 29)` and body at `(155, 36)` — both within the scoreboard rectangle `y ∈ [22, 40]`.

Since `render.venue()` is called before `render.referee()` in `draw_game()`, the green "SET GAM" text draws first, and the referee's white characters draw on top. The interleaved text causes the referee area to display garbled output that reads as "SET GAM".

## Feature List

### 1. Fix sideline spectator distribution
- Prevent sideline spectators from extending into the opponent's court area (reduce z-range)
- Ensure spectators are evenly distributed on screen (not bunched at far end, not sparse near end)
- Maintain existing multi-row structure, jitter, and pose system
- Verify no spectator character overlaps with far court lines/opponent area after projection

### 2. Fix referee rendering
- Render referee as a readable screen-space ASCII figure (fixed offsets, not 3D-projected body parts)
- Separate referee and scoreboard screen areas so they do not overlap
- Ensure referee is visible during all game states (serving, playing, point_scored, violation_replay, kill_cam, game_over)
- Ensure violation messages (`OUT!`, `NET!`, `DOUBLE BOUNCE!`) still display correctly during replay

## Acceptance Criteria

- Sideline spectators do not extend beyond `COURT_LENGTH / 2` (the net) along the z-axis, OR alternatively are split into two separate near-half and far-half blocks that leave the opponent's court area clear.
- Sideline spectators appear visually evenly distributed across their z-range on screen (no extreme gaps or clumps).
- Opponent-side court lines (z > COURT_LENGTH/2, within singles/doubles width) are not occluded by spectator characters.
- Scoreboard panel does not overlap with the referee figure (move scoreboard above the referee area, e.g., to `y ∈ [8, 22]`).
- Referee figure maintains existing screen-space rendering with proper 7px separation between body parts (each on its own text line).
- Referee figure remains clearly readable — head (`@`), body (`|`), arms (`/ \`), legs (`/ \`) — in all game states.
- Violation messages still appear correctly during `STATE_VIOLATION_REPLAY`.
- No regression in spectator cheer, death pose, or hit-detection mechanics.
