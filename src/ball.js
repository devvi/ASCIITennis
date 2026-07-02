import {
  BALL_HELD, BALL_IN_PLAY, BALL_REPLAY, BALL_OUT, BALL_NET, BALL_BOUNCE, BALL_DOUBLE_BOUNCE,
  BALL_FLYING_OUT,
  BALL_RADIUS, COURT_LENGTH,
  GRAVITY, BOUNCE_FACTOR, SPIN_FACTOR, AIR_RESISTANCE,
  HIT_PARAMS, HIT_FLAT, HIT_TOPSPIN, HIT_SLICE, HIT_LOB, COURT_WIDTH,
  SERVE_SPEED_MAX, SERVE_SPEED_MIN, SERVE_S_SPEED_MULT, SERVE_NORMAL_SPEED,
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
      last_hit_by: null,
      last_bounce_side: null,
      trail: [],
      show_speed_lines: false,
      trail_char: 'o',
      just_bounced: false,
    };
  },

  update(b, gravity_override) {
    const is_replay = b.state === BALL_REPLAY;
    const is_flying = b.state === BALL_FLYING_OUT;
    if (b.state !== BALL_IN_PLAY && !is_replay && !is_flying) return;

    b.just_bounced = false;

    if (is_flying) {
      b.vx = b.vx - b.vx * AIR_RESISTANCE + (b.spin_x || 0) * SPIN_FACTOR;
      b.vz = b.vz - b.vz * AIR_RESISTANCE + (b.spin_z || 0) * SPIN_FACTOR;
      b.vy = b.vy + GRAVITY;
      b.x = b.x + b.vx;
      b.y = b.y + b.vy;
      b.z = b.z + b.vz;
      if (b.y < -10 || b.z > COURT_LENGTH + 20 || b.z < -(5)) {
        return;
      }
      return;
    }

    if (is_replay) {
      if (b.z < -5 || b.z > COURT_LENGTH + 5) {
        return;
      }
    }

    const prev_z = b.z;

    if (b.state === BALL_IN_PLAY || is_flying) {
      b.trail.push({ x: b.x, y: b.y, z: b.z });
      const max_trail = b.trail_max_length || 5;
      if (b.trail.length > max_trail) b.trail.shift();
    }

    b.vx = b.vx - b.vx * AIR_RESISTANCE + b.spin_x * SPIN_FACTOR;
    b.vz = b.vz - b.vz * AIR_RESISTANCE + b.spin_z * SPIN_FACTOR;
    if (gravity_override) {
      b.vy = b.vy + GRAVITY * gravity_override.y;
      b.vx = b.vx + GRAVITY * (gravity_override.x || 0);
      b.vz = b.vz + GRAVITY * (gravity_override.z || 0);
    } else {
      b.vy = b.vy + GRAVITY;
    }

    b.x = b.x + b.vx;
    b.y = b.y + b.vy;
    b.z = b.z + b.vz;

    const speed = Math.sqrt(b.vx*b.vx + b.vz*b.vz);
    b.show_speed_lines = speed > 0.4;

    if (b.y < BALL_RADIUS) {
      b.y = BALL_RADIUS;
      b.vy = -b.vy * BOUNCE_FACTOR;
      b.vx = b.vx * 0.8;
      b.vz = b.vz * 0.8;
      b.bounces += 1;
      b.just_bounced = true;

      if (!is_replay) {
        if (!court.is_in_bounds(b.x, b.z)) {
          b.state = BALL_OUT;
        } else {
          const side = b.z < COURT_LENGTH / 2 ? 0 : 1;
          if (b.last_bounce_side !== null && b.last_bounce_side === side) {
            b.state = BALL_DOUBLE_BOUNCE;
          } else {
            b.last_bounce_side = side;
          }
        }
      }
    }

    if (is_replay) return;

    if (court.hits_net(b.x, b.z, prev_z, b.y)) {
      b.state = BALL_NET;
      return;
    }

    if (b.bounces > 0 && b.z > COURT_LENGTH + 5) {
      b.state = BALL_OUT;
    }
    if (b.bounces > 0 && b.z < -5) {
      b.state = BALL_OUT;
    }
  },

  predict_landing(b) {
    if (b.y <= BALL_RADIUS) return null;

    const a = 0.5 * GRAVITY;
    const c_term = b.y - BALL_RADIUS;

    const discriminant = b.vy * b.vy - 4 * a * c_term;
    if (discriminant < 0) return null;

    const t1 = (-b.vy + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b.vy - Math.sqrt(discriminant)) / (2 * a);
    const t = t1 > 0 && t2 > 0 ? Math.min(t1, t2) : Math.max(t1, t2);

    if (t < 0) return null;

    const landing_x = b.x + b.vx * t;
    const landing_z = b.z + b.vz * t;

    if (b.vz > 0) return null;

    if (landing_z > COURT_LENGTH || landing_z < -COURT_LENGTH) return null;

    return { x: landing_x, z: landing_z };
  },

  serve(b, from_x, from_z, target_x, target_z, timing_quality = "normal", power) {
    const dx = target_x - from_x;
    const dz = target_z - from_z;
    let dist = Math.sqrt(dx*dx + dz*dz);
    if (dist < 0.01) dist = 0.01;
    let serve_speed;
    let serve_vy;
    if (power !== undefined) {
      serve_speed = SERVE_SPEED_MIN + (SERVE_SPEED_MAX - SERVE_SPEED_MIN) * power;
      serve_vy = 0.22 - power * 0.08;
    } else {
      const is_s = timing_quality === "s_serve";
      serve_speed = is_s ? SERVE_SPEED_MAX * SERVE_S_SPEED_MULT : SERVE_NORMAL_SPEED;
      serve_vy = is_s ? 0.18 : 0.14;
    }
    b.x = from_x;
    b.y = 1.5;
    b.z = from_z;
    b.vx = (dx / dist) * serve_speed;
    b.vz = (dz / dist) * serve_speed;
    b.vy = serve_vy;
    b.spin_x = 0;
    b.spin_z = 0;
    b.bounces = 0;
    b.state = BALL_IN_PLAY;
    b.last_hit_by = null;
    b.last_bounce_side = null;
  },

  hit(b, hit_x, hit_y, hit_z, target_x, target_z, hit_type, hitter, speed_mult, trail_opts) {
    const params = HIT_PARAMS[hit_type] || HIT_PARAMS[HIT_FLAT];

    const dx = target_x - hit_x;
    const dz = target_z - hit_z;
    let dist = Math.sqrt(dx*dx + dz*dz);
    if (dist < 0.01) dist = 0.01;

    const base_speed = params.speed * (speed_mult || 1.0);
    b.x = hit_x;
    b.y = hit_y;
    b.z = hit_z;
    b.vx = (dx / dist) * base_speed;
    b.vz = (dz / dist) * base_speed;
    const vy_values = { [HIT_FLAT]: 0.14, [HIT_TOPSPIN]: 0.18, [HIT_SLICE]: 0.18, [HIT_LOB]: 0.50 };
    b.vy = vy_values[hit_type] !== undefined ? vy_values[hit_type] : 0.14;
    b.spin_x = Math.random() * params.spin * 2 - params.spin;
    b.spin_z = params.spin * 0.5;
    b.bounces = 0;
    b.state = BALL_IN_PLAY;
    b.last_bounce_side = null;
    b.trail = [];
    if (trail_opts) {
      if (trail_opts.length) b.trail_max_length = trail_opts.length;
      if (trail_opts.char) b.trail_char = trail_opts.char;
      if (trail_opts.color) b.trail_color = trail_opts.color;
    }
    if (hitter !== undefined) {
      b.last_hit_by = hitter;
    }
  },
};
