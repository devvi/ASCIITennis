# PRD: Add Audience

## Issue
#111 — 加入观众席 (Add Audience)

## Summary
Render ASCII spectators around the court perimeter who cheer when the player or AI makes a good play (wins a point, hits a violation replay, or rallies well). This is a purely visual/atmospheric feature — no gameplay impact.

---

## Feature List

### 1. Spectator Placement
- ~20-30 spectators positioned around the court perimeter:
  - Along the near sideline (z < 0, opposite camera side)
  - Along the far sideline (z > COURT_LENGTH)
  - Along the left/right sidelines (|x| > COURT_WIDTH/2)
- Positions are outside court bounds so they don't overlap the playing surface
- Small random offsets per spectator for a natural look

### 2. Idle Pose
- Each spectator renders as a simple ASCII figure when not cheering
- Base character: `O` (head) on `|` (body)
- Rendered at ground level using `camera.project()` — same as players/referee
- Alternate between `O` and `o` slightly for variety

### 3. Cheer Reaction
- Triggered on:
  - `resolve_point()` — any point win
  - `resolve_violation_point()` — opponent error
  - Rally length threshold (e.g., 5+ hit rally) — crowd appreciation
- When cheering: spectator characters change to raised-arm pose
- Cheer pose: `\o/` (arms raised) — three characters per spectator
- `cheer_level` timer counts down from `CHEER_DURATION` (e.g., 60 frames)
- During cheer: each spectator stays in cheer pose until timer expires

### 4. Integration Points (main.js)
- `audience.cheer()` called in `resolve_point()` — crowd cheers when a point is scored
- `audience.cheer()` called in `resolve_violation_point()` — crowd reacts to violations
- `audience.update()` called in `gameLoop` — decays cheer_level
- `render.audience()` called in `draw_game()` after court/net, before players

### 5. Performance
- All spectators use same projection calculation per frame
- No per-frame allocations in hot loop
- Spectator count chosen to stay within frame budget

---

## Acceptance Criteria

1. **Placement**: ~20-30 spectators visible around the court perimeter, correctly projected
2. **Idle State**: Spectators display a neutral ASCII figure during normal play
3. **Cheer Trigger**: Audience cheers on point wins, violation replays, and long rallies
4. **Cheer Decay**: Cheer level decays over ~1 second and returns to idle
5. **Cheer Pose**: Cheering spectators show raised-arm characters `\o/`
6. **No Regressions**: All existing tests pass; gameplay, physics, scoring unaffected
7. **Performance**: No noticeable frame drop from audience rendering
