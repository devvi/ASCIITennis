# Design: Audience Perspective & Referee Fix (观众席以及裁判优化)

**Issue:** #139
**Component:** `audience`, `render`, `ball`, `main`, `scoring`, `constants`, `camera`

---

## 1. Architecture Overview

Three independent feature areas share the `audience` module as their common dependency:

```
          ┌──────────────────┐
          │   constants.js   │  (KILL_RADIUS, BALL_FLYING_OUT, STATE_KILL_CAM)
          └────────┬─────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
     ▼             ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│audience.js│ │ ball.js  │ │render.js │
│ (persp,   │ │(FLYING   │ │ (referee,│
│  hit,     │ │ _OUT)    │ │  death,  │
│  kill)    │ │          │ │  kill-   │
│           │ │          │ │  flash)  │
└─────┬─────┘ └─────┬────┘ └─────┬────┘
      │             │            │
      └──────┬──────┴────────────┘
             ▼
      ┌──────────┐
      │ main.js  │  (game flow: STATE_KILL_CAM
      │          │   fly-out → hit → kill → point)
      └──────────┘
             │
             ▼
      ┌──────────┐
      │scoring.js│  (award_kill)
      └──────────┘
```

---

## 2. Data Structures

### 2a. Per-spectator state (`audience.js`)

```js
// Current (existing):
{ x: number, z: number, row: number, variant: number }

// After change:
{ x: number, z: number, row: number, variant: number, alive: boolean }
```

Constructor default: `alive: true`.

### 2b. Audience-level state additions

```js
kill_count: number  // increments on each kill()
```

### 2c. Ball state constant

```js
BALL_FLYING_OUT = "flying_out"  // new ball state constant
```

### 2d. Game state constant

```js
STATE_KILL_CAM = "kill_cam"  // new game state
```

### 2e. Game variables (main.js)

```js
kill_cam_timer: number    // countdown during STATE_KILL_CAM (default KILL_CAM_DURATION)
kill_hitter: number|null  // which player made the kill (0 or 1)
```

### 2f. Constants

```js
KILL_RADIUS = 1.0         // max distance from ball to spectator for a kill
KILL_CAM_DURATION = 30    // frames to pause on kill
```

---

## 3. Module Design

### 3a. `audience.js` — Perspective compensation

**Current problem:** Sideline banks (indices 4-5) distribute seats evenly in world z from `0` to `COURT_LENGTH`. Perspective projection at pitch `CAM_PITCH = -0.5` compresses far-z values, making the far end look dense.

**Solution:** Apply non-linear mapping to seat z-position for sideline banks:

```
z = COURT_LENGTH * (seatIndex / (seatsInRow - 1)) ^ power
    where power > 1  (e.g., power = 1.5-2.0)
```

This biases seats toward the near-camera end. The exact `power` is tuned so that after projection, the screen-y distance between consecutive seats in a row is roughly uniform.

**Key insight from camera projection:**
At `CAM_PITCH = -0.5`, `CAM_Z = -6`, `CAM_HEIGHT = 10`, the z-to-screen-y mapping is:
- `dyR = (0 - 10) * cos(-0.5) - (z - (-6)) * sin(-0.5)`
- Roughly: `sy ≈ 40 + 9.76 * FOCAL / (dzR)` — a non-linear function of z.

For even screen-y spacing, we need `z` values that produce evenly spaced `sy` values. The power-function approximation avoids needing to invert the projection function explicitly.

**Implementation approach:**
1. In `generate_positions()`, detect sideline banks (where `seatAxis === 'z'`)
2. Replace `t = seat / (seatsInRow - 1)` with `t_adjusted = t^power`
3. Default `power = 1.8` (tunable)
4. Keep jitter, row spacing, and all other bank parameters unchanged

### 3b. `render.js` — Referee rendering fix

**Current problem:** Referee body parts use small world-space offsets (±0.3m to ±0.4m) at z = COURT_LENGTH/2. After perspective, these produce only 2-3 px separation — characters overlap.

**Solution: Screen-space referee rendering.**

Render the referee as a pre-defined ASCII block at a fixed screen position:

```
  @
  |
 /|\
 / \
```

**Screen position:** Anchor at the projected position of `(COURT_WIDTH/2 + 1.0, 0, COURT_LENGTH/2)` — the umpire chair location. Use this anchor's `(sx, sy)` as the top-center of the figure, then draw each line at fixed pixel offsets from the anchor.

**Always visible:** Remove the `if (!state || state.timer <= 0) return;` guard. The referee figure renders during all game states.

**Violation message:** Keep overlaying `state.message` at a fixed screen position near the referee (e.g., `sx + 20, sy`). This only appears during violation replay.

### 3c. `audience.js` — Hit detection

