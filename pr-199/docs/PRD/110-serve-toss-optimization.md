# Serve Toss Optimization

## Issue
The serve toss currently uses linear interpolation — the ball rises and falls at a constant speed. The desired behavior is:
1. Slower toss with natural speed variation (decelerates going up, accelerates falling down)
2. Hitting near the peak of the toss produces a "nice" serve
3. "Nice" floating text appears above the player's head on perfect timing

## Current Implementation

### Toss mechanics (`src/main.js:188-229`)
- **Linear interpolation**: `ball_obj.y` moves from 1.0 to 2.5 (SERVE_TOSS_HEIGHT) over `SERVE_TOSS_DURATION/2` = 15 frames, then back down over 15 frames
- **Timing check**: `s_serve` is awarded if the player presses BTN_A within 3 frames of the midpoint (`half` = frame 15)
- **Auto-loop**: If ball falls below y=0.8 without being hit, toss resets to y=1.0
- **AI**: No toss animation — auto-serves after a 30-frame timer with random timing quality

### Constants (`src/constants.js:90-96`)
```js
SERVE_TOSS_HEIGHT = 2.5
SERVE_TOSS_DURATION = 30
SERVE_S_SPEED_MULT = 1.5
SERVE_NORMAL_SPEED = 0.35
SERVE_ANGLE_MAX = SINGLES_WIDTH * 0.4
SERVE_SPEED_MAX = 0.55
```

### Visual
- No visual feedback for perfect serve timing
- HUD shows "Left click to serve" → "Click to swing!" during toss

## Root Cause
The original `GBC-style serve` (issue #100/#105) used a simple timer-based linear toss for predictability. This was functional but felt unnatural — no acceleration/deceleration made the toss look robotic and made timing feel arbitrary rather than skill-based.

## Proposed Approach

### Phase 1: Tests
Write test cases for:
- Physics-based toss decelerates upward (vy approaches 0 at peak)
- Physics-based toss accelerates downward (vy becomes more negative)
- Nice serve detection (|vy| < threshold near apex)
- Nice serve produces stronger serve (like s_serve)
- Visual popup state management (nice_text timer, position)
- Auto-loop reset detects ball falling below threshold

### Phase 2: Physics-based toss
Replace linear interpolation with initial upward velocity:
- Replace `SERVE_TOSS_DURATION` (frames) with `SERVE_TOSS_VY` (initial upward velocity)
- Calculate vy so ball reaches SERVE_TOSS_HEIGHT from y=1.0: `vy = sqrt(2 * |GRAVITY| * (SERVE_TOSS_HEIGHT - 1.0))`
- During toss, apply gravity each frame: `ball_obj.vy += GRAVITY; ball_obj.y += ball_obj.vy`
- Remove frame counter; detect auto-loop by checking `ball_obj.y <= 0.8` (maintain existing auto-loop logic)

**Impact**: `src/constants.js`, `src/main.js` (update_serving function)

### Phase 3: Nice serve detection
Replace frame-offset timing check with velocity-based:
- When player presses BTN_A during toss, check if `|ball_obj.vy| < NICE_VY_THRESHOLD` (close to apex)
- If so, timing_quality = "nice" (same effect as current s_serve: SERVE_SPEED_MAX * SERVE_S_SPEED_MULT)
- Retain aim angle from input.get_aim_angle()
- AI: use simplified check — random chance of nice serve based on accuracy

**Impact**: `src/main.js`, `src/constants.js`

### Phase 4: Visual "Nice!" popup
Add floating text above player's head on nice serve:
- Add state variables: `nice_text_timer`, `nice_text_y_offset`
- On nice serve hit, set timer to ~30 frames, y_offset starts at player's head height
- In render step: project (player.x, player.y + y_offset, player.z) and draw "Nice!" text
- Timer decrements each frame; message fades when timer nearing 0 (use opacity or disappear)
- Integrate with `render.js` player drawing or add directly in main.js draw_game()

**Impact**: `src/main.js`, `src/render.js`

## Key Considerations
- **Physics feel**: With GRAVITY = -0.006 and target height delta of 1.5, initial vy ≈ 0.134. This gives ~22 frames up, ~22 frames down — slower and more natural than current 15+15
- **Nice threshold**: |vy| < 0.02 gives roughly 6-7 frames of "nice" window near the peak
- **Auto-loop**: Ball will fall faster due to gravity, so auto-loop reset at y=0.8 will still work but may need adjusted threshold
- **AI compatibility**: AI serve timing unaffected; only human toss changes
- **No regressions**: Existing serve physics (ball.serve()) unchanged; only the toss animation before serve() call changes

## Acceptance Criteria
1. Serve toss uses physics-based parabolic arc (vy affected by gravity)
2. Ball visibly slows down as it reaches peak and speeds up on descent
3. Hitting within NICE_VY_THRESHOLD of the apex (vy ≈ 0) produces a "nice" serve
4. "Nice" text appears above player's head for ~30 frames on perfect serve
5. Automatic toss reset still works when ball falls below y=0.8 without being hit
6. All existing tests continue to pass
7. New tests cover physics-based toss, nice detection, and visual popup
