# Product Requirements: CRT Visual Effect (CRT视觉效果)

**Issue:** #186

## Summary

Add a global CRT (cathode-ray tube) television effect overlay to give the entire game screen a retro, old-school monitor appearance. This enhances the nostalgic ASCII aesthetic of ASCIITennis.

---

## Feature Description

The CRT effect should simulate the visual characteristics of a classic CRT monitor, applied globally over all game states (menus, gameplay, special modes, etc.). The effect should be subtle enough to not impair readability/playability but present enough to evoke a retro feel.

### Required Effects

#### 1. Scanlines
- Horizontal alternating dark lines across the entire screen
- Mimics the visible scan lines of CRT monitors
- Semi-transparent (opacity ~15-25%) so game content is clearly visible behind them
- Static (not scrolling) — fixed overlay aligned to pixel grid

#### 2. Screen Curvature (Optional / Stretch Goal)
- Barrel distortion shader applied via CSS `transform` or canvas pixel manipulation
- Subtle inward curve at screen edges
- If performance impact is significant, may be omitted or made toggleable

#### 3. Chromatic Aberration (Optional / Stretch Goal)
- Slight RGB channel separation at screen edges
- Simulates imperfect electron gun convergence on CRT monitors
- Should be very subtle (< 1px offset)

#### 4. Screen Vignette
- Darkening at the corners of the screen
- Gradual radial gradient from center (transparent) to edges (semi-transparent black)
- Helps simulate the curved edges of CRT screens where brightness falls off

#### 5. Phosphor Glow / Bloom (Optional / Stretch Goal)
- Slight glow effect around bright characters (white, yellow)
- Simulates CRT phosphor excitation

### Implementation Approaches

#### Approach A: CSS Post-Processing (Recommended for scanlines + vignette)
- Use CSS pseudo-elements or overlay `div` on top of the canvas
- Scanlines via repeating linear-gradient or SVG pattern
- Vignette via radial-gradient
- Zero performance impact on the game render loop
- Simple to implement and maintain

#### Approach B: Canvas Overlay
- Draw the effects directly onto the game canvas (or a second overlay canvas)
- Full control over per-pixel effects
- Can implement curvature, chroma aberration, bloom
- Higher complexity and potential performance impact

#### Approach C: CSS + Canvas Hybrid
- Scanlines + vignette via CSS (Approach A)
- Optional curvature/chroma via CSS `filter` or `transform`
- Best balance of simplicity and effect quality

### Acceptance Criteria

- [ ] Scanlines overlay visible over the entire game screen
- [ ] Vignette effect darkens corners of the screen
- [ ] Effects are subtle — gameplay and text remain clearly readable
- [ ] Effects apply to all game states (menu, playing, serving, special modes, etc.)
- [ ] Effects do not interfere with canvas input (mouse/keyboard events pass through)
- [ ] No measurable performance degradation (fps remains stable)
- [ ] (Stretch) Curvature effect visible at screen edges
- [ ] (Stretch) Chromatic aberration visible at screen edges
- [ ] (Stretch) Phosphor glow on bright characters

### Non-Goals
- No changes to the actual game rendering logic
- No new game states or gameplay mechanics
- No configuration UI in this phase (toggle can be added later)

## Related Modules
- `index.html` — add overlay div and CSS styles
- `src/styles.css` (new) — CRT effect CSS styles
- `src/main.js` — no changes needed (effects are purely visual overlay)
- `src/render.js` — no changes needed
- `tests/render.test.js` — no test changes needed (visual effect only)
