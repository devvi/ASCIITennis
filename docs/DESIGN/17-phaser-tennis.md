# Issue 17 — Phaser 3D Tennis: Architecture & Design

## Architecture Overview

Phaser 3 web game. All source is new — no existing code reused. Scene-based flow orchestrated by Phaser's scene manager. Game state persisted across scenes via Phaser's registry.

```
Scene Flow:
  Boot → Title → Select → Game → Result → (Select | Title)
```

### Scene Responsibilities

| Scene | Purpose |
|-------|---------|
| `BootScene` | Preload all assets (sprites, fonts, sounds), show loading bar |
| `TitleScene` | Title screen with story intro text, animated background, "Start" prompt |
| `SelectScene` | Show 3 bully cards (name, portrait, difficulty), allow selection |
| `GameScene` | Main tennis match — court, players, ball, AI, scoring, UI, touch controls |
| `ResultScene` | Match result screen, story dialogue, win/loss handling, next action |

### Data Flow

```
Phaser.Registry (persistent across scenes)
  ├── progress: { defeated: [bool,bool,bool], current: 0..2 }
  ├── selectedBully: bullyDef
  ├── matchResult: { winner, score, stats }
  └── dialogueFlags: { seenIntro, seenResult }

Scene transitions pass data via:
  this.scene.start('NextScene', { key: value })
```

## Pseudo-3D Approach

Top-down oblique projection (similar to original ASCII tennis but with pixel-art sprites).

- Logical court: 23.77m × 10.97m (real tennis dimensions)
- Screen: 240×136 pixels (PICO-8 resolution), scaled 4× → 960×544
- Projection: `screenX = courtX * scaleX; screenY = courtZ * scaleY` (orthographic with Z-depth)
- Sprites scaled by depth (lower on screen = smaller = farther)
- Ball height (Y) drawn as vertical offset + shadow on ground
- Players rendered at fixed scale with depth-based Y offset

**Rendering order (back to front):**
1. Court surface (filled polygons)
2. Court lines (thin sprites/lines)
3. Net sprite
4. Shadow of ball
5. AI player sprite
6. Ball sprite (offset by height)
7. Human player sprite
8. UI overlay (score, touch buttons)

## Module Design

### Phaser Game Config (`src/main.js`)

```js
{
  type: Phaser.AUTO,       // WebGL with Canvas fallback
  width: 240,              // PICO-8 logical width
  height: 136,             // PICO-8 logical height
  pixelArt: true,          // nearest-neighbor scaling
  backgroundColor: '#5f574f', // PICO-8 dark gray
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, TitleScene, SelectScene, GameScene, ResultScene]
}
```

### `src/config.js` — Constants

- Court dimensions, net height, ball radius, gravity, physics params
- Hit type definitions (flat, topspin, slice, lob) with speed/arc/spin params
- PICO-8 color palette as hex array (16 colors)
- Screen dimensions (240×136), scale factor (4×)
- Animation frame counts, timing constants
- AI config templates for 3 difficulty levels

### `src/scenes/BootScene.js`

- Preload sprite atlas, sound effects, font bitmap if needed
- Create loading bar using Phaser graphics
- Transition to TitleScene on complete

### `src/scenes/TitleScene.js`

- Display game title with PICO-8 pixel font rendering
- Show story intro text (protagonist at tennis school, threat of expulsion)
- "Tap to Start" prompt using Phaser tweens (pulsing)
- Listen for any keypress or touch → transition to SelectScene
- Pass `{ seenIntro: true }` to registry

### `src/scenes/SelectScene.js`

- Show 3 bully cards arranged vertically or in a row
- Each card: name, difficulty indicator (★), short taunt text
- Bully definitions from `src/data/bullies.js`:
  - Bully 1: "The Serve Slinger" — Easy
  - Bully 2: "The Net Rusher" — Medium  
  - Bully 3: "The Ace Master" — Hard
- Navigation: up/down swipe or W/S keys, confirm with tap/click
- Story context: "Defeat all 3 to stay in school!"
- Locked bullies (defeated) shown with checkmark
- Transition to GameScene with selected bully data

### `src/scenes/GameScene.js` — Main Gameplay

**State machine within scene:**

