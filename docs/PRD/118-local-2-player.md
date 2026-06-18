# Local 2-Player Mode

## Problem
The game only supports single-player vs AI. Two players on the same keyboard cannot play against each other.

## Requirements
- Menu offers mode selection (1-Player / 2-Player) before difficulty
- P1 uses WASD + Space (same as current human controls)
- P2 uses Arrow keys + Enter (currently shared with P1 in same input array)
- P1 plays near side (z clamped to `[0.5, COURT_LENGTH/2 - 0.5]`)
- P2 plays far side (z clamped to `[COURT_LENGTH/2 + 0.5, COURT_LENGTH - 0.5]`)
- P1 rendered cyan `#0ff`, P2 rendered green `#0f0`
- HUD shows "P1" / "P2" in 2P mode instead of "P" / "A"
- No AI module involvement in 2P mode
- Scoring, physics, camera — unchanged

## Acceptance Criteria
1. Player can select "2-Player" from menu, then start match
2. P1 moves with WASD, swings with Space — restricted to near court half
3. P2 moves with Arrow keys, swings with Enter — restricted to far court half
4. Ball physics, scoring, net, court lines all work identically in both modes
5. AI is never invoked during a 2-Player match
