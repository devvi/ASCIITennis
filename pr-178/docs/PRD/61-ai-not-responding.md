# Issue 61 — AI Opponent Never Returns the Ball

## Problem

The AI opponent never successfully hits/returns the ball. After the human player hits the ball toward the AI side, the AI moves around but never swings at the ball, resulting in the ball bouncing out or the AI losing every point.

## Root Cause

In `src/ai.js:35`, the AI's ball-tracking condition is:

```js
if (ball.vz < 0 && ball.z > COURT_LENGTH * 0.4) {
```

This only activates AI tracking when the ball is moving **away** from the AI (`vz < 0` — toward the human). However, the AI's hit detection on line 84-86 requires `ball.vz > 0` (ball moving **toward** the AI). These conditions are mutually exclusive:

- When the ball approaches the AI (`vz > 0`), the tracking branch is skipped and the AI uses a rough recovery position
- The hit condition requires `vz > 0`, but precise tracking never occurs during that phase
- Result: AI never positions itself accurately enough to trigger a swing

## Feature List

1. Fix the AI tracking condition to correctly respond to balls approaching the AI
2. Update the trajectory prediction math to match the corrected direction

## Acceptance Criteria

- [ ] AI moves to intercept the ball when it enters the AI's half of the court
- [ ] AI swings and returns the ball successfully
- [ ] AI still respects difficulty settings (reaction time, accuracy, aggression)
- [ ] AI still returns null while hit_timer is active
- [ ] Existing tests continue to pass or are updated for the new behavior
