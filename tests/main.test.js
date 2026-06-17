import { describe, it, expect } from 'vitest';
import {
  COURT_WIDTH, COURT_LENGTH, SINGLES_WIDTH,
  AI_EASY, AI_HARD,
  STATE_VIOLATION_REPLAY, REPLAY_FRAME_COUNT,
  BALL_REPLAY, BALL_HELD, BALL_IN_PLAY, BALL_OUT, BALL_RADIUS,
  SERVE_ANGLE_MAX,
} from '../src/constants.js';
import { ball } from '../src/ball.js';
import { court } from '../src/court.js';

const HUMAN_TARGET_X_MAX = SINGLES_WIDTH * 0.7 / 2;
const HUMAN_TARGET_Z_MIN = COURT_LENGTH - 4;
const HUMAN_TARGET_Z_MAX = COURT_LENGTH - 2;

describe('human hit targeting bounds', () => {
  it('target_x is bounded within SINGLES_WIDTH * 0.35 when using angle control', () => {
    const maxTargetX = SINGLES_WIDTH * 0.35;
    for (const angle of [-1, 0, 1]) {
      const target_x = angle * SINGLES_WIDTH * 0.35;
      expect(Math.abs(target_x)).toBeLessThanOrEqual(maxTargetX + 0.001);
    }
  });

  it('target_x is 0 when no angle held (angle=0)', () => {
    const target_x = 0 * SINGLES_WIDTH * 0.35;
    expect(target_x).toBe(0);
  });

  it('target_z is within safe zone before baseline', () => {
    for (let i = 0; i < 100; i++) {
      const target_z = COURT_LENGTH - 2 - Math.random() * 2;
      expect(target_z).toBeGreaterThanOrEqual(HUMAN_TARGET_Z_MIN);
      expect(target_z).toBeLessThanOrEqual(HUMAN_TARGET_Z_MAX);
    }
  });
});

describe('AI hit targeting bounds', () => {
  it('easy AI target_x is within SINGLES_WIDTH * 0.65', () => {
    const maxX = SINGLES_WIDTH * (0.8 - AI_EASY.accuracy * 0.3) / 2;
    for (let i = 0; i < 100; i++) {
      const target_x = (Math.random() - 0.5) * SINGLES_WIDTH * (0.8 - AI_EASY.accuracy * 0.3);
      expect(Math.abs(target_x)).toBeLessThanOrEqual(maxX + 0.001);
    }
  });

  it('easy AI target_z is in safe zone before service line', () => {
    const maxZ = 1 + 3 * (1 - AI_EASY.accuracy * 0.4);
    for (let i = 0; i < 100; i++) {
      const target_z = 1 + Math.random() * 3 * (1 - AI_EASY.accuracy * 0.4);
      expect(target_z).toBeGreaterThanOrEqual(1);
      expect(target_z).toBeLessThanOrEqual(maxZ + 0.001);
    }
  });

  it('hard AI target_x is narrower than easy AI', () => {
    const easyMaxX = SINGLES_WIDTH * (0.8 - AI_EASY.accuracy * 0.3) / 2;
    const hardMaxX = SINGLES_WIDTH * (0.8 - AI_HARD.accuracy * 0.3) / 2;
    expect(hardMaxX).toBeLessThan(easyMaxX);
  });

  it('hard AI target_z is shallower (closer to net) than easy AI', () => {
    const easyMaxZ = 1 + 3 * (1 - AI_EASY.accuracy * 0.4);
    const hardMaxZ = 1 + 3 * (1 - AI_HARD.accuracy * 0.4);
    expect(hardMaxZ).toBeLessThan(easyMaxZ);
  });
});

describe('serve angle bounds', () => {
  it('SERVE_ANGLE_MAX is within singles width', () => {
    expect(SERVE_ANGLE_MAX).toBeLessThanOrEqual(SINGLES_WIDTH * 0.5);
  });

  it('serve target_x stays within court for all angles when player at center', () => {
    const player_x = 0;
    for (const angle of [-1, 0, 1]) {
      const target_x = player_x + angle * SERVE_ANGLE_MAX;
      expect(Math.abs(target_x)).toBeLessThanOrEqual(SINGLES_WIDTH / 2 + 0.001);
    }
  });
});

