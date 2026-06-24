# Issue 30: 画面迭代 (Screen Visual Rework)

## Product Requirements

The current game uses first-person perspective ASCII rendering which produces an unrecognizable, unplayable visual. This issue reworks the display to a top-down bird's-eye view inspired by Mario Tennis (GBC).

## Features

1. **Top-down perspective** — camera fixed above court looking straight down, no perspective distortion
2. **Full-court view** — entire court visible at once (no scrolling needed for ASCII resolution)
3. **2D ASCII court rendering** — court surface, lines, and net drawn with ASCII characters on a grid
4. **Player sprites** — distinct ASCII characters for human and AI players, showing position clearly
5. **Ball sprite** — visible ball character with shadow on court surface
6. **Clear HUD** — score, game/set counts, serving indicator, point messages
7. **Menu** — title screen and difficulty selection preserved

## Acceptance Criteria

1. Court is drawn from top-down view with lines (baselines, sidelines, service line, center line) and net
2. Human player is shown as a distinct character (e.g. `P`) at correct court position
3. AI player is shown as a distinct character (e.g. `A`) at correct court position
4. Ball is shown as a character (e.g. `o`) at correct position
5. Ball shadow shown on court surface below ball
6. HUD shows score, games, sets clearly at top of screen
7. Serving state shows "Your serve" / "AI serving" messages
8. Point scored shows winner briefly
9. Menu and game-over screens preserved
10. Game remains playable with same WASD + click controls
