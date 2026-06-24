# Design: Audience & Referee Rendering Fix (观众席和裁判渲染修改)

**Issue:** #145
**Components:** `audience.js`, `render.js`

---

## 1. Architecture Overview

The fix involves two independent changes in two separate modules:

```
audience.js          render.js
  ┃                    ┃
  ┃  Fix sideline      ┃  Fix scoreboard-
  ┃  z-range to        ┃  referee overlap
  ┃  [0, COURT_LENGTH  ┃  + reposition both
  ┃  /2] (near half)   ┃  elements
  ┃                    ┃
  ┗━━━━━━━━━━━━━━━━━━━━┛
```

No new data structures or game flow changes — pure logic/rendering modifications.

---

## 2. Current State Analysis

### 2a. Sideline Spectator Distribution

**File:** `audience.js:37-38`
```js
{ rowAxis: 'x', rowStart: -halfW - STAND_MARGIN_X, rowDir: -1, seatAxis: 'z', seatStart: 0, seatEnd: COURT_LENGTH },
{ rowAxis: 'x', rowStart: halfW + STAND_MARGIN_X, rowDir: 1, seatAxis: 'z', seatStart: 0, seatEnd: COURT_LENGTH },
```

Sideline banks (indices 4-5) distribute seats along the z-axis from 0 to COURT_LENGTH (23.77m). The `power=1.8` non-linear bias only shifts distribution within `[0, COURT_LENGTH]` but:
- Spectators at `z > COURT_LENGTH/2` occlude the opponent's court area
- Even with power bias, perspective compression at far end (1.26 px/m vs 11.86 px/m near) makes far seats appear dense

**Screen-space occlusion measurement:**
- Opponent court near-side: z ≈ COURT_LENGTH/2 = 11.885m → ~1.86 px/m compression
- Sideline spectators at z > 11.885m project into the opponent court's screen area

### 2b. Referee-Scoreboard Overlap

**File:** `render.js:262-291`

Scoreboard rect: `fillRect(155, 22, 40, 18)` — covers `x ∈ [155, 195]`, `y ∈ [22, 40]`
- `'SET'` at `(160, 24)` → spans y=24..31
- `'GAM'` at `(160, 32)` → spans y=32..39

Referee anchor projection:
- refX = COURT_WIDTH/2 + 1.0 = 6.485
- refZ = COURT_LENGTH/2 = 11.885
- Anchor sy ≈ 41
- Head `@` at `(sx-3, sy-12)` ≈ `(158-3, 41-12)` = `(155, 29)` — within scoreboard rect
- Body `|` at `(sx-3, sy-5)` ≈ `(155, 36)` — within scoreboard rect
- Arms at `sy-5` ≈ y=36 — within scoreboard rect
- Legs at `sy+2` ≈ y=43 — **just below** scoreboard rect (y=40)

So the head, body, and arms all overlap with the scoreboard's "SET GAM" text area. Since `render.venue()` (draws scoreboard) is called before `render.referee()`, the white referee chars overwrite the green scoreboard text, creating garbled output.

---

## 3. Design Decisions

### Decision 1: Restrict sideline z-range to near half only

**Choice:** Set `seatEnd = COURT_LENGTH / 2` for sideline banks. Remove the `power=1.8` bias — use linear distribution within `[0, COURT_LENGTH/2]`.

**Rationale:**
- Restricting to near half eliminates opponent court occlusion entirely
- Linear distribution within the reduced range produces acceptable visual evenness because the perspective distortion over 0→11.885m is only ~4× (vs 9.45× over full court)
- Simpler than splitting into two blocks or using inverse projection
- Keeps all existing row structure, jitter, and pose mechanics unchanged

**Trade-off:** Fewer total sideline seats (~half), but still ~16 seats per row over 4 rows = 64 seats, plus 4 baseline banks (32 seats) = 96 total — matches AUDIENCE_COUNT. (MATH: 96 / 6 banks = 16 per bank × 4 rows = 16 seats/row, ~8 per sideline side per row → 8 seats over 11.885m = 1.49m spacing — comfortable.)

