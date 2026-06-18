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

  describe('p2 input', () => {
    it('P2 key mapping: ArrowRight → BTN_RIGHT', () => {
      pressKey('ArrowRight');
      expect(input.p2.held(BTN_RIGHT)).toBe(true);
    });

    it('P2 key mapping: ArrowUp → BTN_UP', () => {
      pressKey('ArrowUp');
      expect(input.p2.held(BTN_UP)).toBe(true);
    });

    it('P2 key mapping: ArrowDown → BTN_DOWN', () => {
      pressKey('ArrowDown');
      expect(input.p2.held(BTN_DOWN)).toBe(true);
    });

    it('P2 key mapping: ArrowLeft → BTN_LEFT', () => {
      pressKey('ArrowLeft');
      expect(input.p2.held(BTN_LEFT)).toBe(true);
    });

    it('P2 key mapping: Enter → BTN_B', () => {
      pressKey('Enter');
      expect(input.p2.held(BTN_B)).toBe(true);
    });

    it('P2 input isolation: Arrow keys do not affect P1 state', () => {
      pressKey('ArrowRight');
      expect(input.p1.held(BTN_RIGHT)).toBe(false);
    });

    it('P1 input isolation: WASD does not affect P2 state', () => {
      pressKey('w');
      expect(input.p2.held(BTN_UP)).toBe(false);
    });

    it('p2.pressed/held/released work correctly with state transitions', () => {
      pressKey('ArrowUp');
      expect(input.p2.pressed(BTN_UP)).toBe(true);
      expect(input.p2.held(BTN_UP)).toBe(true);
      input.update();
      expect(input.p2.pressed(BTN_UP)).toBe(false);
      expect(input.p2.held(BTN_UP)).toBe(true);
      releaseKey('ArrowUp');
      expect(input.p2.released(BTN_UP)).toBe(true);
      input.update();
      expect(input.p2.released(BTN_UP)).toBe(false);
    });

    it('p2.get_movement returns dz=1 for ArrowUp', () => {
      pressKey('ArrowUp');
      const [dx, dz] = input.p2.get_movement();
      expect(dx).toBe(0);
      expect(dz).toBe(1);
    });

    it('p2.get_movement returns dz=-1 for ArrowDown', () => {
      pressKey('ArrowDown');
      const [dx, dz] = input.p2.get_movement();
      expect(dx).toBe(0);
      expect(dz).toBe(-1);
    });

    it('p2.get_movement returns dx=-1 for ArrowLeft', () => {
      pressKey('ArrowLeft');
      const [dx, dz] = input.p2.get_movement();
      expect(dx).toBe(-1);
      expect(dz).toBe(0);
    });

    it('p2.get_movement returns dx=1 for ArrowRight', () => {
      pressKey('ArrowRight');
      const [dx, dz] = input.p2.get_movement();
      expect(dx).toBe(1);
      expect(dz).toBe(0);
    });

    it('p2.get_shot_type returns HIT_FLAT when Enter pressed alone', () => {
      pressKey('Enter');
      expect(input.p2.get_shot_type()).toBe(HIT_FLAT);
    });

    it('p2.get_shot_type returns null without BTN_B press', () => {
      pressKey('ArrowUp');
      expect(input.p2.get_shot_type()).toBeNull();
    });

    it('p2.get_shot_type returns HIT_TOPSPIN when ArrowUp+Enter', () => {
      pressKey('Enter');
      pressKey('ArrowUp');
      expect(input.p2.get_shot_type()).toBe(HIT_TOPSPIN);
    });

    it('p2.get_shot_type returns HIT_SLICE when ArrowDown+Enter', () => {
      pressKey('Enter');
      pressKey('ArrowDown');
      expect(input.p2.get_shot_type()).toBe(HIT_SLICE);
    });

    it('p2.get_shot_type returns HIT_LOB when ArrowLeft+Enter', () => {
      pressKey('Enter');
      pressKey('ArrowLeft');
      expect(input.p2.get_shot_type()).toBe(HIT_LOB);
    });

    it('p2.get_shot_type returns HIT_LOB when ArrowRight+Enter', () => {
      pressKey('Enter');
      pressKey('ArrowRight');
      expect(input.p2.get_shot_type()).toBe(HIT_LOB);
    });

    it('p2.get_serve returns true on BTN_B press', () => {
      pressKey('Enter');
      expect(input.p2.get_serve()).toBe(true);
    });

    it('p2.get_serve returns true on BTN_A press (mouse)', () => {
      handlers.mousedown({ preventDefault: () => {} });
      expect(input.p2.get_serve()).toBe(true);
    });

    it('p2.get_serve returns false when no button pressed', () => {
      expect(input.p2.get_serve()).toBe(false);
    });

    it('P2 keyboard keydown/keyup updates P2 button states correctly', () => {
      pressKey('ArrowRight');
      expect(input.p2.held(BTN_RIGHT)).toBe(true);
      releaseKey('ArrowRight');
      expect(input.p2.held(BTN_RIGHT)).toBe(false);
    });

    it('P2 mouse mousedown sets P2 BTN_A and BTN_B', () => {
      handlers.mousedown({ preventDefault: () => {} });
      expect(input.p2.held(BTN_A)).toBe(true);
      expect(input.p2.held(BTN_B)).toBe(true);
    });

    it('P2 mouse mouseup clears P2 BTN_A and BTN_B', () => {
      handlers.mousedown({ preventDefault: () => {} });
      input.update();
      handlers.mouseup({ preventDefault: () => {} });
      expect(input.p2.held(BTN_A)).toBe(false);
      expect(input.p2.held(BTN_B)).toBe(false);
    });

    it('input.update snapshots both P1 and P2 prev arrays for pressed/released', () => {
      pressKey('w');
      pressKey('ArrowUp');
      expect(input.p1.pressed(BTN_UP)).toBe(true);
      expect(input.p2.pressed(BTN_UP)).toBe(true);
      input.update();
      expect(input.p1.pressed(BTN_UP)).toBe(false);
      expect(input.p2.pressed(BTN_UP)).toBe(false);
      expect(input.p1.held(BTN_UP)).toBe(true);
      expect(input.p2.held(BTN_UP)).toBe(true);
    });
  });
});