```
SERVE_WAIT → SERVE → PLAYING → POINT_END → (SERVE_WAIT | MATCH_END)
```

**Update loop per frame:**
1. Input polling (keyboard + touch)
2. Player movement + swing logic
3. AI update (positioning + shot decision)
4. Ball physics update
5. Collision detection (ball ↔ racket, ball ↔ net, ball ↔ ground, ball ↔ bounds)
6. Scoring logic
7. Camera/projection update
8. Render all objects

**Objects created in create():**
- `this.court` — Court graphics object
- `this.player` — Player sprite with animations (idle, move, swing)
- `this.ai` — AI opponent sprite
- `this.ball` — Ball sprite
- `this.scoreDisplay` — Score text objects
- `this.touchControls` — Virtual joystick + action button group

### `src/scenes/ResultScene.js`

- Show match result: win or lose
- Display story dialogue based on result:
  - Win: bully taunts → protagonist response → next bully unlocked
  - Lose: "You're expelled..." → retry option
- If all 3 bullies defeated: victory celebration screen
- Actions: "Next Bully" / "Retry" / "Main Menu"

### `src/objects/Court.js`

```js
class Court {
  constructor(scene) {
    // Draw court surface, lines, service boxes, net
    // Use scene.add.graphics() for polygons and lines
  }

  draw() {
    // Render court in oblique projection:
    // - Green surface rectangle
    // - White lines (baseline, sideline, service line, center line)
    // - Net as thin rectangle across middle
    // - All coordinates transformed through projection matrix
  }

  project(worldX, worldY, worldZ) {
    // Transform 3D world coords → 2D screen coords
    // Returns { sx, sy, depth }
  }
}
```

### `src/objects/Player.js`

```js
class Player {
  constructor(scene, x, z, isHuman) {
    this.scene = scene;
    this.x = x; this.z = z;
    this.isHuman = isHuman;
    this.state = 'idle'; // idle | moving | swinging
    this.swingTimer = 0;
    this.speed = PLAYER_SPEED;
    this.sprite = scene.add.sprite(0, 0, 'player');
    this.sprite.setOrigin(0.5, 1);
  }

  update() {
    // Update animation state, position sprite via projection
    // Depth-sort z-order
  }

  move(dx, dz) {
    // Clamp within court bounds
  }

  swing() {
    // Start swing animation, set timer
  }

  canHit(ball) {
    // Distance check in 3D
  }
}
```

### `src/objects/Ball.js`

```js
class Ball {
  constructor(scene) {
    this.x = 0; this.y = 0; this.z = 0;
    this.vx = 0; this.vy = 0; this.vz = 0;
    this.spinX = 0; this.spinZ = 0;
    this.state = 'held'; // held | inPlay | out | net
    this.bounces = 0;
    this.sprite = scene.add.sprite(0, 0, 'ball');
    this.shadow = scene.add.sprite(0, 0, 'ballShadow');
    this.shadow.setAlpha(0.3);
  }

  update() {
    // Apply gravity, air resistance, spin
    // Update position
    // Check ground bounce, net collision, court bounds
    // Update sprite position via projection (y-offset for height)
    // Update shadow position (project x,z at y=0)
  }

  serve(fromX, fromZ, targetX, targetZ) { /*...*/ }
  hit(fromX, fromY, fromZ, targetX, targetZ, type) { /*...*/ }
}
```

### `src/objects/AI.js`

```js
class AI {
  constructor(scene, difficulty) {
    this.difficulty = difficulty; // 'easy' | 'medium' | 'hard'
    this.config = AI_CONFIGS[difficulty];
    this.reactionCounter = 0;
    this.targetX = 0;
    this.targetZ = 0;
    this.hasServed = false;
  }

  update(aiPlayer, ball) {
    // 1. Track ball position relative to AI side
    // 2. Wait for reaction time based on difficulty
    // 3. Predict ball landing position
    // 4. Move toward predicted position
    // 5. If ball in range, decide shot type and hit
    // Return { hitType, targetX, targetZ } or null
  }
}
```

### `src/systems/Scoring.js`

Pure functions (no Phaser dependency), testable independently:

