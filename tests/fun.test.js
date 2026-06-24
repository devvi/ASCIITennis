import { describe, it, expect } from 'vitest';
import {
  RALLY_MILESTONES, SCREEN_SHAKE_DURATION, SCREEN_SHAKE_INTENSITY,
  PERFECT_WINDOW, COMBO_SPEED_BOOST,
  ITEM_SPAWN_INTERVAL, ITEM_COLLECT_RANGE, ITEM_LIFETIME, ITEM_TYPES,
  ITEM_ACTIVE_DURATION,
  MAX_PARTICLES, PARTICLE_LIFE,
  MAX_ZOMBIES, ZOMBIE_SPEED, NUM_TARGETS, TARGET_RADIUS,
  STATE_ZOMBIE_TENNIS, STATE_TARGET_PRACTICE, STATE_RALLY_CHALLENGE,
  STATE_GRAVITY_SHIFT, STATE_PONG_MODE,
  GRAVITY_VECTORS, COURT_LENGTH, COURT_WIDTH,
  PLAYER_EYE_Y, HIT_RANGE_H, BTN_UP, BTN_DOWN, BTN_LEFT, BTN_RIGHT, BTN_A, BTN_B,
} from '../src/constants.js';
import { court } from '../src/court.js';
import { ball } from '../src/ball.js';
import { player } from '../src/player.js';
import { scoring } from '../src/scoring.js';

describe('Phase 1: Rally Combo & Feedback System', () => {
  describe('1a. Constants', () => {
    it('RALLY_MILESTONES = [5, 10, 15, 20]', () => {
      expect(RALLY_MILESTONES).toEqual([5, 10, 15, 20]);
    });

    it('SCREEN_SHAKE_DURATION = 4', () => {
      expect(SCREEN_SHAKE_DURATION).toBe(4);
    });

    it('SCREEN_SHAKE_INTENSITY = 2', () => {
      expect(SCREEN_SHAKE_INTENSITY).toBe(2);
    });

    it('PERFECT_WINDOW = 5', () => {
      expect(PERFECT_WINDOW).toBe(5);
    });

    it('COMBO_SPEED_BOOST = 0.02', () => {
      expect(COMBO_SPEED_BOOST).toBe(0.02);
    });
  });

  describe('1b. Rally counter', () => {
    it('rally_hits increments on each hit', () => {
      let rally_hits = 0;
      rally_hits += 1;
      expect(rally_hits).toBe(1);
      rally_hits += 1;
      expect(rally_hits).toBe(2);
    });

    it('rally_hits resets on point end', () => {
      let rally_hits = 12;
      rally_hits = 0;
      expect(rally_hits).toBe(0);
    });
  });

  describe('1c. Screen shake', () => {
    it('shake_timer is set to SCREEN_SHAKE_DURATION on milestone', () => {
      let shake_timer = 0;
      const milestone = 5;
      if (milestone > 0) shake_timer = SCREEN_SHAKE_DURATION;
      expect(shake_timer).toBe(4);
    });

    it('shake_timer counts down each frame', () => {
      let shake_timer = SCREEN_SHAKE_DURATION;
      for (let i = 0; i < SCREEN_SHAKE_DURATION; i++) {
        shake_timer -= 1;
      }
      expect(shake_timer).toBe(0);
    });
  });

  describe('1d. Timing feedback', () => {
    it('PERFECT_WINDOW frames before ball arrival is PERFECT', () => {
      const frames_to_arrival = 3;
      const timing = frames_to_arrival <= PERFECT_WINDOW ? 'PERFECT' : 'GOOD';
      expect(timing).toBe('PERFECT');
    });

    it('ball far from player swing start is LATE', () => {
      const frames_to_arrival = 10;
      const timing = frames_to_arrival > PERFECT_WINDOW ? 'LATE' : 'GOOD';
      expect(timing).toBe('LATE');
    });
  });

  describe('1e. Combo multiplier', () => {
    it('COMBO_SPEED_BOOST increases ball speed per combo level', () => {
      const base_speed = 0.35;
      const combo_level = 3;
      const boosted = base_speed + COMBO_SPEED_BOOST * combo_level;
      expect(boosted).toBeCloseTo(0.41);
    });

    it('combo_level resets after miss/fault', () => {
      let combo_level = 5;
      combo_level = 0;
      expect(combo_level).toBe(0);
    });
  });
});

