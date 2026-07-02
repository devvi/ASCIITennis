# PRD: Serve & Controls Rework

## Issue
#105 — 关于发球2 (About Serving 2)

## Summary
Fix three interrelated bugs in the GBC-style serve system (introduced in #100):
1. Serve toss doesn't auto-loop when missed
2. A/D keys no longer control player lateral movement during rallies
3. Serve always faults because the ball overshoots the court

---

## Feature List

### 1. Auto-looping Serve Toss
- When the player clicks to toss, the ball rises and falls in a parabola.
- If the player misses the timing (ball falls below hit height), the ball auto-re-tosses immediately without requiring another click.
- Loop continues indefinitely until the player clicks to hit at the right moment.

### 2. Restore A/D Lateral Movement During Rallies
- W/S continues to control forward/backward movement (unchanged).
- A/D controls lateral (left/right) player movement during `STATE_PLAYING`.
- A/D continues to control aim angle during serve (`STATE_SERVING`) and during swing (`STATE_PLAYING` when hitting), because `get_aim_angle()` is called at the moment of the hit/serve.
- The `player.move()` function must allow non-zero `dx` for human players.
- During serve state, `update_serving()` does not call `player.move()`, so A/D only affects serve angle.

### 3. Eliminate Serve Faults
- Serves must land in the opponent's service box and stay in play.
- Fix the ball's out-of-bounds detection to not trigger BALL_OUT when the ball exits the court AFTER bouncing (only when it goes out BEFORE bouncing).
- Add a generous far-out safety threshold (z > COURT_LENGTH + 5 or z < -5) to prevent infinite travel.
- Recalibrate serve `vy` so the ball arcs deeper and lands in the service box.

---

## Acceptance Criteria

1. **Serve Toss**
   - Left click tosses ball up; ball rises and falls.
   - If ball falls to ground without being hit, it auto-re-tosses.
   - Player clicks at the right moment to hit the serve.

2. **A/D Movement**
   - During rallies (STATE_PLAYING), A/D moves the player left/right.
   - During serve (STATE_SERVING), A/D controls serve angle only.
   - A/D aim angle continues to work for shot direction during rally hits.

3. **Serve Landing**
   - Serve always lands in the opponent's service box zone.
   - Serve ball does not immediately go out after bouncing.
   - Opponent (AI) can attempt to return the serve.
   - No immediate fault call on serve.

4. **No Regressions**
   - All existing tests pass (after updating for behavioral changes).
   - AI serve and movement unaffected.
   - Violation replay system unaffected.
