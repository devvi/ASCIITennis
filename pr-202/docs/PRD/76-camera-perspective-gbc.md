# Issue 76: 重构视角 — Camera Perspective Refactor (Mario Tennis GBC)

## Product Requirements

The current camera perspective uses a mild downward pitch (−0.15 rad, ~8.6°) that gives a "low third-person" view. The opponent's court remains compressed and the landing marker is difficult to read. This feature refactors the camera to match the **Mario Tennis Game Boy Color** perspective — a steeper overhead angle that reveals the full court clearly, improving depth perception and ball-readability on both sides.

**Reference:** Mario Tennis GBC uses a ~40–50° downward camera angle, positioned high above and behind the player, with the court filling the screen in a clean perspective trapezoid.

## Features

1. **Steep camera pitch** — increase `CAM_PITCH` to approximately −0.5 to −0.7 radians (29–40° downward), matching the GBC's overhead angle
2. **Higher camera elevation** — raise `CAM_HEIGHT` so the camera looks down from above (GBC-style bird's-eye view)
3. **Adjusted camera depth** — tune `CAM_Z` so the entire court is visible with proper foreshortening
4. **Horizon adjustment** — update `HORIZON_Y` to accommodate the new pitch
5. **Player rendering update** — player ASCII figures should look natural from the new overhead angle (e.g., revised body characters that read well from above)
6. **Ball shadow visibility** — ensure the ball's ground shadow (`@`) is clearly distinguishable from the ball (`O`) at the new angle
7. **Smooth backward compatibility** — no physics, AI, scoring, or input changes

## Acceptance Criteria

1. The camera pitch is steep enough that both baselines are clearly visible and the court fills the screen naturally
2. The landing marker (`X`) on the opponent's side is clearly readable
3. The ball's arc is visible — the player can see the ball rise and descend from the overhead angle
4. All existing camera tests (`tests/camera.test.js`) pass with updated expected values
5. All existing render tests (`tests/render.test.js`) pass
6. No physics, AI, scoring, or input changes — this is purely a camera + rendering change
7. Player figures look appropriate from the steeper overhead angle (not just side-profile characters)

## Non-Goals

- No changes to game logic (physics, AI, scoring, input, court boundaries)
- No changes to the Lua codebase (GBC refactor is JS-only)
- No new features like dynamic camera or zoom
