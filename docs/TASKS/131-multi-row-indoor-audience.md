# Task Breakdown: Multi-Row Indoor Audience

**Issue:** #131
**Related modules:** `src/audience.js` (rewrite), `src/render.js` (render method + venue dressing), `src/constants.js` (config values), `src/camera.js` (projection reuse), `src/court.js` (bounding reference), `tests/audience.test.js` (rewrite tests)

## Impact Summary

| Module | Impact | Description |
|--------|--------|-------------|
| `src/constants.js` | Update existing + add new | Increase `AUDIENCE_COUNT`, add `AUDIENCE_ROWS`, `STAND_OFFSETS`, indoor venue consts |
| `src/audience.js` | Major rewrite | Multi-row position generation, depth sorting, pose variety, cheer propagation |
| `src/render.js` | Major update | Rewrite `audience()` method for depth-sorted draws; add venue dressing (roof, lights, columns) |
| `src/main.js` | Low | Audience `init()` call signature may change; venue dressing drawn in `draw_game()` |
| `src/camera.js` | Low | May expose a `project`-based bounding-box check for early culling |
| `tests/audience.test.js` | Rewrite | New test suite matching new data structures and multi-row placement |

## Research Summary

### Current State (Issue #111 implementation)

The existing audience module (`src/audience.js`) places 24 spectators in 6 fixed perimeter regions:
- 4 corner zones near baselines (2 near, 2 far)
- 2 sideline strips (left, right)

Each spectator is a single-file figure. There is no depth sorting, no multiple rows, and no venue dressing. The `AUDIENCE_COUNT` constant is set to 24.

### Proposed Approach

**Seating layout:** Define stand "banks" — rectangular zones behind each baseline and beside each sideline. Each bank has 3–5 rows of spectators.

**Row geometry:**
- Baseline stands: rows extend away from the baseline (z direction), 0.8m row spacing, with x spanning beyond the court width.
- Sideline stands: rows extend outward from the sideline (x direction), same row spacing, with z spanning the court length.

**Position generation:** For each bank, loop over rows; for each row, place spectators at regular intervals with ±0.15m random jitter for natural variation. Skip positions that overlap with court corners.

**Depth sorting:** After generating all positions, sort spectators by z (back-to-front relative to camera at z=-6). Render farthest-first.

**Pose variety:** Introduce 2–3 idle variants (e.g., relaxed ` O `, leaning `(O)`, attentive ` O `) chosen randomly per spectator on init.

**Venue dressing:** In `render.js`, draw static ASCII elements:
- Roof truss: a line of `^` or `~` characters spanning the top of the visible area.
- Light fixtures: `*` characters hanging from the roof at regular intervals.
- Structural pillars: `H` or `#` characters at the 4 corners of the stands.
- Scoreboard outline: a rectangle of `[]` on the far wall above the baseline stands.

**Phased delivery** (see plan below): TDD first, then data structures, then core logic, then UI/output.

## Plan

### Phase 1: Tests (TDD)
- Rewrite `tests/audience.test.js`:
  - `init()` produces ≥80 spectators across multiple rows.
  - Each spectator has a `row` property.
  - All spectator positions are outside the doubles court bounds.
  - At least 3 distinct row values exist per bank.
  - `get_pose()` returns at least 2 different idle variants across the crowd.
  - `get_pose(i)` returns cheer variant when `cheer_level > 0`.
  - Depth sorting: `spectators` array is ordered back-to-front by z.
  - Audience `update()` and `cheer()` work the same as before.

### Phase 2: Data structures
- Rewrite `src/audience.js`:
  - Replace flat position array with structured generation per bank/row.
  - Define stand banks: near-left, near-right, far-left, far-right, left-sideline, right-sideline.
  - Add `row` field and `variant` field to each spectator.
  - `AUDIENCE_ROWS` constant sets row count per bank.
  - `AUDIENCE_COUNT` raised to reflect multi-row capacity.

### Phase 3: Core logic
- `init()` generates positions bank by bank, row by row, with jitter.
- `init()` assigns a random idle variant to each spectator.
- `init()` sorts spectators by depth (z ascending for back-to-front).
- `cheer()` triggers global cheer as before.
- `update()` decays cheer_level, clamps to 0.

### Phase 4: UI / venue dressing
- Rewrite `render.audience()` for depth-sorted multi-row rendering.
- Add venue dressing functions in `render.js`:
  - `render.roof()` — draw ceiling truss/arch at top of visible area.
  - `render.lights()` — draw overhead light fixtures.
  - `render.pillars()` — draw structural columns at stand corners.
- Insert venue dressing calls in `draw_game()` before court/audience rendering.