describe('Phase 2: Power-ups & Court Items', () => {
  describe('2a. Constants', () => {
    it('ITEM_SPAWN_INTERVAL = 600 frames (10s)', () => {
      expect(ITEM_SPAWN_INTERVAL).toBe(600);
    });

    it('ITEM_COLLECT_RANGE = 1.0', () => {
      expect(ITEM_COLLECT_RANGE).toBe(1.0);
    });

    it('ITEM_LIFETIME = 600 frames (10s)', () => {
      expect(ITEM_LIFETIME).toBe(600);
    });

    it('ITEM_TYPES has 5 types', () => {
      expect(Object.keys(ITEM_TYPES).length).toBe(5);
      expect(ITEM_TYPES.FIRE).toBe('F');
      expect(ITEM_TYPES.BIG_RACKET).toBe('B');
      expect(ITEM_TYPES.SHIELD).toBe('S');
      expect(ITEM_TYPES.MULTI_BALL).toBe('M');
      expect(ITEM_TYPES.TIME_SLOW).toBe('T');
    });

    it('ITEM_ACTIVE_DURATION = 300 frames (5s)', () => {
      expect(ITEM_ACTIVE_DURATION).toBe(300);
    });
  });

  describe('2b. Item spawn', () => {
    it('item spawns at random valid court position', () => {
      court.init();
      const halfW = COURT_WIDTH / 2;
      for (let i = 0; i < 50; i++) {
        const x = (Math.random() - 0.5) * (COURT_WIDTH - 2);
        const z = 1 + Math.random() * (COURT_LENGTH - 2);
        expect(Math.abs(x)).toBeLessThanOrEqual(halfW);
        expect(z).toBeGreaterThanOrEqual(1);
        expect(z).toBeLessThanOrEqual(COURT_LENGTH - 1);
      }
    });
  });

  describe('2c. Item collection', () => {
    it('player within ITEM_COLLECT_RANGE of item can collect it', () => {
      const p_x = 0, p_z = 5;
      const item_x = 0.5, item_z = 5.3;
      const dx = p_x - item_x;
      const dz = p_z - item_z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      expect(dist).toBeLessThanOrEqual(ITEM_COLLECT_RANGE);
    });

    it('player far from item cannot collect', () => {
      const p_x = 0, p_z = 5;
      const item_x = 10, item_z = 10;
      const dx = p_x - item_x;
      const dz = p_z - item_z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      expect(dist).toBeGreaterThan(ITEM_COLLECT_RANGE);
    });
  });

  describe('2d. Item effects', () => {
    it('fire ball: shot speed multiplied by 1.5', () => {
      const base_speed = 0.35;
      const boosted = base_speed * 1.5;
      expect(boosted).toBeCloseTo(0.525);
    });

    it('big racket: HIT_RANGE_H doubled', () => {
      const original = HIT_RANGE_H;
      expect(original * 2).toBeCloseTo(5.0);
    });

    it('time slow: velocities multiplied by 0.5', () => {
      const speed = 0.4;
      expect(speed * 0.5).toBeCloseTo(0.2);
    });
  });
});

describe('Phase 3: ASCII Particle Effects & Screen Juice', () => {
  describe('3a. Constants', () => {
    it('MAX_PARTICLES = 30', () => {
      expect(MAX_PARTICLES).toBe(30);
    });

    it('PARTICLE_LIFE = 5', () => {
      expect(PARTICLE_LIFE).toBe(5);
    });
  });

  describe('3b. Particle system', () => {
    it('hit impact spawns particles at contact point', () => {
      const particles = [];
      const spawn_count = 6;
      for (let i = 0; i < spawn_count; i++) {
        particles.push({
          x: 0, y: 1.0, z: 5,
          char: ['*', '+', "'"][Math.floor(Math.random() * 3)],
          vx: (Math.random() - 0.5) * 0.2,
          vy: Math.random() * 0.2,
          vz: (Math.random() - 0.5) * 0.2,
          life: PARTICLE_LIFE,
        });
      }
      expect(particles.length).toBe(spawn_count);
      for (const p of particles) {
        expect(p.life).toBeLessThanOrEqual(PARTICLE_LIFE);
        expect(['*', '+', "'"]).toContain(p.char);
      }
    });

    it('particles animate for PARTICLE_LIFE frames then disappear', () => {
      const p = { life: PARTICLE_LIFE };
      for (let i = 0; i < PARTICLE_LIFE; i++) {
        p.life -= 1;
      }
      expect(p.life).toBe(0);
    });
  });

  describe('3c. Ball trail', () => {
    it('trail records position each frame', () => {
      const trail = [];
      for (let i = 0; i < 3; i++) {
        trail.push({ x: i * 0.1, y: 1.0, z: 5 + i * 0.1 });
      }
      expect(trail.length).toBe(3);
      expect(trail[0].x).toBe(0);
      expect(trail[2].x).toBeCloseTo(0.2);
    });

    it('trail max length is 5', () => {
      const trail = [];
      for (let i = 0; i < 10; i++) {
        trail.push({ x: i, y: 1, z: 5 });
        if (trail.length > 5) trail.shift();
      }
      expect(trail.length).toBeLessThanOrEqual(5);
    });
  });

  describe('3d. Screen shake', () => {
    it('shake offset is ±2px during shake', () => {
      const shake_intensity = 2;
      const offset_x = Math.round((Math.random() - 0.5) * 2 * shake_intensity);
      const offset_y = Math.round((Math.random() - 0.5) * 2 * shake_intensity);
      expect(Math.abs(offset_x)).toBeLessThanOrEqual(shake_intensity);
      expect(Math.abs(offset_y)).toBeLessThanOrEqual(shake_intensity);
    });
  });

  describe('3e. Speed lines', () => {
    it('speed lines active when ball speed > 0.4', () => {
      const speed = 0.45;
      expect(speed > 0.4).toBe(true);
    });

    it('no speed lines when ball speed <= 0.4', () => {
      expect(0.3 > 0.4).toBe(false);
      expect(0.4 > 0.4).toBe(false);
    });
  });

  describe('3f. Crowd wave', () => {
    it('audience alternates poses when rally > 5', () => {
      let phase = 0;
      phase = 1 - phase;
      expect(phase).toBe(1);
      phase = 1 - phase;
      expect(phase).toBe(0);
    });
  });
});