```js
export function createScore() {
  return { points: [0,0], games: [0,0], sets: [0,0], deuce: false, advantage: null };
}

export function awardPoint(score, winner) {
  // Standard tennis scoring: 15-30-40-deuce-advantage-game-set-match
  // Returns null | 'game' | 'set' | 'match'
}

export function displayScore(score) {
  // Returns display string for HUD
}
```

### `src/systems/Input.js`

```js
class InputSystem {
  constructor(scene) {
    // Keyboard: WASD + Space/Enter for action
    // Touch: virtual joystick (left thumb) + action button (right thumb)
    // Also: swipe gestures for shot types
  }

  getMovement() { return { dx, dz }; }
  getAction() { return boolean; }
  getShotType() { return 'flat' | 'topspin' | 'slice' | 'lob'; }
  isServe() { return boolean; }
}
```

**Touch Control Layout (portrait):**
```
+------------------+
|                  |
|   GAME AREA      |
|                  |
| +------+  +----+ |
| |stick |  |hit | |
| +------+  +----+ |
+------------------+
```

**Touch Control Layout (landscape):**
```
+---------------------------+
|  +------+                 |
|  |stick |   GAME AREA     |
|  +------+         +----+  |
|                   |hit |  |
|                   +----+  |
+---------------------------+
```

### `src/systems/Story.js`

```js
const STORY_FLOW = {
  intro: {
    text: [
      "TENNIS ACADEMY",
      "You've been a student here for years.",
      "But the board says you're not good enough.",
      "Defeat the 3 Bullies to stay enrolled!",
    ],
    next: 'select'
  },
  bully1: {
    name: "The Serve Slinger",
    taunt: "New kid? This'll be quick.",
    win: "Not bad... but can you beat the next one?",
    lose: "Pack your bags, kid.",
  },
  bully2: {
    name: "The Net Rusher",
    taunt: "You got lucky with Slinger. I'm faster.",
    win: "Hmph. One more to go...",
    lose: "So close, yet so far.",
  },
  bully3: {
    name: "The Ace Master",
    taunt: "I own this court. Leave now.",
    win: "...Fine. You've earned your spot.",
    lose: "Should've quit while you were ahead.",
  },
  victory: {
    text: [
      "You defeated all 3 Bullies!",
      "The board recognizes your skill.",
      "You can stay at the academy!",
      "For now..."
    ]
  },
  defeat: {
    text: [
      "You've been expelled.",
      "Better luck next year...",
    ]
  }
};
```

### `src/data/bullies.js`

```js
export const BULLIES = [
  {
    id: 0,
    name: "The Serve Slinger",
    difficulty: 'easy',
    taunt: "Ready to lose?",
    color: 0x8f7ee5, // PICO-8 purple
  },
  {
    id: 1,
    name: "The Net Rusher",
    difficulty: 'medium',
    taunt: "I'll end this fast.",
    color: 0xf7b83d, // PICO-8 orange
  },
  {
    id: 2,
    name: "The Ace Master",
    difficulty: 'hard',
    taunt: "You don't belong here.",
    color: 0xff6d6d, // PICO-8 red
  },
];
```

### `src/data/palette.js`

```js
export const PALETTE = {
  black: 0x000000,
  darkBlue: 0x1d2b53,
  darkPurple: 0x7e2553,
  darkGreen: 0x008751,
  brown: 0xab5236,
  darkGray: 0x5f574f,
  lightGray: 0xc2c3c7,
  white: 0xfff1e8,
  red: 0xff6d6d,
  orange: 0xf7b83d,
  yellow: 0xfff024,
  green: 0x00e436,
  blue: 0x29adff,
  lavender: 0x83769c,
  pink: 0xff77a8,
  lightPeach: 0xffccaa,
};

// Convert to CSS hex strings for Phaser
export const PALETTE_HEX = Object.fromEntries(
  Object.entries(PALETTE).map(([k, v]) => [k, '#' + v.toString(16).padStart(6, '0')])
);
```

## File Structure

