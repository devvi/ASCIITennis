# Tasks: Tiebreaker Scoring (#119)

Related modules: src/scoring.js, src/constants.js, src/main.js, src/render.js

## Phase 1: Tests (TDD)

Write tests first before any implementation code.

### Scoring tests (in `tests/scoring.test.js`)
- [ ] `score.new()` has `tiebreak: false` by default
- [ ] `award_point()` enters tiebreaker when games reach 6-6
- [ ] Tiebreaker points count as 0, 1, 2... (not 15, 30, 40)
- [ ] Tiebreaker won at 7-0 (>= 7, lead >= 2)
- [ ] Tiebreaker won at 7-5
- [ ] Tiebreaker won at 8-6 (deuce tiebreak — extends past 7)
- [ ] Tiebreaker does NOT end at 6-6 (no lead of 2)
- [ ] Tiebreaker does NOT end at 7-6 (lead of 1)
- [ ] Winning tiebreaker awards the set (games become 7-6)
- [ ] After tiebreaker, new set has `tiebreak: false` (normal scoring resumes)
- [ ] `display()` shows "Tiebreak: X-Y" during tiebreaker
- [ ] `display()` shows game score as "6-6" during tiebreaker

### Serve rotation tests (in `tests/main.test.js`)
- [ ] Serve alternates every 2 points during tiebreaker (A, B/B, A/A, B/B...)
- [ ] After tiebreaker, serve rotation returns to normal (alternates each game)

### Render tests (in `tests/render.test.js`)
- [ ] `render.hud()` shows tiebreaker state when `score.tiebreak` is true

## Phase 2: Data Structures

- [ ] Add `TIEBREAK_POINTS_TO_WIN = 7` constant in `src/constants.js`
- [ ] Add `TIEBREAK_SERVE_SWITCH = 2` constant (serve changes every 2 points)
- [ ] Add `tiebreak: false` field to `score.new()` in `src/scoring.js`

## Phase 3: Core Logic

- [ ] In `award_game()`, detect `games[0] === 6 && games[1] === 6` → set `tiebreak: true` instead of continuing advantage set
- [ ] In `award_point()`, route to tiebreak scoring when `tiebreak` is true:
  - Increment raw points (0, 1, 2...)
  - Win at `>= TIEBREAK_POINTS_TO_WIN` with `>= 2` lead
  - On win: `games[winner] += 1`, reset tiebreak, call `award_set()`
- [ ] Implement tiebreaker serve rotation in `src/main.js`:
  - First server of tiebreaker determined by normal game rotation
  - Then swap every 2 points
- [ ] Ensure `award_set()` resets `tiebreak` flag for next set

## Phase 4: UI/Output

- [ ] `display()` shows "Tiebreak: X-Y" when `tiebreak` is true, with game score as "6-6"
- [ ] `render.hud()` shows tiebreaker indicator
- [ ] Point/game-over messages handle tiebreaker win text

PLAN_ISSUE=
