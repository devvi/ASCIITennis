# Product Requirements: Sound Effects (音效)

**Issue:** #198

## Summary

Add ball-interaction sound effects to ASCIITennis using the Web Audio API. Different hit qualities (PERFECT, GOOD, LATE, SMASH) must produce distinct audio feedback — perfect hits should sound more "juicy" (satisfying) than late hits. The game currently has zero audio infrastructure; all feedback is visual only.

## Feature Description

The sound system should be a lightweight procedural audio engine using the Web Audio API (`OscillatorNode`, `GainNode`, `AudioContext`). No external audio files should be required — all sounds are generated at runtime via synthesized waveforms. This keeps the game dependency-free and the repo size small.

### Required Sound Events

#### 1. Ball Hit (Racket Contact)

The most important sound. Must vary significantly based on hit quality:

| Quality | Sound Characteristics |
|---------|----------------------|
| **PERFECT** | Bright, rich, "juicy" — higher pitch, longer sustain, possible harmonic layering (multiple oscillators). Should feel powerful and satisfying. |
| **GOOD** | Solid but less bright than PERFECT. Medium pitch, medium sustain. |
| **LATE** | Duller, flatter — lower pitch, shorter decay, less harmonic content. May include a slight "muffled" quality. |
| **SMASH** | Powerful, explosive — very bright with a sharp attack, high pitch, possible white noise burst, longer resonance. Must feel impactful. |
| **Normal** | Default hit sound — plain, medium pitch, quick decay. Fallback for non-timed hits (AI hits, shield returns). |

#### 2. Ball Bounce

- Short, quick "thud"/"boing" sound when ball hits the court surface
- Low pitch, very short decay
- Slight pitch variation per bounce to avoid repetition

#### 3. Ball Net Hit

- Short, dull "thunk" when ball hits the net
- Low pitch, very quick decay
- Distinct from bounce sound

#### 4. Point Scored

- Ascending short jingle or "ding" when a point is won
- Could vary slightly between player scores and opponent scores

#### 5. Serve

- Short rising tone during serve toss/charge to indicate charging energy
- "Ping" at serve release moment

#### 6. Menu Navigation (Stretch)

- Short UI feedback sounds for menu item selection and confirmation
- Subtle — should not be annoying

### Implementation Approach

**Web Audio API** is the recommended approach:

- Create a `SoundManager` module (`src/sound.js`) that encapsulates the `AudioContext`
- Expose functions like `play_hit(quality)`, `play_bounce()`, `play_net()`, `play_point()`, `play_serve()`
- Each function creates short-lived oscillator/gain nodes, configures them with quality-specific parameters, and auto-disposes them after playback
- Use `OscillatorNode` with different waveforms (sine, square, sawtooth, triangle) and `GainNode` for attack/decay envelopes
- For PERFECT/SMASH "juiciness", layer 2-3 oscillators with slight detuning for richness
- AudioContext should be created on first user interaction (to comply with browser autoplay policy) — lazy initialization
- All sounds should be short (< 500ms) to avoid clashing with subsequent game sounds
- Volume must be configurable (future mute toggle)

### Integration Points

| Game Event | Hook Location (main.js) | Sound to Play |
|-----------|------------------------|---------------|
| Player hits ball | Line ~499 (after `ball.hit()`) | `play_hit(timing_quality, is_smash)` with quality parameter |
| Ball bounces | `ball.update()` when ball lands (BALL_DOUBLE_BOUNCE transition) | `play_bounce()` |
| Ball hits net | Before `BALL_NET` state is set | `play_net()` |
| Point scored | `resolve_point()` / `resolve_violation_point()` | `play_point()` |
| Serve release | Serve toss reaches peak or button press | `play_serve()` |
| Menu navigation | `update_menu()` | `play_ui_select()` (stretch) |

### Sound Parameter Tuning

For synthesizing quality-specific hit sounds, use these parameter ranges:

| Parameter | PERFECT | GOOD | LATE | SMASH |
|-----------|---------|------|------|-------|
| Base frequency | 440-660 Hz | 330-440 Hz | 200-300 Hz | 550-880 Hz |
| Waveform | Triangle + sine (layered) | Triangle | Sine (dulled) | Square + noise burst |
| Detune oscillators | ±5 cents (2 oscillators) | None | None | ±10 cents (2-3 osc) |
| Attack time | 2ms | 2ms | 5ms | 1ms |
| Decay time | 300ms | 200ms | 150ms | 400ms |
| Volume (relative) | 1.0 | 0.8 | 0.5 | 1.2 |
| Harmonic content | Rich (2-3 harmonics) | Medium | Sparse (fundamental only) | Very rich + white noise |

### Acceptance Criteria

- [ ] Ball hit sound plays on every racket-ball contact
- [ ] PERFECT hit sounds distinctly different from GOOD/LATE — brighter, richer, more "juicy"
- [ ] GOOD hit sounds solid but less intense than PERFECT
- [ ] LATE hit sounds duller/flatter than GOOD
- [ ] SMASH hit sounds explosive and powerful
- [ ] Bounce sound plays when ball hits the court
- [ ] Net sound plays when ball hits the net
- [ ] Point scored sound plays on point resolution
- [ ] Serve charge/peak sound plays during serve
- [ ] AudioContext is created lazily on first user interaction (no autoplay violations)
- [ ] All sounds are short (< 500ms) and do not overlap/cacophony
- [ ] No external audio files required (all procedural generation)
- [ ] Volume levels are reasonable — sounds enhance but do not dominate gameplay

### Non-Goals

- No music tracks or background music
- No speech/voice sounds
- No ambient court noise (crowd, wind, etc.)
- No settings UI for volume/audio in this phase (can be added later)
- No spatial audio (3D positional sound) — all sounds are mono
- No asset loading — all sounds are procedural

## Related Modules

- `src/sound.js` (new) — SoundManager module with Web Audio API synthesis
- `src/main.js` — integrate sound calls at hit, bounce, net, point, serve events
- `src/constants.js` — add optional constants for sound parameters (frequencies, durations)
- `src/ball.js` — may need to expose bounce/net detection for sound triggers
- `tests/sound.test.js` (new) — unit tests for sound module
- `tests/main.test.js` — integration tests verifying sound calls on game events
