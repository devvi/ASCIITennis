# Product Requirements: CRT Visual Effect

**Issue:** #192

## Summary

Add a global CRT (cathode-ray tube) television effect overlay to give the entire game screen a retro, old-school monitor appearance. This enhances the nostalgic ASCII aesthetic of ASCIITennis and is purely a visual enhancement with zero gameplay impact.

---

## Feature Description

The CRT effect simulates the visual characteristics of a classic CRT monitor, applied globally over all game states (menus, gameplay, special modes, etc.). The effect should be subtle enough to not impair readability/playability but present enough to evoke a retro feel.

### Required Effects

#### 1. Scanlines
- Horizontal alternating dark lines across the entire screen
- Mimics the visible scan lines of CRT monitors
- Semi-transparent (opacity ~15-25%) so game content is clearly visible behind them
- Static (not scrolling) — fixed overlay aligned to pixel grid
- Implemented via CSS `repeating-linear-gradient`

#### 2. Vignette
- Darkening at the corners of the screen
- Gradual radial gradient from center (transparent) to edges (semi-transparent black)
- Helps simulate the curved edges of CRT screens where brightness falls off
- Implemented via CSS `radial-gradient`

### Stretch Effects (Optional)

#### 3. Screen Curvature
- Barrel distortion applied via CSS `perspective` transform
- Subtle inward curve at screen edges

#### 4. Chromatic Aberration
- Slight RGB channel separation at screen edges
- Simulates imperfect electron gun convergence on CRT monitors
- Should be very subtle (< 1px offset)

#### 5. Phosphor Glow
- Slight glow effect around bright characters (white, yellow)
- Simulates CRT phosphor excitation

### Implementation Approach: CSS Post-Processing

Use CSS overlay `div` on top of the canvas:
- **Scanlines** via `repeating-linear-gradient`
- **Vignette** via `radial-gradient`
- **Curvature** via CSS `transform: perspective()`
- **Chromatic aberration** via CSS `filter: drop-shadow()`
- **Phosphor glow** via CSS `filter: drop-shadow()` or `text-shadow`

Zero performance impact on the game render loop. Simple to implement and maintain.

### Acceptance Criteria

- [ ] Scanlines overlay visible over the entire game screen
- [ ] Vignette effect darkens corners of the screen
- [ ] Effects are subtle — gameplay and text remain clearly readable
- [ ] Effects apply to all game states (menu, playing, serving, special modes, etc.)
- [ ] Effects do not interfere with canvas input (mouse/keyboard events pass through via `pointer-events: none`)
- [ ] Overlay aligns correctly with canvas at various window sizes
- [ ] No measurable performance degradation (fps remains stable)
- [ ] (Stretch) Curvature effect visible at screen edges
- [ ] (Stretch) Chromatic aberration visible at screen edges
- [ ] (Stretch) Phosphor glow on bright characters

### Non-Goals
- No changes to the actual game rendering logic (`src/render.js`, `src/main.js`)
- No new game states or gameplay mechanics
- No configuration UI in this phase (toggle can be added later)

## Related Modules
- `index.html` — add overlay div and CSS link
- `src/styles.css` (new) — CRT effect CSS classes
