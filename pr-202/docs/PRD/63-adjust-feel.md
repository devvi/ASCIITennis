# Issue 63: 调整手感 (Adjust Feel)

## Product Requirements

### Problem 1: 球容易出界 (Ball goes out too easily)

Currently, both human and AI hits aim at random court targets. The random X range can exceed the singles sidelines, and the Z depth targets near the baseline, causing frequent unforced errors. Normal returns should reliably land inside the court.

**Features:**
1. **Tighter hit targeting** — reduce the random target zone for human and AI hits so that balls land well within court boundaries
2. **Balanced AI accuracy** — AI targeting also adjusted to reduce wild shots, making rallies more consistent

### Problem 2: 发球力度控制 (Serve power control)

Currently the serve has a fixed speed (0.45) with no player control. Players need a way to control serve speed/power.

**Features:**
1. **Charge-based serve power** — hold the serve button to charge power, release to serve
2. **Visual power indicator** — show a simple power meter in the HUD during serve
3. **Speed scales with charge** — serve speed ranges from ~0.25 (slow) to ~0.55 (fast)

## Acceptance Criteria

1. Human hit targets have a reduced random X range (well within singles sidelines)
2. Human hit targets have a reduced Z range (balls land safely before baseline)
3. AI hit targets are similarly tightened per accuracy config
4. Serve power charges when holding BTN_B/A; power increases over ~30 frames
5. Serve speed/vy scale with charge level; weak serves arc more, strong serves are flatter
6. Power meter displayed during serve charge
7. All existing tests pass; new tests cover tighter targeting and serve power
