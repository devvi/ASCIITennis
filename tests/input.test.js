import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BTN_UP, BTN_DOWN, BTN_LEFT, BTN_RIGHT, BTN_A, BTN_B,
  HIT_TOPSPIN, HIT_SLICE, HIT_LOB, HIT_FLAT,
  SERVE_CHARGE_MAX_FRAMES,
} from '../src/constants.js';
import { input } from '../src/input.js';

describe('input', () => {
  let handlers;
  let mockCanvas;

  beforeEach(() => {
    handlers = {};
    globalThis.window = {
      addEventListener: (ev, fn) => { handlers[ev] = fn; },
    };
    mockCanvas = {
      addEventListener: (ev, fn) => { handlers[ev] = fn; },
    };
    input.init(mockCanvas);
  });

  afterEach(() => {
    delete globalThis.window;
    const keys = ['w', 's', 'a', 'd', ' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    for (const key of keys) {
      if (handlers.keyup) handlers.keyup({ key, preventDefault: () => {} });
    }
    if (handlers.mouseup) handlers.mouseup({ preventDefault: () => {} });
    input.update();
  });

  function pressKey(key) {
    handlers.keydown({ key, preventDefault: () => {} });
  }

  function releaseKey(key) {
    handlers.keyup({ key, preventDefault: () => {} });
  }

  it('pressed returns true when button first goes down', () => {
    pressKey('w');
    expect(input.pressed(BTN_UP)).toBe(true);
  });

  it('pressed returns false after update snapshots', () => {
    pressKey('w');
    input.update();
    expect(input.pressed(BTN_UP)).toBe(false);
  });

  it('held returns true while button is down', () => {
    pressKey('w');
    expect(input.held(BTN_UP)).toBe(true);
    input.update();
    expect(input.held(BTN_UP)).toBe(true);
  });

  it('released returns true after button goes up', () => {
    pressKey('w');
    input.update();
    releaseKey('w');
    expect(input.released(BTN_UP)).toBe(true);
  });

  it('get_movement returns dz=1 for UP (toward net)', () => {
    pressKey('w');
    const [dx, dz] = input.get_movement();
    expect(dx).toBe(0);
    expect(dz).toBe(1);
  });

  it('get_movement returns dz=-1 for DOWN (toward baseline)', () => {
    pressKey('s');
    const [dx, dz] = input.get_movement();
    expect(dx).toBe(0);
    expect(dz).toBe(-1);
  });

  it('get_movement returns dx=-1 for LEFT', () => {
    pressKey('a');
    const [dx, dz] = input.get_movement();
    expect(dx).toBe(-1);
    expect(dz).toBe(0);
  });

  it('get_movement returns dx=1 for RIGHT', () => {
    pressKey('d');
    const [dx, dz] = input.get_movement();
    expect(dx).toBe(1);
    expect(dz).toBe(0);
  });

  it('get_movement combines dx and dz for diagonal', () => {
    pressKey('w');
    pressKey('d');
    const [dx, dz] = input.get_movement();
    expect(dx).toBe(1);
    expect(dz).toBe(1);
  });

  it('get_shot_type returns HIT_FLAT when BTN_B pressed alone', () => {
    pressKey(' ');
    expect(input.get_shot_type()).toBe(HIT_FLAT);
  });

  it('get_shot_type returns null without BTN_B press', () => {
    pressKey('w');
    expect(input.get_shot_type()).toBeNull();
  });

  it('get_shot_type returns HIT_TOPSPIN when UP+BTN_B', () => {
    pressKey(' ');
    pressKey('w');
    expect(input.get_shot_type()).toBe(HIT_TOPSPIN);
  });

  it('get_shot_type returns HIT_SLICE when DOWN+BTN_B', () => {
    pressKey(' ');
    pressKey('s');
    expect(input.get_shot_type()).toBe(HIT_SLICE);
  });

  it('get_shot_type returns HIT_LOB when LEFT+BTN_B', () => {
    pressKey(' ');
    pressKey('a');
    expect(input.get_shot_type()).toBe(HIT_LOB);
  });

  it('get_shot_type returns HIT_LOB when RIGHT+BTN_B', () => {
    pressKey(' ');
    pressKey('d');
    expect(input.get_shot_type()).toBe(HIT_LOB);
  });

  it('get_serve returns false on initial press (starts charging), true on release', () => {
    pressKey(' ');
    expect(input.get_serve()).toBe(false);
    releaseKey(' ');
    expect(input.get_serve()).toBe(true);
  });

  it('get_serve returns true on Enter release after press', () => {
    pressKey('Enter');
    expect(input.get_serve()).toBe(false);
    releaseKey('Enter');
    expect(input.get_serve()).toBe(true);
  });

  it('get_serve returns false without press', () => {
    expect(input.get_serve()).toBe(false);
  });

  it('serve_power returns 0 when not charging', () => {
    expect(input.get_serve_power()).toBe(0);
  });

  it('serve_power increases over time when holding serve button', () => {
    pressKey(' ');
    input.get_serve();
    const halfCharge = input.get_serve_power();
    expect(halfCharge).toBeGreaterThan(0);
    // Simulate passing frames while held
    for (let i = 0; i < SERVE_CHARGE_MAX_FRAMES; i++) {
      input.update();
      input.get_serve();
    }
    const fullCharge = input.get_serve_power();
    expect(fullCharge).toBeCloseTo(1.0, 1);
    expect(fullCharge).toBeGreaterThan(halfCharge);
  });

  it('reset_serve_charge clears charge state', () => {
    pressKey(' ');
    input.get_serve();
    expect(input.get_serve_power()).toBeGreaterThan(0);
    input.reset_serve_charge();
    expect(input.get_serve_power()).toBe(0);
  });

  it('mouse mousedown sets BTN_A and BTN_B', () => {
    handlers.mousedown({ preventDefault: () => {} });
    expect(input.held(BTN_A)).toBe(true);
    expect(input.held(BTN_B)).toBe(true);
  });

  it('mouse mouseup clears BTN_A and BTN_B', () => {
    handlers.mousedown({ preventDefault: () => {} });
    input.update();
    handlers.mouseup({ preventDefault: () => {} });
    expect(input.held(BTN_A)).toBe(false);
    expect(input.held(BTN_B)).toBe(false);
  });

  it('update correctly snapshots previous frame for pressed/released', () => {
    pressKey('w');
    expect(input.pressed(BTN_UP)).toBe(true);
    input.update();
    expect(input.pressed(BTN_UP)).toBe(false);
    expect(input.held(BTN_UP)).toBe(true);
    releaseKey('w');
    expect(input.pressed(BTN_UP)).toBe(false);
    expect(input.released(BTN_UP)).toBe(true);
    input.update();
    expect(input.released(BTN_UP)).toBe(false);
  });
});
