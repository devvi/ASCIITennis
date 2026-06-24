# Task Breakdown: Audience & Referee Rendering Fix (观众席和裁判渲染修改)

**Issue:** #145
**Related modules:** `src/audience.js` (sideline z-range, distribution), `src/render.js` (scoreboard position, referee rendering), `src/constants.js` (any tunables), `tests/audience.test.js`, `tests/render.test.js`

## Research Summary

### Root Causes Found

| Issue | Root Cause | Proposed Fix |
|-------|-----------|-------------|
| Sideline spectators unevenly distributed — sparse near player, dense near opponent | Sideline banks span full `z ∈ [0, COURT_LENGTH]`; `power=1.8` only biases within that range but doesn't remove far-end seats; perspective compression at far end (1.26 px/m vs 11.86 px/m near) makes far seats appear dense | **Option A:** Restrict sideline z-range to `z ∈ [0, COURT_LENGTH/2]` (near half only) or `z ∈ [COURT_LENGTH/2, COURT_LENGTH]` (far half only). **Option B:** Split into two smaller sideline blocks (near and far) leaving a gap around the net area |
| Sideline spectators block/occlude opponent court | Spectators at full court length overlap with opponent's playing area in screen space | Same as above — restrict z-range so spectators don't extend past the net area into opponent territory |
| Referee shows "SET GAM" text | Scoreboard panel at `(155, 22, 40, 18)` draws green "SET" at y=24 and "GAM" at y=32; referee anchor projects to ~(158, 41) with head at ~(155, 29) and body at ~y=36 — both within the scoreboard rectangle. `render.venue()` (scoreboard) runs before `render.referee()`, so green scoreboard text bleeds into the referee area | **Option A:** Move scoreboard higher/lower so it doesn't overlap with referee. **Option B:** Render referee in fixed screen-space at a position that guarantees no overlap. **Option C:** Both. |
| Referee body parts overlap each other (<3px separation) | Body parts use small world-space offsets (±0.3–0.4m) at z=11.885; after projection, characters are <3px apart — Courier New at 7px causes character overlap | Render referee as a fixed screen-space multi-line string (e.g., `@` / `|` / `/|\` / `/ \`) with 7px line spacing, bypassing 3D projection entirely |

### Current Implementation State (post-#139)

The #139 implementation (PR #143, merged to main) added:
- Per-spectator `alive`/`dead` state, `check_hit()`, `kill()`, death pose ✅
- `BALL_FLYING_OUT` state, `STATE_KILL_CAM` game flow ✅
- `scoring.award_kill()` ✅
- Power-function (`power=1.8`) perspective compensation for sideline banks ⚠️ (approximate, incomplete)
- Referee guard removal (`state.timer <= 0` removed for figure) ⚠️ (still uses 3D-projected body parts)

**Still broken:**
- Sideline z-range still spans full `[0, COURT_LENGTH]` — far-end occlusion persists
- Power=1.8 doesn't adequately compensate for perspective — visual unevenness remains
- Referee uses 3D-projected body parts → overlaps with scoreboard "SET GAM" text
- Referee body parts have <3px separation → characters illegible

### Existing Test Coverage

| Module | Current Tests | Missing Tests |
|--------|--------------|---------------|
| audience.test.js | Init, positions, poses, sorting, cheering, hit detection, kill, death pose | Sideline z-range limits, screen-space distribution evenness |
| render.test.js | Court, net, player, ball, HUD, referee, audience, venue | Scoreboard-referee overlap detection, screen-space referee rendering |

## Plan

### Phase 1: Tests (TDD)

#### 1a. Audience sideline z-range tests
- Sideline bank spectators have z values within a restricted range (e.g., `z <= COURT_LENGTH / 2` or a similar bound)
- No sideline spectator has `z > COURT_LENGTH * 0.5` (depending on chosen strategy)
- Screen-space bounding box of sideline spectators does not overlap with opponent court lines
- Even after jitter, no spectator z value exceeds the defined range limit

#### 1b. Referee-scoreboard separation tests (render)
- Scoreboard bounding rect and referee bounding rect do not overlap on screen
- Referee figure has minimum 7px separation between consecutive body-part rows
- Referee renders visible during all game states (mock camera, check printChar calls)
- Violation message still renders during `STATE_VIOLATION_REPLAY`

### Phase 2: Data structures
- No new data structures needed — this is a logic/rendering fix only
- May add a constant for sideline z-range limit (e.g., `SIDELINE_Z_LIMIT`)

### Phase 3: Core logic

#### 3a. Restrict sideline spectator z-range
In `audience.js:generate_positions()`:
- For sideline banks (indices 4, 5), restrict seat positions to not extend past the net midpoint
- Option A: Set `seatEnd = COURT_LENGTH / 2` for sideline banks — spectators only sit in the near half
- Option B: Split each sideline bank into two sub-banks: `[0, COURT_LENGTH/3]` and `[2*COURT_LENGTH/3, COURT_LENGTH]` — near and far blocks with a gap
- Remove the `power=1.8` non-linear distribution — use linear distribution within the restricted range
  - Since the range is reduced, perspective distortion is less severe
  - Linear spacing within a shorter range produces acceptable visual evenness
- Keep all other bank parameters (row count, row spacing, jitter, row positioning) unchanged
- Keep baseline bank positions unchanged (they span x only, no z-range issue)

#### 3b. Fix referee rendering
In `render.js`:
- **Scoreboard fix:** Move the scoreboard position so it does not overlap with the referee. Options:
  - Reduce height: `ctx.fillRect(155, 22, 40, 14)` — only show "SET" at y=24
  - Move higher: `ctx.fillRect(155, 8, 40, 18)` — above referee area
  - Move right: `ctx.fillRect(180, 22, 40, 18)` — further right, clear of referee
- **Referee fix:** Render referee as a fixed screen-space ASCII figure instead of 3D-projected body parts:
  - Keep the world-space anchor projection to determine `(sx, sy)`
  - But draw the figure as a multi-line string at fixed pixel offsets from `(sx, sy)`:
    ```
    print('@', sx - 3, sy - 18);   // head
    print('|', sx - 3, sy - 11);   // body
    print('/', sx - 7, sy - 11);   // left arm
    print('\\', sx + 1, sy - 11);  // right arm
    print('/', sx - 6, sy - 4);    // left leg
    print('\\', sx + 1, sy - 4);   // right leg
    ```
  - 7px vertical separation between rows ensures no character overlap
- Both fixes combined ensure referee and scoreboard do not conflict

### Phase 4: UI / output
- Verify referee figure is clearly readable in all game states
- Verify scoreboard text remains readable
- Verify violation messages still display correctly
- Verify sideline spectators don't occlude opponent court lines

---

## Plan Issue Task Lists

**PLAN_ISSUE:** #147

### Phase 1: Tests (TDD)
- [ ] 1a. Audience sideline z-range tests — restricted range, no opponent court occlusion
- [ ] 1b. Referee-scoreboard separation tests — no overlap, 7px character separation

### Phase 2: Data structures
- [ ] 2a. (Optional) Add `SIDELINE_Z_LIMIT` constant if needed

### Phase 3: Core logic
- [ ] 3a. Restrict sideline spectator z-range in `audience.js:generate_positions()`
- [ ] 3b. Fix referee rendering — scoreboard position and screen-space figure

### Phase 4: UI / output
- [ ] 4a. Visual verification — scoreboard, referee, audience all display correctly
