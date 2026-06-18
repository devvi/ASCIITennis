# PRD: Serve Power Meter

## Issue
#127 — Serve power meter

## Summary
Add a hold-to-charge power meter for serves. Currently, serve quality is binary — either `s_serve` (hit within 3 frames of peak toss) or `normal`. A power meter lets the player hold the button during the toss to charge serve speed, adding strategic depth: short/hard, deep/soft, or anything between. Accuracy (timing relative to peak) remains a separate axis.

---

## Feature List

### 1. Charge Meter During Toss
- When the player presses BTN_A/BTN_B to start the toss, a power meter begins charging (0% → 100%).
- The player releases the button to serve at the current charge level.
- If the player never releases (holds through the full toss cycle), the serve auto-fires at max charge when the ball reaches the hit window.
- The meter resets to 0 for each new serve.

### 2. Variable Serve Speed
- Serve speed scales linearly between `SERVE_SPEED_MIN` and `SERVE_SPEED_MAX` based on charge percentage.
- Charge applies as a multiplier to both horizontal and vertical velocity components.
- `s_serve` (near-peak timing) still applies — it gives a flat bonus on top of power.
- Minimum charge floor: 10% (a tap-serve), max at 100% (full charge).

### 3. Visual Power Meter
- Draw a horizontal bar above the HUD during serve state.
- Bar fills left-to-right as charge increases (e.g., `[====>     ]`).
- Color: green (0-60%), yellow (60-85%), red (85-100%).
- Bar width: 40px, positioned centered below the score HUD.

### 4. AI Integration
- AI serve uses `ai_config.accuracy` plus random variance to determine charge level.
- Hard AI picks higher charge (80-100%) with better accuracy.
- Easy AI picks lower charge (30-60%) with more variance.

### 5. No Regressions
- All existing tests pass.
- Serve toss auto-loop unaffected.
- 2P mode both players get power meter for their serve.
- AI serve flow unchanged except charge selection.

---

## Acceptance Criteria

1. **Charge Mechanics**
   - Pressing serve button starts toss + begins charging.
   - Charge increases from 0% to 100% at a constant rate.
   - Releasing the button fires serve at current charge level.

2. **Speed Scaling**
   - 0% charge → minimum serve speed (`SERVE_SPEED_MIN`).
   - 100% charge → maximum serve speed (`SERVE_SPEED_MAX`).
   - Linear interpolation between min and max.

3. **Visual Meter**
   - Power bar visible during serve charge.
   - Bar fills and changes color as charge increases.
   - Bar disappears after serve is hit.

4. **AI Behavior**
   - AI selects charge level based on difficulty.
   - Hard AI: 80-100% charge.
   - Easy AI: 30-60% charge.

5. **Tests**
   - Charge starts on toss, increases each frame, capped at 100%.
   - Release fires serve with interpolated speed.
   - Auto-fire at 100% if held too long.
   - AI charge selection within expected ranges.
   - Meter bar draws correct width for charge level.
