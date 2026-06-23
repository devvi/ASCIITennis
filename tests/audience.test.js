import { describe, it, expect, beforeEach, vi } from 'vitest';
import { COURT_LENGTH, COURT_WIDTH } from '../src/constants.js';

describe('audience', () => {
  let audience;

  beforeEach(async () => {
    vi.resetModules();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const mod = await import('../src/audience.js');
    audience = mod.audience;
  });

  it('init creates at least 80 spectators', () => {
    audience.init();
    expect(audience.spectators.length).toBeGreaterThanOrEqual(80);
  });

  it('init creates specified number of spectators', () => {
    audience.init(10);
    expect(audience.spectators.length).toBe(10);
  });

  it('init starts with cheer_level = 0', () => {
    audience.init();
    expect(audience.cheer_level).toBe(0);
  });

  it('spectator positions are outside court bounds', () => {
    audience.init();
    const halfW = COURT_WIDTH / 2;
    for (const spec of audience.spectators) {
      const insideCourt = Math.abs(spec.x) <= halfW && spec.z >= 0 && spec.z <= COURT_LENGTH;
      expect(insideCourt).toBe(false);
    }
  });

  it('each spectator has row and variant properties', () => {
    audience.init();
    for (const spec of audience.spectators) {
      expect(spec).toHaveProperty('row');
      expect(spec).toHaveProperty('variant');
      expect(typeof spec.row).toBe('number');
      expect(typeof spec.variant).toBe('number');
    }
  });

  it('spectators have at least 3 distinct row values', () => {
    audience.init();
    const rows = new Set(audience.spectators.map(s => s.row));
    expect(rows.size).toBeGreaterThanOrEqual(3);
  });

  it('get_pose returns different idle variants across the crowd', () => {
    vi.spyOn(Math, 'random').mockRestore();
    audience.init(200);
    audience.cheer_level = 0;
    const variants = new Set(audience.spectators.map(s => s.variant));
    expect(variants.size).toBeGreaterThanOrEqual(2);
  });

  it('get_pose returns cheer pose when cheer_level > 0', () => {
    audience.init();
    audience.cheer();
    const pose = audience.get_pose(0);
    expect(pose.top).toBe('\\o/');
    expect(pose.bottom).toBe(' - ');
  });

  it('get_pose returns correct pose for any index', () => {
    audience.init(5);
    audience.cheer_level = 0;
    for (let i = 0; i < 5; i++) {
      const pose = audience.get_pose(i);
      expect(pose).toHaveProperty('top');
      expect(pose).toHaveProperty('bottom');
    }
  });

  it('spectators are sorted by depth (farthest z first)', () => {
    audience.init();
    for (let i = 1; i < audience.spectators.length; i++) {
      expect(audience.spectators[i].z).toBeLessThanOrEqual(audience.spectators[i - 1].z);
    }
  });

  it('cheer sets cheer_level to positive value', () => {
    audience.init();
    expect(audience.cheer_level).toBe(0);
    audience.cheer();
    expect(audience.cheer_level).toBeGreaterThan(0);
  });

  it('update decrements cheer_level by 1 each frame', () => {
    audience.init();
    audience.cheer();
    const initial = audience.cheer_level;
    audience.update();
    expect(audience.cheer_level).toBe(initial - 1);
  });

  it('update clamps cheer_level to 0', () => {
    audience.init();
    audience.cheer_level = 1;
    audience.update();
    expect(audience.cheer_level).toBe(0);
    audience.update();
    expect(audience.cheer_level).toBe(0);
  });

  it('update transitions cheer_level from >0 down to 0 over multiple frames', () => {
    audience.init();
    audience.cheer();
    const initial = audience.cheer_level;
    for (let i = 0; i < initial; i++) {
      expect(audience.cheer_level).toBe(initial - i);
      audience.update();
    }
    expect(audience.cheer_level).toBe(0);
  });
});
