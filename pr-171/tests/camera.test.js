import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SCREEN_W, SCREEN_H, COURT_LENGTH, COURT_WIDTH, HUD_HEIGHT,
  FOCAL, CAM_HEIGHT, CAM_Z, HORIZON_Y, CAM_PITCH } from '../src/constants.js';
import { camera, setDrawChar } from '../src/camera.js';

describe('camera (perspective)', () => {
  beforeEach(() => {
    camera.init();
  });

  describe('pitch', () => {
    it('init stores the pitch angle', () => {
      camera.init(-0.3);
      expect(camera.pitch).toBe(-0.3);
    });

    it('init defaults to CAM_PITCH when no argument given', () => {
      camera.init();
      expect(camera.pitch).toBe(CAM_PITCH);
    });

    it('zero pitch matches original projection formula', () => {
      camera.init(0);
      const p = camera.project(0, 0, 10);
      const expectedSy = HORIZON_Y - (0 - CAM_HEIGHT) * FOCAL / (10 - CAM_Z);
      const expectedSx = SCREEN_W / 2;
      expect(p.sx).toBeCloseTo(expectedSx, 5);
      expect(p.sy).toBeCloseTo(expectedSy, 5);
      expect(p.scale).toBeCloseTo(FOCAL / (10 - CAM_Z), 5);
    });

    it('negative pitch shifts far-court points upward on screen', () => {
      camera.init(0);
      const pFlat = camera.project(0, 0, 10);
      camera.init(-0.15);
      const pDown = camera.project(0, 0, 10);
      expect(pDown.sy).toBeLessThan(pFlat.sy);
    });

    it('positive pitch shifts far-court points downward on screen', () => {
      camera.init(0);
      const pFlat = camera.project(0, 0, 10);
      camera.init(0.15);
      const pUp = camera.project(0, 0, 10);
      expect(pUp.sy).toBeGreaterThan(pFlat.sy);
    });

    it('negative pitch shifts horizon line upward (smaller sy)', () => {
      camera.init(0);
      const pHoriz = camera.project(0, CAM_HEIGHT, 100);
      camera.init(-0.15);
      const pTilt = camera.project(0, CAM_HEIGHT, 100);
      expect(pTilt.sy).toBeLessThan(pHoriz.sy);
    });

    it('positive pitch shifts horizon line downward (larger sy)', () => {
      camera.init(0);
      const pHoriz = camera.project(0, CAM_HEIGHT, 100);
      camera.init(0.15);
      const pTilt = camera.project(0, CAM_HEIGHT, 100);
      expect(pTilt.sy).toBeGreaterThan(pHoriz.sy);
    });
  });

  it('init does not throw', () => {
    expect(() => camera.init()).not.toThrow();
  });

  it('project returns null for points behind camera', () => {
    const p = camera.project(0, 0, -20);
    expect(p).toBeNull();
  });

  it('project maps center of court to center of screen', () => {
    const p = camera.project(0, 0, COURT_LENGTH / 2);
    expect(p.sx).toBeCloseTo(SCREEN_W / 2, 0);
    expect(p.sy).toBeGreaterThan(0);
    expect(p.sy).toBeLessThan(SCREEN_H);
    expect(p.scale).toBeGreaterThan(0);
  });

  it('project returns decreasing scale for farther points', () => {
    const p1 = camera.project(0, 0, 0);
    const p2 = camera.project(0, 0, COURT_LENGTH);
    expect(p2.scale).toBeLessThan(p1.scale);
  });

  it('project places higher y values higher on screen', () => {
    const p1 = camera.project(0, 0, 10);
    const p2 = camera.project(0, 2, 10);
    expect(p2.sy).toBeLessThan(p1.sy);
  });

  describe('GBC-style camera (steep pitch)', () => {
    it('project with GBC pitch returns valid coords for near court', () => {
      camera.init(-0.6);
      const p = camera.project(0, 0, 0);
      expect(p).not.toBeNull();
      expect(p.sx).toBeGreaterThanOrEqual(0);
      expect(p.sx).toBeLessThanOrEqual(SCREEN_W);
      expect(p.sy).toBeGreaterThanOrEqual(0);
      expect(p.sy).toBeLessThanOrEqual(SCREEN_H);
      expect(p.scale).toBeGreaterThan(0);
    });

    it('project with GBC pitch returns valid coords for far court', () => {
      camera.init(-0.5);
      const p = camera.project(0, 0, COURT_LENGTH);
      expect(p).not.toBeNull();
      expect(p.sx).toBeGreaterThanOrEqual(0);
      expect(p.sx).toBeLessThanOrEqual(SCREEN_W);
      expect(p.scale).toBeGreaterThan(0);
    });

    it('steep pitch does not clip full court width', () => {
      camera.init(-0.6);
      const halfW = COURT_WIDTH / 2;
      const p1 = camera.project(-halfW, 0, 0);
      const p2 = camera.project(halfW, 0, 0);
      expect(p1).not.toBeNull();
      expect(p2).not.toBeNull();
      expect(p2.sx - p1.sx).toBeGreaterThan(0);
    });

    it('landmark points map to expected screen regions under GBC pitch', () => {
      camera.init(-0.6);
      const baseline = camera.project(0, 0, 0);
      expect(baseline.sy).toBeGreaterThan(SCREEN_H / 2);
      const farBaseline = camera.project(0, 0, COURT_LENGTH);
      expect(farBaseline.sy).toBeLessThan(SCREEN_H / 2);
      const net = camera.project(0, 0, COURT_LENGTH / 2);
      expect(net.sy).toBeGreaterThan(farBaseline.sy);
      expect(net.sy).toBeLessThan(baseline.sy);
    });

    it('steep pitch does not cause null-projections for valid court positions', () => {
      camera.init(-0.6);
      const halfW = COURT_WIDTH / 2;
      for (let z = 0; z <= COURT_LENGTH; z += 1) {
        const p = camera.project(0, 0, z);
        expect(p).not.toBeNull();
      }
    });
  });

  it('project moves x right for positive x', () => {
    const p1 = camera.project(0, 0, 10);
    const p2 = camera.project(2, 0, 10);
    expect(p2.sx).toBeGreaterThan(p1.sx);
  });

  it('project returns float coordinates', () => {
    const p = camera.project(1.234, 0, 5.678);
    expect(typeof p.sx).toBe('number');
    expect(typeof p.sy).toBe('number');
    expect(typeof p.scale).toBe('number');
  });

  it('draw_char calls printChar with rounded coordinates', () => {
    const calls = [];
    setDrawChar((ch, x, y) => calls.push({ ch, x, y }));
    camera.draw_char(0, 0, COURT_LENGTH / 2, 'P');
    expect(calls).toHaveLength(1);
    expect(calls[0].ch).toBe('P');
    expect(Number.isInteger(calls[0].x)).toBe(true);
    expect(Number.isInteger(calls[0].y)).toBe(true);
  });

  it('draw_line draws characters along a line', () => {
    const calls = [];
    setDrawChar((ch, x, y) => calls.push({ ch, x, y }));
    camera.draw_line(-COURT_WIDTH / 2, 0, 0, COURT_WIDTH / 2, 0, 0, '-');
    expect(calls.length).toBeGreaterThan(1);
    for (const c of calls) {
      expect(c.ch).toBe('-');
    }
  });

  it('draw_line skips when behind camera', () => {
    const calls = [];
    setDrawChar((ch, x, y) => calls.push({ ch, x, y }));
    camera.draw_line(0, 0, CAM_Z - 1, 1, 0, CAM_Z - 1, '-');
    expect(calls).toHaveLength(0);
  });
});