```
index.html                   → Phaser mount, viewport meta, responsive CSS
vite.config.js               → Vite dev server + build config
src/
  main.js                    → Phaser game config, scene registration
  config.js                  → All game constants
  scenes/
    BootScene.js             → Asset preloading
    TitleScene.js            → Title + intro
    SelectScene.js           → Bully selection
    GameScene.js             → Main tennis match
    ResultScene.js           → Match result + story
  objects/
    Court.js                 → Court rendering + projection
    Player.js                → Player sprite + logic
    Ball.js                  → Ball sprite + physics
    AI.js                    → AI controller
  systems/
    Physics.js               → Ball physics (gravity, bounce, spin, net collision)
    Scoring.js               → Tennis scoring logic
    Input.js                 → Keyboard + touch input abstraction
    Story.js                 → Story state + dialogue data
  data/
    palette.js               → PICO-8 16-color palette
    bullies.js               → Bully definitions
assets/
  sprites/                   → Pixel-art PNG sprites (generated at build or created)
  sounds/                    → WAV/OGG sound effects
tests/
  scoring.test.js            → Unit tests for scoring logic
  physics.test.js            → Unit tests for ball physics
  ai.test.js                 → Unit tests for AI decision logic
  story.test.js              → Unit tests for story progression
```

## Physics System Details

### Ball Physics (3D simulation, 2D rendering)

```
State: { x, y, z, vx, vy, vz, spinX, spinZ, state, bounces }

Update per frame:
  vy += GRAVITY * dt
  vx -= vx * AIR_RESISTANCE
  vz -= vz * AIR_RESISTANCE
  vx += spinX * SPIN_FACTOR
  vz += spinZ * SPIN_FACTOR
  x += vx * dt
  y += vy * dt
  z += vz * dt

Ground bounce (y < BALL_RADIUS):
  y = BALL_RADIUS
  vy = -vy * BOUNCE_FACTOR
  vx *= 0.8, vz *= 0.8
  bounces++
  if bounces > 2 → state = 'out'

Net collision:
  Check if ball crosses net plane (z = COURT_LENGTH/2)
  AND ball height < NET_HEIGHT
  → state = 'net'

Court bounds:
  If ball outside court bounds AFTER bounce → state = 'out'
```

### Collision Detection

```
Racket ↔ Ball:
  Check distance in 3D between player position and ball position
  If distance < HIT_RADIUS (≈1.5) AND player in idle state:
    → player can hit the ball

Shot types modify ball velocity:
  Flat:     high speed, low arc, no spin
  Topspin:  medium speed, medium arc, forward spin (dips ball)
  Slice:    low speed, low arc, backspin (floats ball)
  Lob:      low speed, high arc, light spin
```

## AI Difficulty Configuration

```js
const AI_CONFIGS = {
  easy:   { reactionTime: 30, accuracy: 0.4, aggression: 0.2, speed: 0.6, shotTypes: ['flat'] },
  medium: { reactionTime: 15, accuracy: 0.65, aggression: 0.4, speed: 0.8, shotTypes: ['flat','topspin','slice'] },
  hard:   { reactionTime: 5, accuracy: 0.9, aggression: 0.6, speed: 1.0, shotTypes: ['flat','topspin','slice','lob'] },
};
```

## Story Progression

```
GameState = {
  defeated: [false, false, false],
  currentBully: 0,  // index into BULLIES
}

Flow:
  1. Boot → Title (intro text)
  2. Title → Select (show 3 bullies, highlight available ones)
  3. Select → Game (start match against selected bully)
  4. Game → Result (show match outcome)
  5. Result → Select (if won: mark defeated, advance to next)
     Result → Select (if lost: allow retry same bully)
     Result → Title (if all defeated: victory, then restart)
```

## Phaser-Specific Implementation Notes

- **Sprite generation**: Since we're going for PICO-8 pixel art, sprites can be created as tiny PNG images (16×16 or 24×32 pixels) or generated programmatically using Phaser's Graphics + generateTexture
- **Animations**: Create spritesheet animations for idle (breathing), moving (walk cycle), and swinging (racket arc)
- **Depth sorting**: Use Phaser's `setDepth()` to order sprites by their projected Y position (lower on screen = higher depth value, rendered on top)
- **Mobile scaling**: Phaser Scale Manager with FIT mode ensures the game fills the screen on any device
- **Touch input**: Use Phaser's built-in pointer events + custom zones for virtual joystick and action button
