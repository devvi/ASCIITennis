import { COURT_LENGTH, COURT_WIDTH, PLAYER_IDLE, PLAYER_HITTING, PLAYER_SPEED, HIT_RANGE_H, HIT_HEIGHT_MIN, HIT_HEIGHT_MAX, PERFECT_WINDOW, ITEM_COLLECT_RANGE, ITEM_ACTIVE_DURATION } from './constants.js';

export const player = {
  new(is_ai, side) {
    const isBack = side === 'back' || (side === undefined && is_ai);
    return {
      x: 0,
      z: isBack ? COURT_LENGTH - 2 : 3,
      z_min: isBack ? COURT_LENGTH / 2 + 0.5 : 0.5,
      z_max: isBack ? COURT_LENGTH - 0.5 : COURT_LENGTH / 2 - 0.5,
      state: PLAYER_IDLE,
      hit_timer: 0,
      swing_duration: 15,
      speed: PLAYER_SPEED,
      is_ai: is_ai || false,
      item: null,
      item_active: false,
      item_timer: 0,
      hit_range_mult: 1.0,
      shield_active: false,
      net_climb: false,
      net_climb_timer: 0,
      head_bounce_timer: 0,
      combo_level: 0,
    };
  },

  update(p) {
    if (p.hit_timer > 0) {
      p.hit_timer -= 1;
      if (p.hit_timer <= 0) {
        p.state = PLAYER_IDLE;
      }
    }
    if (p.item_timer > 0) {
      p.item_timer -= 1;
      if (p.item_timer <= 0) {
        p.item_active = false;
        p.hit_range_mult = 1.0;
        p.shield_active = false;
      }
    }
    if (p.net_climb_timer > 0) {
      p.net_climb_timer -= 1;
      if (p.net_climb_timer <= 0) {
        p.net_climb = false;
      }
    }
    if (p.head_bounce_timer > 0) {
      p.head_bounce_timer -= 1;
    }
  },

  move(p, dx, dz) {
    const new_x = p.x + dx * p.speed;
    const new_z = p.z + dz * p.speed;
    const margin = 1.0;

    p.x = Math.max(-COURT_WIDTH/2 + margin, Math.min(COURT_WIDTH/2 - margin, new_x));
    p.z = Math.max(p.z_min, Math.min(p.z_max, new_z));
  },

  swing(p, ball) {
    if (p.hit_timer > 0) return false;
    p.state = PLAYER_HITTING;
    p.hit_timer = p.swing_duration;
    return true;
  },

  swing_with_timing(p, ball) {
    if (p.hit_timer > 0) return null;
    p.state = PLAYER_HITTING;
    p.hit_timer = p.swing_duration;
    if (!ball) return 'normal';
    const dist = Math.abs(ball.z - p.z);
    if (dist < 0.5) return 'PERFECT';
    if (dist < 1.5) return 'GOOD';
    return 'LATE';
  },

  _in_range(p, ball) {
    const dx = p.x - ball.x;
    const dz = p.z - ball.z;
    const horiz_dist = Math.sqrt(dx*dx + dz*dz);
    const hit_range = HIT_RANGE_H * (p.hit_range_mult || 1.0);
    return horiz_dist < hit_range && ball.y >= HIT_HEIGHT_MIN && ball.y <= HIT_HEIGHT_MAX;
  },

  can_hit(p, ball) {
    if (p.state !== PLAYER_IDLE) return false;
    return this._in_range(p, ball);
  },

  in_hit_range(p, ball) {
    return this._in_range(p, ball);
  },

  collect_item(p, type) {
    p.item = type;
  },

  use_item(p) {
    if (!p.item) return null;
    const type = p.item;
    p.item = null;
    p.item_active = true;
    p.item_timer = ITEM_ACTIVE_DURATION;
    return type;
  },

  can_collect_item(p, item_pos) {
    if (!item_pos) return false;
    const dx = p.x - item_pos.x;
    const dz = p.z - item_pos.z;
    return Math.sqrt(dx*dx + dz*dz) < ITEM_COLLECT_RANGE;
  },
};
