# Issue 173 — 道具可用性核实和修改: Item Usability Fix Design

## Architecture Overview

Items (power-ups) are collected from the court and activated via `BTN_X` (E key / Ctrl / Num0). The bug is that the item use handler in `main.js:446-452` only activates `TIME_SLOW`; all other item types are silently consumed with no gameplay effect.

## Root Cause

```js
// main.js:446-452 — only TIME_SLOW activates
if (input1.pressed(BTN_X)) {
  const item_type = player.use_item(human_player);
  if (item_type === ITEM_TYPES.TIME_SLOW) {     // only branch
    time_slow_active = true;
    time_slow_timer = ITEM_ACTIVE_DURATION;
  }
  // BIG_RACKET, SHIELD, MULTI_BALL: no activation
}
```

## Secondary Issues

1. `player.use_item()` hardcodes `300` instead of `ITEM_ACTIVE_DURATION` constant (`player.js:107`)
2. P2 cannot collect items — collection loop only checks `human_player` (`main.js:562`)
3. No P2 item use handler in 2P mode
4. Item blink uses `Date.now()` wall-clock instead of frame counter (`render.js:456`)
5. No P2 item HUD

## Data Structures (unchanged)

```js
// Constants — correct as-is (constants.js:142-147)
ITEM_SPAWN_INTERVAL = 600
ITEM_COLLECT_RANGE = 1.0
ITEM_LIFETIME = 600
ITEM_ACTIVE_DURATION = 300
ITEM_TYPES = { FIRE: 'F', BIG_RACKET: 'B', SHIELD: 'S', MULTI_BALL: 'M', TIME_SLOW: 'T' }

// Player state — correct as-is (player.js:16-20)
p.item = null | string       // collected item type
p.item_active = false         // effect currently active
p.item_timer = 0              // frames remaining
p.hit_range_mult = 1.0       // big racket: 2.0
p.shield_active = false       // shield: auto-return

// Game state — correct as-is (main.js)
items = [{ x, z, type, timer }]
second_ball = null | ball_obj
time_slow_active = false
time_slow_timer = 0
```

## Core Logic Changes

| Function | File:Line | Change |
|----------|-----------|--------|
| `update_playing()` | `main.js:446-452` | Add `else if` branches for BIG_RACKET, SHIELD, MULTI_BALL after `use_item()` |
| `player.use_item()` | `player.js:107` | Replace hardcoded `300` with `ITEM_ACTIVE_DURATION` |
| `update_playing()` | `main.js:562` | Extend collection check to `p2_player` (if exists) |
| `update_playing()` | `main.js:504-519` | Add P2 item use handler for `input2.pressed(BTN_X)` |
| `render.item_box()` | `render.js:456` | Replace `Date.now()` with `frame` parameter |
| `draw_game()` | `main.js:841-844` | Pass P2 item to HUD when in 2P mode |

### Item Effect Activation (main.js:446-452 → expanded)

```js
if (input1.pressed(BTN_X)) {
  const item_type = player.use_item(human_player);
  if (item_type === ITEM_TYPES.TIME_SLOW) {
    time_slow_active = true;
    time_slow_timer = ITEM_ACTIVE_DURATION;
  } else if (item_type === ITEM_TYPES.BIG_RACKET) {
    human_player.hit_range_mult = 2.0;
  } else if (item_type === ITEM_TYPES.SHIELD) {
    human_player.shield_active = true;
  } else if (item_type === ITEM_TYPES.MULTI_BALL) {
    second_ball = ball.new();
    second_ball.x = human_player.x + (Math.random() - 0.5) * 2;
    second_ball.z = human_player.z + 1;
    second_ball.vx = (Math.random() - 0.5) * 0.2;
    second_ball.vz = -0.3;
    second_ball.state = BALL_IN_PLAY;
  }
  // FIRE: handled implicitly via fire_mult check at hit time
}
```

### P2 Item Collection (main.js:555-566)

The collection loop should check both `human_player` and `p2_player`:

```js
for (let i = items.length - 1; i >= 0; i--) {
  const item = items[i];
  item.timer -= 1;
  if (item.timer <= 0) { items.splice(i, 1); continue; }
  if (player.can_collect_item(human_player, item) && !human_player.item) {
    player.collect_item(human_player, item.type);
    items.splice(i, 1);
  } else if (p2_player && player.can_collect_item(p2_player, item) && !p2_player.item) {
    player.collect_item(p2_player, item.type);
    items.splice(i, 1);
  }
}
```

### P2 Item Use (main.js, in the 2P block ~line 504)

Add after P2 movement:

```js
if (input2.pressed(BTN_X)) {
  const item_type = player.use_item(p2_player);
  if (item_type === ITEM_TYPES.TIME_SLOW) {
    time_slow_active = true;
    time_slow_timer = ITEM_ACTIVE_DURATION;
  } else if (item_type === ITEM_TYPES.BIG_RACKET) {
    p2_player.hit_range_mult = 2.0;
  } else if (item_type === ITEM_TYPES.SHIELD) {
    p2_player.shield_active = true;
  } else if (item_type === ITEM_TYPES.MULTI_BALL) {
    second_ball = ball.new();
    second_ball.x = p2_player.x + (Math.random() - 0.5) * 2;
    second_ball.z = p2_player.z - 1;
    second_ball.vx = (Math.random() - 0.5) * 0.2;
    second_ball.vz = 0.3;
    second_ball.state = BALL_IN_PLAY;
  }
}
```

## UI/Output Changes

### Frame-based blink (render.js:456)

Pass `frame` counter instead of `Date.now()`:

```js
item_box(item, frame) {
  if (!item) return;
  const blink = Math.floor(frame / 15) % 2 === 0;
  ctx.fillStyle = blink ? '#fff' : '#aaa';
  camera.draw_char(item.x, 0.01, item.z, '?');
}
```

Update caller in `draw_game()` to pass `frame`.

### P2 Item HUD (render.js:226-230)

```js
if (opts.p2_item) {
  ctx.fillText("P2 ITEM: " + opts.p2_item + " (" + itemDescs[opts.p2_item] + ")", 2, 33);
}
```

## Module Impact

| Module | Lines | Impact |
|--------|-------|--------|
| `src/main.js` | ~446-452, ~504-520, ~555-566, ~792 | Add BIG_RACKET/SHIELD/MULTI_BALL activation; P2 collection & use; pass frame to item_box |
| `src/player.js` | 107 | Use `ITEM_ACTIVE_DURATION` constant |
| `src/render.js` | 226-230, 456 | Frame-based blink; P2 item HUD |
| `tests/fun.test.js` | ~105-184 | Add tests for all 5 item effect activations, use_item(), P2 flow |

## Verification

1. All 5 item types produce correct effects when used
2. P2 can collect and use items in 2P mode
3. Item blink uses frame timer (no `Date.now()` dependency)
4. `use_item()` uses `ITEM_ACTIVE_DURATION` constant
5. All existing tests pass
6. New tests cover all added logic
