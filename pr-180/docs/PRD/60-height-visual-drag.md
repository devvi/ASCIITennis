# Issue 60: 让玩家更容易预测球的落点 — Ball Height Visual Drag

## Product Requirements

Players struggle to track the ball and predict where it will land because the ball moves at a constant horizontal speed regardless of its height. In real tennis, the ball appears to slow down at the apex of its trajectory (relative to the viewer's perspective), giving players time to read and react.

This feature introduces a **height-based horizontal velocity drag**: the ball moves slower when it is high in the air and faster when it is low (near the ground). This leverages a visual perception trick — high objects appear to move more slowly across the field of view — making ball trajectory more readable and landing positions easier to predict.

## Features

1. **Height-based velocity modulation** — apply a multiplier to the ball's horizontal velocity (vx, vz) that decreases as the ball's height (y) increases, giving it a natural "hang time" feel at the apex
2. **Smooth interpolation** — the transition from slow (high) to fast (low) must be smooth and continuous, avoiding abrupt speed changes
3. **Physics-preserving landing prediction** — the existing `predict_landing()` function must remain reasonably accurate despite the modified trajectory (approximation is acceptable)

## Acceptance Criteria

1. Ball horizontal speed is noticeably reduced at the peak of its arc (y >= 2.0) compared to near the ground (y <= 0.5)
2. The speed transition is smooth — no frame-to-frame jitter or sudden speed changes
3. The effect is subtle enough to feel natural (not like the ball is moving through molasses)
4. Landing prediction marker (`X`) remains functionally useful — it doesn't need to be pixel-perfect but should guide the player to the correct area
5. All existing tests continue to pass
6. Lua version (`src/ball.lua`) mirrors the same change for consistency
