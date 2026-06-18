import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BTN_UP, BTN_DOWN, BTN_LEFT, BTN_RIGHT, BTN_A, BTN_B,
  HIT_TOPSPIN, HIT_SLICE, HIT_LOB, HIT_FLAT,
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

  it('get_movement combines W/S dz with A/D dx', () => {
    pressKey('w');
    pressKey('d');
    const [dx, dz] = input.get_movement();
    expect(dx).toBe(1);
    expect(dz).toBe(1);
  });

  it('get_aim_angle returns -1 when A held', () => {
    pressKey('a');
    expect(input.get_aim_angle()).toBe(-1);
  });

  it('get_aim_angle returns 1 when D held', () => {
    pressKey('d');
    expect(input.get_aim_angle()).toBe(1);
  });

  it('get_aim_angle returns 0 when no horiz keys held', () => {
    pressKey('w');
    expect(input.get_aim_angle()).toBe(0);
  });

  it('get_aim_angle returns 0 when no keys held', () => {
    expect(input.get_aim_angle()).toBe(0);
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

  describe('P2 input', () => {
    it('ArrowUp sets BTN_UP for P2', () => {
    pressKey('ArrowUp');
    expect(input.held_p2(BTN_UP)).toBe(true);
  });

  it('ArrowDown sets BTN_DOWN for P2', () => {
    pressKey('ArrowDown');
    expect(input.held_p2(BTN_DOWN)).toBe(true);
  });

  it('ArrowLeft sets BTN_LEFT for P2', () => {
    pressKey('ArrowLeft');
    expect(input.held_p2(BTN_LEFT)).toBe(true);
  });

  it('ArrowRight sets BTN_RIGHT for P2', () => {
    pressKey('ArrowRight');
    expect(input.held_p2(BTN_RIGHT)).toBe(true);
  });

  it('Enter sets BTN_B for P2', () => {
    pressKey('Enter');
    expect(input.held_p2(BTN_B)).toBe(true);
  });

  it('WASD keys do not affect P2 state', () => {
    pressKey('w');
    pressKey('a');
    expect(input.held_p2(BTN_UP)).toBe(false);
    expect(input.held_p2(BTN_LEFT)).toBe(false);
  });

  it('Arrow keys do not affect P1 state', () => {
    pressKey('ArrowUp');
    pressKey('ArrowLeft');
    expect(input.held(BTN_UP)).toBe(false);
    expect(input.held(BTN_LEFT)).toBe(false);
  });

  it('pressed_p2 returns true when P2 button first goes down', () => {
    pressKey('ArrowUp');
    expect(input.pressed_p2(BTN_UP)).toBe(true);
  });

  it('pressed_p2 returns false after update snapshots', () => {
    pressKey('ArrowUp');
    input.update();
    expect(input.pressed_p2(BTN_UP)).toBe(false);
  });

  it('held_p2 returns true while P2 button is down', () => {
    pressKey('ArrowUp');
    expect(input.held_p2(BTN_UP)).toBe(true);
    input.update();
    expect(input.held_p2(BTN_UP)).toBe(true);
  });

  it('released_p2 returns true after P2 button goes up', () => {
    pressKey('ArrowUp');
    input.update();
    releaseKey('ArrowUp');
    expect(input.released_p2(BTN_UP)).toBe(true);
  });

  it('get_movement_p2 returns dz=1 for ArrowUp', () => {
    pressKey('ArrowUp');
    const [dx, dz] = input.get_movement_p2();
    expect(dx).toBe(0);
    expect(dz).toBe(1);
  });

  it('get_movement_p2 returns dz=-1 for ArrowDown', () => {
    pressKey('ArrowDown');
    const [dx, dz] = input.get_movement_p2();
    expect(dx).toBe(0);
    expect(dz).toBe(-1);
  });

  it('get_movement_p2 returns dx=-1 for ArrowLeft', () => {
    pressKey('ArrowLeft');
    const [dx, dz] = input.get_movement_p2();
    expect(dx).toBe(-1);
    expect(dz).toBe(0);
  });

  it('get_movement_p2 returns dx=1 for ArrowRight', () => {
    pressKey('ArrowRight');
    const [dx, dz] = input.get_movement_p2();
    expect(dx).toBe(1);
    expect(dz).toBe(0);
  });

  it('get_movement_p2 combines ArrowUp and ArrowRight', () => {
    pressKey('ArrowUp');
    pressKey('ArrowRight');
    const [dx, dz] = input.get_movement_p2();
    expect(dx).toBe(1);
    expect(dz).toBe(1);
  });

  it('get_aim_angle_p2 returns -1 when ArrowLeft held', () => {
    pressKey('ArrowLeft');
    expect(input.get_aim_angle_p2()).toBe(-1);
  });

  it('get_aim_angle_p2 returns 1 when ArrowRight held', () => {
    pressKey('ArrowRight');
    expect(input.get_aim_angle_p2()).toBe(1);
  });

  it('get_aim_angle_p2 returns 0 when no horiz keys held', () => {
    pressKey('ArrowUp');
    expect(input.get_aim_angle_p2()).toBe(0);
  });

  it('get_shot_type_p2 returns HIT_FLAT when Enter pressed alone', () => {
    pressKey('Enter');
    expect(input.get_shot_type_p2()).toBe(HIT_FLAT);
  });

  it('get_shot_type_p2 returns null without BTN_B press', () => {
    pressKey('ArrowUp');
    expect(input.get_shot_type_p2()).toBeNull();
  });

  it('get_shot_type_p2 returns HIT_TOPSPIN when ArrowUp+Enter', () => {
    pressKey('Enter');
    pressKey('ArrowUp');
    expect(input.get_shot_type_p2()).toBe(HIT_TOPSPIN);
  });

  it('get_shot_type_p2 returns HIT_SLICE when ArrowDown+Enter', () => {
    pressKey('Enter');
    pressKey('ArrowDown');
    expect(input.get_shot_type_p2()).toBe(HIT_SLICE);
  });

  it('get_shot_type_p2 returns HIT_LOB when ArrowLeft+Enter', () => {
    pressKey('Enter');
    pressKey('ArrowLeft');
    expect(input.get_shot_type_p2()).toBe(HIT_LOB);
  });

  it('get_shot_type_p2 returns HIT_LOB when ArrowRight+Enter', () => {
    pressKey('Enter');
    pressKey('ArrowRight');
    expect(input.get_shot_type_p2()).toBe(HIT_LOB);
  });

  it('mouse mousedown sets BTN_A and BTN_B for P2 too', () => {
    handlers.mousedown({ preventDefault: () => {} });
    expect(input.held_p2(BTN_A)).toBe(true);
    expect(input.held_p2(BTN_B)).toBe(true);
  });

  it('P2 state update snapshots correctly for pressed/released', () => {
    pressKey('ArrowUp');
    expect(input.pressed_p2(BTN_UP)).toBe(true);
    input.update();
    expect(input.pressed_p2(BTN_UP)).toBe(false);
    expect(input.held_p2(BTN_UP)).toBe(true);
    releaseKey('ArrowUp');
    expect(input.released_p2(BTN_UP)).toBe(true);
    input.update();
    expect(input.released_p2(BTN_UP)).toBe(false);
  });
  });
});
