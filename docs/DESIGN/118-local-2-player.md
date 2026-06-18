# Local 2-Player Mode — Design

## Architecture

The game currently supports one human player vs AI. Adding local 2-player mode
requires splitting the input module into two independent state banks, adding a
`side` property to the player data structure, and branching the main loop for
mode-specific logic. All other systems (physics, scoring, court, ball, camera,
audience) work unchanged using player indices 0/1.

```
                    ┌──────────────────┐
                    │    main.js       │
                    │  game_mode: 0|1  │
                    └──┬────┬────┬────┘
                       │    │    │
              ┌────────┤    │    ├────────┐
              │        │    │    │        │
              ▼        ▼    │    ▼        ▼
           input.js  player  │  render.js  scoring.js
         ┌──────┐    .js    │  .js         .js
         │P1    │    side   │  color by
         │state │    clamp  │  side
         │P2    │    by     │  labels by
         │state │    side   │  game_mode
         └──────┘           │
                            │
                      ┌─────┴─────┐
                      │  ai.js    │
                      │ (not      │
                      │  invoked  │
                      │  in 2P)   │
                      └───────────┘
```

## Data Structures

### Input: Dual State Arrays

Replace single `prev`/`curr` arrays with separate state for each player:

```
prev1 = [8 x bool]  ─┐
curr1 = [8 x bool]  ─┤ P1 (WASD + Space)
                     │
prev2 = [8 x bool]  ─┤
curr2 = [8 x bool]  ─┤ P2 (Arrows + Enter)
                     │
                     └── same BTN_* indices (BTN_UP/DOWN/LEFT/RIGHT/A/B/X/Y)
```

Two key maps route distinct physical keys to the same logical button indices:

| Key          | Player | Maps to   |
|-------------|--------|-----------|
| `w`/`W`     | P1     | BTN_UP    |
| `s`/`S`     | P1     | BTN_DOWN  |
| `a`/`A`     | P1     | BTN_LEFT  |
| `d`/`D`     | P1     | BTN_RIGHT |
| ` ` (Space) | P1     | BTN_B     |
| `ArrowUp`   | P2     | BTN_UP    |
| `ArrowDown` | P2     | BTN_DOWN  |
| `ArrowLeft` | P2     | BTN_LEFT  |
| `ArrowRight`| P2     | BTN_RIGHT |
| `Enter`     | P2     | BTN_B     |

Mouse/touch continues to set BTN_A and BTN_B for both players (used for serve).
In 2P mode, P2 server uses Enter for serve toss + swing instead.

**Query functions mirror the P1 originals with `_p2` suffix:**

- `get_movement_p2()` — reads P2 state, returns `[dx, dz]`
- `get_aim_angle_p2()` — reads P2 held LEFT/RIGHT
- `get_shot_type_p2()` — reads P2 pressed BTN_B + held direction
- `pressed_p2(btn)`, `held_p2(btn)`, `released_p2(btn)` — P2 state queries

### Player: `side` Property

```js
// player.new(is_ai, side=0)
{
  x: 0,
  z: is_ai ? COURT_LENGTH - 2 : 3,  // P2 overrides in main.js
  state: PLAYER_IDLE,
  hit_timer: 0,
  swing_duration: 15,
  speed: PLAYER_SPEED,
  is_ai: false,
  side: side || 0,    // 0 = near side (z < COURT_LENGTH/2), 1 = far side
}
```

`side` replaces `is_ai` for all visual decisions (color, racket side). The
`is_ai` flag is still used to distinguish AI in 1P mode (for game-over label
fallback).

### Main Loop: `game_mode` Global

```js
let game_mode = 0;  // 0 = 1P (vs AI), 1 = 2P (local)
```

Branch table:

| Function            | 1P (game_mode=0)                           | 2P (game_mode=1)                            |
|---------------------|---------------------------------------------|----------------------------------------------|
| `start_match()`     | Creates ai_player, positions P2 as AI       | Creates p2_player (human), positions far     |
| `update_playing()`  | P1 input + AI update                        | P1 input + P2 input (no AI)                 |
| `update_serving()`  | P1 or AI serve                              | P1 or P2 human serve                         |
| `resolve_point()`   | Same                                        | Same (uses player indices)                   |
| `resolve_violation` | Same                                        | Same                                         |
| `draw_game()`       | Labels "P"/"A"                              | Labels "P1"/"P2"                             |
| Game over           | "Player" / "AI"                             | "Player 1" / "Player 2"                      |

