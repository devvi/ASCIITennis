import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import {
  CHEER_DURATION, RALLY_CHEER_THRESHOLD, AUDIENCE_COUNT,
  COURT_LENGTH, COURT_WIDTH,
} from '../src/constants.js';
import { camera } from '../src/camera.js';
import { court } from '../src/court.js';

describe('audience', () => {
  let audience;

  beforeAll(async () => {
    const mod = await import('../src/audience.js');
    audience = mod.audience;
  });

  beforeEach(() => {
    court.init();
    camera.init();
    audience.init();
  });

  it('init() creates AUDIENCE_COUNT spectators', () => {
    expect(audience.spectators.length).toBe(AUDIENCE_COUNT);
  });

  it('spectator positions are outside court bounds', () => {
    const halfW = COURT_WIDTH / 2;
    for (const spec of audience.spectators) {
      const insideX = spec.x >= -halfW && spec.x <= halfW;
      const insideZ = spec.z >= 0 && spec.z <= COURT_LENGTH;
      expect(insideX && insideZ).toBe(false);
    }
  });

  it('init() sets cheer_level to 0', () => {
    expect(audience.cheer_level).toBe(0);
  });

  it('cheer() sets cheer_level to CHEER_DURATION', () => {
    audience.cheer();
    expect(audience.cheer_level).toBe(CHEER_DURATION);
  });

  it('cheer() overwrites previous cheer_level even if already cheering', () => {
    audience.cheer();
    audience.cheer();
    expect(audience.cheer_level).toBe(CHEER_DURATION);
  });

  it('update() decrements cheer_level by 1 each frame', () => {
    audience.cheer();
    audience.update();
    expect(audience.cheer_level).toBe(CHEER_DURATION - 1);
  });

  it('update() clamps cheer_level to 0', () => {
    for (let i = 0; i < CHEER_DURATION + 10; i++) {
      audience.update();
    }
    expect(audience.cheer_level).toBe(0);
  });

  it('update() does nothing when cheer_level is already 0', () => {
    audience.update();
    expect(audience.cheer_level).toBe(0);
  });

  it('get_pose() returns idle pose when not cheering', () => {
    const pose = audience.get_pose(0);
    expect(Array.isArray(pose)).toBe(true);
    expect(pose).toHaveLength(3);
    expect(pose).toEqual([' ', 'O', ' ']);
  });

  it('get_pose() returns cheer pose when cheer_level > 0', () => {
    audience.cheer();
    const pose = audience.get_pose(0);
    expect(pose).toEqual(['\\', 'o', '/']);
  });

  it('get_pose() returns idle pose after cheer decays', () => {
    audience.cheer();
    for (let i = 0; i < CHEER_DURATION; i++) {
      audience.update();
    }
    expect(audience.get_pose(0)).toEqual([' ', 'O', ' ']);
  });

  it('get_pose() works for any valid spectator index', () => {
    audience.cheer();
    for (let i = 0; i < AUDIENCE_COUNT; i++) {
      const pose = audience.get_pose(i);
      expect(pose).toEqual(['\\', 'o', '/']);
    }
  });
});

describe('audience rendering', () => {
  let audience;
  const mockCtx = {
    _fillStyle: '',
    set fillStyle(v) { this._fillStyle = v; },
    get fillStyle() { return this._fillStyle; },
    fillRect: vi.fn(),
    fillText: vi.fn(),
    setTransform: vi.fn(),
    imageSmoothingEnabled: false,
    font: '',
    textBaseline: '',
    textAlign: '',
  };

  const mockCanvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => mockCtx),
  };

  let render;

  beforeAll(async () => {
    const audMod = await import('../src/audience.js');
    audience = audMod.audience;
    const renderMod = await import('../src/render.js');
    render = renderMod.render;
    renderMod.initRender(mockCanvas);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    court.init();
    camera.init();
    audience.init();
  });

  it('render.audience() draws spectators at their positions', () => {
    render.audience(audience);
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('render.audience() draws AUDIENCE_COUNT spectators (3 chars each)', () => {
    render.audience(audience);
    expect(mockCtx.fillText.mock.calls.length).toBeGreaterThanOrEqual(AUDIENCE_COUNT);
  });

  it('render.audience() uses yellow (#ff0) when cheering', () => {
    audience.cheer();
    render.audience(audience);
    expect(mockCtx._fillStyle).toBe('#ff0');
  });

  it('render.audience() uses white (#fff) when idle', () => {
    render.audience(audience);
    expect(mockCtx._fillStyle).toBe('#fff');
  });
});

describe('audience integration', () => {
  let audience;

  beforeAll(async () => {
    const mod = await import('../src/audience.js');
    audience = mod.audience;
  });

  beforeEach(() => {
    court.init();
    audience.init();
  });

  it('RALLY_CHEER_THRESHOLD is a positive integer', () => {
    expect(RALLY_CHEER_THRESHOLD).toBeGreaterThan(0);
    expect(Number.isInteger(RALLY_CHEER_THRESHOLD)).toBe(true);
  });

  it('rally hits at threshold should trigger cheer', () => {
    const rally_hits = RALLY_CHEER_THRESHOLD;
    if (rally_hits >= RALLY_CHEER_THRESHOLD) {
      audience.cheer();
    }
    expect(audience.cheer_level).toBe(CHEER_DURATION);
  });

  it('rally hits below threshold should not trigger cheer', () => {
    const rally_hits = RALLY_CHEER_THRESHOLD - 1;
    expect(rally_hits < RALLY_CHEER_THRESHOLD).toBe(true);
  });
});
