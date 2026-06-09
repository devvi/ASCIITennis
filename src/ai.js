import {
  COURT_LENGTH, COURT_WIDTH, PLAYER_SPEED,
  BALL_IN_PLAY, PLAYER_IDLE, PLAYER_MOVING,
  HIT_FLAT, HIT_TOPSPIN, HIT_SLICE, HIT_LOB,
  AI_EASY, AI_HARD,
} from "./constants.js";
import { player } from "./player.js";

export const ai = {
  new_player(difficulty) {
    const p = player.new(true);
    p.ai_config = difficulty === "hard" ? AI_HARD : AI_EASY;
    p.reaction_counter = 0;
    p.target_x = p.x;
    p.target_z = p.z;
    p.has_served = false;
    return p;
  },

  update(ai_player, ball) {
    if (ai_player.hit_timer > 0) {
      ai_player.hit_timer -= 1;
      if (ai_player.hit_timer <= 0) {
        ai_player.state = PLAYER_IDLE;
      }
      return null;
    }

    const config = ai_player.ai_config;
    const court_center_x = 0;
    const base_z = COURT_LENGTH - 2;

    if (ball.state === BALL_IN_PLAY) {
      if (ball.vz < 0 && ball.z > COURT_LENGTH * 0.4) {
        if (ai_player.reaction_counter < config.reaction_time) {
          ai_player.reaction_counter += 1;
          ai_player.target_x = court_center_x;
          ai_player.target_z = base_z;
        } else {
          const relative_vz = -ball.vz;
          const rvz = relative_vz < 0.01 ? 0.01 : relative_vz;
          const time_to_reach_z = (ball.z - 2) / rvz;
          const predicted_x = ball.x + ball.vx * time_to_reach_z * 0.8;
          const jitter = (1 - config.accuracy) * 4;
          ai_player.target_x = predicted_x + (Math.random() - 0.5) * jitter;
          const depth_offset = (1 - config.aggression) * 2;
          ai_player.target_z = Math.max(COURT_LENGTH * 0.6, base_z - depth_offset);
        }
      } else {
        ai_player.reaction_counter = 0;
        const target_z_offset = (ball.z - COURT_LENGTH / 2) * 0.3;
        ai_player.target_z = base_z + target_z_offset;
        ai_player.target_x = court_center_x + ball.x * 0.5;
      }
    } else {
      ai_player.reaction_counter = 0;
      ai_player.target_x = court_center_x;
      ai_player.target_z = base_z;
    }

    const dx = ai_player.target_x - ai_player.x;
    const dz = ai_player.target_z - ai_player.z;
    const dist = Math.sqrt(dx*dx + dz*dz);

    const move_speed = config.speed * PLAYER_SPEED * 1.2;
    if (dist > 0.3) {
      const move_x = (dx / dist) * move_speed;
      const move_z = (dz / dist) * move_speed;
      ai_player.x += move_x;
      ai_player.z += move_z;
      const margin = 1.0;
      ai_player.x = Math.max(-COURT_WIDTH/2 + margin, Math.min(COURT_WIDTH/2 - margin, ai_player.x));
      ai_player.z = Math.max(COURT_LENGTH/2 + 0.5, Math.min(COURT_LENGTH - 0.5, ai_player.z));
      ai_player.state = PLAYER_MOVING;
    } else {
      ai_player.state = PLAYER_IDLE;
    }

    if (ball.state === BALL_IN_PLAY) {
      const can_reach = Math.abs(ball.x - ai_player.x) < 1.5
        && Math.abs(ball.z - ai_player.z) < 1.5
        && ball.y < 2.5 && ball.y > 0.1
        && ball.vz > 0;

      if (can_reach && ai_player.state === PLAYER_IDLE) {
        player.swing(ai_player);

        const r = Math.random();
        let hit_type;
        if (r < config.aggression) {
          hit_type = HIT_FLAT;
        } else if (r < config.aggression + 0.25) {
          hit_type = HIT_TOPSPIN;
        } else if (r < config.aggression + 0.45) {
          hit_type = HIT_SLICE;
        } else {
          hit_type = HIT_LOB;
        }

        const target_x = (Math.random() - 0.5) * COURT_WIDTH * (1.2 - config.accuracy * 0.6);
        const target_z = 1 + Math.random() * 4 * (1 - config.accuracy * 0.5);
        return { hit_type, target_x, target_z };
      }
    }

    return null;
  },
};
