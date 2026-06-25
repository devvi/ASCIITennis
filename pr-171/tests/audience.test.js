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

  describe('perspective density', () => {
    it('sideline bank spectators have z values biased toward near-camera (z < COURT_LENGTH/2)', () => {
      audience.init(200);
      const half = COURT_LENGTH / 2;
      const sidelineSpecs = audience.spectators.filter(s =>
        s.z < COURT_LENGTH && s.z > 0 && Math.abs(s.x) > COURT_WIDTH / 2
      );
      const nearCount = sidelineSpecs.filter(s => s.z < half).length;
      const farCount = sidelineSpecs.filter(s => s.z >= half).length;
      expect(nearCount).toBeGreaterThan(farCount);
    });

    it('sideline spectators z values stay within [0, COURT_LENGTH]', () => {
      audience.init(200);
      const sidelineSpecs = audience.spectators.filter(s =>
        Math.abs(s.x) > COURT_WIDTH / 2 && s.z > 0 && s.z < COURT_LENGTH
      );
      for (const spec of sidelineSpecs) {
        expect(spec.z).toBeGreaterThanOrEqual(0);
        expect(spec.z).toBeLessThanOrEqual(COURT_LENGTH);
      }
    });

    it('baseline bank spectators (near/end) span x only, z values are at fixed positions', () => {
      audience.init(96);
      for (const spec of audience.spectators) {
        expect(Math.abs(spec.x)).toBeGreaterThanOrEqual(COURT_WIDTH / 2 - 0.5);
      }
    });
  });

  describe('sideline z-range restriction', () => {
    it('sideline bank spectators have z values within restricted range (z <= COURT_LENGTH / 2)', () => {
      vi.spyOn(Math, 'random').mockRestore();
      audience.init(200);
      const sidelineSpecs = audience.spectators.filter(s =>
        Math.abs(s.x) > COURT_WIDTH / 2 && s.z > 0 && s.z < COURT_LENGTH
      );
      for (const spec of sidelineSpecs) {
        expect(spec.z).toBeLessThanOrEqual(COURT_LENGTH / 2 + 0.3);
      }
    });

    it('no sideline spectator has z > COURT_LENGTH / 2', () => {
      vi.spyOn(Math, 'random').mockRestore();
      audience.init(200);
      for (const spec of audience.spectators) {
        // Sideline spectators: |x| > COURT_WIDTH/2 AND z within court bounds (0..COURT_LENGTH/2)
        if (Math.abs(spec.x) > COURT_WIDTH / 2 && spec.z >= 0 && spec.z <= COURT_LENGTH) {
          expect(spec.z).toBeLessThanOrEqual(COURT_LENGTH / 2 + 0.3);
        }
      }
    });

    it('even after jitter, no spectator z value exceeds COURT_LENGTH / 2 + jitter margin', () => {
      audience.init(200);
      for (const spec of audience.spectators) {
        if (Math.abs(spec.x) > COURT_WIDTH / 2 && spec.z >= 0 && spec.z <= COURT_LENGTH) {
          expect(spec.z).toBeLessThanOrEqual(COURT_LENGTH / 2 + 0.3);
        }
      }
    });

    it('sideline spectators use linear (not power-biased) distribution', () => {
      vi.spyOn(Math, 'random').mockRestore();
      audience.init(200);
      const sidelineSpecs = audience.spectators.filter(s =>
        Math.abs(s.x) > COURT_WIDTH / 2 && s.z > 0 && s.z < COURT_LENGTH
      );
      if (sidelineSpecs.length < 10) return;
      const mid = COURT_LENGTH / 4;
      const nearCount = sidelineSpecs.filter(s => s.z < mid).length;
      const farCount = sidelineSpecs.filter(s => s.z >= mid && s.z <= COURT_LENGTH / 2).length;
      const ratio = nearCount / Math.max(1, farCount);
      expect(ratio).toBeGreaterThanOrEqual(0.5);
      expect(ratio).toBeLessThanOrEqual(2.0);
    });
  });

  describe('hit detection', () => {
    it('spectators have alive=true by default', () => {
      audience.init(10);
      for (const spec of audience.spectators) {
        expect(spec.alive).toBe(true);
      }
    });

    it('kill_count starts at 0', () => {
      audience.init();
      expect(audience.kill_count).toBe(0);
    });

    it('check_hit returns -1 when no spectator within KILL_RADIUS', () => {
      audience.init(96);
      const idx = audience.check_hit(999, 999);
      expect(idx).toBe(-1);
    });

    it('check_hit returns index of nearest alive spectator within KILL_RADIUS', () => {
      audience.init(96);
      const spec = audience.spectators[0];
      const idx = audience.check_hit(spec.x, spec.z);
      expect(idx).toBeGreaterThanOrEqual(0);
    });

    it('check_hit ignores dead spectators', () => {
      audience.init(10);
      for (let i = 0; i < audience.spectators.length; i++) {
        audience.kill(i);
      }
      const idx = audience.check_hit(0, 0);
      expect(idx).toBe(-1);
    });

    it('kill marks spectator alive=false', () => {
      audience.init(10);
      audience.kill(0);
      expect(audience.spectators[0].alive).toBe(false);
    });

    it('kill increments kill_count', () => {
      audience.init(10);
      audience.kill(0);
      expect(audience.kill_count).toBe(1);
      audience.kill(1);
      expect(audience.kill_count).toBe(2);
    });

    it('multiple kills increment kill_count and mark multiple spectators dead', () => {
      audience.init(10);
      audience.kill(0);
      audience.kill(2);
      audience.kill(4);
      expect(audience.kill_count).toBe(3);
      expect(audience.spectators[0].alive).toBe(false);
      expect(audience.spectators[2].alive).toBe(false);
      expect(audience.spectators[4].alive).toBe(false);
      expect(audience.spectators[1].alive).toBe(true);
    });

    it('get_pose returns death pose for dead spectator', () => {
      audience.init(10);
      audience.kill(0);
      const pose = audience.get_pose(0);
      expect(pose.top).toBe(' X ');
      expect(pose.bottom).toBe('|_|');
    });

    it('get_pose returns cheer pose for alive spectator when cheering', () => {
      audience.init(10);
      audience.cheer();
      const pose = audience.get_pose(0);
      expect(pose.top).toBe('\\o/');
      expect(pose.bottom).toBe(' - ');
    });

    it('get_pose returns idle pose for alive spectator when not cheering', () => {
      audience.init(10);
      audience.cheer_level = 0;
      const pose = audience.get_pose(0);
      expect(pose.top).toBeDefined();
      expect(pose.bottom).toBeDefined();
    });
  });
});
