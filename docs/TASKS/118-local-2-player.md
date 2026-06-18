# Tasks: Local 2-Player Mode (#118)

Related modules: src/main.js, src/input.js, src/player.js, src/render.js, src/constants.js

## Phase 1: Tests (TDD)

Write tests first before any implementation code.

### Input tests (in `tests/input.test.js`)
- [ ] P2 key mapping: ArrowRight→BTN_RIGHT, ArrowUp→BTN_UP, ArrowDown→BTN_DOWN, ArrowLeft→BTN_LEFT, Enter→BTN_B
- [ ] P2 input isolation: pressing Arrow keys does not affect P1 state arrays
- [ ] P1 input isolation: pressing WASD does not affect P2 state arrays
- [ ] `input.p2.pressed()`, `input.p2.held()`, `input.p2.released()` work correctly (state transitions)
- [ ] `input.p2.get_movement()` returns correct dx/dz for directional keys
- [ ] `input.p2.get_shot_type()` returns correct shot (flat/topspin/slice/lob) for combo inputs
- [ ] `input.p2.get_serve()` returns true on BTN_B or BTN_A press
- [ ] P2 keyboard `keydown`/`keyup` events update P2 virtual button states correctly
- [ ] P2 mouse `mousedown`/`mouseup` events set P2 BTN_A and BTN_B correctly
- [ ] `input.update()` snapshots both P1 and P2 previous frame states for pressed/released detection

### Player tests (in `tests/player.test.js`)
- [ ] `player.new(false, 1)` creates player with `side: 1`
- [ ] `player.move()` clamps `side: 0` to near half `[0.5, COURT_LENGTH/2 - 0.5]`
- [ ] `player.move()` clamps `side: 1` to far half `[COURT_LENGTH/2 + 0.5, COURT_LENGTH - 0.5]`
- [ ] `player.new(false)` defaults to `side: 0` (backward compat)

### Main flow tests (in `tests/main.test.js`)
- [ ] Menu allows mode selection (1P/2P) with LEFT/RIGHT keys
- [ ] 2P mode starts with two human players, no AI
- [ ] In 2P playing state, P1 input moves P1, P2 input moves P2
- [ ] In 2P mode, P1/P2 each serve from their respective halves
- [ ] Point scored shows P1/P2 labels instead of Player/AI

### Render tests (in `tests/render.test.js`)
- [ ] P1 rendered cyan (#0ff), P2 rendered green (#0f0) when `side` is set
- [ ] Menu renders mode selection option

## Phase 2: Data Structures

- [ ] Add `side` property to `player.new(is_ai, side)` with default 0
- [ ] Add `MODE_1P = 1` and `MODE_2P = 2` constants in `src/constants.js`
- [ ] Restructure `src/input.js` into `input.p1` and `input.p2` sub-objects
  - P1 key map: WASD + Space → BTN_UP/DOWN/LEFT/RIGHT/B
  - P2 key map: Arrow keys + Enter → BTN_UP/DOWN/LEFT/RIGHT/B
  - Each with independent `prev[]`/`curr[]` arrays

## Phase 3: Core Logic

- [ ] Implement `input.p2.get_movement()`, `input.p2.get_shot_type()`, `input.p2.get_serve()` query functions
- [ ] Implement `player.move()` z-clamp by `side` (near half vs far half)
- [ ] Add `game_mode` variable and mode branching in `src/main.js`
  - 1P mode: current behavior (P1 input + AI loop)
  - 2P mode: P1 input + P2 input, no AI invocation
- [ ] Implement 2P serve logic (server player serves from their own half)
- [ ] Ensure `ball.hit()` uses correct player index (0 for P1, 1 for P2)

## Phase 4: UI/Output

- [ ] Menu mode selection: LEFT/RIGHT toggles 1-Player ↔ 2-Player, B to confirm
- [ ] `render.player()` uses `p.side` for color and racket side:
  - `side === 0` → cyan `#0ff`, racket -1
  - `side === 1` → green `#0f0`, racket +1
  - Fallback to `is_ai` when `side` absent
- [ ] `render.hud()` labels adapt: "P1"/"P2" in 2P mode vs "P"/"A" in 1P
- [ ] Point/game-over messages use "P1"/"P2" in 2P mode, "Player"/"AI" in 1P

PLAN_ISSUE=120
