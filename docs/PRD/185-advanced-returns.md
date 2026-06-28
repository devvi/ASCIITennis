# Product Requirements: Advanced Returns (高级回球)

**Issue:** #185
**Feature:** Enhance gameplay with timing-based speed boosts and net smash shots with improved visual effects

## Motivation

Currently the timing system (PERFECT/GOOD/LATE) is purely cosmetic — `swing_with_timing()` returns a quality string but it does not affect ball speed, trajectory, or any gameplay outcome. The combo speed boost (`COMBO_SPEED_BOOST = 0.02` per level) applies regardless of timing quality. The feature request asks for three interconnected enhancements:

1. **Perfect timing should matter** — hitting PERFECT should tangibly reward the player with faster ball speed
2. **Net (volley) smashes** — when close to the net, enable a powerful "smash" shot (杀球) with distinct behavior
3. **Enhanced visual effects** — special shots (perfect-boosted and smash) should have more impressive visuals, specifically "longer trails" (更长的残影)

## Code Analysis

### Current Perfect Timing Implementation (`src/player.js:72-81`)

```js
swing_with_timing(p, ball) {
    if (p.hit_timer > 0) return null;
    p.state = PLAYER_HITTING;
    p.hit_timer = p.swing_duration;
    if (!ball) return 'normal';
    const dist = Math.abs(ball.z - p.z);
    if (dist < 0.5) return 'PERFECT';
    if (dist < 1.5) return 'GOOD';
    return 'LATE';
}
```

The `PERFECT_WINDOW` constant (= 5 frames) is defined in `constants.js:140` but **not used** — timing is based on distance, not frames. The return value flows through `main.js:473-502` where it's only used for display (`timing_feedback`).

### Current Hit Execution (`src/ball.js:165-191`)

`ball.hit()` accepts a `speed_mult` parameter. Currently it's called in `main.js:480` with:
```js
const combo_mult = 1.0 + COMBO_SPEED_BOOST * combo_level;
const fire_mult = human_player.fire_boost ? 1.5 : 1.0;
ball.hit(..., combo_mult * fire_mult);
```

The interface already supports speed multiplication — making PERFECT shots faster requires only wiring the timing quality into the `speed_mult`.

### Current Trail System (`src/ball.js:53-56`, `src/render.js:474-484`)

- Trail stores last 5 positions (max 5 entries, FIFO)
- Rendered as `'o'` characters with alpha 0-0.6
- Trail is cleared on each `ball.hit()` call (`b.trail = []`)
- Speed lines activate when `speed > 0.4` (3 `'='` characters behind ball)

### Current Volley/Net Zone

- Players are restricted to their own half: front player `z_max = COURT_LENGTH/2 - 0.5`
- No explicit "volley zone" or "net smash" mechanic exists
- Hitting range is based solely on distance to ball (`HIT_RANGE_H = 2.5`)

## Cross-Cutting Concerns

### Ball Data Structure Changes (`src/ball.js`)
The `ball.new()` function creates a ball with `trail: []` array and `trail_char: 'o'`. The proposal adds:
- `trail_max_length` — default 5 (existing hardcoded limit), configurable longer for special shots
- `trail_color` — default `'#ff0'` (hardcoded in render.js), configurable per shot type
- `trail_char` — already exists as `'o'`, will be set per shot type

### Player Z-Range Constraints (`src/player.js:59-61`)
Front players have `z_max = COURT_LENGTH / 2 - 0.5`, meaning they cannot cross the net. Since `NET_VOLLEY_RANGE = 1.5` is less than the z_max constraint distance from net, the `Math.abs(player.z - COURT_LENGTH/2) < NET_VOLLEY_RANGE` check will never trigger for front court players. **Action:** Either increase `NET_VOLLEY_RANGE` to allow detection from the front court limit, or reduce the z_max gap. Current gap: `COURT_LENGTH/2 - (COURT_LENGTH/2 - 0.5) = 0.5` from net. `NET_VOLLEY_RANGE = 1.5` is sufficient to detect from 0.5 away. This works correctly.

### AI Smash Prevention (`src/ai.js`)
The AI module (`ai.update()`) calls `ball.hit()` directly without timing/smash logic. The plan should ensure the AI does not accidentally trigger smash mechanics. **Action:** Smash detection should only apply to human player shots, or the AI should have a separate flag.

## Proposed Enhancements

### 1. Perfect Shot Speed Boost
- PERFECT timing adds a speed multiplier to `ball.hit()` (e.g., 1.3x or 1.5x)
- GOOD timing uses standard speed (no bonus or small bonus)
- LATE timing gets no bonus (standard speed)
- The `speed_mult` parameter in `ball.hit()` is the natural integration point

### 2. Net Smash (杀球)
- Define a "volley zone" near the net (e.g., within `NET_VOLLEY_RANGE` of the net line)
- When player is in this zone AND hits the ball, detect it as a smash
- Smash shots have:
  - Higher speed multiplier (e.g., 1.6x)
  - Flatter trajectory (lower vy)
  - Potentially steeper downward angle
- Smash should only be possible when ball is at appropriate height (above net, like a real smash)

### 3. Enhanced Visual Effects
- **Longer trail**: Increase trail length from 5 to more (e.g., 10-15) on perfect/smash shots
- **Trail color differentiation**: Different trail color for perfect (e.g., `#0f0` green) and smash (e.g., `#f00` red)
- **Trail character variation**: Use different characters (e.g., `*` or `#` instead of `o`)
- More particles on perfect/smash hit (e.g., 12 instead of 6)
- Speed lines threshold could be lowered for these special shots

## Acceptance Criteria

1. PERFECT timing applies a configurable speed multiplier to `ball.hit()` (defined in constants)
2. GOOD/LATE timing does not apply the perfect speed bonus
3. Net smash activates when player is within a configurable distance from the net
4. Smash shots have higher speed and flatter trajectory than normal shots
5. Smash is only possible when ball height is above net level
6. Perfect-boosted shots produce a longer trail (more trail positions)
7. Smash shots produce a longer trail with distinct color
8. Perfect/smash shots spawn more particles on impact
9. All existing tests pass; new tests cover timing → speed bonus, smash activation, enhanced trails
10. Constants are tunable: `PERFECT_SPEED_MULT`, `SMASH_SPEED_MULT`, `NET_VOLLEY_RANGE`, `SMASH_TRAIL_LENGTH`, `PERFECT_TRAIL_LENGTH`
