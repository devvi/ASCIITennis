# Issue 151 — 趣味性提升: Fun Improvement Design

## Architecture Overview

All fun features extend the existing game loop without modifying core physics or scoring. New constants, game states, and render calls are added alongside existing code. Each feature is gated behind game mode selection to avoid affecting standard 1P/2P play.

### State Machine Extensions

```
MENU → SERVING → PLAYING → POINT_SCORED → SERVING
                  ↘ GAME_OVER

New modes add wrappers around PLAYING:
  PLAYING (zombie)      → zombie_spawn logic + zombie update
  PLAYING (target)      → target hit detection + scoring variant
  PLAYING (rally)       → no point_scored transition, infinite rally
  PLAYING (gravity)     → gravity direction rotates periodically
  PLAYING (pong)        → camera side view, wall bounces
```

### New Game States

- `STATE_ZOMBIE_TENNIS`, `STATE_TARGET_PRACTICE`, `STATE_RALLY_CHALLENGE`, `STATE_GRAVITY_SHIFT`, `STATE_PONG_MODE` — selected from a Special Modes submenu

### Data Flow

```
main.js: gameLoop()
  ├─ update_menu()          — extended with mode submenu
  ├─ update_playing()       — rally counter, timing quality, power-up usage, particles
  ├─ update_playing_zombie()— zombie AI + collision
  ├─ update_playing_target()— target hit detection
  ├─ update_playing_rally() — no scoring, track rally length
  ├─ update_playing_gravity()— rotate gravity vector
  ├─ update_playing_pong()  — wall bounces, side-view camera
  ├─ update_xxx()           — existing states unchanged
  ├─ input1/2.update()
  ├─ audience_obj.update()  — intensity scaling with rally
  └─ draw_game()            — rally HUD, particles, screen shake, item box, mode-specific rendering
```

---

## Phase 1: Rally Combo & Feedback System

### Data Structures

```js
// Constants
RALLY_MILESTONES = [5, 10, 15, 20]
SCREEN_SHAKE_DURATION = 4     // frames
SCREEN_SHAKE_INTENSITY = 2    // pixels
PERFECT_WINDOW = 5            // frames — swing within this many of ball arrival = PERFECT
COMBO_SPEED_BOOST = 0.02      // speed increase per combo level

// New state in main.js
rally_length: number           // total hits in current rally (replaces rally_hits)
combo_level: number            // consecutive clean hits by human player
shake_timer: number            // frames remaining for screen shake
timing_feedback: { text, timer, x, z }  // popup feedback near player
```

### Core Logic

| Function | Change |
|---|---|
| `update_playing()` | Track `rally_length` on each hit. At milestones, trigger `shake_timer = SCREEN_SHAKE_DURATION`. Compute timing quality by checking ball distance from player when swing starts. Apply `COMBO_SPEED_BOOST * combo_level` to ball speed on hit. Reset combo on miss/fault. |
| `player.swing()` | Return `{ success, timing }` where timing is `'perfect'`, `'good'`, or `'late'` based on ball proximity |
| `audience.cheer()` | Accept optional `intensity` param: `cheer_level = base + rally * 2`, capped at `AUDIENCE_CHEER_DURATION * 3` |

### UI

| Render function | What it draws |
|---|---|
| `render.rally_counter(ctx, length)` | `RALLY: N` at top-center of screen |
| `render.screen_shake()` | Apply `ctx.translate(shake_offset)` before all game draws |
| `render.timing_feedback(ctx, text, timer, x, z)` | "PERFECT"/"GOOD"/"LATE" near player, fades over time |
| `render.combo_indicator(ctx, combo)` | Combo multiplier next to rally counter |

### Module Impact

- `src/main.js` — new state variables, rally logic, timing call in update_playing
- `src/render.js` — 4 new render functions
- `src/audience.js` — intensity parameter in cheer()
- `src/player.js` — swing() returns timing quality

---

## Phase 2: Power-ups & Court Items

### Data Structures

```js
// Constants
ITEM_SPAWN_INTERVAL = 600       // frames (10s)
ITEM_COLLECT_RANGE = 1.0
ITEM_LIFETIME = 600
ITEM_TYPES = { FIRE: 'F', BIG_RACKET: 'B', SHIELD: 'S', MULTI_BALL: 'M', TIME_SLOW: 'T' }
ITEM_ACTIVE_DURATION = 300      // 5 seconds for timed effects

// New state in main.js
items: [{ x: number, z: number, type: string, timer: number }]  // active items on court
item_spawn_timer: number

// New state on player object
player.item = null | { type: string }           // stored (not yet used)
player.item_active = false
player.item_timer = 0
player.hit_range_mult = 1.0                     // big racket: 2.0
player.shield_active = false

// Multi-ball support
second_ball: ball_obj | null
```

