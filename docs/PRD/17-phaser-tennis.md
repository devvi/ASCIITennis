# Issue 17 — Phaser 3D Tennis Game (Pico-8 Style)

## Motivation

Current ASCII-tennis is a monochrome text-based tennis simulation. Issue #17 mandates a complete rewrite: migrate to Phaser framework, add simple 3D visuals with Pico-8 aesthetics, mobile touch support, and a narrative-driven story mode.

## Features

### Core Gameplay
- Simple 3D tennis match played from a fixed/top-down isometric perspective (Pico-8 style faux-3D)
- Single-player vs AI opponents
- Serve, rally, and point resolution mechanics
- Tennis scoring system (15, 30, 40, deuce, advantage, game, set, match)

### Pico-8 Aesthetic
- Low resolution (e.g. 128×128 or 240×136 canvas with nearest-neighbor scaling)
- 16-color Pico-8 palette
- Pixel-art style sprites for players, court, ball, UI elements
- Minimalist chiptune-style sound effects (Web Audio or Phaser sound)

### Mobile Touch Controls
- Touch/swipe to move player
- Tap/hold for shot types
- Virtual buttons or gesture-based controls
- Works on phone and tablet viewports

### Story Mode — "Tennis School Showdown"
- Protagonist is a student at a tennis academy
- Academy administration has decided to expel the protagonist
- Only way to stay: defeat the three "Tennis Bullies" (学校霸王) in match play
- Each bully has increasing difficulty:
  - **Bully 1** — Easy: basic AI, slow, predictable shots
  - **Bully 2** — Medium: faster, mixes shot types
  - **Bully 3** — Hard: aggressive, accurate, uses all shot types
- Defeating all three → protagonist earns right to stay → victory sequence
- Losing any match → game over → option to retry

### Additional Features
- Simple menu system: title screen → opponent select → match → result
- Match result screen with story dialogue
- Sound effects for hits, points, wins/losses
- Responsive layout for desktop and mobile

## Acceptance Criteria

- [ ] Game is built on Phaser framework (Phaser 3.x CE or Phaser 3)
- [ ] Game loads and runs in modern web browsers (Chrome, Firefox, Safari mobile)
- [ ] 3D tennis court rendered in Pico-8 pixel-art style (low-res, 16-color palette)
- [ ] Player moves on court via keyboard (desktop) and touch (mobile)
- [ ] Player can serve and hit ball with different shot types
- [ ] AI opponent plays full points with configurable difficulty (3 levels)
- [ ] Standard tennis scoring works correctly
- [ ] Story mode: 3 bully opponents with increasing difficulty
- [ ] Win/lose conditions: defeat all 3 = victory; lose any match = game over
- [ ] Mobile touch controls function without keyboard
- [ ] Sound effects play for key actions
- [ ] Menu screens (title, opponent select, results) are functional
- [ ] Game runs at stable frame rate (target 60fps on desktop, 30fps on mobile)
