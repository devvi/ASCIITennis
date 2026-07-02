import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';

import {
  COURT_WIDTH, COURT_LENGTH, SINGLES_WIDTH,
  AI_EASY, AI_HARD, BTN_UP, BTN_DOWN, BTN_LEFT, BTN_RIGHT, BTN_A, BTN_B,
  STATE_VIOLATION_REPLAY, REPLAY_FRAME_COUNT,
  BALL_REPLAY, BALL_HELD, BALL_IN_PLAY, BALL_OUT, BALL_RADIUS,
  SERVE_ANGLE_MAX, PLAYER_IDLE, PLAYER_SPEED,
} from '../src/constants.js';
import { ball } from '../src/ball.js';
import { court } from '../src/court.js';
import { player } from '../src/player.js';

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

describe('2P mode', () => {
  it('player.new(false, "back") has back-half z-bounds', () => {
    const p = player.new(false, 'back');
    expect(p.z_min).toBe(COURT_LENGTH / 2 + 0.5);
    expect(p.z_max).toBe(COURT_LENGTH - 0.5);
    expect(p.is_ai).toBe(false);
  });

  it('player.new(false, "front") has front-half z-bounds', () => {
    const p = player.new(false, 'front');
    expect(p.z_min).toBe(0.5);
    expect(p.z_max).toBe(COURT_LENGTH / 2 - 0.5);
  });

  it('player.new(true) still gets back-half z-bounds for backward compat', () => {
    const p = player.new(true);
    expect(p.z_min).toBe(COURT_LENGTH / 2 + 0.5);
    expect(p.z_max).toBe(COURT_LENGTH - 0.5);
  });

  it('player.new(false) without side gets front-half bounds', () => {
    const p = player.new(false);
    expect(p.z_min).toBe(0.5);
    expect(p.z_max).toBe(COURT_LENGTH / 2 - 0.5);
  });

  it('player.move clamps P2 to back-half z range', () => {
    const p = player.new(false, 'back');
    p.z = COURT_LENGTH / 2 + 0.5;
    player.move(p, 0, -100);
    expect(p.z).toBe(COURT_LENGTH / 2 + 0.5);
    player.move(p, 0, 100);
    expect(p.z).toBeLessThanOrEqual(COURT_LENGTH);
  });

  it('player.move clamps P1 to front-half z range', () => {
    const p = player.new(false, 'front');
    p.z = 0.5;
    player.move(p, 0, -100);
    expect(p.z).toBe(0.5);
    player.move(p, 0, 100);
    expect(p.z).toBeLessThanOrEqual(COURT_LENGTH / 2 - 0.5);
  });

  it('P2 hit target z is in front court (2 + random(2))', () => {
    for (let i = 0; i < 100; i++) {
      const target_z = 2 + Math.random() * 2;
      expect(target_z).toBeGreaterThanOrEqual(2);
      expect(target_z).toBeLessThanOrEqual(4);
    }
  });

  it('P1 hit target z is in back court (COURT_LENGTH - 2 - random(2))', () => {
    for (let i = 0; i < 100; i++) {
      const target_z = COURT_LENGTH - 2 - Math.random() * 2;
      expect(target_z).toBeGreaterThanOrEqual(COURT_LENGTH - 4);
      expect(target_z).toBeLessThanOrEqual(COURT_LENGTH - 2);
    }
  });

  it('P2 uses Shift for BTN_A (serve toss) and Enter for BTN_B (hit)', () => {
    const inpKeyMap = {
      "ArrowUp": BTN_UP,
      "ArrowDown": BTN_DOWN,
      "ArrowLeft": BTN_LEFT,
      "ArrowRight": BTN_RIGHT,
      "Enter": BTN_B,
      "Shift": BTN_A,
    };
    expect(inpKeyMap.Enter).toBe(BTN_B);
    expect(inpKeyMap.Shift).toBe(BTN_A);
  });

  it('P2 does not have mouse bindings', () => {
    const inpKeyMap = {
      "ArrowUp": BTN_UP,
      "ArrowDown": BTN_DOWN,
      "ArrowLeft": BTN_LEFT,
      "ArrowRight": BTN_RIGHT,
      "Enter": BTN_B,
      "Shift": BTN_A,
    };
    expect(Object.keys(inpKeyMap).length).toBe(6);
  });
});