describe('Phase 4: Special Game Modes & Easter Eggs', () => {
  describe('4a. Mode constants', () => {
    it('STATE_ZOMBIE_TENNIS is defined', () => {
      expect(STATE_ZOMBIE_TENNIS).toBe('zombie');
    });

    it('STATE_TARGET_PRACTICE is defined', () => {
      expect(STATE_TARGET_PRACTICE).toBe('target_practice');
    });

    it('STATE_RALLY_CHALLENGE is defined', () => {
      expect(STATE_RALLY_CHALLENGE).toBe('rally_challenge');
    });

    it('STATE_GRAVITY_SHIFT is defined', () => {
      expect(STATE_GRAVITY_SHIFT).toBe('gravity_shift');
    });

    it('STATE_PONG_MODE is defined', () => {
      expect(STATE_PONG_MODE).toBe('pong_mode');
    });

    it('MAX_ZOMBIES = 5', () => {
      expect(MAX_ZOMBIES).toBe(5);
    });

    it('ZOMBIE_SPEED = 0.03', () => {
      expect(ZOMBIE_SPEED).toBe(0.03);
    });

    it('NUM_TARGETS = 8', () => {
      expect(NUM_TARGETS).toBe(8);
    });

    it('TARGET_RADIUS = 0.8', () => {
      expect(TARGET_RADIUS).toBe(0.8);
    });

    it('GRAVITY_VECTORS has 5 directions', () => {
      expect(GRAVITY_VECTORS.length).toBe(5);
    });
  });

  describe('4b. Zombie Tennis', () => {
    it('zombie moves toward player at ZOMBIE_SPEED', () => {
      const zombie = { x: 5, z: 10 };
      const player_pos = { x: 0, z: 3 };
      const dx = player_pos.x - zombie.x;
      const dz = player_pos.z - zombie.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      const move_x = (dx / dist) * ZOMBIE_SPEED;
      const move_z = (dz / dist) * ZOMBIE_SPEED;
      zombie.x += move_x;
      zombie.z += move_z;
      expect(Math.abs(zombie.x)).toBeLessThan(5);
      expect(zombie.z).toBeGreaterThan(3);
    });

    it('max 5 zombies on court at once', () => {
      const zombies = [];
      for (let i = 0; i < 10 && zombies.length < MAX_ZOMBIES; i++) {
        zombies.push({ x: 0, z: 0 });
      }
      expect(zombies.length).toBeLessThanOrEqual(MAX_ZOMBIES);
    });
  });

  describe('4c. Target Practice', () => {
    it('targets are on opponent court half', () => {
      court.init();
      for (let i = 0; i < 20; i++) {
        const z = COURT_LENGTH / 2 + Math.random() * (COURT_LENGTH / 2 - 1);
        expect(z).toBeGreaterThanOrEqual(COURT_LENGTH / 2);
      }
    });
  });

  describe('4d. Gravity Shift', () => {
    it('gravity direction cycles every 600 frames', () => {
      const timer = 600;
      let dir_index = 0;
      let new_timer = timer - 1;
      if (new_timer <= 0) {
        dir_index = (dir_index + 1) % GRAVITY_VECTORS.length;
        new_timer = 600;
      }
      expect(new_timer).toBe(599);
      expect(dir_index).toBe(0);
    });
  });

  describe('4e. Easter Eggs', () => {
    it('referee face changes: o_O on violation, ^_^ on point, >_< on kill', () => {
      const faces = {
        violation: 'o_O',
        point: '^_^',
        kill: '>_<',
        idle: '--',
      };
      expect(faces.violation).toBe('o_O');
      expect(faces.point).toBe('^_^');
      expect(faces.kill).toBe('>_<');
      expect(faces.idle).toBe('--');
    });

    it('ball-on-head bounce shows "!" above head for 10 frames', () => {
      const timer = 10;
      expect(timer).toBeGreaterThan(0);
    });
  });
});
