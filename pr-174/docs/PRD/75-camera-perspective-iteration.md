# Issue 75: 视角迭代 — Camera Perspective Iteration

## Product Requirements

The current first-person camera uses a fixed position (`CAM_Z = -5`, `CAM_HEIGHT = 4`) with a simple 1/depth perspective projection and no pitch/rotation. This makes the opponent's side of the court appear heavily compressed, and it is difficult for the player to visually gauge where the ball will land beyond the net.

This feature introduces an **adjustable camera elevation angle (俯仰角)** that tilts the view downward toward the opponent's side. By looking down at a steeper angle, the ball's trajectory and predicted landing zone become much more readable, helping the player react in time.

## Features

1. **Camera pitch (elevation angle)** — add a `CAM_PITCH` angle to the camera projection that rotates the view direction downward, revealing more of the opponent's court surface
2. **Modified projection** — update `camera.project()` to account for pitch rotation (rotate world-space points around the camera's x-axis before the perspective divide)
3. **Tuned default angle** — choose a pitch value that balances readability of the far court with preserving the first-person feel
4. **Smooth backward compatibility** — the existing rendering pipeline (draw_char, draw_line, court surface scanlines) must continue to work without changes

## Acceptance Criteria

1. The opponent's side of the court takes up more vertical screen space than before, improving depth perception on the far side
2. The landing marker (`X`) is more clearly visible on the opponent's side
3. The ball's arc is more readable — the player can see the ball descend toward the opponent's court from a clearer angle
4. All existing camera tests (`tests/camera.test.js`) continue to pass after updating projection expectations
5. All existing render tests (`tests/render.test.js`) continue to pass after updating baseline expectations if needed
6. The change is purely a camera parameter — no physics, AI, scoring, or input changes
