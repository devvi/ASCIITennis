# Issue 60: Ball Height Visual Drag — Tasks

## Related Modules

- `src/constants.js` — add `HEIGHT_DRAG_STRENGTH` and `MAX_HEIGHT_DRAG` constants
- `src/ball.js` — apply height-based horizontal velocity multiplier in `update()`
- `src/ball.lua` — mirror the same change in the Lua port
- `tests/ball.test.js` — new tests for height-based slowdown behavior

## Impacts

- Ball trajectory becomes more readable; players get extra reaction time at the trajectory apex
- Landing prediction remains approximate (does not need to account for the evolving drag since it uses instantaneous velocity)
- No new rendering or input work — purely a physics/game-feel change
- The effect is entirely in `ball.update()` — no changes to main loop, render, or AI

---

## Phase 1: Tests (TDD)

Write test cases for height-based visual drag behavior. Tests must pass before implementation code is written.

- `ball.update()` applies horizontal slowdown when ball is at high y (e.g. y=2.0), reducing |vx| and |vz| compared to a frame without the drag
- `ball.update()` applies no slowdown when ball is at ground level (y=BALL_RADIUS)
- `ball.update()` applies intermediate slowdown at mid height (y=1.0)
- Height drag does not affect vertical velocity (vy)
- Height drag does not affect ball when state is not BALL_IN_PLAY
- Existing trajectory tests still pass (ball reaches player within hit height range for all hit types)
- Landing prediction still returns a reasonable result for a ball under height drag

**File:** `tests/ball.test.js` (extend)

---

## Phase 2: Constants

- Add `HEIGHT_DRAG_STRENGTH = 0.4` — how much horizontal speed is reduced at max height (40% slowdown at apex)
- Add `HEIGHT_DRAG_MAX_Y = 3.0` — the height at which the drag reaches its maximum effect; above this, drag is clamped

The drag formula at a given height `y`:
```
factor = 1 - HEIGHT_DRAG_STRENGTH * clamp(y / HEIGHT_DRAG_MAX_Y, 0, 1)
// factor ranges from 1.0 (ground) to 0.6 (at y >= 3.0)
```

**File:** `src/constants.js`

---

## Phase 3: Core Logic (ball.update)

In `ball.update()`, after the existing velocity update (air resistance, spin, gravity) and before position integration, or alternatively after position integration as a purely visual step:

```js
// Height-based visual drag: reduce horizontal speed when ball is high
const height_ratio = Math.min(b.y / HEIGHT_DRAG_MAX_Y, 1.0);
const drag_factor = 1 - HEIGHT_DRAG_STRENGTH * height_ratio;
b.vx *= drag_factor;
b.vz *= drag_factor;
```

**Placement consideration:** Apply the drag BEFORE air resistance and position integration so the ball's effective trajectory is smoothed over multiple frames. This also feeds into `predict_landing()` which reads the current velocity.

Alternatively, apply it after air resistance but before position integration — this is the recommended spot:
```
1. Apply air resistance and spin
2. Apply height visual drag (new)
3. Apply gravity
4. Integrate position
5. Bounce/net/bounds checks
```

**File:** `src/ball.js`

---

## Phase 4: Lua Mirror

Apply the same change to `src/ball.lua` using identical constants and formula, adapted to Lua syntax. Existing Lua tests (if any) should also pass.

**File:** `src/ball.lua`

---

## Phases (Plan Issue)

**PLAN_ISSUE:** #66

### Phase 1: Tests (TDD)
- [ ] `ball.update()` applies horizontal slowdown when ball is at high y
- [ ] `ball.update()` applies no slowdown when ball is at ground level
- [ ] `ball.update()` applies intermediate slowdown at mid height
- [ ] Height drag does not affect vertical velocity (vy)
- [ ] Height drag does not affect ball when state is not BALL_IN_PLAY
- [ ] Existing trajectory tests still pass
- [ ] Landing prediction still returns a reasonable result

### Phase 2: Constants
- [ ] Add `HEIGHT_DRAG_STRENGTH = 0.4` to `src/constants.js`
- [ ] Add `HEIGHT_DRAG_MAX_Y = 3.0` to `src/constants.js`

### Phase 3: Core Logic
- [ ] Apply height visual drag in `ball.update()` after air resistance, before gravity
- [ ] Verify existing tests still pass

### Phase 4: Lua Mirror
- [ ] Apply same change to `src/ball.lua`
