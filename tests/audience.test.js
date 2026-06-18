import { describe, it, expect, beforeEach } from 'vitest';
import { COURT_LENGTH, COURT_WIDTH } from '../src/constants.js';

describe('audience', () => {
  let audience;

  beforeEach(async () => {
    audience = await import('../src/audience.js').then(m => m.audience);
    audience.init();
  });

  it('init() creates spectators at valid perimeter positions', () => {
    expect(audience.spectators.length).toBeGreaterThan(0);
    for (const spec of audience.spectators) {
      expect(typeof spec.x).toBe('number');
      expect(typeof spec.z).toBe('number');
      expect(typeof spec.offset_x).toBe('number');
      expect(typeof spec.offset_z).toBe('number');
    }
  });

  it('spectator positions are outside court bounds', () => {
    const halfW = COURT_WIDTH / 2;
    for (const spec of audience.spectators) {
      const x = spec.x + spec.offset_x;
      const z = spec.z + spec.offset_z;
      const outsideCourt = x < -halfW - 0.5 || x > halfW + 0.5 || z < -0.5 || z > COURT_LENGTH + 0.5;
      expect(outsideCourt).toBe(true);
    }
  });

  it('init() sets cheer_level to 0', () => {
    expect(audience.cheer_level).toBe(0);
  });

  it('cheer() sets cheer_level to CHEER_DURATION', () => {
    audience.cheer();
    expect(audience.cheer_level).toBe(audience.CHEER_DURATION);
  });

  it('update() decrements cheer_level each frame', () => {
    audience.cheer();
    const initial = audience.cheer_level;
    audience.update();
    expect(audience.cheer_level).toBe(initial - 1);
  });

  it('update() clamps cheer_level to 0', () => {
    audience.cheer();
    for (let i = 0; i < audience.CHEER_DURATION + 10; i++) {
      audience.update();
    }
    expect(audience.cheer_level).toBe(0);
  });

  it('update() leaves cheer_level at 0 when idle', () => {
    audience.update();
    expect(audience.cheer_level).toBe(0);
  });

  it('get_pose() returns cheering pose when cheer_level > 0', () => {
    audience.cheer();
    const pose = audience.get_pose(0);
    expect(pose).toEqual(['\\', 'o', '/']);
  });

  it('get_pose() returns idle pose when cheer_level is 0', () => {
    const pose = audience.get_pose(0);
    expect(pose).toEqual([' ', 'O', ' ']);
  });

  it('creates approximately 25 spectators', () => {
    expect(audience.spectators.length).toBeGreaterThanOrEqual(20);
    expect(audience.spectators.length).toBeLessThanOrEqual(35);
  });
});
