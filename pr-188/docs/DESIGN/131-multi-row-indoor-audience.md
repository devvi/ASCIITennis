# Design: Multi-Row Indoor Audience

**Issue:** #131
**Feature:** Replace sparse single-row audience with dense multi-row stands and indoor venue dressing.

## Architecture

### Rendering Pipeline (updated order)

Current order: Court → Net → Audience → Ball → Players → HUD

New order (painter's algorithm, back-to-front):
1. Venue background (ceiling truss, far-wall scoreboard)
2. Audience (depth-sorted, farthest-z first)
3. Court surface & lines
4. Net
5. Ball
6. Players
7. Foreground venue elements (near pillars, lights)
8. HUD & overlays

### Module Responsibilities

| Module | Change |
|--------|--------|
| `src/constants.js` | Add `AUDIENCE_ROWS`, `STAND_OFFSETS`, `ROW_SPACING`, `SEAT_SPACING`, arena lighting/roof consts |
| `src/audience.js` | Rewrite: multi-row generation, per-spectator `row` + `variant`, depth sorting, pose variety, cheer propagation |
| `src/render.js` | Rewrite `render.audience()` for depth-sorted multi-row; add `render.venue()` for roof/lights/pillars/scoreboard |
| `src/camera.js` | No changes needed; existing `project()` used for all venue dressing |
| `src/main.js` | Add `render.venue()` call in `draw_game()`; audience init call same |
| `tests/audience.test.js` | Rewrite to cover multi-row data structures, depth sorting, pose variants, venue dressing |

## Data Structures

### Constants (new in `src/constants.js`)

```js
// Multi-row audience
export const AUDIENCE_ROWS = 4;          // rows per bank
export const ROW_SPACING = 0.8;          // meters between rows
export const SEAT_SPACING = 0.5;         // meters between seats in a row
export const STAND_MARGIN_X = 1.2;       // extra width beyond court sideline
export const STAND_MARGIN_Z = 1.5;       // depth beyond baseline
export const AUDIENCE_COUNT = 96;        // total (was 24)

// Venue dressing
export const ROOF_Y = 6;                 // world y for ceiling
export const ROOF_CHAR = '^';
export const LIGHT_CHAR = '*';
export const PILLAR_CHAR = 'H';
```

### Spectator Object

```js
{
  x: number,       // world x (meters)
  z: number,       // world z (meters)
  row: number,     // row index 0..AUDIENCE_ROWS-1 (0=farthest from court)
  bank: string,    // 'near_left' | 'near_right' | 'far_left' | 'far_right' | 'left_side' | 'right_side'
  variant: number  // idle pose variant index 0..2
}
```

### Stand Banks

6 banks arranged around the court:

```
       far_left     far_right
         ┌─────────────┐
  left   │             │   right
  side   │   COURT     │   side
         │             │
         └─────────────┘
       near_left    near_right
```

- **near_left/near_right**: Behind near baseline (z < 0), x beyond court width
- **far_left/far_right**: Behind far baseline (z > COURT_LENGTH), x beyond court width
- **left_side/right_side**: Along sidelines (0 < z < COURT_LENGTH), x outside court

Each bank generates `AUDIENCE_ROWS` rows of spectators with progressive offset from court.

### Audience Module API (unchanged surface)

```js
audience.init(count?)    // generate positions, assign variants, depth-sort
audience.cheer()         // trigger global cheer
audience.update()        // decay cheer_level
audience.get_pose(i)     // return {top, bottom} strings based on variant + cheer state
```

Internal additions:
- `audience.generate_positions(count)` — bank-by-bank row generation
- `audience.sort_by_depth()` — sort spectators by z descending (farthest first)

## Pose Variants

| Variant | Idle Top | Idle Bottom | Cheer Top | Cheer Bottom |
|---------|----------|-------------|-----------|--------------|
| 0       | ` O `    | ` _ `       | `\o/`     | ` - `        |
| 1       | `(O)`    | `_ _`       | `\o/`     | ` - `        |
| 2       | ` O'`    | ` _ `       | `\o/`     | ` - `        |

Cheer pose is always `\o/` / ` - ` regardless of variant, for visual uniformity during celebration.

## Venue Dressing

### Ceiling Truss (screen-space)
- Drawn at screen Y=2..6, spanning X=10..230
- Characters: alternating `^` and `~` to suggest a truss
- Varies slightly per frame for a subtle shimmer if desired

### Overhead Lights
- `*` characters at regular intervals along the ceiling
- Projected from world positions at (x, ROOF_Y, z) at truss anchor points
- 5-7 lights evenly spaced across the width

### Structural Pillars
- `H` characters at the 4 outer stand corners
- Projected from world positions:
  - Near-left:  (-(COURT_WIDTH/2 + STAND_MARGIN_X + 1), 0, -(STAND_MARGIN_Z + 1))
  - Near-right: ( COURT_WIDTH/2 + STAND_MARGIN_X + 1,  0, -(STAND_MARGIN_Z + 1))
  - Far-left:   (-(COURT_WIDTH/2 + STAND_MARGIN_X + 1), 0, COURT_LENGTH + STAND_MARGIN_Z + 1)
  - Far-right:  ( COURT_WIDTH/2 + STAND_MARGIN_X + 1,  0, COURT_LENGTH + STAND_MARGIN_Z + 1)
- Drawn as vertical column of 3 `H` characters at different heights

### Scoreboard
- ASCII rectangle above the far baseline stands
- Positioned near the horizon line
- Shows `SETS` and `GAMES` in compact form
- Only displayed during playing states (not menu)
