# Tasks: Serve Toss Optimization (#110)

## Related Modules
| Module | File | Impact |
|--------|------|--------|
| Constants | `src/constants.js` | Add SERVE_TOSS_VY, NICE_VY_THRESHOLD |
| Game state | `src/main.js` | Replace linear toss with physics toss; add nice serve detection + popup state |
| Render | `src/render.js` | Add "Nice!" popup rendering |
| Ball | `src/ball.js` | No change (serve() called same way) |
| Tests | `tests/main.test.js` | Update serve timing tests for physics-based toss |
| Tests | `tests/ball.test.js` | Add toss physics tests |

## Issue Context
Parent issue: #110

The serve toss currently uses frame-based linear interpolation, making the ball move at constant speed. The goal is to use physics-based toss (initial vy + gravity) for natural acceleration/deceleration, detect "nice" timing near the apex, and show a "Nice!" popup above the player's head.

## Current Behavior
- Linear toss: 15 frames up, 15 frames down
- "s_serve" if within 3 frames of midpoint
- No visual feedback

## Desired Behavior
- Parabolic toss: vy starts positive, gravity decelerates ascent, accelerates descent
- "nice" serve when hit near apex (vy ≈ 0)
- "Nice!" floating text above player head

## Dependency / Architectural Notes
- The toss is purely a pre-serve animation in `update_serving()`; `ball.serve()` is called with the timing_quality parameter
- AI uses a separate timer-based path in the same function; only the human path changes
- `ball_obj.vy` is currently 0 during toss; the physics-based toss will repurpose it
- Toss auto-loop checks `ball_obj.y <= 0.8` — this threshold may need adjustment since the ball will now fall faster with gravity
