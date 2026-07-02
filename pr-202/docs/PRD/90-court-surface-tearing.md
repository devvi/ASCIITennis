# Issue 90: 图形优化 — Court Surface Tearing Fix

## Product Requirements

The player's near court displays visible horizontal stripe/tearing artifacts during rendering. The current `drawCourtSurface()` function iterates 80 evenly-spaced Z-steps across the court and draws 1-pixel-high horizontal strips. Due to perspective projection, near-court Z-steps map to screen Y positions that are far apart, leaving visible gaps between strips.

## Root Cause

In `src/render.js`, `drawCourtSurface()`:
- Iterates `i = 0..80` across `z = 0..COURT_LENGTH`
- At each step, projects the left/right court-edge points to 2D screen coords
- Draws a single-pixel-high `fillRect` strip

The 80 Z-steps are equally spaced in world space but not in screen space. Near the player's baseline (z near 0), the projected strips are wide apart in Y, producing unfilled horizontal gaps. The opponent's far court (z near COURT_LENGTH) appears denser and shows fewer gaps.

## Features

1. **Solid court surface** — replace the Z-step scanline approach with a filled quadrilateral using the 4 projected court corners
2. **Solid service boxes** — apply the same polygon-fill approach to `drawServiceBoxes()`
3. **No visual artifacts** — court and service boxes render without horizontal stripes or gaps

## Acceptance Criteria

1. The court surface no longer has visible horizontal tearing/stripes
2. The service boxes fill cleanly without gaps
3. All existing render tests pass
4. No changes to game logic, physics, AI, scoring, or input

## Non-Goals

- No changes to camera, physics, AI, scoring, input, or court geometry
- No changes to the Lua codebase
- No new rendering features or effects
