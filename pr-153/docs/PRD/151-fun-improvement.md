# Product Requirements: 趣味性提升 (Fun Improvement)

**Issue:** #151
**Feature:** Research and design fun-oriented features that leverage ASCII-art aesthetics to create unexpected, engaging gameplay moments beyond traditional tennis.

## Motivation

The current game is a faithful tennis simulation with solid mechanics (physics, AI, scoring, audience). However, the ASCII medium offers unique opportunities for expressive, low-resolution visual humor and creative gameplay that a realistic tennis game would not normally attempt. By studying fun tennis mini-games (Mario Tennis, Wii Sports Tennis, Pong, arcade tennis games) and combining those ideas with ASCII's distinctive visual style, we can create features that surprise and delight players while staying true to the text-based aesthetic.

## Research Findings

### Arcade Tennis Fun Mechanics (Reference Games)

| Game | Fun Mechanic | ASCII Applicability |
|------|-------------|---------------------|
| **Mario Tennis** | Power shots with elemental effects (fire, ice, etc.) | ASCII chars for fire `*`, ice `#`, electric `~` — cheap to render |
| **Wii Sports Tennis** | Mii characters, exaggerated animations, simple controls | ASCII player figures already have `O` / `_` / `. :` — can add expressions, accessories |
| **Pong** | Minimalist, fast, pure focus | ASCII is naturally minimalist — lean into the retro terminal feel with CRT scanlines, boot-up sequences |
| **Windjammers** | Explosive disc throws with screen shake, super moves | Screen shake via camera offset, super move ASCII art overlay |
| **Dodgeball** | Multiple balls, elimination, chaos | Multi-ball mode, player elimination (like spectator kills but for players) |
| **Rhythm games** | Hit timing matters, combo meter | Add timing feedback: "PERFECT" / "GREAT" / "MISS" ASCII text popups |
| **Bomberman** | Power-up pickups, arena modification | Power-up boxes on court with ASCII icons `?` `B` `S` etc. |
| **Towerfall** | Screen-filling action, wall-jumps, projectiles | Verticality, wall interactions, projectile tennis |

### ASCII-Specific Opportunities

1. **Low-resolution humor** — ASCII's coarse grid (240×136) means small details read as abstract shapes. Dead audience `X`, cheer `\o/` — these work *because* they're crude. Lean into this: exaggerated reactions, comically large text, screen-filling ASCII art effects.

2. **Terminal / retro aesthetic** — The black background, colored characters, and fixed-width font evoke old terminals, BBS games, and early roguelikes. Features like "boot sequence" intros, CRT scanline overlays, and typewriter-text effects fit naturally.

3. **No physics budget** — Since rendering is character-grid-based, we can add "particle effects" (just flying characters) at near-zero cost. Sparks `*`, sweat drops `'`, exclamation marks `!` — all just `printChar` calls.

4. **Text-as-gameplay** — The referee already shows "OUT!" / "NET!" text. Extend this: scrolling commentary, player trash-talk in ASCII, dramatic text animations.

## Proposed Fun Features (Priority-Ordered)

### P1: Rally Combo & Feedback System
**Concept:** Build audience excitement and visual feedback around rally length. The longer a rally goes, the more intense the visual presentation becomes.

- **Rally counter** — Display current rally length prominently on HUD (e.g. `RALLY: 12`)
- **Audience intensity** — Cheer level and frequency scale with rally length (longer rally = louder/longer cheers)
- **Screen effects at milestones** — At rally lengths 5, 10, 15, 20+: screen shake, flashing border, ASCII spark effects
- **Shot timing feedback** — "PERFECT" / "GOOD" / "LATE" popup text based on swing timing relative to ball arrival
- **Combo multiplier** — Consecutive clean hits build a multiplier that increases ball speed slightly on each return

### P2: Power-ups & Court Items
**Concept:** Random items appear on court that players can run over to gain temporary advantages, similar to Mario Kart item boxes.

- **Item spawn** — A `?` box appears at a random court position every ~10 seconds
- **Run over to collect** — Player passing near the item collects it
- **Item types:**
  - `F` (Fire Ball) — Next shot is faster with fire ASCII trail `*~*~*~`
  - `B` (Big Racket) — Next 2 hits have 2x hit range
  - `S` (Shield) — Auto-returns the next ball within range
  - `M` (Multi-ball) — Spawns a second ball in play for 5 seconds
  - `T` (Time Slow) — Slows game speed for 3 seconds (everything moves at 0.5x)
- **Item indicator** — Show collected item on HUD next to player name
- **Use item** — Press X (or keyboard E) to activate stored item

### P3: ASCII Particle Effects & Screen Juice
**Concept:** Add visual flair using only ASCII characters to make hits, serves, and points feel more impactful.

- **Hit impact** — On racket contact, spray `*` `+` `'` characters outward from hit point for 5 frames
- **Ball trail** — Ball leaves a fading trail of `o` characters at its previous positions (3-frame trail)
- **Screen shake** — On powerful hits / kills, offset all rendering by ±2px for 4 frames
- **Speed lines** — Ball traveling fast (>0.4 speed) draws `=` characters behind it as speed lines
- **Crowd wave** — During long rallies, audience characters sway left/right (`\o/` → `|o|` → `/o\`)
- **"KILL" flash** — Existing kill flash gets particle burst accompaniment
- **Score flash** — On game/set/match point, score text pulses/flashes

### P4: Special Game Modes
**Concept:** Accessible from the menu alongside "1P" and "2P", offering dramatically different play styles.

- **Zombie Tennis** — Ball that misses returns as a zombie `Z` that slowly chases the player; must hit it again to destroy it. Multiple zombie balls accumulate.
- **Target Practice** — Targets appear on opponent's court side; hit them for bonus points (like a batting cage)
- **Rally Challenge** — No scoring, just survive as long as possible against increasingly difficult AI; track longest rally record
- **Gravity Shift** — Every 10 seconds, gravity flips or changes direction; ball physics becomes chaotic
- **Pong Mode** — Reset camera to pure 2D side view; play ASCII Pong with tennis physics

### P5: Easter Eggs & Hidden Features
**Concept:** Secret interactions that reward exploration and experimentation.

- **Net interaction** — Press a key near the net to climb over it (character shows climbing pose)
- **Ball-on-head bounce** — If ball lands perfectly on player's head (top of `O`), it bounces straight up — shows `!` above head
- **All-dead audience message** — After killing all 96 spectators, a "game complete" ASCII art screen appears
- **Cheat codes** — Input specific key sequences at the menu to unlock special modes (e.g. `↑↑↓↓←→←→BA` for super mode)
- **Referee reactions** — Referee shows different ASCII faces depending on game state: `o_O` on close calls, `>_<` on faults, `^_^` on game point
- **Midnight mode** — If match exceeds a certain duration, the venue lights turn off and only character-colored pixels remain visible (inverted / reduced palette)

## Acceptance Criteria

- All new features preserve the existing ASCII rendering aesthetic (no bitmap effects, no images)
- No feature breaks existing gameplay modes (standard 1P, 2P matches remain functional)
- New features are toggle-able or mode-specific (players can opt in/out)
- Frame rate remains at 60fps — all effects are computationally cheap (character prints only)
- Features are implemented via new constants/game states rather than modifying core physics
- Rally combo system does not alter ball physics in standard mode (only in specific modes)
- Power-up items do not spawn outside court bounds
- Particle effects do not obscure critical gameplay info (ball position, player position, score)
- Easter eggs are discoverable naturally but do not interfere with normal play
- New game modes are selectable from the START menu alongside existing 1P/2P options
