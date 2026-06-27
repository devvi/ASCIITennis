# Tasks: Mario Tennis GBC-style Serve & Angle Control

## Parent Issue
#100

## Plan Issue
#102

## Related Modules
- `src/input.js` — serve toss, angle input
- `src/player.js` — remove lateral movement
- `src/main.js` — serve state machine, remove fault
- `src/ball.js` — serve with angle param
- `src/constants.js` — toss height, serve timing constants
- `src/ai.js` — ensure AI serves land in
- `src/render.js` — toss visual cue (optional)

## Summary
Replace charge-bar serve with Mario Tennis GBC-style toss-and-timing serve. Remove service faults. Repurpose A/D from movement to angle control.

## Phases

### Phase 1: Tests (TDD)
- Write tests for new serve system (toss, peak detection, S serve, normal serve)
- Write tests for angle control (A/D modifies target_x)
- Write tests confirming no service faults
- Write tests for AI serve always landing in

### Phase 2: Constants & Input
- Add constants: toss peak height, S serve speed multiplier
- Modify `input.js`: add serve toss state machine; remove charge; add angle input helper

### Phase 3: Core Logic
- Modify `player.js`: remove lateral (A/D) movement for human
- Modify `main.js`: new serve flow (toss → hit timing); remove all `serve_fault` checks
- Modify `ball.js`: serve accepts angle param
- Modify `ai.js`: AI serves always in bounds

### Phase 4: UI
- Update render for serve mode (show toss; no charge bar)
- Keep existing HUD and referee display (remove FAULT messages)
