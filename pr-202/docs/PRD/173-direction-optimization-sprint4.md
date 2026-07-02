# Product Requirements: Direction Optimization Sprint 4 — Mario Tennis GBC-style Directional Shots

**Issue:** #173
**Feature:** Position-relative directional aiming with timing-based angle modulation, inspired by Mario Tennis GBC

## Motivation

Issue #172 will restore basic A/D directional control with a fixed moderate angle (`DIRECTIONAL_ANGLE ≈ 0.63`) when no mouse is held. This gives keyboard-only players the ability to aim, but the angle is a flat constant regardless of court position or timing.

In Mario Tennis GBC, directional shots are far more nuanced:

1. **Direction is relative to player position** — pressing left while on the left baseline sends the ball sharply down-the-line; pressing left while on the right baseline sends it cross-court. The same input produces different absolute targets depending on where the player stands.
2. **Timing affects precision** — perfect timing gives full angle control; late/early timing reduces the effective angle, making shots straighter.
3. **Movement and aim are unified** — the same directional keys control both movement and shot direction, creating an intuitive flow where the direction you're running naturally influences the shot.

This sprint builds on #172's foundation by making the directional system position-aware and timing-sensitive.

## Root Cause

### 1. Current `target_x` is position-absolute

In `src/main.js:460-461`:
```js
const angle = input1.get_aim_angle();
const target_x = angle * SINGLES_WIDTH * 0.35;
```

The target X is computed as an absolute court coordinate. A `+0.63` angle always means `target_x ≈ +1.82`, regardless of whether the player is standing at x=0 (center), x=2 (right baseline), or x=-2 (left baseline). This means:
- From the left baseline, pressing D (right) only aims toward the center-right, not cross-court
- From the right baseline, pressing A (left) only aims toward the center-left, not cross-court
- The angle doesn't "bend" relative to the player's court position

### 2. No timing-accuracy linkage

The `timing_quality` value from `player.swing_with_timing()` is currently used only as a truthy gate. It is not used to modulate the shot angle. In Mario Tennis GBC, poor timing produces less directional control.

### 3. P2 (2-player mode) has the same issue

The 2-player code path at `main.js:512-514` has the same absolute target_x calculation.

## Proposed Solution

### 1. Position-relative target X

Change the `target_x` calculation in `main.js` to be relative to the player's current X position:

| Player position | Direction held | Current target_x (absolute) | Proposed target_x (relative) | Effect |
|----------------|----------------|----------------------------|-----------------------------|--------|
| x=0 (center) | A (left) | -1.82 | -1.82 | Same — down the middle-left |
| x=-2 (left baseline) | A (left) | -1.82 | -3.82 | Down-the-line (sharp left) |
| x=-2 (left baseline) | D (right) | +1.82 | -0.18 | Cross-court toward center |
| x=2 (right baseline) | A (left) | -1.82 | +0.18 | Cross-court toward center |
| x=2 (right baseline) | D (right) | +1.82 | +3.82 | Down-the-line (sharp right) |
| Any | none | 0 | player.x (toward center) | Center-ish relative to position |

Formula:
```js
const target_x = human_player.x + angle * SINGLES_WIDTH * 0.35;
```

### 2. Timing quality modulates angle

Scale the effective angle by timing quality:

| Timing Quality | Angle Multiplier | Effect |
|---------------|-----------------|--------|
| `PERFECT` | 1.0× | Full directional control |
| `GOOD` | 0.75× | Noticeable but reduced angle |
| `LATE` / `EARLY` (any other) | 0.5× | Weak directional control |

Implementation:
```js
const timing_mult = timing_quality === 'PERFECT' ? 1.0 : timing_quality === 'GOOD' ? 0.75 : 0.5;
const target_x = human_player.x + angle * timing_mult * SINGLES_WIDTH * 0.35;
```

### 3. Clamp target within court bounds

Ensure the target never goes outside the playable singles court area:
```js
const halfCourt = SINGLES_WIDTH / 2 - 0.5;
const target_x = Math.max(-halfCourt, Math.min(halfCourt, human_player.x + angle * SINGLES_WIDTH * 0.35));
```

### 4. Apply same changes to P2 path

The 2-player mode code path should receive the same position-relative + timing modulation for P2.

### 5. Mouse hold behavior unchanged

When the mouse/Shift is held, the proportional `sqrt(t)` aiming already provides position-relative control (the mouse user can click on any court position). However, the timing modulation and court clamping should still apply for consistency.

## Impact on Gameplay

- **Keyboard-only players get Mario Tennis GBC-style positioning**: A/D shots now feel natural — pressing the direction you want to hit *relative to your position*.
- **Timing adds skill depth**: Players who time their swings well are rewarded with better angle control.
- **Mouse users unaffected**: Mouse-hold aiming continues to work as before, but with added court-bound clamping for safety.
- **2P mode parity**: Player 2 (Arrow keys) gets the same position-relative behavior.
- **Serve**: `do_serve` also uses `get_aim_angle()` and can benefit from the `.x + angle * ...` computation in `update_serving`.

## Feature List

### 1. Modify shot target_x in `src/main.js` (playing state)
- Change `target_x = angle * SINGLES_WIDTH * 0.35` to `target_x = player.x + angle * timing_mult * SINGLES_WIDTH * 0.35`
- Apply timing multiplier: PERFECT=1.0, GOOD=0.75, LATE/EARLY=0.5
- Clamp `target_x` to `[-SINGLES_WIDTH/2 + 0.5, SINGLES_WIDTH/2 - 0.5]`
- Apply same to P2 shot path

### 2. Modify serve target_x in `src/main.js`
- Change `do_serve` to compute `target_x` relative to server position

### 3. Add timing constants to `src/constants.js`
- `TIMING_ANGLE_PERFECT = 1.0`
- `TIMING_ANGLE_GOOD = 0.75`
- `TIMING_ANGLE_LATE = 0.5`

### 4. Update tests
- Add tests for position-relative target_x computation
- Add tests for timing quality modulation
- Add tests for court-bound clamping
- Verify mouse-hold behavior is unchanged

## Acceptance Criteria

- Holding A + space from x=-2 → target_x is near -3.82 (down-the-line left)
- Holding D + space from x=-2 → target_x is near -0.18 (cross-court right)
- Holding A + space from x=2 → target_x is near 0.18 (cross-court left)
- Holding D + space from x=2 → target_x is near 3.82 (down-the-line right)
- No direction + space → target_x equals player.x (straight relative to position)
- PERFECT timing → full angle; GOOD → 0.75×; LATE → 0.5×
- target_x is always clamped within singles court bounds
- P2 mode has same position-relative behavior
- Serve placement is also position-relative
- Mouse hold aiming is completely unchanged
- All existing tests pass
