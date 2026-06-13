# Issue 30: 画面迭代 — Tasks

## Related Modules

- `src/render.js` — major rewrite of court/net/player/ball/HUD drawing
- `src/camera.js` — replace 3D perspective projection with 2D top-down mapping
- `src/constants.js` — may adjust SCREEN_W/H, remove FOV/DEPTH_CHARS
- `src/main.js` — update `draw_game()` camera init
- `tests/render.test.js` — new tests for top-down rendering
- `tests/camera.test.js` — new tests for 2D camera

## Impacts

- Render pipeline completely changes from perspective to top-down
- Camera module simplified from 3D projection to 2D mapping
- Game logic untouched — physics, AI, scoring, input unchanged
- All existing tests for logic modules should continue to pass

---

## Phase 1: Tests (TDD)

Write test cases for the new top-down camera and renderer. Tests should cover:

- `camera.topdown.project()` maps world (x,z) to screen (sx,sy) correctly
- `camera.topdown.init()` sets correct view bounds
- `render.court()` draws all 7 line segments + net
- `render.player()` draws player character at correct position
- `render.ball()` draws ball character at correct position
- HUD rendering displays score/games/sets correctly
- Menu and game_over screens render without error

**File:** `tests/camera.test.js` (extend), `tests/render.test.js` (new)

---

## Phase 2: Camera (2D Top-Down)

Replace `camera.js` 3D perspective projection with a simple 2D coordinate mapping:

- Remove `project()`, `project_char()`, `draw_line()`, `draw_rect()`, `depth_char()`
- Add `topdown` object with:
  - `init()` — set view bounds (court extents mapped to screen)
  - `world_to_screen(x, z)` — map world coords to pixel coords
  - `draw_line(x1,z1, x2,z2)` — draw straight 2D line on canvas
- Constants: remove FOV, DEPTH_CHARS; potentially add top-down-specific values

**File:** `src/camera.js`

---

## Phase 3: Renderer (Top-Down Display)

Rewrite `src/render.js` to draw everything in 2D top-down view:

- `render.court()` — draw green court rectangle, white lines (baselines, sidelines, service line, center line), net as `=====` style bar
- `render.player(p, label)` — draw character P/A at player's (x,z) position, optionally with a shadow
- `render.ball(b)` — draw `o` at ball (x,z), with shadow character beneath
- `render.hud(score)` — compact score display at top showing points, games, sets
- `render.menu()` / `render.game_over()` — preserve existing ASCII art

**File:** `src/render.js` (major rewrite)

---

## Phase 4: Main Integration

Update `src/main.js`:

- Call new camera init for top-down view
- Verify state machine works correctly with new rendering
- Clean up any dead code from old perspective system
- Manual testing: game is playable, readable, fun

**File:** `src/main.js`

---

## Phase 1 Issue Tracking

- [ ] Create GitHub Issue: `[#30] Phase 1: Tests`

## Phase 2 Issue Tracking

- [ ] Create GitHub Issue: `[#30] Phase 2: Camera (2D Top-Down)`

## Phase 3 Issue Tracking

- [ ] Create GitHub Issue: `[#30] Phase 3: Renderer (Top-Down Display)`

## Phase 4 Issue Tracking

- [ ] Create GitHub Issue: `[#30] Phase 4: Main Integration`
