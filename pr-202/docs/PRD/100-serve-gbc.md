# PRD: Mario Tennis GBC-style Serve & Angle Control

## Issue
#100 — 关于发球 (About Serving)

## Summary
Overhaul the serving mechanic and aiming system to match Mario Tennis GBC.

---

## Feature List

### 1. Mario Tennis GBC-style Serve
- Player clicks left mouse button to toss the ball upward.
- Ball rises to a peak height, then falls.
- If the player's swing connects at the **peak** of the ball toss → **S serve** (high-speed super serve).
- Only the timing determines speed — no charge bar.

### 2. No Service Faults
- Serves always land in the service box.
- Remove `serve_fault` violation entirely.
- Serve quality is expressed purely through ball speed (S serve vs normal serve) and angle.
- Opponent (AI) serves also never fault.

### 3. A/D Angle Control
- During play, the **A/D (left/right)** keys control the **horizontal aim angle** of shots instead of random targeting.
- During the serve, A/D also controls serve placement angle.
- Up/Down (W/S) continues to control player forward/backward movement.
- Shot type combos: B + direction for topspin/slice/lob remain unchanged.

---

## Acceptance Criteria

1. **Serving**
   - Left click tosses ball up; ball rises and falls with gravity.
   - If player hits ball at peak height → S serve (max speed `SERVE_SPEED_MAX`).
   - If player hits ball before or after peak → normal serve (proportional speed).
   - No fault is possible — serve always lands in service box.
   - AI serve also always lands in.

2. **Angle Control**
   - A/D modifies `target_x` proportionally for all human shots (including serve).
   - No A/D → shot goes straight (center).
   - A held left → shot angles left (negative target_x).
   - D held right → shot angles right (positive target_x).
   - Magnitude of angle is capped within singles sidelines.

3. **Movement**
   - W/S controls forward/backward movement only.
   - Player's lateral movement removed (A/D now controls aim, not movement).
   - AI movement and targeting unchanged.

---

## Impact Analysis

| Module | Impact |
|--------|--------|
| `src/input.js` | Add serve toss state, peak detection; remove charge logic |
| `src/player.js` | Remove lateral movement from human player |
| `src/main.js` | New serve state machine (toss → hit timing); remove fault checking |
| `src/ball.js` | Serve method may get angle param; remove fault-related code |
| `src/constants.js` | May add new constants for toss height, serve timing |
| `tests/input.test.js` | Update tests for new serve mechanics |
| `tests/main.test.js` | Remove fault tests; add serve timing tests |
| `tests/ball.test.js` | Update serve tests |
