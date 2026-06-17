import { COURT_LENGTH, COURT_WIDTH, PLAYER_IDLE, PLAYER_HITTING, PLAYER_SPEED, HIT_RANGE_H, HIT_HEIGHT_MIN, HIT_HEIGHT_MAX } from './constants.js';

export const player = {
  new(is_ai) {
    return {
      x: 0,
      z: is_ai ? COURT_LENGTH - 2 : 3,
      state: PLAYER_IDLE,
      hit_timer: 0,
      swing_duration: 15,
      speed: PLAYER_SPEED,
      is_ai: is_ai || false,
    };
  },

  update(p) {
    if (p.hit_timer > 0) {
      p.hit_timer -= 1;
      if (p.hit_timer <= 0) {
        p.state = PLAYER_IDLE;
      }
    }
  },

  move(p, dx, dz) {
    const new_x = p.x + dx * p.speed;
    const new_z = p.z + dz * p.speed;
    const margin = 1.0;

    p.x = Math.max(-COURT_WIDTH/2 + margin, Math.min(COURT_WIDTH/2 - margin, new_x));
    p.z = Math.max(0.5, Math.min(COURT_LENGTH/2 - 0.5, new_z));
  },

  swing(p) {
    if (p.hit_timer > 0) return false;
    p.state = PLAYER_HITTING;
    p.hit_timer = p.swing_duration;
    return true;
  },

  _in_range(p, ball) {
    const dx = p.x - ball.x;
    const dz = p.z - ball.z;
    const horiz_dist = Math.sqrt(dx*dx + dz*dz);
    return horiz_dist < HIT_RANGE_H && ball.y >= HIT_HEIGHT_MIN && ball.y <= HIT_HEIGHT_MAX;
  },

  can_hit(p, ball) {
    if (p.state !== PLAYER_IDLE) return false;
    return this._in_range(p, ball);
  },

  in_hit_range(p, ball) {
    return this._in_range(p, ball);
  },
};
