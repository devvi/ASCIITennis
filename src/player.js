import { PLAYER_IDLE, PLAYER_MOVING, PLAYER_HITTING, PLAYER_SPEED, COURT_WIDTH, COURT_LENGTH } from "./constants.js";

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

  can_hit(p, ball) {
    if (p.state !== PLAYER_IDLE) return false;
    const dx = p.x - ball.x;
    const dz = p.z - ball.z;
    const dy = ball.y;
    const dist = Math.sqrt(dx*dx + dz*dz + dy*dy);
    return dist < 1.5;
  },
};