### Core Logic

| Function | Change |
|---|---|
| `update_playing()` | Tick `item_spawn_timer`. At interval, spawn item at random valid court position (within bounds, not overlapping players). Check player-item proximity each frame. Tick active item timers, clear expired effects. |
| `player.collect_item(type)` | Store item in `player.item`. Despawn box. |
| `player.use_item()` | Consume stored item: set timer, apply modifier (hit_range_mult, shield_active, etc.) |
| `player.update()` | Tick `item_timer`, reset modifiers when expired |
| `ball.hit()` | If hitter has fire active, multiply speed by 1.5, set `trail_char = '*'`. If multi-ball active, spawn `second_ball` copy. |
| `ball.update()` | If `second_ball` exists, update it too. Check shield auto-return in update_playing. |

### Item Effects

| Type | Effect | Duration | Visual |
|---|---|---|---|
| Fire (F) | Next shot: +50% speed, `*` trail | 1 shot | `*` chars at ball trail positions |
| Big Racket (B) | HIT_RANGE_H doubled | 2 swings | Player character enlarged: `[O]` |
| Shield (S) | Auto-return next ball in range | once | Blue spark `~` around player |
| Multi-ball (M) | Second ball in play | 300 frames | Two balls rendered, both update |
| Time Slow (T) | All velocity × 0.5 | 300 frames | "SLOW" text, blue tint |

### UI

| Render function | What it draws |
|---|---|
| `render.item_box(ctx, item, frame)` | `?` in white at item position, subtle blink (toggle every 15 frames) |
| `render.item_hud(ctx, player)` | Show collected item icon next to player name |
| `render.active_effect(ctx, player)` | Colored border or icon highlight when effect active |
| `render.fire_trail(ctx, trail_positions)` | `*` chars at ball's last 5 positions, fading alpha |
| `render.slow_indicator(ctx)` | "SLOW" text + blue border overlay |

### Module Impact

- `src/constants.js` — new item/powerup constants
- `src/main.js` — item spawn timer, collision check, multi-ball, time slow multiplier, shield auto-return
- `src/player.js` — item inventory, use_item(), timer management
- `src/ball.js` — fire trail, multi-ball spawn
- `src/render.js` — item box, item HUD, fire trail, slow indicator

---

## Phase 3: ASCII Particle Effects & Screen Juice

### Data Structures

```js
MAX_PARTICLES = 30
PARTICLE_LIFE = 5
// particles = [{ x, y, z, char, vx, vy, vz, life }]
particles: []

// Ball trail
// trail = [{ x, y, z }], max length 5
ball_trail: []

// Screen shake
shake_offset = { x: 0, y: 0 }

// Crowd wave
crowd_phase = 0   // toggles each frame during rallies > 5
```

### Core Logic

| Function | Change |
|---|---|
| `player.swing()` on contact | Spawn 5-8 particles at ball contact position with random velocity, life=5 |
| `ball.update()` | Before moving, record current position into trail array (shift old entries) |
| `main.js` gameLoop | After update, decrement particle lives, remove dead particles. If `shake_timer > 0`, compute random offset ±2px, decrement timer. |
| `ball.update()` | If speed > 0.4, set `show_speed_lines = true` |
| `audience.update()` | If rally > 5, toggle `crowd_phase` each frame |
| `render.hud()` | On game/set/match point, pulse score text (alternate brightness or scale) |

### UI

| Render function | What it draws |
|---|---|
| `render.particles(ctx, particles)` | Project each particle and draw its char (`*`, `+`, `'`, `.`) |
| `render.ball_trail(ctx, trail)` | Draw `o` at each trail position, older entries darker/more transparent |
| `render.speed_lines(ctx, ball)` | Draw `=` chars along ball velocity direction behind ball |
| `render.crowd_wave(ctx, audience, phase)` | Alternate poses per frame: `\o/` → `|o|` → `/o\` |
| `render.score_flash(ctx, score, frame)` | Toggle score text color between white/yellow on game/set/match point |

Screen shake is applied via `ctx.translate()` at the start of `draw_game()` before any draw calls.

### Module Impact

- `src/constants.js` — particle constants
- `src/main.js` — particle array management, screen shake application
- `src/player.js` — particle spawn on swing
- `src/ball.js` — trail recording, speed line flag
- `src/audience.js` — crowd wave phase toggle
- `src/render.js` — particle/trail/speed line rendering, crowd wave rendering, score flash

---

## Phase 4: Special Game Modes & Easter Eggs

### Data Structures

```js
// New game mode enum
STATE_ZOMBIE_TENNIS, STATE_TARGET_PRACTICE, STATE_RALLY_CHALLENGE,
STATE_GRAVITY_SHIFT, STATE_PONG_MODE

