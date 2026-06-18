import { describe, it, expect } from 'vitest';
import { scoring } from '../src/scoring.js';

describe('scoring', () => {
  it('new() creates empty score', () => {
    const s = scoring.new();
    expect(s.points).toEqual([0, 0]);
    expect(s.games).toEqual([0, 0]);
    expect(s.sets).toEqual([0, 0]);
    expect(s.deuce).toBe(false);
    expect(s.advantage).toBeNull();
  });

  it('point_name returns correct strings', () => {
    expect(scoring.point_name(0)).toBe('0');
    expect(scoring.point_name(1)).toBe('15');
    expect(scoring.point_name(2)).toBe('30');
    expect(scoring.point_name(3)).toBe('40');
    expect(scoring.point_name(4)).toBe('40');
  });

  it('display shows simple score', () => {
    const s = scoring.new();
    s.points = [1, 0];
    expect(scoring.display(s)).toBe('15 - 0');
  });

  it('display shows deuce at 40-40', () => {
    const s = scoring.new();
    s.points = [3, 3];
    expect(scoring.display(s)).toBe('Deuce');
  });

  it('display shows advantage for player', () => {
    const s = scoring.new();
    s.deuce = true;
    s.advantage = 0;
    expect(scoring.display(s)).toBe('Deuce\nAd Player');
  });

  it('display shows advantage for AI', () => {
    const s = scoring.new();
    s.deuce = true;
    s.advantage = 1;
    expect(scoring.display(s)).toBe('Deuce\nAd AI');
  });

  it('display shows deuce without advantage', () => {
    const s = scoring.new();
    s.deuce = true;
    expect(scoring.display(s)).toBe('Deuce');
  });

  it('award_point increments points for winner', () => {
    const s = scoring.new();
    scoring.award_point(s, 0);
    expect(s.points[0]).toBe(1);
    expect(s.points[1]).toBe(0);
  });

  it('award_point triggers deuce at 3-3', () => {
    const s = scoring.new();
    s.points = [2, 2];
    scoring.award_point(s, 0);
    scoring.award_point(s, 1);
    expect(s.deuce).toBe(true);
  });

  it('award_point awards game at 4-2', () => {
    const s = scoring.new();
    s.points = [3, 2];
    const result = scoring.award_point(s, 0);
    expect(result).toBe('game');
    expect(s.games[0]).toBe(1);
    expect(s.points).toEqual([0, 0]);
  });

  it('award_point handles advantage -> game', () => {
    const s = scoring.new();
    s.deuce = true;
    scoring.award_point(s, 0);
    expect(s.advantage).toBe(0);
    scoring.award_point(s, 1);
    expect(s.advantage).toBeNull();
    expect(s.deuce).toBe(true);
    scoring.award_point(s, 0);
    expect(s.advantage).toBe(0);
    const result = scoring.award_point(s, 0);
    expect(result).toBe('game');
  });

  it('award_game increments games and checks set win', () => {
    const s = scoring.new();
    s.games = [5, 4];
    const result = scoring.award_game(s, 0);
    expect(s.games).toEqual([0, 0]);
    expect(s.sets[0]).toBe(1);
    expect(result).toBe('set');
  });

  it('award_game awards set when games lead by 2', () => {
    const s = scoring.new();
    s.games = [5, 3];
    const result = scoring.award_game(s, 0);
    expect(result).toBe('set');
    expect(s.games).toEqual([0, 0]);
    expect(s.sets[0]).toBe(1);
  });

  it('award_set awards match when sets reach 2', () => {
    const s = scoring.new();
    s.sets = [1, 0];
    s.games = [5, 4];
    const result = scoring.award_set(s, 0);
    expect(result).toBe('match');
    expect(s.sets[0]).toBe(2);
  });

  it('award_set does not win match before 2 sets', () => {
    const s = scoring.new();
    s.games = [5, 4];
    const result = scoring.award_set(s, 0);
    expect(result).toBe('set');
    expect(s.sets[0]).toBe(1);
  });

  it('reset clears the score', () => {
    const s = scoring.new();
    s.points = [3, 2];
    s.games = [5, 3];
    s.sets = [1, 0];
    s.deuce = true;
    s.advantage = 0;
    scoring.reset(s);
    expect(s.points).toEqual([0, 0]);
    expect(s.games).toEqual([0, 0]);
    expect(s.sets).toEqual([0, 0]);
    expect(s.deuce).toBe(false);
    expect(s.advantage).toBeNull();
  });
  it('resolve_violation awards point to opponent for OUT violation', () => {
    const s = scoring.new();
    scoring.resolve_violation(s, 0, 'out');
    expect(s.points[1]).toBe(1);
    expect(s.points[0]).toBe(0);
  });

  it('resolve_violation awards point to opponent for NET violation', () => {
    const s = scoring.new();
    scoring.resolve_violation(s, 1, 'net');
    expect(s.points[0]).toBe(1);
    expect(s.points[1]).toBe(0);
  });

  it('resolve_violation awards point to opponent for DOUBLE_BOUNCE violation', () => {
    const s = scoring.new();
    scoring.resolve_violation(s, 0, 'double_bounce');
    expect(s.points[1]).toBe(1);
  });

  it('resolve_violation awards point to opponent for SERVE_FAULT violation', () => {
    const s = scoring.new();
    scoring.resolve_violation(s, 0, 'serve_fault');
    expect(s.points[1]).toBe(1);
  });

  // === Tiebreaker tests ===

  it('new() has tiebreak false by default', () => {
    const s = scoring.new();
    expect(s.tiebreak).toBe(false);
  });

  it('award_point enters tiebreaker when games reach 6-6', () => {
    const s = scoring.new();
    s.games = [6, 6];
    const result = scoring.award_point(s, 0);
    expect(s.tiebreak).toBe(true);
    expect(s.points).toEqual([0, 0]);
    expect(result).toBe('tiebreak');
  });

  it('tiebreaker points count as 0, 1, 2 (not 15, 30, 40)', () => {
    const s = scoring.new();
    s.tiebreak = true;
    scoring.award_point(s, 0);
    expect(s.points[0]).toBe(1);
    scoring.award_point(s, 0);
    expect(s.points[0]).toBe(2);
  });

  it('tiebreaker won at 7-0 (>=7, lead >=2)', () => {
    const s = scoring.new();
    s.tiebreak = true;
    s.points = [6, 0];
    const result = scoring.award_point(s, 0);
    expect(result).toBe('set');
    expect(s.sets[0]).toBe(1);
    expect(s.tiebreak).toBe(false);
  });

  it('tiebreaker won at 7-5', () => {
    const s = scoring.new();
    s.tiebreak = true;
    s.points = [6, 5];
    const result = scoring.award_point(s, 0);
    expect(result).toBe('set');
    expect(s.sets[0]).toBe(1);
  });

  it('tiebreaker won at 8-6 (deuce tiebreak)', () => {
    const s = scoring.new();
    s.tiebreak = true;
    s.points = [7, 6];
    const result = scoring.award_point(s, 0);
    expect(result).toBe('set');
    expect(s.sets[0]).toBe(1);
  });

  it('tiebreaker does NOT end at 6-6 (no lead of 2)', () => {
    const s = scoring.new();
    s.tiebreak = true;
    s.points = [5, 5];
    const result = scoring.award_point(s, 0);
    expect(result).toBeNull();
    expect(s.points).toEqual([6, 5]);
  });

  it('tiebreaker does NOT end at 7-6 (lead of 1)', () => {
    const s = scoring.new();
    s.tiebreak = true;
    s.points = [6, 6];
    const result = scoring.award_point(s, 0);
    expect(result).toBeNull();
    expect(s.points).toEqual([7, 6]);
  });

  it('winning tiebreaker awards the set (games become 7-6)', () => {
    const s = scoring.new();
    s.tiebreak = true;
    s.sets = [0, 0];
    s.points = [6, 5];
    const result = scoring.award_point(s, 0);
    expect(result).toBe('set');
    expect(s.games).toEqual([0, 0]);
    expect(s.sets[0]).toBe(1);
  });

  it('after tiebreaker, new set has tiebreak false', () => {
    const s = scoring.new();
    s.tiebreak = true;
    s.points = [6, 5];
    scoring.award_point(s, 0);
    expect(s.tiebreak).toBe(false);
  });

  it('display shows Tiebreak: X-Y during tiebreaker', () => {
    const s = scoring.new();
    s.tiebreak = true;
    s.points = [3, 2];
    expect(scoring.display(s)).toBe('Tiebreak: 3-2');
  });

  it('display shows game score as X-Y during tiebreaker (first line uses tiebreak format)', () => {
    const s = scoring.new();
    s.tiebreak = true;
    s.games = [6, 6];
    s.points = [4, 3];
    expect(scoring.display(s)).toBe('Tiebreak: 4-3');
  });

  it('reset clears tiebreak flag', () => {
    const s = scoring.new();
    s.tiebreak = true;
    s.points = [3, 2];
    scoring.reset(s);
    expect(s.tiebreak).toBe(false);
  });
});
