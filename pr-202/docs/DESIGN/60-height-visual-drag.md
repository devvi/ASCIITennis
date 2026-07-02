# Issue 60: Ball Height Visual Drag — Design

## Architecture

A purely additive change to ball physics: modulate horizontal velocity (vx, vz) based on ball height (y) to create a visual "slow-down" at the trajectory apex.

### Formula

```
height_ratio = clamp(y / HEIGHT_DRAG_MAX_Y, 0, 1)
drag_factor = 1 - HEIGHT_DRAG_STRENGTH * height_ratio
vx *= drag_factor
vz *= drag_factor
```

At ground (y=0): factor = 1.0 (no drag)
At apex (y >= HEIGHT_DRAG_MAX_Y): factor = 1 - HEIGHT_DRAG_STRENGTH

### Data Structures

- `src/constants.js` — add `HEIGHT_DRAG_STRENGTH (0.4)` and `HEIGHT_DRAG_MAX_Y (3.0)`
- No new fields on ball object; purely a runtime computation in `ball.update()`

### Module Design

**`src/ball.js` — `update()` method** (insertion point after air resistance, before gravity):

```
1. Apply air resistance and spin
2. Apply height visual drag (new)
3. Apply gravity
4. Integrate position
5. Bounce/net/bounds checks
```

**`src/ball.lua` — `ball.update()` method** — identical flow adapted to Lua syntax.

### Impact on `predict_landing()`

`predict_landing()` uses instantaneous vx/vz to project the landing point. Since the drag is applied per-frame, the prediction will slightly underestimate how far the ball travels when the ball is currently high (because drag will decrease as the ball descends). This is acceptable — the landing marker will still guide the player to the correct area, and the slight inaccuracy reinforces the visual effect (ball "falls" faster than predicted, surprising the opponent too).

### Not Changed

- No main loop, rendering, input, AI, or game state changes
- No new files
- Existing test suite must remain passing