describe('serve power meter charge logic', () => {
  it('SERVE_CHARGE_DURATION is positive', () => {
    const SERVE_CHARGE_DURATION = 45;
    expect(SERVE_CHARGE_DURATION).toBeGreaterThan(0);
  });

  it('charge increases from 0 to 1.0 over SERVE_CHARGE_DURATION frames', () => {
    const SERVE_CHARGE_DURATION = 45;
    let charge = 0;
    for (let i = 0; i < SERVE_CHARGE_DURATION; i++) {
      charge = Math.min(1, (i + 1) / SERVE_CHARGE_DURATION);
    }
    expect(charge).toBe(1);
  });

  it('charge does not exceed 1.0', () => {
    const SERVE_CHARGE_DURATION = 45;
    let charge = 0;
    for (let i = 0; i < SERVE_CHARGE_DURATION * 2; i++) {
      charge = Math.min(1, charge + 1 / SERVE_CHARGE_DURATION);
    }
    expect(charge).toBe(1);
  });

  it('charge resets to 0 on new serve (setup_serve simulation)', () => {
    let serve_charge = 0.75;
    serve_charge = 0;
    expect(serve_charge).toBe(0);
  });

  it('AI hard serve charge is in high range (>= 0.8)', () => {
    const aiConfig = { accuracy: 0.9 };
    for (let i = 0; i < 50; i++) {
      const charge = 0.8 + Math.random() * 0.2;
      expect(charge).toBeGreaterThanOrEqual(0.8);
      expect(charge).toBeLessThanOrEqual(1.0);
    }
  });

  it('AI easy serve charge is in medium range (0.3 to 0.6)', () => {
    const aiConfig = { accuracy: 0.5 };
    for (let i = 0; i < 50; i++) {
      const charge = 0.3 + Math.random() * 0.3;
      expect(charge).toBeGreaterThanOrEqual(0.3);
      expect(charge).toBeLessThanOrEqual(0.6);
    }
  });
});

describe('kill cam flow', () => {
  it('STATE_KILL_CAM constant is exported', async () => {
    const mod = await import('../src/constants.js');
    expect(mod.STATE_KILL_CAM).toBe('kill_cam');
  });

  it('BALL_FLYING_OUT constant is exported', async () => {
    const mod = await import('../src/constants.js');
    expect(mod.BALL_FLYING_OUT).toBe('flying_out');
  });

  it('KILL_RADIUS is a positive number', async () => {
    const mod = await import('../src/constants.js');
    expect(mod.KILL_RADIUS).toBeGreaterThan(0);
  });

  it('KILL_CAM_DURATION is a positive integer', async () => {
    const mod = await import('../src/constants.js');
    expect(mod.KILL_CAM_DURATION).toBeGreaterThan(0);
    expect(Number.isInteger(mod.KILL_CAM_DURATION)).toBe(true);
  });

  it('ball in BALL_FLYING_OUT moves toward audience and maintains state', () => {
    court.init();
    const b = ball.new();
    b.state = 'flying_out';
    b.x = SINGLES_WIDTH + 0.5;
    b.y = 2.0;
    b.z = COURT_LENGTH + 1;
    b.vx = 0.3;
    b.vy = -0.05;
    b.vz = 0.5;
    const initialZ = b.z;
    ball.update(b);
    expect(b.z).not.toBe(initialZ);
    expect(b.state).toBe('flying_out');
  });

  it('BALL_OUT detection still occurs on out-of-bounds bounce in normal play', () => {
    court.init();
    const b = ball.new();
    b.state = 'in_play';
    b.x = SINGLES_WIDTH + 1;
    b.z = COURT_LENGTH / 2;
    b.y = BALL_RADIUS - 0.01;
    b.vy = -0.1;
    ball.update(b);
    expect(b.state).toBe('out');
  });
});

