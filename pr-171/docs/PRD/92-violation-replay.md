# Issue 92: 犯规判定优化 (Violation Judgment Optimization)

## Product Requirements

Improve the player's ability to understand and confirm when a violation (fault/out/net/double-bounce) has occurred. Currently violations transition immediately to POINT_SCORED with only a brief text message, making it hard for players to see what happened.

## Features

1. **Ball physics continuation after violation** — When a ball faults, goes out, hits the net, or double-bounces, it should continue simulating along its natural trajectory for several additional bounces before the game transitions to the next state. This enhances the player's physical feel of the ball.

2. **Violation replay phase** — After a violation is detected, the game enters a brief replay phase where:
   - The ball continues bouncing with full physics
   - The referee message (OUT!, NET!, FAULT!, DOUBLE BOUNCE!) is displayed prominently
   - The predicted landing spot or violation zone is highlighted
   - The game pauses briefly after the replay to let the player absorb the information

3. **Visual landing indication** — During the replay phase, show clear visual markers indicating where the ball landed relative to court boundaries (e.g. the 'X' landing marker stays visible, or the out-of-bounds zone is highlighted).

## Acceptance Criteria

1. After a fault/out/net/double-bounce violation, the ball continues its physics trajectory for at least 3 additional bounces or ~60 frames before transitioning to POINT_SCORED
2. The ball is rendered during the entire replay phase, including bounces off the ground
3. The referee violation message is displayed throughout the replay phase
4. The landing marker 'X' is visible at the ball's first out-of-bounds contact point
5. After the replay phase ends, the game transitions to POINT_SCORED as before
6. All existing tests pass
