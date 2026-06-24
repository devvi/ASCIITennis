import { describe, it, expect } from 'vitest';
import { BALL_IN_PLAY, BALL_HELD, COURT_LENGTH, PLAYER_MOVING, PLAYER_IDLE } from '../src/constants.js';
import { ai } from '../src/ai.js';
import { player } from '../src/player.js';

describe('ai', () => {
  it('new_player creates AI player with easy config', () => {
    const p = ai.new_player('easy');
    expect(p.is_ai).toBe(true);
    expect(p.ai_config).toBeDefined();
    expect(p.ai_config.reaction_time).toBe(20);
    expect(p.ai_config.accuracy).toBe(0.5);
    expect(p.reaction_counter).toBe(0);
    expect(p.target_x).toBeDefined();
    expect(p.target_z).toBeDefined();
  });

  it('new_player creates hard AI with different config', () => {
    const easy = ai.new_player('easy');
    const hard = ai.new_player('hard');
    expect(hard.ai_config.reaction_time).toBeLessThan(easy.ai_config.reaction_time);
    expect(hard.ai_config.accuracy).toBeGreaterThan(easy.ai_config.accuracy);
    expect(hard.ai_config.aggression).toBeGreaterThan(easy.ai_config.aggression);
  });

  it('update returns null while hit_timer is active', () => {
    const p = ai.new_player('easy');
    p.hit_timer = 10;
    const result = ai.update(p, { state: BALL_IN_PLAY });
    expect(result).toBeNull();
    expect(p.hit_timer).toBe(9);
  });

  it('update moves AI toward ball when in play', () => {
    const p = ai.new_player('easy');
    p.reaction_counter = 999;
    const b = { state: BALL_IN_PLAY, x: 3, z: COURT_LENGTH - 5, vz: 0.3, vx: 0, vy: 0, y: 1.0 };
    const oldX = p.x;
    ai.update(p, b);
    expect(p.x).not.toBe(oldX);
  });

  it('update returns hit action when ball is reachable in AI half', () => {
    const p = ai.new_player('hard');
    p.reaction_counter = 999;
    const ai_target_z = Math.max(COURT_LENGTH * 0.6, COURT_LENGTH - 2 - (1 - 0.7) * 2);
    p.x = 0;
    p.z = ai_target_z;
    p.state = PLAYER_IDLE;
    const b = {
      state: BALL_IN_PLAY,
      x: 0,
      z: COURT_LENGTH - 5,
      vz: 0.2,
      vx: 0,
      vy: 0,
      y: 1.0,
    };
    const result = ai.update(p, b);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('hit_type');
    expect(result).toHaveProperty('target_x');
    expect(result).toHaveProperty('target_z');
  });

  it('update tracks ball at different positions in AI half', () => {
    const p = ai.new_player('hard');
    p.reaction_counter = 999;
    const oldX = p.x;
    const oldZ = p.z;
    const b = {
      state: BALL_IN_PLAY,
      x: -2,
      z: COURT_LENGTH - 6,
      vz: 0.25,
      vx: 0.1,
      vy: 0,
      y: 1.0,
    };
    ai.update(p, b);
    expect(p.x).not.toBe(oldX);
    expect(p.z).not.toBe(oldZ);
  });

  it('update returns null when ball is not in play', () => {
    const p = ai.new_player('easy');
    const b = { state: BALL_HELD };
    const result = ai.update(p, b);
    expect(result).toBeNull();
  });

  it('update sets AI state to PLAYER_MOVING when ball is in play and AI needs to move', () => {
    const p = ai.new_player('easy');
    p.reaction_counter = 999;
    const b = {
      state: BALL_IN_PLAY,
      x: 5,
      z: COURT_LENGTH * 0.5,
      vz: 0.3,
      vx: 0,
      vy: 0,
      y: 1.0,
    };
    ai.update(p, b);
    expect([PLAYER_MOVING, PLAYER_IDLE]).toContain(p.state);
  });

  it('update returns null when ball is not reachable (too high)', () => {
    const p = ai.new_player('easy');
    p.reaction_counter = 999;
    const b = {
      state: BALL_IN_PLAY,
      x: p.x,
      z: p.z + 0.5,
      vz: 0.5,
      vx: 0,
      vy: 0.3,
      y: 3.0,
    };
    const result = ai.update(p, b);
    expect(result).toBeNull();
  });

  it('AI can_reach uses same expanded constants as player', () => {
    const p = player.new(true);
    p.state = PLAYER_IDLE;
    const ball = { x: p.x + 2.4, y: 1.0, z: p.z };
    expect(player.can_hit(p, ball)).toBe(true);
  });

  it('update returns null when ball is beyond expanded horizontal range', () => {
    const p = ai.new_player('easy');
    p.reaction_counter = 999;
    const b = {
      state: BALL_IN_PLAY,
      x: p.x + 3.0,
      z: p.z + 0.3,
      vz: 0.5,
      vx: 0,
      vy: 0,
      y: 1.0,
    };
    const result = ai.update(p, b);
    expect(result).toBeNull();
  });
});
