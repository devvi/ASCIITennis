# Product Requirements: Local 2-Player Mode

**Issue:** #118
**Feature:** Two human players compete on the same keyboard in a local multiplayer match.

## Motivation

The game currently supports only Player-vs-AI. Adding local 2-player mode doubles the game's replayability — friends can play head-to-head on the same machine, the same way classic ASCII games like *Worms*, *Boulder Dash*, and *International Karate* did.

## Feature List

1. **Game mode selection** — Menu adds "2 PLAYERS" option alongside existing difficulty choices ("EASY", "HARD").
2. **Dual input handlers** — Refactor `src/input.js` from singleton to factory, producing two independent input objects with separate key maps:
   - P1: `W`/`A`/`S`/`D` for movement, `Space` for hit/shots, mouse for serve toss.
   - P2: `Arrow keys` for movement, `Enter` for hit/shots, `Shift` for serve toss.
3. **Two human players** — Replace `ai_player` with `p2_player` in 2P mode. Both are `player.new(false)` (not AI), with different z-bounds:
   - P1: front half `[0.5, COURT_LENGTH/2 - 0.5]`
   - P2: back half `[COURT_LENGTH/2 + 0.5, COURT_LENGTH - 0.5]`
4. **Head-to-head gameplay** — Both players move simultaneously, both can hit the ball, ball direction reverses appropriately (P1 hits toward P2, P2 hits toward P1).
5. **Manual serve for both** — P1 serves from front (like current human), P2 serves from back (like current AI) — both using manual toss-and-swing mechanic (not auto-serve).
6. **Rendering** — P1 drawn in cyan (`#0ff`), P2 drawn in red (`#f44`). HUD labels "P1:" / "P2:" in 2P mode. Point/winner messages say "Player 1" / "Player 2".
7. **Scoring is unchanged** — Existing scoring module works generically for two players.
8. **Configurable z-bounds** — Player objects carry `z_min` / `z_max` values so `player.move()` can clamp to front or back half.

## Acceptance Criteria

- Menu offers "2 PLAYERS" selection; selecting it starts a 2-player match.
- P1 responds only to WASD + Space, P2 responds only to Arrows + Enter/Shift.
- Each player is confined to their own half of the court.
- Both players can serve (P1 from front, P2 from back, both with manual toss).
- Ball hit by P1 travels toward P2's side; ball hit by P2 travels toward P1's side.
- HUD displays "P1:" and "P2:" instead of "P:" and "A:".
- Point/won messages display "Player 1" / "Player 2".
- Returning to menu and selecting 1P mode still works exactly as before.
- All existing tests continue to pass.
