import { describe, it, expect } from 'vitest';
import { COURT_LENGTH, COURT_WIDTH, NET_HEIGHT, SINGLES_WIDTH } from '../src/constants.js';
import { court } from '../src/court.js';

describe('court', () => {
  it('init creates line segments and a net', () => {
    court.init();
    expect(court.lines.length).toBeGreaterThanOrEqual(7);
    expect(court.net).toBeDefined();
    expect(court.net.height).toBe(NET_HEIGHT);
  });

  it('is_in_bounds returns true for center of court', () => {
    court.init();
    expect(court.is_in_bounds(0, COURT_LENGTH / 2)).toBe(true);
  });

  it('is_in_bounds returns false for outside court', () => {
    court.init();
    expect(court.is_in_bounds(COURT_WIDTH, COURT_LENGTH / 2)).toBe(false);
    expect(court.is_in_bounds(-COURT_WIDTH, COURT_LENGTH / 2)).toBe(false);
    expect(court.is_in_bounds(0, -1)).toBe(false);
    expect(court.is_in_bounds(0, COURT_LENGTH + 1)).toBe(false);
  });

  it('is_in_bounds returns true at exact singles boundaries', () => {
    court.init();
    expect(court.is_in_bounds(-SINGLES_WIDTH / 2, 0)).toBe(true);
    expect(court.is_in_bounds(SINGLES_WIDTH / 2, COURT_LENGTH)).toBe(true);
  });

  it('is_in_player_side returns true for z < half', () => {
    court.init();
    expect(court.is_in_player_side(1)).toBe(true);
    expect(court.is_in_player_side(COURT_LENGTH / 2 - 0.1)).toBe(true);
  });

  it('is_in_player_side returns false for z > half', () => {
    court.init();
    expect(court.is_in_player_side(COURT_LENGTH / 2 + 0.1)).toBe(false);
    expect(court.is_in_player_side(COURT_LENGTH)).toBe(false);
  });

  it('hits_net detects crossing from front to back below net height', () => {
    court.init();
    expect(court.hits_net(0, COURT_LENGTH / 2 + 0.1, COURT_LENGTH / 2 - 0.1, NET_HEIGHT - 0.1)).toBe(true);
  });

  it('hits_net detects crossing from back to front below net height', () => {
    court.init();
    expect(court.hits_net(0, COURT_LENGTH / 2 - 0.1, COURT_LENGTH / 2 + 0.1, NET_HEIGHT - 0.1)).toBe(true);
  });

  it('hits_net returns false if ball is above net height', () => {
    court.init();
    expect(court.hits_net(0, COURT_LENGTH / 2 + 0.1, COURT_LENGTH / 2 - 0.1, NET_HEIGHT + 0.5)).toBe(false);
  });

  it('hits_net returns false if ball does not cross net', () => {
    court.init();
    expect(court.hits_net(0, 1, 0, 0.5)).toBe(false);
  });
  it('is_in_bounds with singles width rejects ball in doubles alley', () => {
    court.init();
    const alley_x = SINGLES_WIDTH / 2 + 0.5;
    expect(alley_x).toBeGreaterThan(SINGLES_WIDTH / 2);
    expect(alley_x).toBeLessThan(COURT_WIDTH / 2);
    expect(court.is_in_bounds(alley_x, COURT_LENGTH / 2)).toBe(false);
  });

  it('is_in_bounds with singles width accepts ball on singles sideline', () => {
    court.init();
    expect(court.is_in_bounds(SINGLES_WIDTH / 2, COURT_LENGTH / 2)).toBe(true);
  });

  it('is_in_service_box returns true for ball in near service box', () => {
    court.init();
    expect(court.is_in_service_box(0, COURT_LENGTH / 8, 0)).toBe(true);
  });

  it('is_in_service_box returns true for ball in far service box', () => {
    court.init();
    expect(court.is_in_service_box(0, 7 * COURT_LENGTH / 8, 1)).toBe(true);
  });

  it('is_in_service_box returns false for ball outside service box on correct side', () => {
    court.init();
    expect(court.is_in_service_box(0, COURT_LENGTH / 2, 0)).toBe(false);
  });

  it('is_in_service_box returns false for ball on wrong side', () => {
    court.init();
    expect(court.is_in_service_box(0, COURT_LENGTH / 8, 1)).toBe(false);
  });

  it('is_in_service_box returns false for ball outside singles width', () => {
    court.init();
    expect(court.is_in_service_box(SINGLES_WIDTH, COURT_LENGTH / 8, 0)).toBe(false);
  });
});
