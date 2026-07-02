# Issue 30: 画面迭代 — Design

## Architecture: Top-Down 2D Render Pipeline

Replace the first-person 3D perspective camera with a fixed top-down 2D view. The game logic (physics, AI, scoring, input) is completely unchanged — only the visual output is rewritten.

### Coordinate System

```
World space (unchanged):
  x: -COURT_WIDTH/2 ... +COURT_WIDTH/2
  z: 0 (human baseline) ... COURT_LENGTH (AI baseline)
  y: vertical (ignored for top-down positioning, used only for ball shadow)

Screen space (canvas pixel coords):
  sx: 0 ... SCREEN_W-1    (columns, left→right)
  sy: 0 ... SCREEN_H-1    (rows, top→bottom)
```

Mapping: world (x,z) → screen (sx,sy) via simple linear scale + offset.

### View Layout

```
┌──────────────────────────────────────┐  sy=0
│  HUD:  P:15  A:30  Games 0-0  Sets  │  HUD area (~15 rows)
│  0-1                                 │
├──────────────────────────────────────┤
│                                      │
│   ┌──────────────────────────┐       │
│   │                          │       │
│   │  AI SIDE (top)           │       │  Court area
│   │  ── net ──────────────   │       │  (~100 rows)
│   │  Player SIDE (bottom)    │       │
│   │                          │       │
│   └──────────────────────────┘       │
│                                      │
│  P (human)            A (AI)        │  Player/ball row
│                        o (ball)     │
├──────────────────────────────────────┤
│  Status: "Your serve" / "Point: P"   │  Status area (~20 rows)
└──────────────────────────────────────┘  sy=SCREEN_H-1
```

### Court Drawing (ASCII Grid)

The court occupies the central rectangular region of the screen. Draw with characters on a monospaced character grid (not pixel-precise canvas drawing).

| Element | ASCII | Color |
|---|---|---|
| Court surface | ` ` (space) filled bg | Green (#0a0) |
| Baselines / Sidelines | `-` `|` or `=` | White (#fff) |
| Service line | `-` | White (#fff) |
| Center line | `|` | White (#fff) |
| Net | `=` `x` `+` pattern | White (#fff) |
| Player (human) | `P` | Cyan (#0ff) |
| Player (AI) | `A` | Red (#f00) |
| Ball | `o` | Yellow (#ff0) |
| Ball shadow | `.` | Dark gray (#333) |

### Module Changes

#### `src/constants.js`
- Remove `FOV`, `DEPTH_CHARS`
- Keep `SCREEN_W`, `SCREEN_H` (or adjust for better aspect)
- Add top-down specific constants: `HUD_HEIGHT`, `STATUS_HEIGHT`, `COURT_PADDING`

#### `src/camera.js` — Major rewrite
Replace entire module with `camera.topdown`:
- `init()` — compute scale/offset to map world coords to screen coords
- `world_to_screen(x, z)` → `{sx, sy}`
- Methods: `draw_line()`, `draw_char()` for court/player/ball rendering on canvas
- Remove all 3D projection code, `depth_char()`, `draw_rect()`

#### `src/render.js` — Major rewrite
All drawing via monospaced character grid on canvas (text-based), not pixel graphics:
- `render.court()` — fill green bg, draw white line characters
- `render.net()` — draw `=====` across middle
- `render.player(p, label)` — draw label `P`/`A` at mapped position
- `render.ball(b)` — draw `o` at position, `.` shadow beneath
- `render.hud(score)` — compact score display in top region
- `render.menu()` / `render.game_over()` — preserve existing ASCII art (adjust positions for new layout)

#### `src/main.js` — Minor update
- Replace `camera.init()` call with top-down init
- Update any coordinate references if needed
- Remove perspective-specific dead code

### Data Flow

```
game loop
  → update() [unchanged physics/AI/input]
  → beginFrame()
  → camera.topdown.init() [set view bounds]
  → render.court()
  → render.net()
  → render.ball(ball)
  → render.player(human, 'P')
  → render.player(ai, 'A')
  → render.hud(score)
  → status messages (print)
  → requestAnimationFrame
```

### Mario Tennis (GBC) Reference

Key visual principles adapted:
- **Top-down fixed camera** — whole court visible, no scrolling
- **Clear player differentiation** — distinct characters/labels
- **Ball visible with shadow** — shows height via offset shadow
- **Compact HUD** — scores at top, not overlapping court
- **Readable court lines** — contrast with court surface
