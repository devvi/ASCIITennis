# Product Requirements: 道具可用性修正 (Item Usability Fix)

**Issue:** #173
**Feature:** Investigate and fix the bug where items picked up on the court have no effect after being "used" via the E key.

## Motivation

Items (power-ups) were implemented as part of the fun improvement feature (#151) but do not function correctly. When a player collects an item from the court and presses E (BTN_X) to use it, most item types produce no visible effect. This makes the entire item system feel broken and confusing to players. The issue needs to be diagnosed and fixed to restore the intended gameplay value.

## Root Cause Analysis

### Primary Bug: Missing Effect Activation

In `src/main.js:446-452`, the `update_playing()` function handles item usage:

```js
if (input1.pressed(BTN_X)) {
  const item_type = player.use_item(human_player);
  if (item_type === ITEM_TYPES.TIME_SLOW) {
    time_slow_active = true;
    time_slow_timer = ITEM_ACTIVE_DURATION;
  }
}
```

Only `ITEM_TYPES.TIME_SLOW` (`'T'`) activates its effect. The other four item types are silently consumed without any gameplay impact:

| Item Type | Code | Should Do | Actual Behavior |
|-----------|------|-----------|-----------------|
| FIRE (`F`) | `'F'` | Next shot 1.5x speed | Works *accidentally* via implicit check in hit logic |
| BIG_RACKET (`B`) | `'B'` | 2x hit range for 5s | No effect — `hit_range_mult` never set to 2.0 |
| SHIELD (`S`) | `'S'` | Auto-return ball within range | No effect — `shield_active` never set to true |
| MULTI_BALL (`M`) | `'M'` | Spawn second ball for 5s | No effect — `second_ball` never spawned |
| TIME_SLOW (`T`) | `'T'` | 0.5x speed for 5s | Works correctly |

### Secondary Issues Found

1. **`player.use_item()` hardcodes timer** — Line 107 in `player.js` uses literal `300` instead of the `ITEM_ACTIVE_DURATION` constant. Currently a wash (300 = 300) but fragile.

2. **FIRE effect cleanup fragile** — Lines 467-470 check `human_player.item === null` (item slot is empty after `use_item()` clears it). This works but relies on implicit state ordering.

3. **AI/P2 cannot collect items** — The collection loop (lines 555-566) only checks `human_player`, so in 2P mode, only P1 gets items.

4. **Item rendering uses wall-clock time** — `render.item_box()` in `render.js:454` uses `Date.now() / 500` for blink animation, which doesn't respect game pause or slow-motion.

5. **Second ball (multi-ball) update incomplete** — The `second_ball` is updated in physics (lines 544-549) but has no collision handling, violation detection, or interaction with items.

## Affected Systems

| Module | Impact |
|--------|--------|
| `src/main.js` | Item use handler missing effect activations for 3/5 item types |
| `src/player.js` | `use_item()` hardcodes timer constant; flags exist but caller never sets them |
| `src/render.js` | Item blink uses `Date.now()` instead of frame counter |

## Acceptance Criteria

- BIG_RACKET item correctly doubles hit range for 5 seconds (player.hit_range_mult = 2.0)
- SHIELD item correctly auto-returns one ball within range (shield_active = true)
- MULTI_BALL item correctly spawns a second ball on use
- FIRE item continues to work (1.5x next shot speed)
- TIME_SLOW item continues to work (0.5x speed)
- `player.use_item()` uses `ITEM_ACTIVE_DURATION` constant instead of hardcoded 300
- Items can be collected and used by both P1 and P2 in 2P mode
- Existing tests continue to pass
- New tests cover all five item type effect activations