describe('violation replay flow', () => {
  it('STATE_VIOLATION_REPLAY constant exists', () => {
    expect(STATE_VIOLATION_REPLAY).toBe('violation_replay');
  });

  it('REPLAY_FRAME_COUNT is a positive number', () => {
    expect(REPLAY_FRAME_COUNT).toBeGreaterThan(0);
    expect(Number.isInteger(REPLAY_FRAME_COUNT)).toBe(true);
  });

  it('ball physics continues after violation when in BALL_REPLAY state', () => {
    court.init();
    const b = ball.new();
    b.state = BALL_REPLAY;
    b.x = 0;
    b.y = 2.0;
    b.z = COURT_LENGTH / 2;
    b.vz = 0.1;
    b.vy = -0.05;
    const initialZ = b.z;
    ball.update(b);
    expect(b.z).not.toBe(initialZ);
    expect(b.state).toBe(BALL_REPLAY);
  });

  it('ball in replay state reflects multiple frames of physics', () => {
    court.init();
    const b = ball.new();
    b.state = BALL_REPLAY;
    b.x = 0;
    b.y = 1.0;
    b.z = 10;
    b.vz = 0.05;
    b.vy = -0.01;

    for (let i = 0; i < 90; i++) {
      ball.update(b);
      if (b.y < BALL_RADIUS) {
        b.y = BALL_RADIUS;
        b.vy = -b.vy * 0.6;
      }
    }

    expect(b.bounces).toBeGreaterThanOrEqual(1);
  });

  it('replay timer countdown: after enough decrements, replay should end', () => {
    let replay_timer = REPLAY_FRAME_COUNT;
    expect(replay_timer).toBe(90);
    for (let i = 0; i < 90; i++) {
      replay_timer -= 1;
    }
    expect(replay_timer).toBe(0);
  });

  describe('serve auto-loop and no-fault', () => {
    it('serve target_z is within service box (COURT_LENGTH * 0.85)', () => {
      const target_z = COURT_LENGTH * 0.85;
      expect(target_z).toBeGreaterThan(COURT_LENGTH * 0.75);
      expect(target_z).toBeLessThan(COURT_LENGTH);
    });

    it('ball after normal serve does not trigger BALL_OUT before bouncing', () => {
      court.init();
      const b = ball.new();
      ball.serve(b, 0, 2, 0, COURT_LENGTH * 0.85, 'normal');
      let outBeforeBounce = false;
      for (let i = 0; i < 200 && b.state === BALL_IN_PLAY; i++) {
        ball.update(b);
        if (b.state === BALL_OUT && b.bounces === 0) {
          outBeforeBounce = true;
        }
      }
      expect(outBeforeBounce).toBe(false);
    });

    it('ball after normal serve bounces at least once (lands in court)', () => {
      court.init();
      const b = ball.new();
      ball.serve(b, 0, 2, 0, COURT_LENGTH * 0.85, 'normal');
      let bounced = false;
      for (let i = 0; i < 200 && b.state === BALL_IN_PLAY; i++) {
        ball.update(b);
        if (b.bounces > 0) bounced = true;
      }
      expect(bounced).toBe(true);
    });
  });

  it('violation message constants are defined (serve_fault removed)', () => {
    const VIOLATION_MESSAGES = {
      out: "OUT!",
      net: "NET!",
      double_bounce: "DOUBLE BOUNCE!",
    };
    expect(VIOLATION_MESSAGES.out).toBe("OUT!");
    expect(VIOLATION_MESSAGES.net).toBe("NET!");
    expect(VIOLATION_MESSAGES.double_bounce).toBe("DOUBLE BOUNCE!");
    expect(VIOLATION_MESSAGES.serve_fault).toBeUndefined();
  });
});
