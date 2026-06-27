# Product Requirements: Item Usability Fix

**Issue:** #181
**Parent:** #173
**Feature:** Fix item usability bugs — ensure all 5 item types (BIG_RACKET, SHIELD, MULTI_BALL, FIRE, TIME_SLOW) produce correct effects when used, extend collection/usage to P2, and fix rendering issues.

## Motivation

The plan issue #181 consolidates the research findings from `docs/PRD/173-item-usability-fix.md` into an actionable implementation plan. The item system has multiple bugs:
1. Only TIME_SLOW activates; BIG_RACKET, SHIELD, MULTI_BALL are silently consumed
2. `player.use_item()` hardcodes timer instead of using `ITEM_ACTIVE_DURATION`
3. P2 cannot collect or use items in 2P mode
4. Item blink uses wall-clock time instead of frame counter
5. No P2 item HUD indicator

## Requirements

### Item Effect Activation
- BIG_RACKET: `player.hit_range_mult = 2.0` for `ITEM_ACTIVE_DURATION` frames
- SHIELD: `player.shield_active = true` for `ITEM_ACTIVE_DURATION` frames
- MULTI_BALL: spawn `second_ball` with proper position/velocity toward opponent's court
- FIRE: implicit via `fire_mult` check at hit time (existing behavior)
- TIME_SLOW: `time_slow_active = true` with `time_slow_timer = ITEM_ACTIVE_DURATION` (existing behavior)

### Code Quality
- `player.use_item()` must use `ITEM_ACTIVE_DURATION` constant instead of hardcoded `300`

### Multiplayer
- P2 can collect items from the court in 2P mode
- P2 can use items via `input2.pressed(BTN_X)`
- All 5 item types work for P2

### Rendering
- Item box blink uses frame counter (not `Date.now()`) so it respects pause/slow-motion
- P2 item HUD displayed in 2P mode

## Acceptance Criteria

- All 5 item types produce correct effects when used by P1
- All 5 item types produce correct effects when used by P2
- Items spawn correctly for MULTI_BALL (proper position, velocity toward opponent)
- `player.use_item()` uses `ITEM_ACTIVE_DURATION` constant
- P2 can collect items from the court
- Item blink animation uses frame-based timer
- P2 item HUD visible in 2P mode
- All existing tests pass
- New tests cover all item type activations, P2 flow, and rendering changes
