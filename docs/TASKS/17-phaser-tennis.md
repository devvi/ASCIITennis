# Issue 17 — Task Analysis: Phaser 3D Tennis Rewrite

## Related Modules (All New)

The entire codebase is replaced. No existing source is reused.

| Module | Description |
|--------|-------------|
| `index.html` | Phaser bootstrap, viewport meta for mobile, Pico-8 style CSS |
| `src/main.js` | Phaser game config, scene registration, game init |
| `src/scenes/Boot.js` | Asset preloading (sprites, sounds) |
| `src/scenes/TitleScene.js` | Title screen with story intro |
| `src/scenes/SelectScene.js` | Opponent selection screen (story context + difficulty) |
| `src/scenes/GameScene.js` | Main tennis match gameplay |
| `src/scenes/ResultScene.js` | Match result with story dialogue |
| `src/objects/Court.js` | 3D court rendering (pseudo-3D isometric), net, lines |
| `src/objects/Player.js` | Player sprite, movement, animation states, racket swing |
| `src/objects/Ball.js` | Ball physics (gravity, bounce, spin), trajectory |
| `src/objects/AI.js` | AI controller (3 difficulty levels) |
| `src/objects/Bully.js` | 3 bully definitions (names, portraits, difficulty, dialogue) |
| `src/systems/Physics.js` | Tennis ball physics (gravity, bounce, spin, net collision) |
| `src/systems/Scoring.js` | Tennis scoring: points 15-30-40, deuce, advantage, game, set |
| `src/systems/Input.js` | Keyboard + touch input abstraction, virtual joystick |
| `src/systems/Story.js` | Story state machine, dialogue data, progression tracking |
| `src/config.js` | Constants: court dimensions, physics params, palette, resolution |
| `src/data/palette.js` | Pico-8 16-color palette definition |
| `src/data/dialogue.js` | Story dialogue text (intro, opponent taunts, results) |
| `assets/sprites/` | Pixel-art sprites (player, bullies, ball, court, UI) |
| `assets/sounds/` | Sound effects (hit, score, win, lose, menu) |

## Impacts

- **Framework shift**: Vanilla Canvas → Phaser 3. Game object lifecycle, sprite management, scene system replace custom game loop
- **Visual overhaul**: ASCII characters → pixel-art sprites with Pico-8 16-color palette at low resolution
- **3D rendering**: Faux-3D isometric or pseudo-3D projection in Phaser (not full WebGL 3D)
- **Mobile support**: Touch input handling added alongside keyboard. Responsive viewport scaling
- **Story system**: Adds narrative layer — dialogue, opponent progression, branching
- **Audio**: Sound effects via Phaser's Web Audio integration
- **Build tooling**: May need a bundler (Vite or Webpack) for Phaser and asset loading

## Summary

Complete rewrite of ASCIITennis. Current ASCII canvas game is replaced with a Phaser-based pixel-art 3D tennis game featuring Pico-8 aesthetics, mobile touch controls, and a story mode with 3 bully opponents. All existing code is discarded.

## Implementation Phases

### Phase 1: Project Scaffold and Phaser Setup
- Initialize project with Phaser 3 dependency (npm install phaser)
- Create `vite.config.js` for dev/build tooling (Vite + Phaser)
- Create `index.html` with Phaser mount point, mobile viewport meta
- Create `src/main.js` with Phaser game config (128×128 resolution, pixel art rendering, Pico-8 background color)
- Create `src/config.js` with all constants
- Create `src/data/palette.js` with Pico-8 16-color palette
- Verify Phaser boots with a colored blank scene

### Phase 2: Scenes Framework
- Implement `BootScene` — preload assets, show loading bar
- Implement `TitleScene` — title text, "Start" prompt, keyboard/touch input
- Implement `SelectScene` — 3 bully cards with names, difficulties
- Implement `GameScene` — main gameplay container
- Implement `ResultScene` — win/lose display with story text
- Scene transitions (Title → Select → Game → Result → Title)

### Phase 3: Court and Visuals
- Render tennis court as pseudo-3D isometric tilemap or sprite composition
- Draw court lines, net, service boxes in Pico-8 colors
- Implement camera/viewport that follows gameplay
- Apply nearest-neighbor scaling for pixel-art crispness
- Draw pixel-art player sprites (idle, moving, swinging animations)

### Phase 4: Ball Physics and Player Controls
- Implement ball physics: gravity, bounce, spin, air resistance
- Implement racket/ball collision detection
- Implement serve mechanic
- Implement shot types: flat, topspin, slice, lob
- Keyboard input (WASD + action keys)
- Touch input (virtual joystick + tap)

### Phase 5: AI Opponent
- Implement basic AI with configurable parameters
- 3 difficulty levels matching the 3 bullies:
  - Easy: slow, low accuracy, flat shots only
  - Medium: moderate speed, mixed shots
  - Hard: fast, high accuracy, all shot types
- AI positioning relative to ball trajectory
- AI shot selection logic

### Phase 6: Scoring and Match Flow
- Implement tennis scoring system (points, games, sets)
- Implement match state machine
- Game loop: serve → rally → point resolution → game → set → match
- Edge cases: deuce, advantage, tiebreak (if needed)

### Phase 7: Story Mode
- Implement `Story` data module with dialogue for all scenes
- Implement 3 bully definitions in `src/data/bullies.js`
- Story flow: Intro → Select Bully → Match → Result dialogue → Next bully → Victory/Game Over
- Track player progress across bullies
- Win condition: defeat all 3
- Lose condition: lose any match → game over → retry option

### Phase 8: Audio and Polish
- Create/generate simple chiptune-style sound effects (Phaser Web Audio or preloaded)
- Sounds for: ball hit, point scored, win/lose, menu navigation
- Responsive layout: scale canvas to fit mobile screen
- Touch control refinements (responsive button placement)
- Performance optimization for mobile
- Title screen with animated elements
- Visual polish: particle effects, screen shake on point win

## Phase Issue Tracking

<!-- Phase issue numbers recorded here after creation -->
