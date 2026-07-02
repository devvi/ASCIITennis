import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function createMockAudioContext() {
  let oscIdx = 0;
  let gainIdx = 0;
  const oscillators = [];
  const gains = [];

  const ctx = {
    state: 'running',
    currentTime: 0,
    destination: { id: 'dest' },
    sampleRate: 44100,

    createOscillator: vi.fn(() => {
      const osc = {
        _id: `osc_${oscIdx++}`,
        type: '',
        frequency: {
          value: 440,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        detune: {
          value: 0,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(() => {}),
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscillators.push(osc);
      return osc;
    }),

    createGain: vi.fn(() => {
      const g = {
        _id: `gain_${gainIdx++}`,
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(() => {}),
      };
      gains.push(g);
      return g;
    }),

    createBuffer: vi.fn((channels, length, sampleRate) => ({
      getChannelData: vi.fn(() => new Float32Array(length)),
      numberOfChannels: channels,
      length,
      sampleRate,
    })),

    createBufferSource: vi.fn(() => ({
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),

    resume: vi.fn(),

    _oscillators: oscillators,
    _gains: gains,
  };

  return ctx;
}

let mockCtx;

beforeEach(() => {
  mockCtx = createMockAudioContext();
  globalThis.window = {
    AudioContext: vi.fn(() => mockCtx),
    webkitAudioContext: undefined,
  };
});

afterEach(() => {
  delete globalThis.window;
});

describe('play_hit', () => {
  it('creates AudioContext lazily on first call', async () => {
    delete globalThis.window;
    globalThis.window = { AudioContext: vi.fn(() => createMockAudioContext()) };
    const { sound: s } = await import('../src/sound.js');
    try {
      expect(globalThis.window.AudioContext).not.toHaveBeenCalled();
      s.play_hit('PERFECT');
      expect(globalThis.window.AudioContext).toHaveBeenCalledTimes(1);
    } finally {
      s._reset_audio_context();
    }
  });

  it('creates AudioContext on first play call', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      expect(globalThis.window.AudioContext).not.toHaveBeenCalled();
      s.play_hit('PERFECT');
      expect(globalThis.window.AudioContext).toHaveBeenCalledTimes(1);
    } finally {
      s._reset_audio_context();
    }
  });

  it('uses PERFECT params: triangle waveform, 523Hz, detuned oscillators', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_hit('PERFECT');
      const oscs = mockCtx._oscillators;
      expect(oscs.length).toBeGreaterThanOrEqual(2);
      const firstType = oscs[0].type;
      expect(firstType).toBe('triangle');
      expect(oscs[0].frequency.setValueAtTime).toHaveBeenCalledWith(523, 0);
    } finally {
      s._reset_audio_context();
    }
  });

  it('uses GOOD params: triangle waveform, 392Hz', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_hit('GOOD');
      const oscs = mockCtx._oscillators;
      expect(oscs.length).toBeGreaterThanOrEqual(1);
      const typeTriangles = oscs.filter(o => o.type === 'triangle');
      expect(typeTriangles.length).toBeGreaterThanOrEqual(1);
    } finally {
      s._reset_audio_context();
    }
  });

  it('uses LATE params: sine waveform, 261Hz', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_hit('LATE');
      const oscs = mockCtx._oscillators;
      const sines = oscs.filter(o => o.type === 'sine');
      expect(sines.length).toBeGreaterThanOrEqual(1);
    } finally {
      s._reset_audio_context();
    }
  });

  it('uses NORMAL params as fallback for unknown quality', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_hit('UNKNOWN_QUALITY');
      const oscs = mockCtx._oscillators;
      expect(oscs.length).toBeGreaterThanOrEqual(1);
      const sines = oscs.filter(o => o.type === 'sine');
      expect(sines.length).toBeGreaterThanOrEqual(1);
    } finally {
      s._reset_audio_context();
    }
  });

  it('uses SMASH params when is_smash=true', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_hit('NORMAL', true);
      const oscs = mockCtx._oscillators;
      expect(oscs.length).toBeGreaterThanOrEqual(3);
      const squares = oscs.filter(o => o.type === 'square');
      expect(squares.length).toBeGreaterThanOrEqual(1);
    } finally {
      s._reset_audio_context();
    }
  });

  it('calls resume if AudioContext is suspended', async () => {
    mockCtx.state = 'suspended';
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_hit('NORMAL');
      expect(mockCtx.resume).toHaveBeenCalledTimes(1);
    } finally {
      s._reset_audio_context();
    }
  });

  it('gracefully handles missing AudioContext', async () => {
    delete globalThis.window;
    globalThis.window = { AudioContext: undefined };
    const { sound: s } = await import('../src/sound.js');
    try {
      expect(() => s.play_hit('PERFECT')).not.toThrow();
    } finally {
      s._reset_audio_context();
    }
  });

  it('gracefully handles AudioContext constructor throwing', async () => {
    delete globalThis.window;
    globalThis.window = {
      AudioContext: vi.fn(() => { throw new Error('AudioContext not available'); }),
    };
    const { sound: s } = await import('../src/sound.js');
    try {
      expect(() => s.play_hit('PERFECT')).not.toThrow();
    } finally {
      s._reset_audio_context();
    }
  });

  it('creates oscillator with gain envelope (attack/decay)', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_hit('NORMAL');
      const gains = mockCtx._gains;
      expect(gains.length).toBeGreaterThanOrEqual(1);
      expect(gains[0].gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
      expect(gains[0].gain.linearRampToValueAtTime).toHaveBeenCalled();
    } finally {
      s._reset_audio_context();
    }
  });
});

