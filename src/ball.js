import {
  BALL_HELD, BALL_IN_PLAY, BALL_OUT, BALL_NET, BALL_BOUNCE,
  BALL_RADIUS, COURT_LENGTH,
  GRAVITY, BOUNCE_FACTOR, SPIN_FACTOR, AIR_RESISTANCE,
  HIT_PARAMS, HIT_FLAT,
} from './constants.js';
import { court } from './court.js';

export const ball = {
  new() {
    return {
      x: 0, y: 1.0, z: 0,
      vx: 0, vy: 0, vz: 0,
      spin_x: 0, spin_z: 0,
      state: BALL_HELD,
      bounces: 0,
    };
  },

  update(b) {
    if (b.state !== BALL_IN_PLAY) return;

    const prev_z = b.z;

    b.vx = b.vx - b.vx * AIR_RESISTANCE + b.spin_x * SPIN_FACTOR;
    b.vz = b.vz - b.vz * AIR_RESISTANCE + b.spin_z * SPIN_FACTOR;
    b.vy = b.vy + GRAVITY;

    b.x = b.x + b.vx;
    b.y = b.y + b.vy;
    b.z = b.z + b.vz;

    if (b.y < BALL_RADIUS) {
      b.y = BALL_RADIUS;
      b.vy = -b.vy * BOUNCE_FACTOR;
      b.vx = b.vx * 0.8;
      b.vz = b.vz * 0.8;
      b.bounces += 1;

      if (b.bounces > 2) {
        b.state = BALL_OUT;
      }
    }

    if (court.hits_net(b.x, b.z, prev_z, b.y)) {
      b.state = BALL_NET;
      return;
    }

    if (!court.is_in_bounds(b.x, b.z)) {
      if (b.bounces > 0) {
        b.state = BALL_OUT;
      }
    }

    if (b.z > COURT_LENGTH + 2) {
      b.state = BALL_OUT;
    }
    if (b.z < -2) {
      b.state = BALL_OUT;
    }
  },

  serve(b, from_x, from_z, target_x, target_z) {
    const dx = target_x - from_x;
    const dz = target_z - from_z;
    let dist = Math.sqrt(dx*dx + dz*dz);
    if (dist < 0.01) dist = 0.01;
    const serve_speed = 0.45;
    b.x = from_x;
    b.y = 1.5;
    b.z = from_z;
    b.vx = (dx / dist) * serve_speed;
    b.vz = (dz / dist) * serve_speed;
    b.vy = 1.2;
    b.spin_x = 0;
    b.spin_z = 0;
    b.bounces = 0;
    b.state = BALL_IN_PLAY;
  },

  hit(b, hit_x, hit_y, hit_z, target_x, target_z, hit_type) {
    const params = HIT_PARAMS[hit_type] || HIT_PARAMS[HIT_FLAT];

    const dx = target_x - hit_x;
    const dz = target_z - hit_z;
    let dist = Math.sqrt(dx*dx + dz*dz);
    if (dist < 0.01) dist = 0.01;

    const speed = params.speed;
    b.x = hit_x;
    b.y = hit_y;
    b.z = hit_z;
    b.vx = (dx / dist) * speed;
    b.vz = (dz / dist) * speed;
    b.vy = 1.5 + params.arc * 2;
    b.spin_x = Math.random() * params.spin * 2 - params.spin;
    b.spin_z = params.spin * 0.5;
    b.bounces = 0;
    b.state = BALL_IN_PLAY;
  },
};
