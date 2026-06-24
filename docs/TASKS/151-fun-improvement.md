# Task Breakdown: 趣味性提升 (Fun Improvement)

**Issue:** #151
**Related modules:** `src/main.js` (game loop, mode selection), `src/render.js` (effects, HUD), `src/constants.js` (new constants), `src/input.js` (new button combos), `src/audience.js` (intensity), `src/ball.js` (trail, physics variants), `src/player.js` (power-up state), `src/scoring.js` (combo, challenge scoring)

## Impact Summary

| Module | Impact | Description |
|--------|--------|-------------|
| `src/constants.js` | Add ~20 constants | Rally milestones, item config, particle config, mode enums |
| `src/main.js` | High | New game states, mode switching, power-up logic, particle update, screen shake, timing feedback |
| `src/render.js` | High | Particle rendering, screen shake offset, rally counter HUD, item HUD, mode-specific rendering, easter egg visuals |
| `src/input.js` | Low | Add KEY_X for item activation, maybe combo detection for easter eggs |
| `src/audience.js` | Medium | Intensity-based cheering, crowd wave animation |
| `src/ball.js` | Medium | Ball trail tracking, multi-ball support, zombie ball state, gravity shift |
| `src/player.js` | Medium | Power-up state machine, item inventory, big racket hit range, shield auto-return |
| `src/scoring.js` | Low-Medium | Combo multiplier, target practice scoring, challenge mode scoring |
| `tests/` | High | New test files for each feature module |

## Plan

Research complete — see `docs/PRD/151-fun-improvement.md` for requirements.

### Phase 1: Rally Combo & Feedback System

#### 1a. Tests
- Rally counter increments on each hit, resets on point end
- Audience cheer intensity scales with rally length (cheer_duration = base + rally * 2)
- Screen shake triggered at rally milestones (5, 10, 15, 20)
- Shot timing feedback shows correct text based on ball proximity when swing starts
- Combo multiplier increases ball speed slightly per consecutive hit

#### 1b. Data structures
- `RALLY_MILESTONES = [5, 10, 15, 20]` — rally lengths that trigger effects
- `SCREEN_SHAKE_DURATION = 4` (frames)
- `SCREEN_SHAKE_INTENSITY = 2` (pixels)
- `PERFECT_WINDOW = 5` (frames — swing within this many frames of ball arrival = PERFECT)
- `COMBO_SPEED_BOOST = 0.02` (speed increase per combo level)

#### 1c. Core logic
- `update_playing()`: Track rally length, detect milestone triggers, compute timing quality
- `player.swing()`: Return timing quality based on ball proximity
- `main.js`: Apply screen shake offset to camera/render, manage combo multiplier

#### 1d. UI/output
- `render.rally_counter(ctx, rally)` — display `RALLY: N` at top-center of screen
- `render.screen_shake()` — apply offset to all subsequent draw calls
- `render.timing_feedback(ctx, quality)` — show "PERFECT"/"GOOD"/"LATE" popup near player
- `render.combo_indicator(ctx, combo)` — show combo multiplier next to rally counter
- Audience cheer duration/length linked to `rally_length`

### Phase 2: Power-ups & Court Items

#### 2a. Tests
- Item spawns at random valid court position every ~10 seconds
- Player within `ITEM_COLLECT_RANGE = 1.0` collects item
- Collected item shows on HUD
- Item effect activates on key press, lasts correct duration
- Fire ball effect: ball speed increased, trail shows `*` characters
- Big racket effect: player HIT_RANGE_H doubled for 2 swings
- Shield effect: auto-returns ball within range (calls `ball.hit()` automatically)
- Multi-ball effect: second ball ball_obj spawned, both update independently
- Time slow effect: all velocity updates multiplied by 0.5
- Item despawns after `ITEM_LIFETIME = 600` frames (10s) if not collected

#### 2b. Data structures
```
ITEM_SPAWN_INTERVAL = 600  // frames (10s)
ITEM_COLLECT_RANGE = 1.0
ITEM_LIFETIME = 600
ITEM_TYPES = { FIRE: 'F', BIG_RACKET: 'B', SHIELD: 'S', MULTI_BALL: 'M', TIME_SLOW: 'T' }
// Player state additions:
//   player.item = null | { type: string, timer: number }
//   player.item_active = false
//   player.item_timer = 0
//   player.hit_range_mult = 1.0
```

#### 2c. Core logic
- `main.js`: Timer-based item spawn, position validation, collision check with both players
- `player.collect_item(type)`: Store item in player inventory
- `player.use_item()`: Activate stored item effect, start duration timer
- `player.update()`: Decrement active item timer, clear expired effects
- `ball.hit()`: Apply fire ball speed boost if hitter has fire active
- `ball.hit()`: Spawn second ball if multi-ball active
- Shield: `player.in_hit_range()` expanded or auto-call `ball.hit()` in `update_playing()`