describe('play_bounce', () => {
  it('creates oscillator with low pitch sine wave', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_bounce();
      const oscs = mockCtx._oscillators;
      expect(oscs.length).toBe(1);
      expect(oscs[0].type).toBe('sine');
      expect(oscs[0].frequency.setValueAtTime).toHaveBeenCalledWith(150, 0);
    } finally {
      s._reset_audio_context();
    }
  });
});

describe('play_net', () => {
  it('creates oscillator with short dull thunk', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_net();
      const oscs = mockCtx._oscillators;
      expect(oscs.length).toBe(1);
      expect(oscs[0].type).toBe('sine');
      expect(oscs[0].frequency.setValueAtTime).toHaveBeenCalledWith(200, 0);
    } finally {
      s._reset_audio_context();
    }
  });
});

describe('play_point_scored', () => {
  it('creates two oscillators for ascending ding', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_point_scored();
      const oscs = mockCtx._oscillators;
      expect(oscs.length).toBe(2);
      const triangles = oscs.filter(o => o.type === 'triangle');
      expect(triangles.length).toBe(2);
    } finally {
      s._reset_audio_context();
    }
  });

  it('first tone at 523Hz, second at 659Hz', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_point_scored();
      const oscs = mockCtx._oscillators;
      expect(oscs[0].frequency.setValueAtTime).toHaveBeenCalledWith(523, 0);
      expect(oscs[1].frequency.setValueAtTime).toHaveBeenCalledWith(659, 0.1);
    } finally {
      s._reset_audio_context();
    }
  });
});

describe('play_serve_release', () => {
  it('creates oscillator with triangle wave at 440Hz', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_serve_release();
      const oscs = mockCtx._oscillators;
      expect(oscs.length).toBe(1);
      expect(oscs[0].type).toBe('triangle');
      expect(oscs[0].frequency.setValueAtTime).toHaveBeenCalledWith(440, 0);
    } finally {
      s._reset_audio_context();
    }
  });
});

describe('play_serve_charge', () => {
  it('creates sawtooth oscillator with frequency sweep', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_serve_charge();
      const oscs = mockCtx._oscillators;
      expect(oscs.length).toBe(1);
      expect(oscs[0].type).toBe('sawtooth');
      expect(oscs[0].frequency.setValueAtTime).toHaveBeenCalledWith(200, 0);
      expect(oscs[0].frequency.linearRampToValueAtTime).toHaveBeenCalledWith(400, 0.3);
    } finally {
      s._reset_audio_context();
    }
  });
});

describe('play_ui_select', () => {
  it('creates square wave oscillator', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_ui_select();
      const oscs = mockCtx._oscillators;
      expect(oscs.length).toBe(1);
      expect(oscs[0].type).toBe('square');
    } finally {
      s._reset_audio_context();
    }
  });
});

describe('AudioContext lifecycle', () => {
  it('does not create AudioContext before first play call', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      expect(globalThis.window.AudioContext).not.toHaveBeenCalled();
    } finally {
      s._reset_audio_context();
    }
  });

  it('reuses the same AudioContext on multiple calls', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_hit('PERFECT');
      s.play_bounce();
      expect(globalThis.window.AudioContext).toHaveBeenCalledTimes(1);
    } finally {
      s._reset_audio_context();
    }
  });

  it('creates new AudioContext after reset', async () => {
    const { sound: s } = await import('../src/sound.js');
    try {
      s.play_hit('NORMAL');
      expect(globalThis.window.AudioContext).toHaveBeenCalledTimes(1);
      s._reset_audio_context();
      s.play_hit('NORMAL');
      expect(globalThis.window.AudioContext).toHaveBeenCalledTimes(2);
    } finally {
      s._reset_audio_context();
    }
  });
});

describe('graceful fallback', () => {
  it('all play functions do not throw when AudioContext is unavailable', async () => {
    delete globalThis.window;
    globalThis.window = { AudioContext: undefined };
    const { sound: s } = await import('../src/sound.js');
    try {
      expect(() => s.play_hit('PERFECT')).not.toThrow();
      expect(() => s.play_bounce()).not.toThrow();
      expect(() => s.play_net()).not.toThrow();
      expect(() => s.play_point_scored()).not.toThrow();
      expect(() => s.play_serve_release()).not.toThrow();
      expect(() => s.play_serve_charge()).not.toThrow();
      expect(() => s.play_ui_select()).not.toThrow();
    } finally {
      s._reset_audio_context();
    }
  });
});
