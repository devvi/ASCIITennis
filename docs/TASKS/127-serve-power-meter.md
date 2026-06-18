# Tasks: Serve Power Meter (parent #127)

## Related modules
`src/constants.js`, `src/main.js`, `src/ball.js`, `src/render.js`, `src/input.js`, `src/ai.js`

## Impact summary
- **constants.js** — add `SERVE_CHARGE_RATE`, `SERVE_SPEED_MIN`, `SERVE_CHARGE_DURATION` constants
- **main.js** — add `serve_charge` state variable, integrate charge into `update_serving()` and `do_serve()`
- **ball.js** — `serve()` accepts `power` parameter (0-1) to scale speed
- **render.js** — `render.serve_meter(charge)` draws the power bar
- **ai.js** — AI selects charge level on serve
- **input.js** — `held()` tracking for charge duration (already works, no changes needed)

---

## Phases

### Phase 1: Tests
- [ ] Test `ball.serve()` accepts power param and scales speed
- [ ] Test power=0 → SERVE_SPEED_MIN
- [ ] Test power=1 → SERVE_SPEED_MAX
- [ ] Test power=0.5 → midpoint speed
- [ ] Test `render.serve_meter(0)` draws empty bar
- [ ] Test `render.serve_meter(1)` draws full bar
- [ ] Test `render.serve_meter(0.5)` draws half bar with correct color
- [ ] Test `update_serving()` starts charge on first press
- [ ] Test charge increases each frame
- [ ] Test charge caps at 100%
- [ ] Test release fires serve at current charge
- [ ] Test AI serve charge in hard range (80-100%)
- [ ] Test AI serve charge in easy range (30-60%)
- [ ] Test charge resets to 0 on new serve

### Phase 2: Data structures
- [ ] Add `SERVE_SPEED_MIN = 0.25` to constants
- [ ] Add `SERVE_CHARGE_DURATION = 45` to constants (frames to full charge)
- [ ] Add `serve_charge` variable to main.js state vars

### Phase 3: Core logic
- [ ] `ball.serve()` accepts power param, interpolates speed
- [ ] `update_serving()` tracks charge on held button
- [ ] Charge increments each frame, caps at 100%
- [ ] Release button fires serve at current charge
- [ ] Auto-fire at max charge if held too long
- [ ] AI `update()` returns charge level
- [ ] Pass power param through `do_serve()`

### Phase 4: UI/output
- [ ] `render.serve_meter(charge)` draws horizontal bar
- [ ] Bar color changes at thresholds (green/yellow/red)
- [ ] Meter visible during serve charge only
- [ ] HUD text updated to show "Hold to charge, release to serve"
- [ ] Power bar dimensions: 40px wide, 5px tall, centered under HUD
