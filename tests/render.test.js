import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { SCREEN_W, SCREEN_H, COURT_LENGTH, COURT_WIDTH, HUD_HEIGHT, STATUS_HEIGHT, COURT_PADDING } from '../src/constants.js';
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

describe('render (top-down)', () => {
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

  it('court sets green fill and draws lines', () => {
    render.court();
    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(mockCtx._fillStyle).toBe('#fff');
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('net draws characters across court middle', () => {
    render.net();
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('player draws label character at player position', () => {
    const p = { x: 0, z: COURT_LENGTH / 2, is_ai: false };
    render.player(p, 'P');
    expect(mockCtx.fillText).toHaveBeenCalledWith('P', expect.any(Number), expect.any(Number));
  });

  it('player draws AI label', () => {
    const p = { x: 1, z: 2, is_ai: true };
    render.player(p, 'A');
    expect(mockCtx.fillText).toHaveBeenCalledWith('A', expect.any(Number), expect.any(Number));
  });

  it('ball draws when in play', () => {
    const b = { x: 0, y: 1.5, z: COURT_LENGTH / 2, state: 'in_play', vx: 0, vy: 0, vz: 0, bounces: 0, spin_x: 0, spin_z: 0 };
    render.ball(b);
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('ball does not draw when held', () => {
    const b = { x: 0, y: 1.0, z: COURT_LENGTH / 2, state: 'held' };
    render.ball(b);
    expect(mockCtx.fillText).not.toHaveBeenCalled();
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
});
