import { describe, it, expect } from 'vitest';
import { COURT_LENGTH, COURT_WIDTH, PLAYER_IDLE, PLAYER_HITTING, PLAYER_SPEED } from '../src/constants.js';
import { player } from '../src/player.js';

describe('player', () => {
  it('new() creates player at front of court', () => {
    const p = player.new(false);
    expect(p.x).toBe(0);
    expect(p.z).toBe(3);
    expect(p.state).toBe(PLAYER_IDLE);
    expect(p.hit_timer).toBe(0);
    expect(p.is_ai).toBe(false);
  });

  it('new(true) creates AI player at back of court', () => {
    const p = player.new(true);
    expect(p.z).toBe(COURT_LENGTH - 2);
    expect(p.is_ai).toBe(true);
  });

  it('move clamps x within court margins', () => {
    const p = player.new(false);
    player.move(p, -100, 0);
    expect(p.x).toBeGreaterThanOrEqual(-COURT_WIDTH / 2 + 1);
    player.move(p, 100, 0);
    expect(p.x).toBeLessThanOrEqual(COURT_WIDTH / 2 - 1);
  });

  it('move clamps z within court front half', () => {
    const p = player.new(false);
    player.move(p, 0, -100);
    expect(p.z).toBeGreaterThanOrEqual(0.5);
    player.move(p, 0, 100);
    expect(p.z).toBeLessThanOrEqual(COURT_LENGTH / 2 - 0.5);
  });

  it('move applies speed to movement (dz only for human)', () => {
    const p = player.new(false);
    const oldZ = p.z;
    player.move(p, 0, 1);
    expect(p.z).toBe(oldZ + PLAYER_SPEED);
  });

  it('human player can move laterally', () => {
    const p = player.new(false);
    const oldX = p.x;
    player.move(p, 1, 0);
    expect(p.x).toBe(oldX + PLAYER_SPEED);
    player.move(p, -1, 0);
    expect(p.x).toBe(oldX);
  });

  it('AI player can move laterally', () => {
    const p = player.new(true);
    const oldX = p.x;
    player.move(p, 1, 0);
    expect(p.x).toBe(oldX + PLAYER_SPEED);
  });

  it('swing sets state to hitting and returns true when idle', () => {
    const p = player.new(false);
    const result = player.swing(p);
    expect(result).toBe(true);
    expect(p.state).toBe(PLAYER_HITTING);
    expect(p.hit_timer).toBe(p.swing_duration);
  });

  it('swing returns false when already hitting', () => {
    const p = player.new(false);
    player.swing(p);
    const result = player.swing(p);
    expect(result).toBe(false);
  });

  it('update decrements hit_timer and transitions to idle', () => {
    const p = player.new(false);
    player.swing(p);
    expect(p.hit_timer).toBeGreaterThan(0);
    for (let i = 0; i < p.swing_duration; i++) {
      player.update(p);
    }
    expect(p.state).toBe(PLAYER_IDLE);
    expect(p.hit_timer).toBe(0);
  });

  it('can_hit returns true when ball is close', () => {
    const p = player.new(false);
    const b = { x: p.x, y: 1.0, z: p.z };
    expect(player.can_hit(p, b)).toBe(true);
  });

  it('can_hit returns false when ball is far', () => {
    const p = player.new(false);
    const b = { x: 100, y: 1.0, z: 100 };
    expect(player.can_hit(p, b)).toBe(false);
  });

  it('can_hit returns false when player is hitting', () => {
    const p = player.new(false);
    player.swing(p);
    const b = { x: p.x, y: 1.0, z: p.z };
    expect(player.can_hit(p, b)).toBe(false);
  });

  it('can_hit returns true within expanded horizontal range (2.5)', () => {
    const p = player.new(false);
    const b = { x: p.x + 2.4, y: 1.0, z: p.z };
    expect(player.can_hit(p, b)).toBe(true);
  });

  it('can_hit returns false beyond horizontal range (2.5)', () => {
    const p = player.new(false);
    const b = { x: p.x + 2.6, y: 1.0, z: p.z };
    expect(player.can_hit(p, b)).toBe(false);
  });

  it('can_hit returns false when ball is too high', () => {
    const p = player.new(false);
    const b = { x: p.x, y: 2.6, z: p.z };
    expect(player.can_hit(p, b)).toBe(false);
  });

  it('can_hit returns false when ball is too low', () => {
    const p = player.new(false);
    const b = { x: p.x, y: 0.05, z: p.z };
    expect(player.can_hit(p, b)).toBe(false);
  });

  it('can_hit returns true at minimum valid height (0.1)', () => {
    const p = player.new(false);
    const b = { x: p.x, y: 0.1, z: p.z };
    expect(player.can_hit(p, b)).toBe(true);
  });

  it('can_hit returns true at maximum valid height (2.5)', () => {
    const p = player.new(false);
    const b = { x: p.x, y: 2.5, z: p.z };
    expect(player.can_hit(p, b)).toBe(true);
  });

  it('in_hit_range returns true when ball is within range regardless of player state', () => {
    const p = player.new(false);
    player.swing(p);
    const b = { x: p.x, y: 1.0, z: p.z };
    expect(player.in_hit_range(p, b)).toBe(true);
  });

  it('in_hit_range returns false when ball is far', () => {
    const p = player.new(false);
    const b = { x: 100, y: 1.0, z: 100 };
    expect(player.in_hit_range(p, b)).toBe(false);
  });

  describe('side property', () => {
    it('new(false, 1) creates player with side: 1', () => {
      const p = player.new(false, 1);
      expect(p.side).toBe(1);
    });

    it('new(false) defaults to side: 0 (backward compat)', () => {
      const p = player.new(false);
      expect(p.side).toBe(0);
    });

    it('move clamps side:0 player to near half [0.5, COURT_LENGTH/2 - 0.5]', () => {
      const p = player.new(false, 0);
      player.move(p, 0, -100);
      expect(p.z).toBeGreaterThanOrEqual(0.5);
      player.move(p, 0, 100);
      expect(p.z).toBeLessThanOrEqual(COURT_LENGTH / 2 - 0.5);
    });

    it('move clamps side:1 player to far half [COURT_LENGTH/2 + 0.5, COURT_LENGTH - 0.5]', () => {
      const p = player.new(false, 1);
      p.z = COURT_LENGTH / 2 + 1;
      player.move(p, 0, -100);
      expect(p.z).toBeGreaterThanOrEqual(COURT_LENGTH / 2 + 0.5);
      player.move(p, 0, 100);
      expect(p.z).toBeLessThanOrEqual(COURT_LENGTH - 0.5);
    });
  });
});
