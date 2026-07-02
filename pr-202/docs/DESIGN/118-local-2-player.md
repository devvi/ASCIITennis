# Design: Local 2-Player Mode

**Issue:** #118
**Parent:** #118

## Architecture

### Overview

Add a local 2-player (hot-seat) mode where two human players share one keyboard with separate key bindings. The game mode is selected from the menu alongside existing AI difficulty options.

### Data Structures

#### Input Factory (`src/input.js`)
- Refactor singleton `input` object into a `createInput(keyMap, useMouse)` factory function
- Returns an independent input object with its own `prev`/`curr` button state arrays, event listeners, and query methods (`pressed()`, `held()`, `released()`, `get_movement()`, `get_aim_angle()`, `get_shot_type()`)
- Export two key map constants:
  - `KEY_MAP_P1`: `W`/`A`/`S`/`D` → directions, `Space` → BTN_B, mouse → BTN_A
  - `KEY_MAP_P2`: `ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight` → directions, `Enter` → BTN_B, `Shift` → BTN_A
- Keep backward-compatible default `input` export (combined key map + mouse) for existing 1P usage
- `init(canvas)` is replaced by per-input init that only registers relevant event listeners

#### Player z-bounds (`src/player.js`)
- Player objects gain `z_min` and `z_max` fields
- `player.new(is_ai, side)` where `side` is `"front"` or `"back"`:
  - Front (P1): `z_min = 0.5`, `z_max = COURT_LENGTH/2 - 0.5`, default `z = 3`
  - Back (P2/AI): `z_min = COURT_LENGTH/2 + 0.5`, `z_max = COURT_LENGTH - 0.5`, default `z = COURT_LENGTH - 2`
- `player.move()` clamps z to `[p.z_min, p.z_max]` instead of hardcoded `[0.5, COURT_LENGTH/2 - 0.5]`

### Module Design

```
main.js
  ├── init_game()        — unchanged, menu handles setup
  ├── start_match(mode)  — accepts "1p" or "2p"; creates p2_player for "2p"
  ├── update_menu()      — cycles through EASY / HARD / 2 PLAYERS
  ├── update_serving()   — P2 serves manually (Shift key) in 2P mode
  ├── update_playing()   — reads P1 and P2 inputs, moves both, checks both for hits
  ├── resolve_point()    — winner labels "Player 1" / "Player 2" in 2P mode
  └── draw_game()        — renders both players with appropriate colors/labels

input.js
  ├── createInput(keyMap, useMouse) → { init, update, pressed, held, released, ... }
  ├── KEY_MAP_P1         — WASD + Space
  ├── KEY_MAP_P2         — Arrows + Enter + Shift
  └── input              — backward-compatible default singleton

player.js
  └── .new(is_ai, side)  — returns player with z_min/z_max set by side

render.js
  ├── render.player(p, label, color)  — color param added for 2P distinction
  ├── render.hud(score, mode)         — "P1:"/"P2:" in 2P, "P:"/"A:" in 1P
  └── render.game_over(winner)        — "Player 1" / "Player 2" in 2P
```

### Data Flow

```
Frame loop (gameLoop):
  1. update_menu() / update_serving() / update_playing()
  2. input_p1.update()
  3. input_p2.update() (only in 2P mode)
  4. draw_game()
```

### Key Interactions

1. **Menu flow**: User selects "2 PLAYERS" from menu → `start_match("2p")` creates `p1_player` (front half) and `p2_player` (back half) with `input_p1` and `input_p2` respectively.

2. **Serve**: In 2P mode, both players serve manually:
   - P1: mouse click (BTN_A via mouse) for toss, mouse click for swing
   - P2: Shift (BTN_A via keyboard) for toss, Shift for swing

3. **Hit targeting**: 
   - P1 hits target toward back court: `target_z = COURT_LENGTH - 2 - random(2)`
   - P2 hits target toward front court: `target_z = 2 + random(2)`

4. **Rendering**:
   - P1: cyan (`#0ff`), racket on left side (same as current human)
   - P2: red (`#f44`), racket on right side (same as current AI)
   - HUD: "P1:" and "P2:" labels
   - Point/winner: "Player 1" / "Player 2"

### Constraints

- No changes to `src/ball.js`, `src/scoring.js`, `src/camera.js`, `src/court.js`, `src/ai.js` (AI module is unused in 2P mode)
- Existing 1P mode must work exactly as before
- All existing tests must pass
