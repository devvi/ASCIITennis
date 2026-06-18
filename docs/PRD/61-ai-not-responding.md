# Issue 61 — AI Opponent Never Returns the Ball

## Problem

The AI opponent never successfully hits/returns the ball. After the human player hits the ball toward the AI side, the AI moves around but never swings at the ball, resulting in the ball bouncing out or the AI losing every point.

## Root Cause

In `src/ai.js:87`, the hit check requires `ai_player.state === PLAYER_IDLE`:

- Lines 66-74 set `state = PLAYER_MOVING` whenever the AI is >0.3 units from its target (nearly always, since targets include random jitter)
- Lines 76-77 only set `state = PLAYER_IDLE` when within 0.3 units of the target
- Result: the AI is almost always `PLAYER_MOVING` when the ball passes through its reachable zone, so the hit check at line 87 always fails

The `can_reach` check (distance + height + velocity direction) is sufficient on its own to decide whether to swing.

## Feature List

1. Remove the `state === PLAYER_IDLE` requirement from the AI hit check

## Acceptance Criteria

- [ ] AI swings and returns the ball successfully
- [ ] AI still respects difficulty settings (reaction time, accuracy, aggression)
- [ ] AI still returns null while hit_timer is active
- [ ] Existing tests continue to pass or are updated for the new behavior