### Decision 2: Move scoreboard above referee anchor

**Choice:** Shift the scoreboard rect upward to `y ∈ [8, 22]`, placing it above the referee's head (sy-18 ≈ y=23). Keep "SET" at `(160, 10)` and "GAM" at `(160, 18)`.

**Rationale:**
- Avoids moving referee (which is tied to court center, important for spatial awareness)
- Top-right corner has empty space above existing scoreboard position
- No overlap with referee or any other UI elements
- "SET" and "GAM" remain readable in the same font/color

### Decision 3: Keep screen-space referee rendering (already in place from #139)

The current referee in `render.js:280-286` already uses screen-space offsets from a projected anchor point — no change needed to the referee rendering code itself.

---

## 4. Module Design

### 4a. `audience.js` — Sideline z-range restriction

**Change in `generate_positions()`:**

```js
// Before (line 37-38):
{ rowAxis: 'x', rowStart: -halfW - STAND_MARGIN_X, rowDir: -1, seatAxis: 'z', seatStart: 0, seatEnd: COURT_LENGTH },
{ rowAxis: 'x', rowStart: halfW + STAND_MARGIN_X, rowDir: 1, seatAxis: 'z', seatStart: 0, seatEnd: COURT_LENGTH },

// After:
{ rowAxis: 'x', rowStart: -halfW - STAND_MARGIN_X, rowDir: -1, seatAxis: 'z', seatStart: 0, seatEnd: COURT_LENGTH / 2 },
{ rowAxis: 'x', rowStart: halfW + STAND_MARGIN_X, rowDir: 1, seatAxis: 'z', seatStart: 0, seatEnd: COURT_LENGTH / 2 },
```

**Remove power function for sideline banks:**

```js
// Before (lines 53-56):
if (isSideline) {
  const power = 1.8;
  const tAdj = Math.pow(t, power);
  seatPos = bank.seatStart + tAdj * (bank.seatEnd - bank.seatStart);
} else {
  seatPos = bank.seatStart + t * (bank.seatEnd - bank.seatStart);
}

// After — linear distribution for all banks:
seatPos = bank.seatStart + t * (bank.seatEnd - bank.seatStart);
```

**Impact:** Sideline spectators now sit only in the near half (player-side) of the court, from `z=0` to `z=COURT_LENGTH/2`. The opponent's court area (`z > COURT_LENGTH/2`) remains spectator-free along the sidelines.

### 4b. `render.js` — Scoreboard repositioning

**Change in `venue()` — scoreboard position:**

```js
// Before (lines 262-266):
ctx.fillStyle = '#222';
ctx.fillRect(155, 22, 40, 18);
ctx.fillStyle = '#0f0';
ctx.fillText('SET', 160, 24);
ctx.fillText('GAM', 160, 32);

// After:
ctx.fillStyle = '#222';
ctx.fillRect(155, 8, 40, 18);
ctx.fillStyle = '#0f0';
ctx.fillText('SET', 160, 10);
ctx.fillText('GAM', 160, 18);
```

**No changes to `referee()` —** the existing screen-space rendering is already correct. The overlap was caused by the scoreboard's position, not the referee's.

---

## 5. Verification

### Visual verification criteria
1. **Sideline spectators**: No spectator character visible in the opponent's court area (`z > COURT_LENGTH/2`) along sidelines
2. **Spectator distribution**: Evenly spread on screen — no large gaps or clumps
3. **Scoreboard**: "SET" and "GAM" text displayed in green at top-right, not overlapping any game elements
4. **Referee Figure**: `@`, `|`, `/ \`, `/ \` clearly visible below the scoreboard, no garbled text
5. **Violation messages**: `OUT!`, `NET!`, `DOUBLE BOUNCE!` still display correctly during replay at `(140, 20)` — not affected by scoreboard move

### No-regression checks
- Baseline bank spectators unchanged (they span x only at fixed z)
- Spectator cheer, death pose, hit-detection mechanics unchanged
- Player, ball, net, court rendering unchanged
- HUD (score display, kill flash) unchanged
- Menu and game_over screens unchanged
- Serve meter unchanged