#### 2d. UI/output
- Item box renders as `?` in white on court surface, with subtle blink
- Collected item icon on HUD next to player name
- Active effect indicator (colored border or icon highlight)
- Fire ball trail: `*` characters at ball's last 5 positions
- Time slow: subtle color shift (blue tint) and "SLOW" text indicator

### Phase 3: ASCII Particle Effects & Screen Juice

#### 3a. Tests
- Hit impact spawns N particles at contact point
- Particles animate for 5 frames then disappear
- Ball trail spawns `o` at old position each frame, fades over 3 frames
- Screen shake offsets all renders by ±2px for exactly 4 frames
- Speed lines render behind ball when ball speed > 0.4
- Crowd wave alternates audience poses left/right on alternating frames
- Score text pulses (scale alternation or brightness toggling) on game/set/match point

#### 3b. Data structures
```
// Particle system
// particles = [{ x, y, z, char, vx, vy, vz, life }]
MAX_PARTICLES = 30
PARTICLE_LIFE = 5
// Trail system
// ball_trail = [{ x, y, z }], max length 5
// Screen shake
// shake_offset = { x: 0, y: 0 }, updated each frame
// Crowd wave phase
// crowd_phase = 0, toggled each frame during rallies > 5
```

#### 3c. Core logic
- On `player.swing()` with ball contact: spawn particles at ball position
- `ball.update()`: Record trail positions before moving
- `main.js`: After all update calls, decrement particle lives, remove dead particles
- `main.js`: Apply screen shake offset to camera.project() or to ctx.translate()
- Ball speed > 0.4: Set `ball.show_speed_lines = true`
- Audience update: On rally > 5, alternate `crowd_phase` each frame

#### 3d. UI/output
- `render.particles(ctx, particles)`: Project and draw each particle character
- `render.ball_trail(ctx, trail)`: Project and draw fading `o` chars
- `render.speed_lines(ctx, ball)`: Draw `=` chars along ball velocity direction
- Apply `ctx.translate(shake_offset.x, shake_offset.y)` at start of `draw_game()` when shaking
- `render.crowd_wave(ctx, audience, phase)`: Alternate poses per frame

### Phase 4: Special Game Modes & Easter Eggs

#### 4a. Tests
- Menu shows new mode options (alongside 1P/2P)
- Zombie Tennis: missed ball spawns zombie `Z` that moves toward player
- Target Practice: targets appear on opponent's court half, hit detection works
- Rally Challenge: AI difficulty increases over time, game never ends on points
- Gravity Shift: gravity direction changes every 600 frames
- Pong Mode: camera switches to 2D side view, ball bounces off top/bottom walls
- Easter eggs: net climb, ball-on-head bounce, referee expressions, all-dead screen

#### 4b. Data structures
```
STATE_ZOMBIE_TENNIS, STATE_TARGET_PRACTICE, STATE_RALLY_CHALLENGE,
STATE_GRAVITY_SHIFT, STATE_PONG_MODE  // new game states
// Zombie: { x, z, speed, active }
MAX_ZOMBIES = 5
// Targets: [{ x, z, hit: false, points: 10 }]
NUM_TARGETS = 8
// Gravity: gravity_direction = { x, y, z }, changes every 600 frames
```

#### 4c. Core logic
- Menu: Extend to 5 options (1P Easy, 1P Hard, 2P, Special Modes → submenu)
- Each mode wraps or modifies the existing game loop:
  - Zombie: On ball going out, spawn zombie at landing point; zombie moves toward player at `ZOMBIE_SPEED=0.03`; player hit by zombie = lose point; hitting zombie with ball destroys it
  - Target Practice: Targets rendered on far court; hitting one awards 10 points + cheer; new target spawns after hit
  - Rally Challenge: No `STATE_POINT_SCORED` / `STATE_GAME_OVER` — ball just resets; tracks longest rally
  - Gravity Shift: `GRAVITY` vector rotates 90° every 600 frames
  - Pong Mode: `camera.init_pong()` — orthographic side view; ball bounces off ceiling `roof_y` and ground `y=0`; paddles are player characters

#### 4d. Easter eggs (scattered across phases)
- **Net climb** — `input1.pressed(BTN_UP)` while `|z| < 1` near net: player shows climbing animation (3 frames of different poses), then teleports to other side
- **Ball-on-head bounce** — `ball.y` within `PLAYER_EYE_Y ± 0.1` and `ball.vx < 0.01` and `ball.vz < 0.01`: ball bounces straight up with `vy = 0.15`, shows `!` for 10 frames
- **Referee expressions** — `referee_state.face` set based on game state: `o_O` on violation_replay, `^_^` on point_scored, `>_<` on kill_cam, `--` on idle
- **All-dead audience** — When ALL spectators dead (`audience.kill_count >= AUDIENCE_COUNT`): play "funeral march" visual (slow scrolling `RIP` text across audience area) then game over with special ASCII art
- **Cheat codes** — On menu, input `↑↑↓↓←→←→BA` sets `game_mode = "super"`: all AI becomes max difficulty, ball speed +50%, fire trail always active, audience always cheering
