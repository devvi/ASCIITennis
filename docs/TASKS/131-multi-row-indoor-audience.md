# Task Breakdown: Multi-Row Indoor Audience

**Issue:** #131
**Related modules:** `src/audience.js` (rewrite), `src/render.js` (render method + venue dressing), `src/constants.js` (config values), `src/camera.js` (projection reuse), `src/court.js` (bounding reference), `tests/audience.test.js` (rewrite tests)

## Impact Summary

| Module | Impact | Description |
|--------|--------|-------------|
| `src/constants.js` | Update existing + add new | Raise `AUDIENCE_COUNT` to ~96, add `AUDIENCE_ROWS`, `ROW_SPACING`, `SEAT_SPACING`, `STAND_MARGIN_X`, `STAND_MARGIN_Z` |
| `src/audience.js` | Major rewrite | Multi-row bank/row position generation, depth sorting, pose variant assignment, cheer propagation |
| `src/render.js` | Major update | Rewrite `render.audience()` for depth-sorted multi-row rendering; add `render.venue()` for ceiling truss, lights, pillars, scoreboard |
| `src/main.js` | Low | Insert `render.venue()` call in `draw_game()` pipeline |
| `tests/audience.test.js` | Rewrite | New test suite matching multi-row data structures and placement constraints |

## Research Summary

### Current State (Issue #111 implementation)

The existing audience module (`src/audience.js`) places 24 spectators in 6 fixed perimeter regions:
- 4 corner zones near baselines (2 near, 2 far)
- 2 sideline strips (left, right)

Each spectator is a single-file figure. There is no depth sorting, no multiple rows, and no venue dressing. The `AUDIENCE_COUNT` constant is set to 24. Each spectator object has only `{ x, z }` with no `row` or `variant` fields. All spectators share the same two poses (idle ` O ` / ` _ `, cheer `\o/` / ` - `) determined globally by `cheer_level`.

### Proposed Approach

**Seating layout:** Define 6 stand "banks" — rectangular zones behind each baseline and beside each sideline:
- near-left, near-right (close baseline stands, z < 0)
- far-left, far-right (far baseline stands, z > COURT_LENGTH)
- left-sideline, right-sideline (sideline stands, x beyond court width)

Each bank contains 3–5 rows of spectators with configurable spacing.

**Row geometry:**
- Baseline stands: rows extend away from the baseline (z direction), `ROW_SPACING` apart, with x spanning `STAND_MARGIN_X` beyond the court width.
- Sideline stands: rows extend outward from the sideline (x direction), `ROW_SPACING` apart, with z spanning `STAND_MARGIN_Z` beyond the court length.

**Position generation:** For each bank, loop over rows (0..AUDIENCE_ROWS-1); for each row, place spectators at `SEAT_SPACING` intervals with ±0.15m random jitter for natural variation. Skip positions that overlap with court corners.

**Depth sorting:** After generating all positions, sort `spectators` array by z descending (farthest from camera first) so nearer rows render on top of farther rows during depth-sorted rendering.

**Pose variety:** Introduce 2–3 idle variants (e.g., relaxed ` O ` / ` _ `, leaning `(O)` / ` | `, attentive ` O ` / ` | `) chosen randomly per spectator on init. Cheer still switches all to `\o/` / ` - ` globally.

**Venue dressing:** A single `render.venue()` function draws static ASCII elements:
- Ceiling truss: `^` or `~` characters spanning the top of the visible area.
- Overhead lights: `*` characters along the ceiling at regular intervals.
- Structural pillars: `H` at 4 outer stand corners.
- Scoreboard: ASCII rectangle above far baseline stands.

**Phased delivery** (see plan below): TDD first, then data structures, then core logic, then UI/output.

## Plan

### Phase 1: Tests (TDD)
- Rewrite `tests/audience.test.js`:
  - `init()` produces ≥80 spectators across multiple rows.
  - Each spectator has a `row` property and `variant` property.
  - All spectator positions are outside the doubles court bounds.
  - At least 3 distinct row values exist per bank.
  - `get_pose()` returns at least 2 different idle variants across the crowd.
  - `get_pose(i)` returns cheer variant when `cheer_level > 0`.
  - Depth sorting: `spectators` array is ordered farthest-to-closest by z.
  - Audience `update()` and `cheer()` work the same as before.

### Phase 2: Data structures
- Rewrite `src/audience.js`:
  - Replace flat position array with structured generation per bank/row.
  - Define 6 stand banks: near-left, near-right, far-left, far-right, left-sideline, right-sideline.
  - Add `row` field and `variant` field to each spectator object.
  - Add `AUDIENCE_ROWS`, `ROW_SPACING`, `SEAT_SPACING`, `STAND_MARGIN_X`, `STAND_MARGIN_Z` to constants.
  - Raise `AUDIENCE_COUNT` to ~96.

### Phase 3: Core logic
- `init()` generates positions bank by bank, row by row, with jitter.
- `init()` assigns a random idle variant to each spectator.
- `init()` sorts spectators by depth (z descending, farthest-first).
- `cheer()` triggers global cheer as before.
- `update()` decays cheer_level, clamps to 0.

### Phase 4: UI / venue dressing
- Rewrite `render.audience()` for depth-sorted multi-row rendering.
- Add `render.venue()` in `render.js`:
  - Ceiling truss: `^`/`~` characters spanning top of visible area.
  - Overhead lights: `*` characters along ceiling.
  - Structural pillars: `H` at 4 outer stand corners.
  - Scoreboard: ASCII rectangle above far baseline stands.
- Insert `render.venue()` call in `draw_game()` at correct position in pipeline.
