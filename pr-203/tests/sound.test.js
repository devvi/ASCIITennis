import { describe, it, expect, vi, beforeEach } from 'vitest';

function makeMockAudioContext() {
  const osc = {
    type: 'sine',
    frequency: { value: 440 },
    detune: { value: 0 },
    start: vi.fn(),
    stop: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const gain = {
    gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const ctx = {
    currentTime: 1.0,
    state: 'running',
    resume: vi.fn(() => Promise.resolve()),
    createOscillator: vi.fn(() => {
      const o = Object.create(osc);
      o.frequency = { value: 440 };
      o.detune = { value: 0 };
      o.type = 'sine';
      o.start = vi.fn();
      o.stop = vi.fn();
      o.connect = vi.fn();
      o.disconnect = vi.fn();
      o.buffer = null;
      return o;
    }),
    createGain: vi.fn(() => {
      const g = Object.create(gain);
      g.gain = { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
      g.connect = vi.fn();
      g.disconnect = vi.fn();
      return g;
    }),
    createBuffer: vi.fn(() => ({
      getChannelData: vi.fn(() => new Float32Array(100)),
      sampleRate: 44100,
      length: 100,
      numberOfChannels: 1,
    })),
    createBufferSource: vi.fn(() => {
      const src = {
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      return src;
    }),
    destination: {},
    sampleRate: 44100,
  };
  return ctx;
}

describe('sound module', () => {
  let mockCtx;
  let sound;

  beforeEach(async () => {
    mockCtx = makeMockAudioContext();
    globalThis.AudioContext = vi.fn(() => mockCtx);
    vi.resetModules();
    sound = await import('../src/sound.js');
  });

  it('exports expected play functions', () => {
    expect(sound.play_hit).toBeDefined();
    expect(sound.play_bounce).toBeDefined();
    expect(sound.play_net).toBeDefined();
    expect(sound.play_point_scored).toBeDefined();
    expect(sound.play_serve_release).toBeDefined();
  });

  it('creates AudioContext lazily on first play call', () => {
    expect(globalThis.AudioContext).not.toHaveBeenCalled();
    sound.play_bounce();
    expect(globalThis.AudioContext).toHaveBeenCalledTimes(1);
  });

  it('reuses AudioContext on subsequent calls', () => {
    sound.play_bounce();
    sound.play_net();
    expect(globalThis.AudioContext).toHaveBeenCalledTimes(1);
  });

  it('resumes AudioContext if suspended', () => {
    mockCtx.state = 'suspended';
    sound.play_bounce();
    expect(mockCtx.resume).toHaveBeenCalled();
  });

  it('play_hit with PERFECT creates oscillator with triangle waveform', () => {
    sound.play_hit('PERFECT', false);
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    const oscCalls = mockCtx.createOscillator.mock.results;
    expect(oscCalls.length).toBeGreaterThanOrEqual(1);
    expect(oscCalls[0].value.type).toBe('triangle');
  });

  it('play_hit with SMASH creates oscillator with square waveform', () => {
    sound.play_hit('SMASH', false);
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    const oscCalls = mockCtx.createOscillator.mock.results;
    expect(oscCalls[0].value.type).toBe('square');
  });

  it('play_hit with LATE creates oscillator with sine waveform', () => {
    sound.play_hit('LATE', false);
    const oscCalls = mockCtx.createOscillator.mock.results;
    expect(oscCalls[0].value.type).toBe('sine');
  });

  it('play_hit with GOOD creates oscillator with triangle waveform', () => {
    sound.play_hit('GOOD', false);
    const oscCalls = mockCtx.createOscillator.mock.results;
    expect(oscCalls[0].value.type).toBe('triangle');
  });

  it('play_hit with normal quality creates oscillator with sine waveform', () => {
    sound.play_hit('normal', false);
    const oscCalls = mockCtx.createOscillator.mock.results;
    expect(oscCalls[0].value.type).toBe('sine');
  });

  it('play_hit with is_smash=true creates additional oscillator for explosion', () => {
    sound.play_hit('PERFECT', true);
    expect(mockCtx.createOscillator).toHaveBeenCalled();
  });

  it('play_serve_release creates oscillator and calls start/stop', () => {
    sound.play_serve_release();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    const oscCalls = mockCtx.createOscillator.mock.results;
    for (const result of oscCalls) {
      expect(result.value.start).toHaveBeenCalled();
      expect(result.value.stop).toHaveBeenCalled();
    }
  });

  it('play_point_scored creates multiple oscillators for ascending jingle', () => {
    sound.play_point_scored();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    const callCount = mockCtx.createOscillator.mock.calls.length;
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  it('play_bounce creates a short oscillator', () => {
    sound.play_bounce();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    const oscCalls = mockCtx.createOscillator.mock.results;
    for (const result of oscCalls) {
      expect(result.value.start).toHaveBeenCalled();
      expect(result.value.stop).toHaveBeenCalled();
    }
  });

  it('play_net creates a short low-pitched oscillator', () => {
    sound.play_net();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    const oscCalls = mockCtx.createOscillator.mock.results;
    expect(oscCalls[0].value.frequency.value).toBeLessThan(300);
  });

  it('handles missing AudioContext gracefully', () => {
    delete globalThis.AudioContext;
    expect(() => sound.play_bounce()).not.toThrow();
    expect(() => sound.play_hit('PERFECT')).not.toThrow();
    expect(() => sound.play_point_scored()).not.toThrow();
  });
});