```js
check_hit(x, z) {
  let nearest = -1;
  let minDist = Infinity;
  for (let i = 0; i < this.spectators.length; i++) {
    const s = this.spectators[i];
    if (!s.alive) continue;
    const dx = x - s.x;
    const dz = z - s.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    if (dist < KILL_RADIUS && dist < minDist) {
      minDist = dist;
      nearest = i;
    }
  }
  return nearest;
}

kill(i) {
  if (i < 0 || i >= this.spectators.length) return;
  if (!this.spectators[i].alive) return;
  this.spectators[i].alive = false;
  this.kill_count++;
}
```

### 3d. `audience.js` — Death pose

Death pose added to `POSES`:
```js
dead: { top: ' X ', bottom: '|_|' }
```

In `get_pose(i)`, check `alive` before `cheer_level`:
```js
get_pose(i) {
  const spec = this.spectators[i];
  if (!spec || !spec.alive) return POSES.dead;
  if (this.cheer_level > 0) return POSES.cheer;
  return POSES.idle[spec.variant % POSES.idle.length];
}
```

### 3e. `ball.js` — BALL_FLYING_OUT state

New state transition:
```
BALL_IN_PLAY → BALL_OUT (first out-of-bounds bounce detected)
             → BALL_FLYING_OUT (on transition, instead of immediate resolve)
```

In `ball.update()`:
- `BALL_FLYING_OUT` continues physics: gravity, air resistance, position update
- Skips: bounce detection, net collision, bounds checks, double-bounce detection
- Termination condition: `b.y < -10 || b.z > COURT_LENGTH + 20 || b.z < -(STAND_MARGIN_Z + 5)`

### 3f. `main.js` — Game flow modifications

**State machine change:**
```
STATE_PLAYING → (on BALL_OUT) → ball.state = BALL_FLYING_OUT, stay in STATE_PLAYING
  → audience.check_hit() finds hit → STATE_KILL_CAM
  → ball expires (y < -10 etc.) → STATE_VIOLATION_REPLAY (normal out)
STATE_KILL_CAM (30 frames) → STATE_POINT_SCORED
```

**Update flow within STATE_PLAYING when `ball.state === BALL_FLYING_OUT`:**
```js
if (ball_obj.state === BALL_FLYING_OUT) {
  ball.update(ball_obj);
  const hitIndex = audience_obj.check_hit(ball_obj.x, ball_obj.z);
  if (hitIndex >= 0) {
    audience_obj.kill(hitIndex);
    scoring.award_kill(score, hitter);
    point_winner = hitter;  // kill gives point to the hitter
    kill_cam_timer = KILL_CAM_DURATION;
    game_state = STATE_KILL_CAM;
  } else if (ball_obj.y < -10 || ball_obj.z > COURT_LENGTH + 20 || ball_obj.z < -5) {
    // Ball missed all spectators — fall back to normal violation
    resolve_violation_point("out", hitter);
  }
}
```

**Kill cam update:**
```js
function update_kill_cam() {
  kill_cam_timer -= 1;
  if (kill_cam_timer <= 0) {
    referee_state.timer = 0;
    point_timer = 60;
    game_state = STATE_POINT_SCORED;
  }
}
```

### 3g. `scoring.js` — award_kill

```js
award_kill(s, hitter) {
  // Kill awards 1 point to the hitter (unlike out which goes to opponent)
  return this.award_point(s, hitter);
}
```

### 3h. `render.js` — Kill flash HUD

When `game_state === STATE_KILL_CAM`, render `"KILL +1"` near the scoreboard:
```js
if (kill_flash_timer > 0) {
  ctx.fillStyle = '#ff0';
  print("KILL +1", 100, 1);
}
```

Managed by a simple interface variable `kill_flash_timer` in render state.

---

## 4. Data Flow: Fly-out → hit → kill → point

```
BALL_OUT detected in update_playing()
  │
  ▼
ball.state = BALL_FLYING_OUT
  │
  ▼ (next frame)
ball.update() continues physics (gravity, velocity)
audience.check_hit(ball.x, ball.z)
  │
  ├── hit found ──► audience.kill(index)
  │                  scoring.award_kill(score, hitter)
  │                  game_state = STATE_KILL_CAM (30 frames)
  │                  render shows death pose + KILL +1 text
  │                  ▼
  │                  STATE_POINT_SCORED → STATE_SERVING
  │
  └── no hit ──► ball expires ──► resolve_violation_point("out", hitter)
                                     opponent gets point
                                     STATE_VIOLATION_REPLAY
```

---

## 5. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Screen-space referee | World-space offsets at z=COURT_LENGTH/2 produce <3px separation; screen-space ensures readability at any distance |
| Power-function perspective | Simple, tunable, no need to invert camera projection; 1 constant to tweak |
| Linear scan for hit detection | Only ~96 spectators, O(n) per frame is negligible |
| Same `award_point` for kills | Kill scoring uses the exact same 15→30→40→game→set→match progression (parity with normal points) |
| Ball-continues-physics approach | Reuses existing `BALL_REPLAY`-style logic for `BALL_FLYING_OUT` (skip bounds/net, continue gravity) |
| `STATE_KILL_CAM` as separate state | Clean separation from `STATE_VIOLATION_REPLAY`; different timer and UI behavior |
