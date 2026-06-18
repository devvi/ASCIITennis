import { describe, it, expect, beforeEach, vi } from 'vitest';
import { COURT_LENGTH, COURT_WIDTH, SCREEN_W, SCREEN_H } from '../src/constants.js';

describe('audience', () => {
  let audience;

  beforeEach(async () => {
    vi.resetModules();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const mod = await import('../src/audience.js');
    audience = mod.audience;
  });

  it('init creates the default number of spectators', () => {
    audience.init();
    expect(audience.spectators.length).toBeGreaterThanOrEqual(20);
    expect(audience.spectators.length).toBeLessThanOrEqual(30);
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
    audience.init(100);
    const halfW = COURT_WIDTH / 2;
    for (const spec of audience.spectators) {
      const insideCourt = Math.abs(spec.x) <= halfW && spec.z >= 0 && spec.z <= COURT_LENGTH;
      expect(insideCourt).toBe(false);
    }
  });

  it('cheer sets cheer_level to CHEER_DURATION', () => {
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

  it('get_pose returns idle when cheer_level is 0', () => {
    audience.init();
    expect(audience.cheer_level).toBe(0);
    const pose = audience.get_pose(0);
    expect(pose.top).toBe(' O ');
    expect(pose.bottom).toBe(' _ ');
  });

  it('get_pose returns cheer when cheer_level > 0', () => {
    audience.init();
    audience.cheer();
    const pose = audience.get_pose(0);
    expect(pose.top).toBe('\\o/');
    expect(pose.bottom).toBe(' - ');
  });

  it('get_pose returns correct pose for any index', () => {
    audience.init(5);
    audience.cheer();
    for (let i = 0; i < 5; i++) {
      const pose = audience.get_pose(i);
      expect(pose.top).toBe('\\o/');
      expect(pose.bottom).toBe(' - ');
    }
  });

  it('get_pose transitions from cheer to idle as cheer_level decays', () => {
    audience.init();
    audience.cheer();
    expect(audience.get_pose(0).top).toBe('\\o/');
    while (audience.cheer_level > 0) {
      audience.update();
    }
    expect(audience.get_pose(0).top).toBe(' O ');
  });

  it('spectators all have x and z coordinates', () => {
    audience.init(10);
    for (const spec of audience.spectators) {
      expect(spec).toHaveProperty('x');
      expect(spec).toHaveProperty('z');
      expect(typeof spec.x).toBe('number');
      expect(typeof spec.z).toBe('number');
    }
  });
});
