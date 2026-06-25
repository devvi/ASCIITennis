# Product Requirements: Spectator Elimination (观众击杀)

**Issue:** #133
**Feature:** Out-of-bounds ball kills spectators — each kill adds +1 to match score.

## Motivation

The court currently has audience figures that only cheer. This feature adds an arcade-style risk/reward mechanic: hitting the ball out of bounds is no longer a pure penalty — instead, the ball continues into the stands and kills a spectator, awarding 1 point. This creates strategic tension (aim in-bounds vs. blast into the crowd) and adds visual humor and spectacle.

## Feature List

1. **Out-of-bounds trajectory extension** — Ball continues flying after going out, following its real physics trajectory into the audience area, instead of immediately halting for a violation replay.
2. **Spectator hit detection** — Ball trajectory is checked against spectator positions. The nearest spectator within a hit radius (tunable, ~1.0m) is flagged as hit.
3. **Individual spectator state** — Each spectator has an `alive`/`dead` flag, replacing the single global `cheer_level`.
4. **Death animation/pose** — Dead spectators display an "X X" eyes and slumped body (e.g. ` X ` / `|_|` or similar) instead of the normal idle or cheer pose.
5. **Score increment on kill** — `scoring.award_kill(hitter)` adds 1 raw point to the hitter's game point total, displayed immediately on the HUD with a visual indicator (e.g. "KILL +1" flash).
6. **Kill-to-win integration** — Killed spectators feed into the existing tennis scoring: each kill is equivalent to winning a point (advances 15→30→40→game). Alternatively, kills are tracked as a separate bonus score shown alongside the tennis score.
7. **New game state** — `STATE_KILL_CAM` (or similar) — brief pause/focus on the killed spectator (~30 frames) before resuming normal play.
8. **Kill limit** — Dead spectators stay dead. Once all spectators are dead, no more kills possible (ball simply goes out as normal).
9. **Cheer on kill** — Surviving spectators cheer louder/longer when a kill occurs.
10. **Configurable density** — Kill radius, kill-cam duration, and death pose tunable via constants.

## Acceptance Criteria

- Ball that goes out of bounds continues into the audience instead of immediately stopping.
- Ball trajectory that passes near a living spectator triggers a kill on that spectator.
- Killed spectator permanently changes to a death pose.
- Match score increments by 1 when a kill occurs.
- HUD shows kill feedback (e.g. "KILL +1" or visual flash).
- Surviving spectators cheer when a kill happens.
- When all spectators are dead, balls that go out behave normally (no kills possible).
- Kill-cam pause is brief and does not break game flow.
- No performance regression from per-frame spectator hit checks.
- Spectator death persists at minimum for the duration of the current game (optional: reset on new game).
