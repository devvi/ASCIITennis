# Design: Sound Effects (音效)

**Parent Issue:** #198

## Architecture Overview

A lightweight procedural audio engine using the Web Audio API. No external audio files — all sounds are synthesized at runtime via `OscillatorNode` and `GainNode`. The sound module is a singleton that lazily initializes `AudioContext` on first use (browser autoplay policy compliance).

### Module Structure

```
src/sound.js  (new module)
  ├─ AudioContext (lazy, singleton)
  ├─ HIT_SOUND_PARAMS table (quality → frequency, waveform, detune, envelope)
  ├─ play_hit(quality, is_smash)     — ball hit by player (quality: perfect/good/late/normal/smash)
  ├─ play_bounce()                    — ball bounces on court
  ├─ play_net()                       — ball hits the net
  ├─ play_point_scored()              — point won (ascending ding)
  ├─ play_serve_release()             — serve ball release
  ├─ play_serve_charge()              — rising tone during serve charge (stretch)
  └─ play_ui_select()                 — menu navigation sound (stretch)
```

### Data Flow

```
Game Event (main.js)
  → Detects event (hit, bounce, net, point, serve)
  → Calls sound.play_*(params)
  → sound.js lazily creates AudioContext (if first call)
  → Creates OscillatorNode(s) + GainNode with event-specific params
  → Schedules attack/decay envelope via gain.linearRampToValueAtTime()
  → oscillator.start(now) / oscillator.stop(now + duration)
  → Nodes auto-dispose on stop
```

### AudioContext Lifecycle

```
First play_*() call:
  → Create AudioContext (new AudioContext())
  → If state === 'suspended', call audioCtx.resume()
  → Proceed to play sound

Subsequent play_*() calls:
  → If state === 'suspended', call audioCtx.resume()
  → Create oscillator/gain nodes, play, auto-dispose
```

### Integration Points

| Module | Location | Hook |
|--------|----------|------|
| `main.js` | `update_playing()` after player swing + `ball.hit()` | `play_hit(timing_quality, is_smash)` |
| `main.js` | `update_playing()` after AI/P2 hit | `play_hit('normal')` |
| `main.js` | `ball.update()` result — check `ball.just_bounced` flag | `play_bounce()` |
| `main.js` | `ball.update()` result — check `ball.state === BALL_NET` | `play_net()` |
| `main.js` | `resolve_point()` / `resolve_violation_point()` | `play_point_scored()` |
| `main.js` | `setup_serve()` at serve ball release | `play_serve_release()` |
| `main.js` | `update_menu()` on menu select/confirm | `play_ui_select()` (stretch) |

### Sound Parameter Tables

Each hit quality maps to specific synthesis parameters for distinct audio feedback:

| Quality | Frequency | Waveform | Detune (cents) | Attack | Decay | Volume | Harmonics | Noise |
|---------|-----------|----------|----------------|--------|-------|--------|-----------|-------|
| PERFECT | 440-660 Hz | triangle + sine | ±5 (2 osc) | 2ms | 300ms | 1.0 | 2-3 | No |
| GOOD | 330-440 Hz | triangle | None | 2ms | 200ms | 0.8 | 1 | No |
| LATE | 200-300 Hz | sine (dulled) | None | 5ms | 150ms | 0.5 | 0 | No |
| SMASH | 550-880 Hz | square + noise | ±10 (2-3 osc) | 1ms | 400ms | 1.2 | 3 | Yes |
| NORMAL | 330 Hz | sine | None | 3ms | 200ms | 0.7 | 0 | No |

### Ball Bounce Flag

To keep `ball.js` physics pure (no audio logic), expose a one-frame flag:

```javascript
// In ball.update(), after bounce:
ball.just_bounced = (ball.y < BALL_RADIUS && ball.vy < 0);

// In main.js, after ball.update():
if (ball_obj.just_bounced && ball_obj.state === BALL_IN_PLAY) {
  sound.play_bounce();
}
```

### Module Impact

| Module | Type | Changes |
|--------|------|---------|
| `src/sound.js` | New | SoundManager with Web Audio API synthesis functions |
| `src/main.js` | Modify | Add sound hooks at hit, bounce, net, point, serve events |
| `src/constants.js` | Modify | Optional: add sound parameter constants |
| `src/ball.js` | Modify | Add `ball.just_bounced` flag (one line) |
| `tests/sound.test.js` | New | Unit tests for sound synthesis, lazy init, error handling |
| `tests/main.test.js` | Modify | Integration tests verifying sound calls on game events |
