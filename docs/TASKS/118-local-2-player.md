# Task Breakdown: Local 2-Player Mode

**Issue:** #118
**Related modules:** `src/input.js` (refactor to factory), `src/player.js` (z-bounds), `src/main.js` (game loop, serve, menu), `src/render.js` (labels/colors), `src/constants.js` (key maps, state), `tests/input.test.js` (updated), `tests/main.test.js` (new tests)

## Impact Summary

| Module | Impact | Description |
|--------|--------|-------------|
| `src/input.js` | **Major refactor** | Convert singleton to `createInput(keyMap, useMouse?)` factory; export P1/P2 key map constants |
| `src/player.js` | Minor | Add `z_min`/`z_max` fields; `player.move()` uses them instead of hardcoded bounds |
| `src/main.js` | **Major** | Menu: add "2 PLAYERS" option; 2P mode: replace AI with second human player; dual-input `update_playing()`; both serve manually; P2 hit targets reversed |
| `src/render.js` | Moderate | `render.player()` uses `side` or player-index for color/label; HUD adapts for 2P mode |
| `src/constants.js` | Low | No new constants needed (or minimal — e.g., `GAME_MODE_2P` string) |
| `tests/input.test.js` | Moderate | Add tests for `createInput()` factory, separate P1/P2 key maps, isolation |
| `tests/main.test.js` | Moderate | Add tests for 2P menu selection, P2 movement, P2 hit targets, both-serving |

## Plan

Research complete — see `docs/PRD/118-local-2-player.md` for requirements.

### Phase 1: Tests (TDD)
- Refactor `tests/input.test.js`:
  - Test `createInput()` factory function
  - Test P1 key map only responds to WASD+Space, not arrows
  - Test P2 key map only responds to Arrows+Enter+Shift, not WASD
  - Test mouse only affects P1, not P2
  - Test both inputs can be updated independently
- Add `tests/main.test.js` tests:
  - Menu "2 PLAYERS" selection creates two non-AI players
  - P2 movement uses P2 input in `update_playing()`
  - P2 hit targets go toward front court
  - Both players can serve manually
  - P2 z-bounds are back half

### Phase 2: Data structures
- Refactor `src/input.js`:
  - Replace singleton `input` with `createInput(keyMap, useMouse)` factory
  - Export default P1 key map and P2 key map
  - Keep backward-compatible `input` export for existing 1P usage
- Update `src/player.js`:
  - Add `z_min` and `z_max` to player object
  - `player.move()` clamps z to `[p.z_min, p.z_max]`
  - `player.new()` sets defaults based on `side` parameter

### Phase 3: Core logic
- Update `src/main.js`:
  - `init_game()`: no change (menu handles setup)
  - `start_match()`: accept `mode` param; if "2p", create `p2` (not AI) with back-half bounds
  - `update_playing()`: read both P1 and P2 inputs, move both, check both for hits
  - `update_serving()`: if server is P2, P2 uses own input for manual toss-and-swing
  - P2 hit targets: aim toward front court (`target_z = 2 + random(2)`)
  - Menu: add "2 PLAYERS" selection, cycle through 3 options

### Phase 4: UI / rendering
- Update `src/render.js`:
  - `render.player(p, label)`: use index-based colors (P1=cyan, P2=red)
  - HUD: show "P1:"/"P2:" in 2P mode
  - Point/winner messages: "Player 1" / "Player 2"
