# Issue 62: Court and Court Rules — Design

## Architecture

### Current Problem
- `court.is_in_bounds()` uses `COURT_WIDTH` (doubles width 10.97m), causing balls in the doubles alley (between singles and doubles sideline) to be counted as "in play"
- Point resolution in `main.js` uses only ball position relative to court halves, not last-hitter tracking
- No explicit violation type system — ball.out/net just maps to `BALL_OUT`/`BALL_NET` states
- No referee entity or violation feedback display

### Solution Overview

1. **Boundary fix** — `is_in_bounds()` checks against `SINGLES_WIDTH / 2` instead of `COURT_WIDTH / 2`
2. **Last-hitter tracking** — `ball.last_hit_by` stores `0` (player) or `1` (AI) on each hit
3. **Violation types** — constants for unambiguous violation identification
4. **Referee state** — ephemeral state in main.js carrying violation message, type, and display timer
5. **Referee render** — ASCII referee figure at net post with judgment text

### Data Structures

#### Violation Constants (`constants.js`)
```
VIOLATION_NONE = null
VIOLATION_OUT = "out"
VIOLATION_NET = "net"
VIOLATION_DOUBLE_BOUNCE = "double_bounce"
VIOLATION_SERVE_FAULT = "serve_fault"
```

#### Ball state additions (`ball.new()`)
```
last_hit_by: null   // 0 = player, 1 = AI, null = not hit yet
last_bounce_side: null  // 0 = player's side, 1 = AI's side
```

#### Referee state (`main.js`)
```
referee: {
  message: "",         // e.g. "OUT!", "NET!", "DOUBLE BOUNCE!", "FAULT!"
  violation_type: null, // one of VIOLATION_* constants
  timer: 0             // countdown frames
}
```

#### Service Box detection (`court.js`)
```
is_in_service_box(x, z, side):
  // side = 0 (near, player's side) or 1 (far, AI's side)
  // Singles service box: half of SINGLES_WIDTH wide, 1/4 of COURT_LENGTH deep
  // On near side (z in [0, COURT_LENGTH/4]), on far side (z in [3*COURT_LENGTH/4, COURT_LENGTH])
  // Must also be within the correct half of the service line center
```

### Module Changes

| Module | Change |
|--------|--------|
| `constants.js` | Add `VIOLATION_*` constants, `SINGLES_WIDTH` already exists |
| `court.js` | Fix `is_in_bounds()` to use `SINGLES_WIDTH/2`; add `is_in_service_box()` |
| `ball.js` | Add `last_hit_by`, `last_bounce_side`; set `last_hit_by` in `hit()`; detect double bounce in `update()` |
| `scoring.js` | Add `resolve_violation(score, last_hitter, violation_type)` → returns winner index |
| `main.js` | Replace simple side-based resolution with last-hitter + violation logic; add referee state; wire up serve validation |
| `render.js` | Add `referee(referee_state)` function; call from `draw_game()` |

### Violation Resolution Logic

When ball enters a terminal state (OUT, NET, DOUBLE_BOUNCE):
1. Identify the **violation type**:
   - `BALL_OUT` + outside singles bounds → `VIOLATION_OUT`
   - `BALL_NET` → `VIOLATION_NET`
   - Double bounce on same side → `VIOLATION_DOUBLE_BOUNCE`
2. The **last hitter** loses the point (opponent wins)
3. Call `scoring.resolve_violation(score, last_hitter, violation_type)` which:
   - Calls `scoring.award_point(score, 1 - last_hitter)`
   - Returns the winner index
4. Set referee state with message and timer

### Referee Rendering

- ASCII referee character `@` positioned near the net post
- When violation is active, display centered text below referee:
  - `VIOLATION_OUT` → "OUT!"
  - `VIOLATION_NET` → "NET!"
  - `VIOLATION_DOUBLE_BOUNCE` → "DOUBLE BOUNCE!"
  - `VIOLATION_SERVE_FAULT` → "FAULT!"
- Text visible during `STATE_POINT_SCORED`, disappears when referee timer expires

### Data Flow

```
ball.update() → sets b.state = BALL_OUT/BALL_NET
  → main.js update_playing() detects state change
  → determines violation type + last_hitter
  → scoring.resolve_violation() → award_point()
  → referee state set with message
  → render.referee() draws figure + text
  → point_timer counts down → reset to serving state
```
