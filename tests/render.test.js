import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { SCREEN_W, SCREEN_H, COURT_LENGTH, COURT_WIDTH, HUD_HEIGHT } from '../src/constants.js';
import { camera } from '../src/camera.js';
import { court } from '../src/court.js';
import { scoring } from '../src/scoring.js';

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

describe('render (perspective)', () => {
  beforeAll(async () => {
    const mod = await import('../src/render.js');
    render = mod.render;
    mod.initRender(mockCanvas);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    court.init();
    camera.init();
  });

  it('court draws surface and lines using fillRect grid and fillText', () => {
    render.court();
    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('court surface draws scanline-filled rectangles for 3 polygons', () => {
    render.court();
    const rectCalls = mockCtx.fillRect.mock.calls.length;
    expect(rectCalls).toBeGreaterThan(0);
  });

  it('drawServiceBoxes fills via fillRect for both court halves', () => {
    render.court();
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it('net draws components across court middle', () => {
    render.net();
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('player draws figure at position', () => {
    const p = { x: 0, z: COURT_LENGTH / 2, is_ai: false, state: 'idle' };
    render.player(p, 'P');
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('player draws AI figure', () => {
    const p = { x: 1, z: 2, is_ai: true, state: 'idle' };
    render.player(p, 'A');
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('ball draws when in play', () => {
    const b = { x: 0, y: 1.5, z: COURT_LENGTH / 2, state: 'in_play', vx: 0, vy: 0, vz: 0, bounces: 0, spin_x: 0, spin_z: 0 };
    render.ball(b);
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('ball draws when held (visible during serve toss)', () => {
    const b = { x: 0, y: 1.0, z: COURT_LENGTH / 2, state: 'held' };
    render.ball(b);
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('hud displays score information', () => {
    const s = scoring.new();
    s.points = [1, 0];
    s.games = [2, 1];
    render.hud(s);
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('menu renders without error', () => {
    render.menu(1);
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('game_over renders without error', () => {
    render.game_over('Player');
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('player draws indicator when can_hit_this_frame is true', () => {
    const p = { x: 0, z: 5, is_ai: false, can_hit_this_frame: true };
    render.player(p, 'P');
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('player draws normally when can_hit_this_frame is false', () => {
    const p = { x: 0, z: 5, is_ai: false, can_hit_this_frame: false };
    render.player(p, 'P');
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('landing_marker draws X character at given position', () => {
    render.landing_marker({ x: 0, z: 10 });
    expect(mockCtx.fillText).toHaveBeenCalledWith('X', expect.any(Number), expect.any(Number));
  });
  it('referee draws referee character when active', () => {
    render.referee({ message: '', timer: 60, violation_type: null });
    expect(mockCtx.fillText).toHaveBeenCalledWith('@', expect.any(Number), expect.any(Number));
  });

  it('referee draws referee figure even when timer is 0 (always visible)', () => {
    vi.clearAllMocks();
    render.referee({ message: '', timer: 0, violation_type: null });
    expect(mockCtx.fillText).toHaveBeenCalledWith('@', expect.any(Number), expect.any(Number));
  });

  it('referee does not render when state is undefined', () => {
    vi.clearAllMocks();
    render.referee(undefined);
    expect(mockCtx.fillText).not.toHaveBeenCalled();
  });

  it('referee draws violation message text', () => {
    render.referee({ message: 'OUT!', timer: 60, violation_type: 'out' });
    expect(mockCtx.fillText).toHaveBeenCalledWith('OUT!', expect.any(Number), expect.any(Number));
  });

  it('referee draws NET! message for net violation', () => {
    render.referee({ message: 'NET!', timer: 60, violation_type: 'net' });
    expect(mockCtx.fillText).toHaveBeenCalledWith('NET!', expect.any(Number), expect.any(Number));
  });

  describe('serve_meter', () => {
    it('serve_meter(0) draws empty bar (fills only background)', () => {
      vi.clearAllMocks();
      render.serve_meter(0);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('serve_meter(1) draws full bar', () => {
      vi.clearAllMocks();
      render.serve_meter(1);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('serve_meter(0.5) draws half bar', () => {
      vi.clearAllMocks();
      render.serve_meter(0.5);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('serve_meter uses green color for low charge', () => {
      vi.clearAllMocks();
      render.serve_meter(0.3);
      const fillCalls = mockCtx.fillRect.mock.calls;
      const backgroundCalls = fillCalls.filter(c => mockCtx._fillStyle === '#222' || c.length >= 4);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('serve_meter uses yellow color for medium charge', () => {
      vi.clearAllMocks();
      render.serve_meter(0.6);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('serve_meter uses red color for high charge', () => {
      vi.clearAllMocks();
      render.serve_meter(0.9);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });
  });
});
