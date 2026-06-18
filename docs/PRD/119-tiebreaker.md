# Tiebreaker Scoring

## Problem
At 6-6 in games, the set uses advantage set rules (must lead by 2), causing matches to continue indefinitely. Real tennis caps sets at 6-6 with a tiebreaker — a first-to-7-points mini-game with 2-point lead, and special serve rotation.

## Requirements
- When games reach 6-6 in any set, a tiebreaker game begins instead of continuing advantage set
- Tiebreaker points count 1, 2, 3... (not 15, 30, 40)
- First to 7 points with a 2-point lead wins the tiebreaker (and the set 7-6)
- If tiebreaker reaches 6-6, play continues until someone leads by 2 (e.g., 8-6, 9-7)
- Serve rotation during tiebreaker: Player A serves point 1, then players alternate every 2 points (B serves 2-3, A serves 4-5, B serves 6-7...)
- Players switch ends every 6 points (purely cosmetic — no gameplay impact)
- Tiebreaker display shows games as `6-6` with points underneath (e.g., `Tiebreak: 4-3`)
- After tiebreaker, next set resets to normal scoring (no carryover)
- Deciding set (3rd set in a 2-out-of-3 match) also uses tiebreaker (no advantage set)

## Acceptance Criteria
1. At 6-6 in games, a tiebreaker starts with `tiebreak: true` flag
2. Tiebreaker points are counted 0, 1, 2, 3... not 0, 15, 30, 40
3. Tiebreaker ends when a player reaches 7+ with 2+ point lead
4. Winner gets `games[winner] += 1` and set ends with games 7-6
5. Serve alternates every 2 points during tiebreaker
6. Display shows `6-6` with `Tiebreak: X-Y` below
7. Second set resumes normal deuce/advantage scoring
8. All existing tests continue to pass
