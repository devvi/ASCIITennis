import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SCREEN_W, SCREEN_H, COURT_LENGTH, COURT_WIDTH, HUD_HEIGHT, STATUS_HEIGHT, COURT_PADDING } from '../src/constants.js';
import { camera, setDrawChar } from '../src/camera.js';

describe('camera (top-down)', () => {
  beforeEach(() => {
    camera.init();
  });

  it('init sets up valid scale factors', () => {
    expect(camera.scaleX).toBeGreaterThan(0);
    expect(camera.scaleZ).toBeGreaterThan(0);
  });

  it('world_to_screen maps court center to center of court area', () => {
    const p = camera.world_to_screen(0, COURT_LENGTH / 2);
    const courtAreaCenterX = COURT_PADDING + (COURT_WIDTH) * camera.scaleX / 2;
    const courtAreaCenterY = HUD_HEIGHT + (COURT_LENGTH / 2) * camera.scaleZ;
    expect(p.sx).toBeCloseTo(courtAreaCenterX, 0);
    expect(p.sy).toBeCloseTo(courtAreaCenterY, 0);
  });

  it('world_to_screen maps left-front corner of court', () => {
    const p = camera.world_to_screen(-COURT_WIDTH / 2, 0);
    expect(p.sx).toBeCloseTo(COURT_PADDING, 0);
    expect(p.sy).toBeCloseTo(HUD_HEIGHT, 0);
  });

  it('world_to_screen maps right-back corner of court', () => {
    const p = camera.world_to_screen(COURT_WIDTH / 2, COURT_LENGTH);
    expect(p.sx).toBeCloseTo(SCREEN_W - COURT_PADDING, 0);
    expect(p.sy).toBeCloseTo(SCREEN_H - STATUS_HEIGHT, 0);
  });

  it('world_to_screen returns float coordinates', () => {
    const p = camera.world_to_screen(1.234, 5.678);
    expect(typeof p.sx).toBe('number');
    expect(typeof p.sy).toBe('number');
  });

  it('draw_char calls printChar with rounded coordinates', () => {
    const calls = [];
    setDrawChar((ch, x, y) => calls.push({ ch, x, y }));
    camera.draw_char(0, COURT_LENGTH / 2, 'P');
    expect(calls).toHaveLength(1);
    expect(calls[0].ch).toBe('P');
    expect(Number.isInteger(calls[0].x)).toBe(true);
    expect(Number.isInteger(calls[0].y)).toBe(true);
  });

  it('draw_line draws characters along a line', () => {
    const calls = [];
    setDrawChar((ch, x, y) => calls.push({ ch, x, y }));
    camera.draw_line(-COURT_WIDTH / 2, 0, COURT_WIDTH / 2, 0, '-');
    expect(calls.length).toBeGreaterThan(1);
    for (const c of calls) {
      expect(c.ch).toBe('-');
    }
  });
});
