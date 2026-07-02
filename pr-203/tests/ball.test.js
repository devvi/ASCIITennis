import { describe, it, expect } from 'vitest';
import {
  BALL_HELD, BALL_IN_PLAY, BALL_REPLAY, BALL_OUT, BALL_NET, BALL_BOUNCE, BALL_DOUBLE_BOUNCE,
  BALL_RADIUS, COURT_LENGTH, NET_HEIGHT, SINGLES_WIDTH, COURT_WIDTH,
  HIT_FLAT, HIT_TOPSPIN, HIT_SLICE, HIT_LOB,
  HIT_HEIGHT_MIN, HIT_HEIGHT_MAX,
  SERVE_SPEED_MIN, SERVE_SPEED_MAX, SERVE_S_SPEED_MULT, SERVE_NORMAL_SPEED,
  GRAVITY,
} from '../src/constants.js';
import { ball } from '../src/ball.js';
import { court } from '../src/court.js';

describe('ball', () => {
  it('new() creates ball in held state', () => {
    const b = ball.new();
    expect(b.state).toBe(BALL_HELD);
    expect(b.x).toBe(0);
    expect(b.y).toBe(1.0);
    expect(b.z).toBe(0);
    expect(b.bounces).toBe(0);
  });

  it('update does nothing when ball is held', () => {
    const b = ball.new();
    ball.update(b);
    expect(b.x).toBe(0);
    expect(b.y).toBe(1.0);
  });

  it('serve puts ball in play', () => {
    const b = ball.new();
    ball.serve(b, 0, 2, 3, 15, 'normal');
    expect(b.state).toBe(BALL_IN_PLAY);
    expect(b.x).toBe(0);
    expect(b.z).toBe(2);
    expect(b.y).toBe(1.5);
    expect(b.bounces).toBe(0);
  });

  it('serve with zero distance target does not crash', () => {
    const b = ball.new();
    ball.serve(b, 0, 2, 0, 2, 'normal');
    expect(b.state).toBe(BALL_IN_PLAY);
  });

  it('serve with normal timing uses SERVE_NORMAL_SPEED', () => {
    const b = ball.new();
    ball.serve(b, 0, 2, 3, 15, 'normal');
    const speed = Math.sqrt(b.vx*b.vx + b.vz*b.vz);
    expect(speed).toBeCloseTo(SERVE_NORMAL_SPEED, 2);
  });

  it('serve with s_serve timing uses max speed times multiplier', () => {
    const b = ball.new();
    ball.serve(b, 0, 2, 3, 15, 's_serve');
    const speed = Math.sqrt(b.vx*b.vx + b.vz*b.vz);
    expect(speed).toBeCloseTo(SERVE_SPEED_MAX * SERVE_S_SPEED_MULT, 2);
  });

  it('serve defaults to normal when no timing_quality given', () => {
    const b = ball.new();
    ball.serve(b, 0, 2, 3, 15);
    const speed = Math.sqrt(b.vx*b.vx + b.vz*b.vz);
    expect(speed).toBeCloseTo(SERVE_NORMAL_SPEED, 2);
  });

  it('update moves ball when in play', () => {
    const b = ball.new();
    court.init();
    ball.serve(b, 0, 2, 0, 15, 'normal');
    const oldZ = b.z;
    ball.update(b);
    expect(b.z).not.toBe(oldZ);
  });

  it('hit applies flat parameters', () => {
    const b = ball.new();
    court.init();
    ball.hit(b, 0, 1.0, 10, 5, 5, HIT_FLAT);
    expect(b.state).toBe(BALL_IN_PLAY);
    expect(b.vx).toBeDefined();
    expect(b.vy).toBeDefined();
    expect(b.vz).toBeDefined();
  });

  it('hit applies topspin parameters', () => {
    const b = ball.new();
    court.init();
    ball.hit(b, 0, 1.0, 10, 5, 5, HIT_TOPSPIN);
    expect(b.state).toBe(BALL_IN_PLAY);
  });

  it('hit applies slice parameters', () => {
    const b = ball.new();
    court.init();
    ball.hit(b, 0, 1.0, 10, 5, 5, HIT_SLICE);
    expect(b.state).toBe(BALL_IN_PLAY);
  });

  it('hit applies lob parameters', () => {
    const b = ball.new();
    court.init();
    ball.hit(b, 0, 1.0, 10, 5, 5, HIT_LOB);
    expect(b.state).toBe(BALL_IN_PLAY);
  });

  it('hit defaults to flat for unknown hit type', () => {
    const b = ball.new();
    court.init();
    ball.hit(b, 0, 1.0, 10, 5, 5, 99);
    expect(b.state).toBe(BALL_IN_PLAY);
  });

  describe('serve trajectory (vy recalibrated)', () => {
    it('normal serve arcs deep enough to reach service box', () => {
      court.init();
      const b = ball.new();
      ball.serve(b, 0, 2, 0, COURT_LENGTH * 0.85, 'normal');
      b.state = BALL_IN_PLAY;
      let maxZ = b.z;
      let landed = false;
      for (let i = 0; i < 200 && b.state === BALL_IN_PLAY; i++) {
        ball.update(b);
        if (b.z > maxZ) maxZ = b.z;
        if (b.bounces > 0) landed = true;
      }
      expect(landed).toBe(true);
      expect(maxZ).toBeGreaterThan(COURT_LENGTH * 0.6);
    });

    it('normal serve does not trigger BALL_OUT before first bounce', () => {
      court.init();
      const b = ball.new();
      ball.serve(b, 0, 2, 0, COURT_LENGTH * 0.85, 'normal');
      b.state = BALL_IN_PLAY;
      let outBeforeBounce = false;
      for (let i = 0; i < 200 && b.state === BALL_IN_PLAY; i++) {
        ball.update(b);
        if (b.state === BALL_OUT && b.bounces === 0) {
          outBeforeBounce = true;
        }
      }
      expect(outBeforeBounce).toBe(false);
    });
  });

  it('detects bounce when ball hits ground', () => {
    const b = ball.new();
    court.init();
    ball.serve(b, 0, 2, 0, 3, 'normal');
    b.y = BALL_RADIUS;
    b.vy = -0.1;
    ball.update(b);
    expect(b.y).toBeGreaterThanOrEqual(BALL_RADIUS);
  });

  it('increments bounces on ground contact', () => {
    const b = ball.new();
    court.init();
    b.state = BALL_IN_PLAY;
    b.y = BALL_RADIUS - 0.01;
    b.vy = -0.1;
    ball.update(b);
    expect(b.bounces).toBe(1);
  });

  it('ball can bounce multiple times on alternating sides without double bounce', () => {
    const b = ball.new();
    court.init();
    b.state = BALL_IN_PLAY;
    b.z = 3;
    for (let i = 0; i < 5; i++) {
      b.y = BALL_RADIUS - 0.01;
      b.vy = -0.1;
      ball.update(b);
      expect(b.state).not.toBe(BALL_DOUBLE_BOUNCE);
      b.z = b.z < COURT_LENGTH / 2 ? COURT_LENGTH - 3 : 3;
    }
  });

  it('detects net hit', () => {
    const b = ball.new();
    court.init();
    b.state = BALL_IN_PLAY;
    b.x = 0;
    b.y = NET_HEIGHT - 0.1;
    b.z = COURT_LENGTH / 2 - 5;
    b.vz = 10;
    b.vy = 0;
    ball.update(b);
    expect(b.state).toBe(BALL_NET);
  });

  it('ball goes out when past baseline after bounce', () => {
    const b = ball.new();
    court.init();
    b.state = BALL_IN_PLAY;
    b.bounces = 1;
    b.z = COURT_LENGTH + 6;
    ball.update(b);
    expect(b.state).toBe(BALL_OUT);
  });

  it('ball goes out when behind player after bounce', () => {
    const b = ball.new();
    court.init();
    b.state = BALL_IN_PLAY;
    b.bounces = 1;
    b.z = -6;
    ball.update(b);
    expect(b.state).toBe(BALL_OUT);
  });

  
  it('predict_landing returns landing coordinates for ball falling toward ground', () => {
    const b = ball.new();
    b.state = BALL_IN_PLAY;
    b.x = 0;
    b.y = 2.0;
    b.z = 10;
    b.vx = 0;
    b.vy = -0.05;
    b.vz = -0.2;
    const landing = ball.predict_landing(b);
    expect(landing).not.toBeNull();
    expect(typeof landing.x).toBe('number');
    expect(typeof landing.z).toBe('number');
  });

  it('predict_landing returns null when ball is on ground', () => {
    const b = ball.new();
    b.state = BALL_IN_PLAY;
    b.x = 0;
    b.y = 0.05;
    b.z = 10;
    b.vx = 0;
    b.vy = 0;
    b.vz = -0.2;
    const landing = ball.predict_landing(b);
    expect(landing).toBeNull();
  });

  it('predict_landing returns null when ball is moving away from player', () => {
    const b = ball.new();
    b.state = BALL_IN_PLAY;
    b.x = 0;
    b.y = 2.0;
    b.z = 5;
    b.vx = 0;
    b.vy = -0.05;
    b.vz = 0.3;
    const landing = ball.predict_landing(b);
    expect(landing).toBeNull();
  });

  describe.each([
    [HIT_FLAT, 'flat'],
    [HIT_TOPSPIN, 'topspin'],
    [HIT_SLICE, 'slice'],
  ])('trajectory for %s hit', (hitType, _name) => {
    it('reaches human player within hit height range', () => {
      const b = ball.new();
      court.init();
      const ai_z = COURT_LENGTH - 2;
      const human_z = 3;
      ball.hit(b, 0, 1.0, ai_z, 0, human_z, hitType);
      expect(b.state).toBe(BALL_IN_PLAY);
      b.spin_x = 0;

      let reached = false;
      for (let i = 0; i < 300 && b.state === BALL_IN_PLAY; i++) {
        ball.update(b);
        if (b.z <= human_z && !reached && b.y >= 0) {
          reached = true;
          expect(b.y).toBeGreaterThanOrEqual(HIT_HEIGHT_MIN);
          expect(b.y).toBeLessThanOrEqual(HIT_HEIGHT_MAX);
        }
      }
      expect(reached).toBe(true);
    });
  });
  it('new() creates ball with last_hit_by null', () => {
    const b = ball.new();
    expect(b.last_hit_by).toBeNull();
  });

  it('new() creates ball with last_bounce_side null', () => {
    const b = ball.new();
    expect(b.last_bounce_side).toBeNull();
  });

  it('hit() sets last_hit_by to hitter index', () => {
    const b = ball.new();
    court.init();
    ball.hit(b, 0, 1.0, 10, 5, 5, HIT_FLAT, 0);
    expect(b.last_hit_by).toBe(0);
    ball.hit(b, 0, 1.0, 10, 5, 5, HIT_FLAT, 1);
    expect(b.last_hit_by).toBe(1);
  });

  it('double bounce on same side sets BALL_DOUBLE_BOUNCE', () => {
    const b = ball.new();
    court.init();
    b.state = BALL_IN_PLAY;
    b.z = 3;
    b.y = BALL_RADIUS - 0.01;
    b.vy = -0.1;
    ball.update(b);
    expect(b.state).toBe(BALL_IN_PLAY);
    b.y = BALL_RADIUS - 0.01;
    b.vy = -0.1;
    ball.update(b);
    expect(b.state).toBe(BALL_DOUBLE_BOUNCE);
  });

  it('double bounce does not trigger on different sides', () => {
    const b = ball.new();
    court.init();
    b.state = BALL_IN_PLAY;
    b.z = 3;
    b.y = BALL_RADIUS - 0.01;
    b.vy = -0.1;
    ball.update(b);
    expect(b.state).toBe(BALL_IN_PLAY);
    b.z = COURT_LENGTH - 3;
    b.y = BALL_RADIUS - 0.01;
    b.vy = -0.1;
    ball.update(b);
    expect(b.state).not.toBe(BALL_DOUBLE_BOUNCE);
    expect(b.last_bounce_side).toBe(1);
  });

  describe('BALL_REPLAY state', () => {
    it('allows physics to continue updating', () => {
      const b = ball.new();
      court.init();
      b.state = BALL_REPLAY;
      b.x = 0;
      b.y = 2.0;
      b.z = 10;
      b.vx = 0;
      b.vy = -0.05;
      b.vz = -0.2;
      const oldZ = b.z;
      ball.update(b);
      expect(b.z).not.toBe(oldZ);
    });

    it('applies gravity to vy', () => {
      const b = ball.new();
      court.init();
      b.state = BALL_REPLAY;
      b.y = 2.0;
      b.vy = 0;
      b.z = 10;
      ball.update(b);
      expect(b.vy).toBeLessThan(0);
    });

    it('bounces on ground contact', () => {
      const b = ball.new();
      court.init();
      b.state = BALL_REPLAY;
      b.y = BALL_RADIUS;
      b.vy = -0.1;
      b.z = 10;
      ball.update(b);
      expect(b.y).toBeGreaterThanOrEqual(BALL_RADIUS);
      expect(b.vy).toBeGreaterThan(0);
    });

    it('can bounce multiple times', () => {
      const b = ball.new();
      court.init();
      b.state = BALL_REPLAY;
      b.y = 0.5;
      b.vy = -0.02;
      b.z = 10;
      let bounces = 0;
      for (let i = 0; i < 200; i++) {
        const prevBounces = b.bounces;
        ball.update(b);
        if (b.bounces > prevBounces) bounces++;
      }
      expect(bounces).toBeGreaterThanOrEqual(2);
    });

    it('stops updating position when far beyond court (z > COURT_LENGTH + 5)', () => {
      const b = ball.new();
      court.init();
      b.state = BALL_REPLAY;
      b.x = 0;
      b.y = 2.0;
      b.z = COURT_LENGTH + 10;
      b.vx = 0;
      b.vy = -0.05;
      b.vz = -0.2;
      const oldZ = b.z;
      ball.update(b);
      expect(b.z).toBe(oldZ);
    });

    it('stops updating position when far behind court (z < -5)', () => {
      const b = ball.new();
      court.init();
      b.state = BALL_REPLAY;
      b.x = 0;
      b.y = 2.0;
      b.z = -10;
      b.vx = 0;
      b.vy = -0.05;
      b.vz = 0.2;
      const oldZ = b.z;
      ball.update(b);
      expect(b.z).toBe(oldZ);
    });

    it('skips net collision detection', () => {
      const b = ball.new();
      court.init();
      b.state = BALL_REPLAY;
      b.x = 0;
      b.y = NET_HEIGHT - 0.1;
      b.z = COURT_LENGTH / 2 - 5;
      b.vz = 10;
      b.vy = 0;
      ball.update(b);
      expect(b.state).toBe(BALL_REPLAY);
    });

    it('skips out-of-bounds detection', () => {
      const b = ball.new();
      court.init();
      b.state = BALL_REPLAY;
      b.z = COURT_LENGTH + 3;
      b.y = 2.0;
      ball.update(b);
      expect(b.state).toBe(BALL_REPLAY);
    });
  });

  it('ball between singles and doubles sideline is OUT after bounce', () => {
    const b = ball.new();
    court.init();
    b.state = BALL_IN_PLAY;
    b.x = SINGLES_WIDTH / 2 + 0.5;
    b.z = COURT_LENGTH / 2;
    b.y = BALL_RADIUS - 0.01;
    b.vy = -0.1;
    b.vz = 0;
    b.bounces = 1;
    ball.update(b);
    expect(b.state).toBe(BALL_OUT);
  });

  describe('BALL_FLYING_OUT state', () => {
    it('ball in BALL_FLYING_OUT continues physics (moves with velocity)', () => {
      const b = ball.new();
      court.init();
      b.state = 'flying_out';
      b.x = 0;
      b.y = 2.0;
      b.z = COURT_LENGTH + 1;
      b.vx = 0.1;
      b.vy = -0.05;
      b.vz = 0.2;
      const oldZ = b.z;
      ball.update(b);
      expect(b.z).not.toBe(oldZ);
    });

    it('BALL_FLYING_OUT applies gravity to vy', () => {
      const b = ball.new();
      court.init();
      b.state = 'flying_out';
      b.y = 2.0;
      b.vy = 0;
      b.z = COURT_LENGTH + 1;
      ball.update(b);
      expect(b.vy).toBeLessThan(0);
    });

    it('BALL_FLYING_OUT skips bounce detection (does not set BALL_OUT)', () => {
      const b = ball.new();
      court.init();
      b.state = 'flying_out';
      b.x = SINGLES_WIDTH + 5;
      b.y = 0.01;
      b.z = COURT_LENGTH / 2;
      b.vy = -0.1;
      ball.update(b);
      expect(b.state).toBe('flying_out');
    });

    it('BALL_FLYING_OUT skips net collision detection', () => {
      const b = ball.new();
      court.init();
      b.state = 'flying_out';
      b.x = 0;
      b.y = NET_HEIGHT - 0.1;
      b.z = COURT_LENGTH / 2 - 5;
      b.vz = 10;
      b.vy = 0;
      ball.update(b);
      expect(b.state).toBe('flying_out');
    });

    it('BALL_FLYING_OUT ball continues past far baseline without state change', () => {
      const b = ball.new();
      court.init();
      b.state = 'flying_out';
      b.x = 0;
      b.y = 2.0;
      b.z = COURT_LENGTH + 5;
      b.vz = 0.2;
      for (let i = 0; i < 10; i++) {
        ball.update(b);
      }
      expect(b.z).toBeGreaterThan(COURT_LENGTH + 5);
      expect(b.state).toBe('flying_out');
    });

    it('BALL_FLYING_OUT ball air resistance affects velocity', () => {
      const b = ball.new();
      court.init();
      b.state = 'flying_out';
      b.x = 0;
      b.y = 2.0;
      b.z = COURT_LENGTH + 1;
      b.vx = 0.5;
      b.vy = 0;
      b.vz = 0;
      const oldVx = b.vx;
      ball.update(b);
      expect(Math.abs(b.vx)).toBeLessThan(Math.abs(oldVx));
    });
  });

  describe('trail_opts in hit()', () => {
    it('hit() without trail_opts uses defaults (trail_max=undefined, trail_char="o")', () => {
      court.init();
      const b = ball.new();
      ball.hit(b, 0, 1.0, 10, 5, 5, HIT_FLAT);
      expect(b.trail_char).toBe('o');
      expect(b.trail_color).toBeUndefined();
      expect(b.trail_max_length).toBeUndefined();
    });

    it('hit() with trail_opts.length sets trail_max_length', () => {
      court.init();
      const b = ball.new();
      ball.hit(b, 0, 1.0, 10, 5, 5, HIT_FLAT, 0, 1.0, { length: 10 });
      expect(b.trail_max_length).toBe(10);
    });

    it('hit() with trail_opts.char sets trail_char', () => {
      court.init();
      const b = ball.new();
      ball.hit(b, 0, 1.0, 10, 5, 5, HIT_FLAT, 0, 1.0, { char: '*' });
      expect(b.trail_char).toBe('*');
    });

    it('hit() with trail_opts.color sets trail_color', () => {
      court.init();
      const b = ball.new();
      ball.hit(b, 0, 1.0, 10, 5, 5, HIT_FLAT, 0, 1.0, { color: '#4f4' });
      expect(b.trail_color).toBe('#4f4');
    });

    it('hit() with all trail_opts sets all trail properties', () => {
      court.init();
      const b = ball.new();
      ball.hit(b, 0, 1.0, 10, 5, 5, HIT_FLAT, 0, 1.0, { length: 8, char: '*', color: '#4f4' });
      expect(b.trail_max_length).toBe(8);
      expect(b.trail_char).toBe('*');
      expect(b.trail_color).toBe('#4f4');
    });

    it('hit() clears trail before setting new trail options', () => {
      court.init();
      const b = ball.new();
      b.trail = [{ x: 0, y: 1, z: 5 }];
      ball.hit(b, 0, 1.0, 10, 5, 5, HIT_FLAT, 0, 1.0, { length: 12 });
      expect(b.trail.length).toBe(0);
    });

    it('hit() with speed_mult=1.5 produces higher speed than speed_mult=1.0', () => {
      court.init();
      const b1 = ball.new();
      const b2 = ball.new();
      ball.hit(b1, 0, 1.0, 10, 5, 5, HIT_FLAT, 0, 1.0);
      ball.hit(b2, 0, 1.0, 10, 5, 5, HIT_FLAT, 0, 1.5);
      const speed1 = Math.sqrt(b1.vx*b1.vx + b1.vz*b1.vz);
      const speed2 = Math.sqrt(b2.vx*b2.vx + b2.vz*b2.vz);
      expect(speed2).toBeGreaterThan(speed1);
    });
  });

  describe('serve power param', () => {
    it('serve with power=1 uses SERVE_SPEED_MAX', () => {
      const b = ball.new();
      ball.serve(b, 0, 2, 3, 15, 'normal', 1);
      const speed = Math.sqrt(b.vx*b.vx + b.vz*b.vz);
      expect(speed).toBeCloseTo(SERVE_SPEED_MAX, 2);
    });

    it('serve with power=0 uses SERVE_SPEED_MIN', () => {
      const b = ball.new();
      ball.serve(b, 0, 2, 3, 15, 'normal', 0);
      const speed = Math.sqrt(b.vx*b.vx + b.vz*b.vz);
      expect(speed).toBeCloseTo(SERVE_SPEED_MIN, 2);
    });

    it('serve with power=0.5 gives midpoint speed', () => {
      const b = ball.new();
      ball.serve(b, 0, 2, 3, 15, 'normal', 0.5);
      const speed = Math.sqrt(b.vx*b.vx + b.vz*b.vz);
      const midpoint = SERVE_SPEED_MIN + (SERVE_SPEED_MAX - SERVE_SPEED_MIN) * 0.5;
      expect(speed).toBeCloseTo(midpoint, 2);
    });

    it('serve without power param falls back to timing_quality behavior', () => {
      const b = ball.new();
      ball.serve(b, 0, 2, 3, 15);
      const speed = Math.sqrt(b.vx*b.vx + b.vz*b.vz);
      expect(speed).toBeCloseTo(SERVE_NORMAL_SPEED, 2);
    });

    it('serve with power=1 has lower vy (flatter trajectory) than power=0', () => {
      const b1 = ball.new();
      ball.serve(b1, 0, 2, 3, 15, 'normal', 0);
      const b2 = ball.new();
      ball.serve(b2, 0, 2, 3, 15, 'normal', 1);
      expect(b2.vy).toBeLessThan(b1.vy);
    });
  });

  describe('just_bounced flag', () => {
    it('ball.new() initializes just_bounced to false', () => {
      const b = ball.new();
      expect(b.just_bounced).toBe(false);
    });

    it('just_bounced is true after a bounce', () => {
      court.init();
      const b = ball.new();
      b.state = BALL_IN_PLAY;
      b.y = BALL_RADIUS - 0.01;
      b.vy = -0.01;
      ball.update(b);
      expect(b.just_bounced).toBe(true);
    });

    it('just_bounced resets to false on next update after bounce', () => {
      court.init();
      const b = ball.new();
      b.state = BALL_IN_PLAY;
      b.y = BALL_RADIUS - 0.01;
      b.vy = -0.01;
      ball.update(b);
      expect(b.just_bounced).toBe(true);
      ball.update(b);
      expect(b.just_bounced).toBe(false);
    });
  });
});
