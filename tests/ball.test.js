import { describe, it, expect } from 'vitest';
import {
  BALL_HELD, BALL_IN_PLAY, BALL_OUT, BALL_NET, BALL_BOUNCE,
  BALL_RADIUS, COURT_LENGTH, NET_HEIGHT,
  HIT_FLAT, HIT_TOPSPIN, HIT_SLICE, HIT_LOB,
  HIT_HEIGHT_MIN, HIT_HEIGHT_MAX,
  AIR_RESISTANCE, GRAVITY,
  HEIGHT_DRAG_STRENGTH, HEIGHT_DRAG_MAX_Y,
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
    ball.serve(b, 0, 2, 3, 15);
    expect(b.state).toBe(BALL_IN_PLAY);
    expect(b.x).toBe(0);
    expect(b.z).toBe(2);
    expect(b.y).toBe(1.5);
    expect(b.bounces).toBe(0);
  });

  it('serve with zero distance target does not crash', () => {
    const b = ball.new();
    ball.serve(b, 0, 2, 0, 2);
    expect(b.state).toBe(BALL_IN_PLAY);
  });

  it('update moves ball when in play', () => {
    const b = ball.new();
    court.init();
    ball.serve(b, 0, 2, 0, 15);
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

  it('detects bounce when ball hits ground', () => {
    const b = ball.new();
    court.init();
    ball.serve(b, 0, 2, 0, 3);
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

  it('ball becomes out after 3 bounces', () => {
    const b = ball.new();
    court.init();
    b.state = BALL_IN_PLAY;
    for (let i = 0; i < 5; i++) {
      b.y = BALL_RADIUS - 0.01;
      b.vy = -0.1;
      ball.update(b);
    }
    expect(b.state).toBe(BALL_OUT);
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

  it('ball goes out when past baseline', () => {
    const b = ball.new();
    court.init();
    b.state = BALL_IN_PLAY;
    b.z = COURT_LENGTH + 3;
    ball.update(b);
    expect(b.state).toBe(BALL_OUT);
  });

  it('ball goes out when behind player', () => {
    const b = ball.new();
    court.init();
    b.state = BALL_IN_PLAY;
    b.z = -3;
    ball.update(b);
    expect(b.state).toBe(BALL_OUT);
  });

  describe('height visual drag', () => {
    it('applies visual offset when ball is at high y', () => {
      const b = ball.new();
      court.init();
      b.state = BALL_IN_PLAY;
      b.x = 0;
      b.y = 2.0;
      b.z = 10;
      b.draw_x = 0;
      b.draw_z = 10;
      b.vx = 0.5;
      b.vz = -0.3;
      b.vy = 0;
      b.spin_x = 0;
      b.spin_z = 0;
      ball.update(b);
      expect(b.draw_x).toBeLessThan(b.x);
      expect(b.draw_z).toBeGreaterThan(b.z);
    });

    it('applies minimal visual offset when ball is at ground level', () => {
      const b = ball.new();
      court.init();
      b.state = BALL_IN_PLAY;
      b.x = 0;
      b.y = BALL_RADIUS;
      b.z = 10;
      b.draw_x = 0;
      b.draw_z = 10;
      b.vx = 0.5;
      b.vz = -0.3;
      b.vy = -GRAVITY;
      b.spin_x = 0;
      b.spin_z = 0;
      ball.update(b);
      expect(b.draw_x).toBeCloseTo(b.x, 2);
      expect(b.draw_z).toBeCloseTo(b.z, 2);
    });

    it('applies intermediate visual offset at mid height', () => {
      const b = ball.new();
      court.init();
      b.state = BALL_IN_PLAY;
      b.x = 0;
      b.y = 1.0;
      b.z = 10;
      b.draw_x = 0;
      b.draw_z = 10;
      b.vx = 0.5;
      b.vz = -0.3;
      b.vy = 0;
      b.spin_x = 0;
      b.spin_z = 0;
      const high_b = ball.new();
      high_b.state = BALL_IN_PLAY;
      high_b.x = 0;
      high_b.y = 2.0;
      high_b.z = 10;
      high_b.draw_x = 0;
      high_b.draw_z = 10;
      high_b.vx = 0.5;
      high_b.vz = -0.3;
      high_b.vy = 0;
      high_b.spin_x = 0;
      high_b.spin_z = 0;
      ball.update(b);
      ball.update(high_b);
      const mid_dx = Math.abs(b.x - b.draw_x);
      const high_dx = Math.abs(high_b.x - high_b.draw_x);
      expect(mid_dx).toBeGreaterThan(0);
      expect(high_dx).toBeGreaterThan(mid_dx);
    });

    it('height drag does not affect physics velocity', () => {
      const b = ball.new();
      court.init();
      b.state = BALL_IN_PLAY;
      b.x = 0;
      b.y = 2.0;
      b.z = 10;
      b.draw_x = 0;
      b.draw_z = 10;
      b.vx = 0.5;
      b.vz = -0.3;
      b.vy = -0.05;
      b.spin_x = 0;
      b.spin_z = 0;
      const vx_before = b.vx;
      const vz_before = b.vz;
      const vy_before = b.vy;
      ball.update(b);
      expect(b.vy).toBe(vy_before + GRAVITY);
      expect(b.vx).toBe(vx_before - vx_before * AIR_RESISTANCE);
      expect(b.vz).toBe(vz_before - vz_before * AIR_RESISTANCE);
    });

    it('height drag does not affect ball when state is not BALL_IN_PLAY', () => {
      const b = ball.new();
      court.init();
      b.state = BALL_HELD;
      b.x = 0;
      b.y = 2.0;
      b.z = 10;
      b.draw_x = 0;
      b.draw_z = 10;
      b.vx = 0.5;
      b.vz = -0.3;
      b.vy = 0;
      b.spin_x = 0;
      b.spin_z = 0;
      const vx_before = b.vx;
      const vz_before = b.vz;
      const dx_before = b.draw_x;
      const dz_before = b.draw_z;
      ball.update(b);
      expect(b.vx).toBe(vx_before);
      expect(b.vz).toBe(vz_before);
      expect(b.draw_x).toBe(dx_before);
      expect(b.draw_z).toBe(dz_before);
    });

    it('landing prediction still returns a reasonable result for ball under height drag', () => {
      const b = ball.new();
      court.init();
      ball.hit(b, 0, 1.0, 10, 5, 5, HIT_FLAT);
      b.spin_x = 0;
      b.spin_z = 0;
      for (let i = 0; i < 10; i++) {
        ball.update(b);
      }
      if (b.state === BALL_IN_PLAY) {
        const landing = ball.predict_landing(b);
        if (landing !== null) {
          expect(typeof landing.x).toBe('number');
          expect(typeof landing.z).toBe('number');
          expect(landing.z).toBeLessThanOrEqual(COURT_LENGTH);
        }
      }
    });

    it('draw_x and draw_z are initialized on new ball', () => {
      const b = ball.new();
      expect(b.draw_x).toBe(0);
      expect(b.draw_z).toBe(0);
    });
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
});
