# Task Breakdown: Sound Effects (音效)

**Issue:** #198
**Related modules:** `src/sound.js` (new), `src/main.js`, `src/constants.js`, `src/ball.js`
**PLAN_ISSUE:** TBD (to be set by plan phase)

## Research Summary

### Current State

ASCIITennis has zero audio infrastructure. All game feedback is visual (particles, screen shake, timing feedback text, trails, crowd animation). The game is a pure Canvas 2D application using ES modules with no dependencies.

### Audio Technology Selection

**Web Audio API** is the only viable approach for procedural audio in the browser without external files. It is supported by all modern browsers and requires zero dependencies or asset loading.

| Approach | Pros | Cons |
|----------|------|------|
| **Web Audio API** (OscillatorNode) | No files needed, tiny code, full control | Procedural sounds may not sound as "realistic" as samples |
| **Audio elements** (`<audio>`) | Can use real recorded sounds | Requires asset files, increases repo size, needs loading |
| **Howler.js / Tone.js** | Higher-level API | Adds dependency, increases bundle size, unnecessary for simple SFX |

**Recommended: Web Audio API procedural synthesis** — the retro ASCII aesthetic pairs naturally with chiptune-style synthesized sound effects. The game already has a retro feel, and synthesized sounds fit the aesthetic perfectly.

### Event Detection Points

Key locations in `main.js` where sound hooks are needed:

1. **Ball hit** (player) — line ~478-499: `player.swing_with_timing()` returns quality string (`'PERFECT'`, `'GOOD'`, `'LATE'`, `'normal'`). Smash detected at line ~486-488.
2. **Ball hit** (AI/P2) — lines ~583-584 and ~571-576: No timing quality available for non-human hits. Use a default hit sound.
3. **Ball bounce** — `ball.update()` in `ball.js` line ~65-75: When ball contacts ground and `ball.y < BALL_RADIUS`, the bounce happens. Currently sets `state = BALL_DOUBLE_BOUNCE` on second bounce.
4. **Ball net hit** — `court.hits_net()` called in `ball.update()` — set state to `BALL_NET`.
5. **Point scored** — `resolve_point()` and `resolve_violation_point()` functions in `main.js` (lines ~660-750).
6. **Serve** — `update_serving()` function performs the serve toss and charge, releases ball on button press or timer.
7. **Menu** — `update_menu()` handles keyboard navigation.

### Integration Strategy

The SoundManager should be a singleton module that:
1. Lazily creates `AudioContext` on first `play*()` call (browser autoplay compliance)
2. Exports individual `play_*` functions that create short-lived oscillator/gain graphs
3. Handles AudioContext state (resume if suspended)
4. Each sound creates its nodes, schedules start/stop, and lets them auto-garbage-collect after `stop()`

### Bounce Detection Detail

In `ball.update()`, bounce occurs at:
```javascript
if (ball.y < BALL_RADIUS) {
  ball.y = BALL_RADIUS;
  ball.vy = Math.abs(ball.vy) * BOUNCE_FACTOR;
  // ... bounce logic
}
```
A sound hook should emit `play_bounce()` here, but only when the ball actually contacts from above (i.e., `ball.vy < 0` before the bounce). A bounce flag `ball.just_bounced` can be set for one frame so `main.js` can trigger the sound.

## Plan

### Phase 1: Tests (TDD)
- [ ] Create `tests/sound.test.js` with test stubs
- [ ] Test `play_hit(quality)` creates correct oscillator parameters per quality level
- [ ] Test `play_bounce()` triggers correctly
- [ ] Test `play_net()` triggers correctly
- [ ] Test `play_point()` triggers correctly
- [ ] Test lazy AudioContext creation (no crash before first interaction)
- [ ] Test that all `play_*` functions handle AudioContext not available gracefully
- [ ] Test main.js integration (verify sound functions called on correct game events)
- [ ] Mock AudioContext/OscillatorNode/GainNode for unit tests

### Phase 2: Data structures
- [ ] Define `src/sound.js` module structure with SoundManager object
- [ ] Define quality-specific sound parameter tables (frequency, waveform, duration, volume per PERFECT/GOOD/LATE/SMASH/normal)
- [ ] Add any necessary constants to `src/constants.js`

### Phase 3: Core logic (Sound synthesis)
- [ ] Implement lazy AudioContext creation with autoplay policy handling
- [ ] Implement `play_hit(quality, is_smash)` — synthesize hit sound with quality-parameterized oscillator
- [ ] Implement `play_bounce()` — short low-pitched thud
- [ ] Implement `play_net()` — short dull thunk
- [ ] Implement `play_point_scored()` — ascending ding/jingle
- [ ] Implement `play_serve_release()` — serve ping
- [ ] Implement `play_serve_charge()` — rising tone during serve charge (stretch)
- [ ] Implement `play_ui_select()` — menu navigation sound (stretch)

