# Product Requirements: Multi-Row Indoor Audience

**Issue:** #131
**Feature:** Replace the sparse single-row audience with dense multi-row stands and indoor venue dressing.

## Motivation

The current 24-spectator audience (from #111) is scattered in a single row around the court perimeter. The venue feels like an empty field with a few onlookers rather than a real tennis stadium. This feature adds multiple rows of seated spectators on all sides and frames the scene with indoor venue elements (roof structure, overhead lighting, structural supports) to create the atmosphere of a covered tennis hall.

## Feature List

1. **Multi-row seating** — 3–5 rows of spectators behind each baseline and along each sideline, with staggered positions for natural depth.
2. **Significantly more spectators** — Increase total count from 24 to ~80–150.
3. **Full surround** — Audience wraps around all 4 sides of the court (not just the current 6 discrete patches).
4. **Depth-sorted rendering** — Spectators farther from the camera render first; closer spectators render last so nearer rows occlude farther ones correctly.
5. **Visual row variation** — Spectator density, character sizing, or pose subtlety varies by row to reinforce depth perception (e.g., far rows may use a compact 1-line character).
6. **Indoor venue dressing** — ASCII elements that suggest an indoor tennis hall:
   - Roof/ceiling truss lines or arch visible above the court.
   - Overhead light fixtures (e.g., `*` or `O` characters along the ceiling).
   - Structural pillars or columns at stand corners.
   - Optional: a simple scoreboard or clock element on the far wall.
7. **Pose variety** — Randomise idle pose slightly across the crowd (e.g., some spectators sit still ` O `, others lean `(O)` or stretch ` O `) for a livelier look.
8. **Cheer propagation** — Cheer still triggers globally (all spectators switch to `\o/`), but may include rare spectators who react one frame later for a natural wave effect.
9. **Performance** — With ~100+ draw calls per frame, ensure rendering remains efficient (batch or skip offscreen spectators early).

## Acceptance Criteria

- At least 80 spectators are visible on screen in a typical playing view.
- Spectators are arranged in at least 3 distinct rows on each side of the court.
- Spectators closer to the camera correctly render in front of farther spectators.
- The scene includes ceiling or overhead structural elements suggesting an indoor venue.
- Idle spectators show at least 2 different appearance variants.
- Cheer still triggers correctly on point-scored and violation events.
- No significant performance drop at 60fps (render budget well under 16ms).
- All audience rendering stays within the 240×136 screen bounds after projection.
