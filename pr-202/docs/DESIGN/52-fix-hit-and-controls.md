# Issue 52 — Fix: Can't hit ball & controls reversed

## Bugs Found

### Bug A: Up/Down controls reversed

**File:** `src/input.js:92-93`

`get_movement()` assigns `BTN_UP → dz = -1` and `BTN_DOWN → dz = 1`. In the
coordinate system the camera looks toward +z (the net is at z ≈ 11.9), so
increasing z moves the player forward. The mapping is backwards: W (UP) should
move forward (+z) but instead moves backward (-z).

**Fix:** Swap dz values — `BTN_UP → dz = 1`, `BTN_DOWN → dz = -1`.

---

### Bug B: Ball always above hit height

**Root cause:** `ball.hit()` in `src/ball.js:122` sets `b.vy = 1.5 + params.arc * 2`.
Even for a flat shot (arc=0), vy starts at 1.5. With `GRAVITY = -0.04`:

- Ball reaches y ≈ 30m by frame 47 (when it reaches the player)  
- `HIT_HEIGHT_MAX = 2.5` → ball is never in vertical hit range

**Secondary cause:** `GRAVITY = -0.04` is too strong for the game scale. At this
gravity the ball falls ~1 unit in 7 frames; a court crossing takes ~47 frames,
so the ball either rockets sky-high (if vy > 0) or plummets (if vy ≤ 0).

**Fix:**
1. Reduce `GRAVITY` from -0.04 to -0.006 — keeps the ball aloft for the full
   court crossing while still providing visible arc.
2. Remove the hard-coded `1.5` base in `ball.hit()` and compute `vy` from the
   shot-type arc parameter scaled appropriately.
   - Flat: `vy = 0.04` (barely rises, drives flat)
   - Topspin: `vy = 0.18` (moderate arc, dips)
   - Slice: `vy = -0.02` (low/sinking)
   - Lob: `vy = 0.50` (high arc)
3. Keep `hit_y = 1.0` for ground strokes (could be dynamic later).

---

## Affected Modules

| Module | Change |
|--------|--------|
| `src/input.js` | Swap dz for BTN_UP / BTN_DOWN (Bug A) |
| `src/constants.js` | Tune GRAVITY and HIT_PARAMS (Bug B) |
| `src/ball.js` | Fix vy calculation in `hit()` (Bug B) |

## Verification

- W key moves player toward the net (z increase)
- S key moves player away from net (z decrease)
- AI-hit ball arrives at player at height 0.1 – 2.5 (within hit range)
- Player can consistently hit the ball by pressing B