### Phase 4: Integration
- [ ] Hook ball hit sound in `main.js` at player hit point (with timing quality parameter)
- [ ] Hook ball hit sound for AI/P2 hits (normal/default quality)
- [ ] Hook bounce sound in `main.js` or `ball.js` ball ground contact
- [ ] Hook net hit sound in `main.js` or `ball.js`
- [ ] Hook point scored sound in `resolve_point()` / `resolve_violation_point()`
- [ ] Hook serve release sound in `update_serving()` or `setup_serve()`
- [ ] Verify all sounds play correctly during actual gameplay
- [ ] Verify no sound plays during STATE_MENU before game starts (except UI sounds)

### Phase 5: Polish
- [ ] Tune PERFECT sound to be distinctly "juicy" (harmonic layering, longer sustain)
- [ ] Tune SMASH sound to be explosive (white noise burst, higher volume)
- [ ] Tune LATE sound to be noticeably duller
- [ ] Ensure volume balance between different sound types
- [ ] Verify performance — no dropped frames during sound synthesis
- [ ] Verify browser compatibility (Chrome, Firefox, Safari)

## Plan Issue Task Lists

### Phase 1: Tests
- [ ] Create `tests/sound.test.js` with mocked Web Audio API
- [ ] Test quality-specific hit sound parameter generation
- [ ] Test bounce/net/point/serve sound triggers
- [ ] Test lazy AudioContext initialization
- [ ] Test graceful handling of missing AudioContext
- [ ] Test main.js integration

### Phase 2: Data structures
- [ ] Create `src/sound.js` module skeleton
- [ ] Define quality-specific parameter tables
- [ ] Add any needed constants

### Phase 3: Core logic
- [ ] Implement lazy AudioContext creation
- [ ] Implement `play_hit()` with quality parameterization
- [ ] Implement `play_bounce()`, `play_net()`, `play_point_scored()`, `play_serve_release()`

### Phase 4: Integration
- [ ] Hook hit sound in main.js at player swing (with quality)
- [ ] Hook hit sound for AI/P2 (default quality)
- [ ] Hook bounce sound
- [ ] Hook net sound
- [ ] Hook point scored sound
- [ ] Hook serve release sound

### Phase 5: Polish
- [ ] Tune PERFECT "juicy" sound
- [ ] Tune SMASH "explosive" sound
- [ ] Tune LATE "dull" sound
- [ ] Volume balance across sounds
- [ ] Performance verification

## Design Notes

### Sound Parameter Table Shape

```javascript
const HIT_SOUND_PARAMS = {
  PERFECT: { freq: 523, waveform: 'triangle', detune: [0, 5], attack: 0.002, decay: 0.3, volume: 1.0, harmonics: 2 },
  GOOD:    { freq: 392, waveform: 'triangle', detune: [],    attack: 0.002, decay: 0.2, volume: 0.8, harmonics: 1 },
  LATE:    { freq: 261, waveform: 'sine',     detune: [],    attack: 0.005, decay: 0.15, volume: 0.5, harmonics: 0 },
  SMASH:   { freq: 659, waveform: 'square',   detune: [0, 7, -7], attack: 0.001, decay: 0.4, volume: 1.2, harmonics: 3, noise: true },
  NORMAL:  { freq: 330, waveform: 'sine',     detune: [],    attack: 0.003, decay: 0.2, volume: 0.7, harmonics: 0 },
};
```

### AudioContext Lifecycle

```
First user interaction (click/key)
  → AudioContext created (if not exists)
  → AudioContext state = "suspended"
  → await audioCtx.resume()
  → Now ready to play sounds

Each play_*() call:
  → Create OscillatorNode(s) + GainNode
  → Configure frequency, waveform, detune
  → Set up attack/decay envelope via gain.linearRampToValueAtTime()
  → oscillator.start(now)
  → oscillator.stop(now + duration)
  → Nodes auto-disconnect on stop
```

### Bounce Sound Integration

Rather than adding sound logic into `ball.js` physics (which should remain pure), expose a one-frame flag:

```javascript
// In ball.update(), after bounce:
ball.just_bounced = (ball.y < BALL_RADIUS && ball.vy < 0);

// In main.js game loop, after ball.update():
if (ball_obj.just_bounced && ball_obj.state === BALL_IN_PLAY) {
  sound.play_bounce();
}
```