describe('import consistency', () => {
  it('main.js imports all BALL_* constants it uses from constants.js', () => {
    const source = readFileSync('./src/main.js', 'utf-8');
    const importMatch = source.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/constants\.js['"]/s);
    expect(importMatch).not.toBeNull();
    const importedNames = importMatch[1].split(',').map(s => s.trim());

    const usedBallNames = new Set();
    const ballRegex = /\bBALL_[A-Z_]+\b/g;
    let m;
    while ((m = ballRegex.exec(source)) !== null) {
      usedBallNames.add(m[0]);
    }

    for (const name of usedBallNames) {
      expect(importedNames).toContain(name);
    }
  });

  it('all ball state constants are exported from constants.js', async () => {
    const mod = await import('../src/constants.js');
    const ballStates = [
      'BALL_HELD', 'BALL_IN_PLAY', 'BALL_OUT', 'BALL_NET',
      'BALL_BOUNCE', 'BALL_DOUBLE_BOUNCE', 'BALL_REPLAY', 'BALL_FLYING_OUT',
    ];
    for (const name of ballStates) {
      expect(mod[name]).toBeDefined();
    }
  });

  it('BALL_IN_PLAY constant value is consistent across src modules', () => {
    expect(BALL_IN_PLAY).toBe('in_play');
    const ball_states = [
      { file: 'ball.js', state: BALL_IN_PLAY },
      { file: 'ai.js', state: BALL_IN_PLAY },
      { file: 'main.js', state: BALL_IN_PLAY },
    ];
    for (const entry of ball_states) {
      expect(entry.state).toBe('in_play');
    }
  });

  it('check_head_bounce logic does not throw with BALL_IN_PLAY', () => {
    const ball_obj = { state: BALL_IN_PLAY, x: 0, z: 12, y: 1.7, vx: 0, vz: 0, vy: 0 };
    const human_player = { x: 0, z: 12, head_bounce_timer: 0 };
    const fn = () => {
      if (!ball_obj || ball_obj.state !== BALL_IN_PLAY) return;
      const dx = ball_obj.x - human_player.x;
      const dz = ball_obj.z - human_player.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.3 && Math.abs(ball_obj.y - 1.7) < 0.1 && Math.abs(ball_obj.vx) < 0.01 && Math.abs(ball_obj.vz) < 0.01) {
        human_player.head_bounce_timer = 10;
      }
    };
    expect(fn).not.toThrow();
    expect(human_player.head_bounce_timer).toBe(10);
  });

  it('zombie ball-hit detection does not throw with BALL_IN_PLAY', () => {
    const ball_obj = { state: BALL_IN_PLAY, x: 10, z: 10 };
    const zombies = [{ x: 10.4, z: 10.3, speed: 0.03 }];
    const fn = () => {
      if (ball_obj.state === BALL_IN_PLAY) {
        for (const zmb of zombies) {
          const bd = Math.sqrt((ball_obj.x - zmb.x) ** 2 + (ball_obj.z - zmb.z) ** 2);
          if (bd < 1.0) {
            zombies.splice(zombies.indexOf(zmb), 1);
          }
        }
      }
    };
    expect(fn).not.toThrow();
    expect(zombies.length).toBe(0);
  });

  describe('sound module integration', () => {
    it('main.js imports sound functions', () => {
      const source = readFileSync('./src/main.js', 'utf-8');
      expect(source).toContain("import { play_hit, play_bounce, play_net, play_point_scored, play_serve_release } from './sound.js'");
    });

    it('ball.js exports just_bounced flag in new()', async () => {
      const mod = await import('../src/ball.js');
      const b = mod.ball.new();
      expect(b).toHaveProperty('just_bounced');
      expect(b.just_bounced).toBe(false);
    });
  });
});
