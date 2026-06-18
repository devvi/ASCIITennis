# Tasks: Local 2-Player Mode

## Related Modules

| Module | Type | Impact |
|--------|------|--------|
| `src/constants.js` | Constants | Add `GAME_MODE_1P`, `GAME_MODE_2P` |
| `src/input.js` | Core | Dual input state arrays, P2 key map, P2 query functions |
| `src/main.js` | Core | Mode selection menu, 2P serving/playing/game-over branches |
| `src/player.js` | Core | `side` property, parameterized z clamp in `move()` |
| `src/render.js` | UI | Player color/racket by `side`, HUD labels by mode |
| `src/ai.js` | Peripheral | No changes — not invoked in 2P mode |
| `tests/input.test.js` | Tests | P2 key mapping, state isolation, P2 query functions |
| `tests/player.test.js` | Tests | Far-side clamping |
| `tests/render.test.js` | Tests | P2 color, racket side, HUD labels |
| `tests/main.test.js` | Tests | 2P init, serving flow |

## Phases

### Phase 1: Tests
- [ ] Add P2 input tests (key mapping, state queries, no cross-talk with P1)
- [ ] Add player far-side clamping tests
- [ ] Add render tests (P2 color, racket side)
- [ ] Add main flow tests (2P init, serving, game-over labels)

### Phase 2: Data structures
- [ ] Add `GAME_MODE_1P`, `GAME_MODE_2P` constants
- [ ] Add P2 key map and dual state arrays in `input.js`
- [ ] Add `side` property to player factory

### Phase 3: Core logic
- [ ] Implement P2 input queries (`get_movement_p2`, `get_shot_type_p2`, `get_aim_angle_p2`, `pressed_p2`)
- [ ] Parameterize `player.move()` z clamp by `side`
- [ ] Add `game_mode` global in `main.js`; branch menu for mode selection
- [ ] Branch `start_match`, `update_playing`, `update_serving`, `do_serve`, `setup_serve` for 2P
- [ ] Branch `resolve_point`, `resolve_violation_point` — P2 uses player 1 index

### Phase 4: UI/output
- [ ] `render.player()` — color/racket side by `side` not `is_ai`
- [ ] `render.hud()` — "P1"/"P2" in 2P mode, "P"/"A" in 1P mode
- [ ] `render.menu()` — mode selection row
- [ ] Game over text — "Player 1"/"Player 2" in 2P mode

## Plan Issue

`PLAN_ISSUE` will be recorded here after creation.
