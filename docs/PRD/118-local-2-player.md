# Local 2-Player Mode

## Summary

Add a local 2-player mode where two humans can play against each other on the same keyboard. The game currently supports single-player vs AI; this adds a party-game mode with minimal infrastructure changes since rendering, physics, scoring, and court systems already exist.

## Motivation

- Turns the game into a true head-to-head experience
- Reuses all existing physics, court, ball, scoring, and rendering systems
- Only requires: input split, menu toggle, second player entity, and removing AI dependency in 2P mode

## Feature List

1. **Game Mode Selection** — title screen lets user choose 1-Player (vs AI) or 2-Player (local)
2. **Player 1 Controls** — WASD for movement, Space for shot action, A/D for aim angle (unchanged)
3. **Player 2 Controls** — Arrow keys for movement, Enter for shot action, Left/Right for aim angle
4. **Dual Input Module** — separate key-to-button state arrays for P1 and P2, no cross-talk
5. **Second Player Entity** — independent paddle on the far side of the net (z > COURT_LENGTH/2)
6. **P2 Side Clamping** — P2 movement clamped to `[COURT_LENGTH/2 + 0.5, COURT_LENGTH - 0.5]`
7. **Rendering** — P2 rendered with distinct color (green `#0f0`), racket on right side
8. **Scoring Display** — HUD shows "P1" / "P2" instead of "P" / "A" in 2P mode
9. **Serve Logic** — both players can serve; server alternates each game (already works via `server = 1 - server`)
10. **Game Over** — displays "Player 1" or "Player 2" as winner

## Impacts

| Module | Impact |
|--------|--------|
| `src/constants.js` | Add `GAME_MODE_1P`, `GAME_MODE_2P` constants |
| `src/input.js` | Refactor to dual input state arrays + P2 key map; add P2 query functions |
| `src/main.js` | Add `game_mode` global; branch logic for 1P vs 2P in menu, serving, playing, HUD, game-over |
| `src/player.js` | Add `side` property (0=near, 1=far); parameterize z clamp in `move()` |
| `src/render.js` | Change player rendering to use `side` instead of `is_ai` for color/racket; HUD labels |
| `src/ai.js` | No changes — AI module simply not invoked in 2P mode |
| `tests/input.test.js` | Add tests for P2 key map, P2 state queries, no cross-talk |
| `tests/player.test.js` | Add tests for far-side clamping |
| `tests/main.test.js` | Add tests for 2P init, serving flow, rendering labels |
| `tests/render.test.js` | Add tests for P2 color, P2 racket side |

## Acceptance Criteria

- [ ] Menu offers mode selection (1-Player / 2-Player) before difficulty in 1P mode
- [ ] In 2P mode, difficulty selection is skipped
- [ ] P2 paddle rendered on far side with green color, controlled by arrow keys
- [ ] P1 paddle rendered on near side with cyan color, controlled by WASD
- [ ] Both players can move independently without cross-talk
- [ ] Both players can serve (toss + swing) using their respective serve keys
- [ ] Both players can hit all shot types (flat, topspin, slice, lob)
- [ ] Scoring HUD shows "P1" / "P2" in 2P mode, "P" / "A" in 1P mode
- [ ] Game over displays correct winner name
- [ ] All 203 existing tests continue to pass
