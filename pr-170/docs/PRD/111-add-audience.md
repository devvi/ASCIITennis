# Product Requirements: Add Audience / Spectators

**Issue:** #111
**Feature:** ASCII-art audience figures around the court perimeter that react to gameplay.

## Motivation

The court currently feels empty. Adding a small audience that cheers when a player wins a point adds atmosphere and feedback to the game's ASCII presentation.

## Feature List

1. **Audience placement** — ~20–30 spectator figures positioned around the court perimeter (behind baselines, along sidelines), outside the playable area.
2. **Idle animation** — Default state: simple ASCII figures (e.g. `O` with `_` body).
3. **Cheer animation** — On point-won events, spectators switch to a raised-arms cheer pose (e.g. `\o/`).
4. **Cheer decay** — Cheer state fades back to idle over ~60–90 frames (~1–1.5s).
5. **Integration with scoring** — Trigger cheers in `resolve_point()` and `resolve_violation_point()`.
6. **Rendering order** — Insert audience rendering after court/net but before players/ball for correct depth.
7. **Configurable density** — Number of spectators tunable via a constant.
8. **Camera-aware** — Reuse existing `camera.project()` system so figures are correctly projected into the 2D ASCII view.

## Acceptance Criteria

- Spectators are visible around the court in the correct perspective.
- Spectators show idle poses by default.
- When a point is scored, all spectators switch to cheer pose.
- Cheer pose persists briefly (~60–90 frames) then decays back to idle.
- Audience rendering does not overlap with players, ball, net, or HUD.
- No performance regression (rendering is already lightweight).
- All visible spectators are within the 240×136 screen bounds after projection.
