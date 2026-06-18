# Local 2-Player Mode — Design

## Data Structure Changes

### Player model (`src/player.js`)
- Add `side` property (0 = near/left, 1 = far/right) to `player.new()`
- `player.move()` uses `p.side` to choose z-clamp:
  - `side === 0`: `[0.5, COURT_LENGTH/2 - 0.5]` (near half)
  - `side === 1`: `[COURT_LENGTH/2 + 0.5, COURT_LENGTH - 0.5]` (far half)
- `player.new(false)` defaults to `side: 0` (backward compatible with existing human)

### Constants (`src/constants.js`)

```js
export const MODE_1P = 1;   // single player vs AI
export const MODE_2P = 2;   // local 2-player
```

### Input (`src/input.js`)
Two independent button state arrays, each with its own key map:

```
input.p1 = { prev, curr } — WASD + Space  → BTN_UP/DOWN/LEFT/RIGHT/B
input.p2 = { prev, curr } — Arrow keys + Enter → BTN_UP/DOWN/LEFT/RIGHT/B
```

Both share the same virtual button constants (BTN_UP=0, etc.). Each has its own `prev[]`/`curr[]` arrays and its own `pressed()`, `held()`, `released()`, `get_movement()`, `get_shot_type()` methods.

**Key map split:**
- P1: `w/W`→UP, `s/S`→DOWN, `a/A`→LEFT, `d/D`→RIGHT, `Space`→BTN_B
- P2: `ArrowUp`→UP, `ArrowDown`→DOWN, `ArrowLeft`→LEFT, `ArrowRight`→RIGHT, `Enter`→BTN_B
- Mouse/click → BTN_A (shared — both players can use mouse for serve/confirm)

## Module Changes

### `src/input.js`
- Expose `input.p1` and `input.p2` objects with same API as current `input`
- Both update on `keydown`/`keyup` — distinguish by checking which key map matches
- `input.update()` snapshots both p1 and p2 prev arrays
- P1 mouse behavior unchanged (sets p1's BTN_A/BTN_B)
- Add P2 mouse handling (sets p2's BTN_A/BTN_B for menu/serve)

### `src/player.js`
- `player.new(is_ai, side)` — new `side` param (default 0)
- `player.move(p, dx, dz)` — z-clamp based on `p.side`

### `src/main.js`
- Add `game_mode` variable (MODE_1P / MODE_2P)
- `init_game()` defaults to MODE_1P
- `update_menu()`:
  - Add mode selection with `BTN_LEFT`/`BTN_RIGHT` toggling 1P/2P
  - On `BTN_B` confirm: if 1P → show difficulty, if 2P → `start_match_2p()`
- `start_match_2p()`:
  - Create two human players (side 0 and side 1)
  - No ai_player created
- `update_playing()`:
  - If MODE_1P: same as now (P1 input + AI)
  - If MODE_2P: P1 input + P2 input, no AI
  - `ball.hit()` uses player index 0 for P1, 1 for P2
- `resolve_point()` labels: uses "P1"/"P2" in 2P mode, "Player"/"AI" in 1P
- `draw_game()`:
  - P2 player rendered with green (#0f0) color
  - Service/hints show P1/P2 context

### `src/render.js`
- `render.player(p, label)` — use `p.side` for color/racket decisions:
  - `side === 0` → cyan `#0ff`, racket -1
  - `side === 1` → green `#0f0`, racket +1
  - Fallback to `is_ai` for backward compat (though `side` will always be present)
- `render.menu()` — show mode selection (1-Player / 2-Player)
- `render.hud()` — show "P1"/"P2" or "P"/"A" based on mode

## No changes needed
- `src/ai.js` — not invoked in 2P mode
- `src/ball.js` — physics unchanged
- `src/camera.js` — no changes
- `src/court.js` — no changes
- `src/scoring.js` — already uses index 0/1
- `src/audience.js` — reacts the same regardless of mode

## Test Plan

New test file: `tests/main_2p.test.js` (or extend `tests/main.test.js`)

### Phase 1: Tests
1. P2 key mapping: ArrowRight → BTN_RIGHT, ArrowUp → BTN_UP, etc.
2. P2 input isolation: pressing Arrow keys does not affect P1 state
3. P1 input isolation: pressing WASD does not affect P2 state
4. `input.p2.pressed()`, `input.p2.held()`, `input.p2.released()` work correctly
5. `input.p2.get_movement()` returns correct dx/dz for directional keys
6. `input.p2.get_shot_type()` returns correct shot for combo inputs
7. `input.p2.get_serve()` returns true on BTN_B or BTN_A press
8. P2 keyboard events update P2 button states correctly
9. P2 mouse events set P2 BTN_A and BTN_B correctly
10. `input.update()` snapshots both P1 and P2 previous frame states

### Phase 2: Data structures
1. Add `side` property to player model
2. Add constants (MODE_1P, MODE_2P)
3. Restructure input into p1/p2 sub-objects

### Phase 3: Core logic
1. P2 `get_movement()`, `get_shot_type()`, `get_serve()` queries
2. Player z-clamp by `side`
3. Mode branching in main loop (1P vs 2P update paths)
4. 2P serve logic (both players can serve from their half)

### Phase 4: UI/Output
1. Menu mode selection (1-Player / 2-Player)
2. P2 rendering (green #0f0) with `side`-based racket side
3. HUD labels adapt to mode (P1/P2 vs P/A)
4. Point/game-over messages show P1/P2 in 2P mode
