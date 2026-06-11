# Issue 17 — Task Analysis: Phaser 3D Tennis Rewrite

## Related Modules (All New)

The entire codebase is replaced. No existing source is reused.

| Module | Description |
|--------|-------------|
| `index.html` | Phaser bootstrap, viewport meta for mobile, Pico-8 style CSS |
| `vite.config.js` | Vite dev server + build config for Phaser |
| `src/main.js` | Phaser game config, scene registration, game init |
| `src/config.js` | Constants: court dimensions, physics params, palette, resolution |
| `src/scenes/BootScene.js` | Asset preloading (sprites, sounds) |
| `src/scenes/TitleScene.js` | Title screen with story intro |
| `src/scenes/SelectScene.js` | Opponent selection screen (story context + difficulty) |
| `src/scenes/GameScene.js` | Main tennis match gameplay |
| `src/scenes/ResultScene.js` | Match result with story dialogue |
| `src/objects/Court.js` | Pseudo-3D court rendering, projection, net, lines |
| `src/objects/Player.js` | Player sprite, movement, animation states, racket swing |
| `src/objects/Ball.js` | Ball physics (gravity, bounce, spin), trajectory |
| `src/objects/AI.js` | AI controller (3 difficulty levels) |
| `src/systems/Physics.js` | Tennis ball physics (gravity, bounce, spin, net collision) |
| `src/systems/Scoring.js` | Tennis scoring: points 15-30-40, deuce, advantage, game, set |
| `src/systems/Input.js` | Keyboard + touch input abstraction, virtual joystick |
| `src/systems/Story.js` | Story state machine, dialogue data, progression tracking |
| `src/data/palette.js` | Pico-8 16-color palette definition |
| `src/data/bullies.js` | 3 bully definitions (names, portraits, difficulty, dialogue) |
| `tests/scoring.test.js` | Unit tests for scoring logic |
| `tests/physics.test.js` | Unit tests for ball physics |
| `tests/ai.test.js` | Unit tests for AI decision logic |
| `tests/story.test.js` | Unit tests for story progression |
| `assets/sprites/` | Pixel-art sprites (player, bullies, ball, court, UI) |
| `assets/sounds/` | Sound effects (hit, score, win, lose, menu) |

## Impacts

- **Framework shift**: Vanilla Canvas → Phaser 3. Game object lifecycle, sprite management, scene system replace custom game loop
- **Visual overhaul**: ASCII characters → pixel-art sprites with Pico-8 16-color palette at low resolution
- **3D rendering**: Faux-3D oblique projection in Phaser (not full WebGL 3D)
- **Mobile support**: Touch input handling added alongside keyboard. Responsive viewport scaling
- **Story system**: Adds narrative layer — dialogue, opponent progression, branching
- **Audio**: Sound effects via Phaser's Web Audio integration
- **Build tooling**: Vite bundler for Phaser and asset loading

## Summary

Complete rewrite of ASCIITennis. Current ASCII canvas game is replaced with a Phaser-based pixel-art 3D tennis game featuring Pico-8 aesthetics, mobile touch controls, and a story mode with 3 bully opponents. All existing code is discarded.

## Implementation Phases

### Phase 1: Tests — TDD for Core Logic (#19)
- Write Vitest unit tests for Scoring system (createScore, awardPoint, displayScore, edge cases: deuce, advantage)
- Write Vitest unit tests for Ball physics (gravity, bounce, spin, air resistance, net collision, bounds)
- Write Vitest unit tests for AI decision logic (positioning, shot selection per difficulty)
- Write Vitest unit tests for Story progression (defeat tracking, flow, win/lose conditions)
- Verify all tests pass with `npm test`

### Phase 2: Project Scaffold and Phaser Setup (#20)
- npm install phaser
- Create vite.config.js with Phaser-compatible config
- Update index.html with Phaser mount div, viewport meta, Pico-8 style CSS
- Create src/main.js with Phaser game config (240×136, pixelArt: true, PICO-8 bg color)
- Create src/config.js with all game constants
- Create src/data/palette.js with PICO-8 16-color palette
- Verify Phaser boots with a blank colored scene

