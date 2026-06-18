# Add Audience

## Product Requirements
Add a spectator audience around the court perimeter. When the player or AI performs well, the audience cheers with animated poses.

## Features
- ~25 spectators positioned around the court perimeter
- Spectators show idle pose by default
- Audience cheers on: point scored, violation point, rally hits >= 5
- Cheer animation lasts ~60 frames
- Cheering spectators shown in yellow, idle in white

## Acceptance Criteria
- Spectators appear outside court bounds
- Audience.cheer() triggers cheer animation
- Audience.update() decrements cheer level
- Audience.get_pose() returns correct pose based on cheer state
- Rendered via camera.project()/draw_char() in render.js
