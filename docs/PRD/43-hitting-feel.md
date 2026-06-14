# Issue 43: 击球手感重构 (Hitting Feel Refactor)

## Product Requirements

Players currently struggle to hit the ball because the hit detection window is too narrow and the ball speed makes trajectory prediction impossible. This issue reworks the hitting mechanic to be responsive, predictable, and visually informative.

## Features

1. **Expanded hit range** — increase `can_hit` radius so the ball is hittable within a reasonable window, with separate horizontal and vertical checks
2. **Visual hit indicator** — show when the ball is within hitting range (change player character or ball appearance)
3. **Landing zone prediction** — display a visual marker where the ball will land, allowing players to position reactively
4. **Balanced ball speed** — reduce max ball velocity and add speed scaling so rallies last longer and are more readable
5. **Consistent physics** — ensure bounce, gravity, and air resistance produce predictable arcs

## Acceptance Criteria

1. Player can consistently hit the ball with reasonable timing
2. A visual indicator (e.g. player character glows or changes character) appears when the ball is in hit range
3. A landing prediction marker (e.g. `X` on the court surface) shows where the ball will bounce
4. Ball speed is reduced so a rally lasts at least 3-4 exchanges on Easy difficulty
5. AI hitting consistency is also adjusted to match new parameters
6. All existing tests pass; new tests cover hit range, prediction, and speed changes