### Menu Flow

```
┌──────────────────────┐
│  ____  _   _   ___   │  ← ASCII title
│ Select Game Mode:    │
│  > 1-Player          │
│    2-Player          │
└──────────────────────┘
        │
        ├── 1P ──→ Difficulty screen ──→ start_match() (game_mode=0)
        │
        └── 2P ──→ start_match() (game_mode=1, skip difficulty)
```

## Module Changes (Per Phase)

### Phase 1: Tests
- `tests/input.test.js`: P2 key mapping tests (Arrow keys + Enter map correctly),
  P2 state isolation (P1 keys don't affect P2 state and vice versa),
  P2 query functions (`get_movement_p2`, `get_aim_angle_p2`, `get_shot_type_p2`,
  `pressed_p2`, `held_p2`, `released_p2`), P2 combo shots (Enter + Arrow direction).
- `tests/player.test.js`: `side` property defaults, far-side z-clamp
  `[COURT_LENGTH/2 + 0.5, COURT_LENGTH - 0.5]`, side influences z-clamp only.
- `tests/render.test.js`: P2 rendering uses green `#0f0`, racket side +1,
  HUD labels "P1"/"P2" in 2P mode.
- `tests/main.test.js`: 2P init creates second player on far side, 2P serving
  flow (P2 can serve), game-over labels.

### Phase 2: Data Structures
- `src/constants.js`: Add `GAME_MODE_1P = 0`, `GAME_MODE_2P = 1`.
- `src/input.js`: Add `KEY_MAP_P2` for Arrow keys + Enter; duplicate
  `prev`/`curr` arrays as `prev1`/`curr1` and `prev2`/`curr2`;
  refactor `onKeyDown`/`onKeyUp` to dispatch to correct state bank;
  P1 functions remain unchanged as wrappers over state bank 1.
- `src/player.js`: Add `side` parameter to `new()`; `move()` uses
  `p.side` to select z-clamp range.

### Phase 3: Core Logic
- `src/input.js`: Add P2 query functions mirroring P1 originals.
- `src/player.js`: Parameterize `move()` z-clamp by `side`.
- `src/main.js`: Add `game_mode` global; mode selection in `update_menu()`;
  branch `start_match()`, `update_playing()`, `update_serving()`,
  `do_serve()`, `setup_serve()` for 2P; P2 uses `pressed_p2`/`held_p2`.
  Player indices 0/1 remain unchanged for scoring.

### Phase 4: UI/Output
- `src/render.js`: `player()` uses `side` (0=cyan `#0ff`, 1=green `#0f0`)
  and racket side (0=-1, 1=+1). `hud()` shows "P1"/"P2" when `game_mode=1`.
  `menu()` adds mode selection row. `game_over()` labels use `side` for
  2P mode ("Player 1"/"Player 2").
- `src/main.js`: Pass `game_mode` to render functions; game-over label
  uses `score.sets[0] > score.sets[1]` with mode-aware name.

## Key Design Decisions

1. **Same logical button indices** — both players use BTN_UP through BTN_Y. Only
   the physical key-to-button routing differs. This keeps hit-type detection,
   movement, and aim logic identical across players.

2. **`side` not `is_ai`** — `side` is the canonical property for visual decisions.
   `is_ai` is preserved for its original purpose (AI module decision). In 2P mode,
   both players have `is_ai=false` but `side` distinguishes them visually.

3. **No AI changes** — AI module is simply not invoked when `game_mode=1`.
   The `update_playing()` loop replaces `ai.update()` with P2 human input.

4. **Menu vs difficulty** — Mode selection happens before difficulty. In 2P mode,
   difficulty is skipped entirely. This keeps the menu tree shallow.

5. **Scoring unchanged** — Player indices 0 and 1 map to P1 and P2 in both modes.
   Only display labels change. `server = 1 - server` alternation works identically.
