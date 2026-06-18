# Tiebreaker Scoring — Design

## Problem
At 6-6 in games, `award_game()` requires a 2-game lead to win the set. Games continue indefinitely since no one can achieve 8-6. Real tennis caps sets at 6-6 with a tiebreaker.

## Architecture

### New field on score object
`tiebreak: false` — set to `true` when games reach 6-6. Reset to `false` when set ends.

### New constants
- `TIEBREAK_POINTS_TO_WIN = 7` — points needed to win tiebreak (with 2-point lead)

### Module changes

#### `src/scoring.js`
- **`new()`**: add `tiebreak: false` field
- **`award_game()`**: after incrementing games, check if `games[0] === 6 && games[1] === 6` → set `tiebreak = true`, reset points, return `"tiebreak"`
- **`award_point()`**: when `tiebreak` is true, use raw point counting (0, 1, 2…) instead of 15/30/40. Win at `>= TIEBREAK_POINTS_TO_WIN` with `>= 2` lead. On win: increment `games[winner]`, call `award_set()` directly (bypasses normal game win path since 7-6 only has 1-game lead)
- **`display()`**: when `tiebreak` is true, return `"Tiebreak: X-Y"` instead of point names
- **`award_set()`**: reset `tiebreak` to `false` for new set
- **`reset()`**: reset `tiebreak` to `false`

#### `src/main.js`
- **`resolve_point()`**: during tiebreak, toggle `server` after every odd-numbered point (serve alternates every 2 points)

#### `src/render.js`
- **`render.hud()`**: when `score.tiebreak` is true, show "Games 6-6" and tiebreak point display

### Data flow
```
award_point() ──► (normal) ──► award_game() ──► award_set()
                  │                              ▲
                  │  (6-6 detection)              │
                  └──► tiebreak=true ─────────────┘
                  │                   │
                  │  (each point)     │
                  └──► raw counting   │
                  │                   │
                  │  (win at 7+, +2)  │
                  └──► games++ ───────┘
                       award_set()
```

### Serve rotation during tiebreak
- First server = whoever's turn it is (normal rotation carried `server` into tiebreak)
- Point 1: current server
- Points 2-3: other player
- Points 4-5: original server
- Pattern: switch servers when `total_points % 2 === 1`
- After tiebreak: normal per-game alternation resumes