### Phase 3: Scenes Framework (#21)
- Implement BootScene — asset preloading with loading bar
- Implement TitleScene — title text + story intro + Start prompt
- Implement SelectScene — 3 bully cards with names, difficulties, locked states
- Implement GameScene — main gameplay container (stub with court)
- Implement ResultScene — win/lose display with story text
- Connect scene transitions (Boot→Title→Select→Game→Result→Select/Title)

### Phase 4: Court and Visuals (#22)
- Implement Court class with oblique projection math (3D world → 2D screen)
- Draw court surface, lines, service boxes in PICO-8 colors using Phaser graphics
- Draw net sprite
- Create pixel-art player sprites (idle, moving, swinging animations)
- Create pixel-art ball sprite + shadow
- Implement depth-based sprite sorting (z-order by projected Y)
- Apply nearest-neighbor scaling for crisp pixel art

### Phase 5: Ball Physics and Player Controls (#23)
- Implement Ball class with full physics: gravity, bounce, spin, air resistance
- Implement net collision detection (ball crossing net plane + height check)
- Implement court bounds checking
- Implement Player class (movement constrained to court, swing state machine)
- Implement 4 shot types: flat, topspin, slice, lob (velocity modifiers)
- Implement serve mechanic (toss + hit)
- Keyboard input (WASD for movement, Space/Enter for action)
- Touch input (virtual joystick + action button using Phaser pointer events)
- Shot combo detection: held direction + action → shot type

### Phase 6: AI Opponent (#24)
- Implement AI class with configurable parameters (reactionTime, accuracy, aggression, speed)
- Implement 3 difficulty configs: easy, medium, hard
- AI positioning logic (track ball, predict landing position, move)
- AI shot selection (restrict shot types by difficulty)
- AI serving logic

### Phase 7: Scoring and Match Flow (#25)
- Implement pure-function Scoring module (createScore, awardPoint, awardGame, awardSet)
- Handle deuce, advantage, game/set/match win conditions
- Implement match state machine (SERVE_WAIT → SERVE → PLAYING → POINT_END → ...)
- Display score HUD on GameScene
- Edge cases: deuce cycling, double faults

### Phase 8: Story Mode (#26)
- Create src/data/bullies.js with 3 bully definitions (name, difficulty, taunt, color)
- Implement Story dialogue data (intro, taunts, results, victory, defeat)
- Implement Story progression system (defeated tracking, flow)
- Wire up TitleScene with intro dialogue
- Wire up SelectScene with bully cards + locked/unlocked states
- Wire up ResultScene with win/lose dialogue + next action
- Victory screen: all 3 bullies defeated → celebration
- Game over screen: lose any match → retry option

### Phase 9: Audio and Polish (#27)
- Create/generate simple chiptune sound effects (ball hit, point scored, win, lose, menu)
- Implement Phaser audio for all game actions using Web Audio
- Responsive layout: Phaser Scale Manager FIT mode for all screen sizes
- Touch control refinements (responsive button placement, prevent default scroll)
- Performance optimization for mobile (texture atlas, sprite batching)
- Title screen with animated/pulsing elements
- Visual polish: particle effects on point win, screen shake
- Final testing on Chrome, Firefox, Safari mobile

## Phase Issue Tracking

| Phase | Name | Issue |
|-------|------|-------|
| 1 | Tests — TDD for Core Logic | [#19](https://github.com/devvi/ASCIITennis/issues/19) |
| 2 | Project Scaffold and Phaser Setup | [#20](https://github.com/devvi/ASCIITennis/issues/20) |
| 3 | Scenes Framework | [#21](https://github.com/devvi/ASCIITennis/issues/21) |
| 4 | Court and Visuals | [#22](https://github.com/devvi/ASCIITennis/issues/22) |
| 5 | Ball Physics and Player Controls | [#23](https://github.com/devvi/ASCIITennis/issues/23) |
| 6 | AI Opponent | [#24](https://github.com/devvi/ASCIITennis/issues/24) |
| 7 | Scoring and Match Flow | [#25](https://github.com/devvi/ASCIITennis/issues/25) |
| 8 | Story Mode | [#26](https://github.com/devvi/ASCIITennis/issues/26) |
| 9 | Audio and Polish | [#27](https://github.com/devvi/ASCIITennis/issues/27) |