// Zombie
// zombies = [{ x, z, speed, active, target_x, target_z }]
MAX_ZOMBIES = 5
ZOMBIE_SPEED = 0.03
zombies: []

// Target Practice
// targets = [{ x, z, hit: false, points }]
NUM_TARGETS = 8
TARGET_RADIUS = 0.8
targets: []
target_score: number

// Rally Challenge
longest_rally: number

// Gravity Shift
gravity_direction: { x: 0, y: -1, z: 0 }   // unit vector
gravity_shift_timer: number                  // 600 frames
GRAVITY_VECTORS = [
  { x: 0, y: -1, z: 0 },    // normal
  { x: 0, y: 0, z: -1 },    // pull toward net
  { x: 0, y: 0, z: 1 },     // pull away from net
  { x: -1, y: 0, z: 0 },    // pull left
  { x: 1, y: 0, z: 0 },     // pull right
]

// Pong Mode
PONG_CEILING_Y = 4
pong_camera_active: boolean

// Easter eggs
net_climb_pending: boolean
head_bounce_active: boolean
referee_expression: string
```

### Core Logic

#### Menu
- Extend `update_menu()` to support 5 options: 1P Easy, 1P Hard, 2P, Special Modes
- Special Modes opens submenu with: Zombie Tennis, Target Practice, Rally Challenge, Gravity Shift, Pong Mode
- Each mode calls `start_match(mode)` with the appropriate mode string

#### Zombie Tennis
- On ball going out (state = BALL_OUT or BALL_DOUBLE_BOUNCE), spawn zombie at ball's position
- Zombie moves toward the human player at ZOMBIE_SPEED
- If zombie reaches player (dist < 0.5), player loses the point
- Hitting zombie with the ball destroys it (zombie removed from array)
- Max 5 zombies on court at once

#### Target Practice
- 8 targets rendered on opponent's court half (random positions)
- Hitting a target with the ball: +10 points, target disappears, new target spawns after 1 second
- No scoring against opponent; game lasts 60 seconds
- Display score and time remaining on HUD

#### Rally Challenge
- No STATE_POINT_SCORED or STATE_GAME_OVER transitions
- Ball resets to server after each point, server rotates
- Track `longest_rally` across all rallies
- AI difficulty increases slightly after each rally reset
- Display longest rally on HUD

#### Gravity Shift
- Instead of `vy += GRAVITY`, ball velocity updates: `vy += gravity_direction.y * GRAVITY_MAG`, similarly for vx, vz
- `gravity_direction` rotates through GRAVITY_VECTORS array every 600 frames
- Visual: arrow indicator on HUD showing current gravity direction

#### Pong Mode
- `camera.init_pong()` — orthographic side-view projection
- Bounds: left/right walls at ±COURT_WIDTH/2, ceiling at PONG_CEILING_Y, ground at y=0
- Ball bounces off ceiling and ground with BOUNCE_FACTOR
- Players are paddles (same ASCII figures), move up/down with UP/DOWN keys
- Scoring: ball past opponent's z-boundary = point

### Easter Eggs

| Egg | Trigger | Effect | Module |
|---|---|---|---|
| Net climb | Press UP while `|z - COURT_LENGTH/2| < 1` and `|x| < 0.5` | Player shows climbing animation (3 frames), teleports to other side | `main.js`, `render.js` |
| Ball-on-head | Ball lands within `PLAYER_EYE_Y ± 0.1` of player head, velocity near zero | Ball bounces straight up, `!` shows above head for 10 frames | `ball.update()`, `render.js` |
| Referee expressions | Game state changes | `o_O` on violation, `^_^` on point scored, `>_<` on kill cam, `--` idle | `render.referee()` |
| All-dead audience | `audience.kill_count >= 96` | Slow scrolling "R.I.P." text across audience area, then game over with special ASCII art | `main.js`, `render.js` |
| Cheat codes | On menu, input `↑↑↓↓←→←→BA` (W, W, S, S, A, D, A, D, Space) | Set `game_mode = "super"`: max AI, ball speed +50%, fire trail always active, audience always cheering | `input.js`, `main.js` |

### Module Impact

- `src/constants.js` — new game state enums, mode-specific constants
- `src/main.js` — new update functions for each mode, extended menu, egg detection
- `src/ball.js` — gravity direction support, pong-mode wall bounces
- `src/camera.js` — `init_pong()` orthographic mode
- `src/render.js` — mode-specific rendering, referee expressions, all-dead screen, cheat code indicator
- `src/input.js` — cheat code sequence detection
- `src/audience.js` — all-dead trigger
- `src/player.js` — net climb animation state
