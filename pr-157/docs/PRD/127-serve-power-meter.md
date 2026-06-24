# Serve Power Meter

## Summary
Add a hold-to-charge power meter for serves. Instead of timing-based quality (s_serve vs normal), the player holds the button to charge power, and releases to serve at the charged power level.

## Motivation
The current serve has timing-only quality (press at peak for s_serve). A power meter gives more strategic depth — the player must balance charging for power against the risk of over-charging or mistiming the release.

## Requirements
- **Charge mechanic** — hold BTN_A to charge power during serve toss
- **Power meter UI** — horizontal bar fills as charge increases (green → yellow → red thresholds)
- **Speed interpolation** — serve speed scales linearly between `SERVE_SPEED_MIN` and `SERVE_SPEED_MAX`
- **Auto-fire** — serve fires automatically at max charge if held too long
- **AI integration** — AI serve power varies by difficulty (hard: 80-100%, easy: 30-60%)
- **Charge reset** — charge resets to 0 on new serve

## Acceptance Criteria
- [ ] Hold BTN_A during serve toss charges power meter
- [ ] Release BTN_A fires serve at current charge level
- [ ] Power meter renders as horizontal bar (green/yellow/red)
- [ ] Serve speed = SERVE_SPEED_MIN + (SERVE_SPEED_MAX - SERVE_SPEED_MIN) * power
- [ ] Max charge auto-fires serve
- [ ] AI serves at difficulty-appropriate power levels
- [ ] All existing tests pass
