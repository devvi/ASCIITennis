import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BTN_UP, BTN_DOWN, BTN_LEFT, BTN_RIGHT, BTN_A, BTN_B,
  HIT_TOPSPIN, HIT_SLICE, HIT_LOB, HIT_FLAT,
} from '../src/constants.js';
import { input, createInput, KEY_MAP_P1, KEY_MAP_P2 } from '../src/input.js';

describe('createInput factory', () => {
  let handlers;
  let mockCanvas;

  function makeHandlers() {
    const h = {};
    globalThis.window = {
      addEventListener: (ev, fn) => { h[ev] = fn; },
    };
    return h;
  }

  function cleanup(handlers) {
    delete globalThis.window;
    for (const key of ['w', 's', 'a', 'd', ' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift']) {
      if (handlers.keyup) handlers.keyup({ key, preventDefault: () => {} });
    }
    if (handlers.mouseup) handlers.mouseup({ preventDefault: () => {} });
  }

  function pressKey(handlers, key) {
    handlers.keydown({ key, preventDefault: () => {} });
  }

  it('createInput returns object with expected methods', () => {
    const inp = createInput(KEY_MAP_P1, false);
    expect(inp).toHaveProperty('init');
    expect(inp).toHaveProperty('update');
    expect(inp).toHaveProperty('pressed');
    expect(inp).toHaveProperty('held');
    expect(inp).toHaveProperty('released');
    expect(inp).toHaveProperty('get_movement');
    expect(inp).toHaveProperty('get_aim_angle');
    expect(inp).toHaveProperty('get_shot_type');
  });

  it('P1 responds to W key for UP', () => {
    const h = makeHandlers();
    const inp = createInput(KEY_MAP_P1, false);
    inp.init();
    pressKey(h, 'w');
    expect(inp.held(BTN_UP)).toBe(true);
    cleanup(h);
  });

  it('P1 does not respond to ArrowUp', () => {
    const h = makeHandlers();
    const inp = createInput(KEY_MAP_P1, false);
    inp.init();
    pressKey(h, 'ArrowUp');
    expect(inp.held(BTN_UP)).toBe(false);
    cleanup(h);
  });

  it('P1 responds to Space for BTN_B', () => {
    const h = makeHandlers();
    const inp = createInput(KEY_MAP_P1, false);
    inp.init();
    pressKey(h, ' ');
    expect(inp.held(BTN_B)).toBe(true);
    cleanup(h);
  });

  it('P1 does not respond to Enter', () => {
    const h = makeHandlers();
    const inp = createInput(KEY_MAP_P1, false);
    inp.init();
    pressKey(h, 'Enter');
    expect(inp.held(BTN_B)).toBe(false);
    cleanup(h);
  });

  it('P2 responds to ArrowUp for UP', () => {
    const h = makeHandlers();
    const inp = createInput(KEY_MAP_P2, false);
    inp.init();
    pressKey(h, 'ArrowUp');
    expect(inp.held(BTN_UP)).toBe(true);
    cleanup(h);
  });

  it('P2 does not respond to W key', () => {
    const h = makeHandlers();
    const inp = createInput(KEY_MAP_P2, false);
    inp.init();
    pressKey(h, 'w');
    expect(inp.held(BTN_UP)).toBe(false);
    cleanup(h);
  });

  it('P2 responds to Enter for BTN_B', () => {
    const h = makeHandlers();
    const inp = createInput(KEY_MAP_P2, false);
    inp.init();
    pressKey(h, 'Enter');
    expect(inp.held(BTN_B)).toBe(true);
    cleanup(h);
  });

  it('P2 responds to Shift for BTN_A', () => {
    const h = makeHandlers();
    const inp = createInput(KEY_MAP_P2, false);
    inp.init();
    pressKey(h, 'Shift');
    expect(inp.held(BTN_A)).toBe(true);
    cleanup(h);
  });

  it('P2 with useMouse=false ignores mouse events', () => {
    const h = makeHandlers();
    const inp = createInput(KEY_MAP_P2, false);
    inp.init();
    expect(h.mousedown).toBeUndefined();
    expect(inp.held(BTN_A)).toBe(false);
    expect(inp.held(BTN_B)).toBe(false);
    cleanup(h);
  });

  it('P1 with useMouse=true responds to mouse events', () => {
    const h = {};
    globalThis.window = {
      addEventListener: (ev, fn) => { h[ev] = fn; },
    };
    mockCanvas = { addEventListener: (ev, fn) => { h[ev] = fn; } };
    const inp = createInput(KEY_MAP_P1, true);
    inp.init(mockCanvas);
    h.mousedown({ preventDefault: () => {} });
    expect(inp.held(BTN_A)).toBe(true);
    expect(inp.held(BTN_B)).toBe(true);
    delete globalThis.window;
    if (h.mouseup) h.mouseup({ preventDefault: () => {} });
  });

  it('two inputs can be updated independently', () => {
    const h1 = {}, h2 = {};
    const events1 = {}, events2 = {};
    globalThis.window = {
      addEventListener: (ev, fn) => { events1[ev] = fn; },
    };
    const inp1 = createInput(KEY_MAP_P1, false);
    inp1.init();
    globalThis.window = {
      addEventListener: (ev, fn) => { events2[ev] = fn; },
    };
    const inp2 = createInput(KEY_MAP_P2, false);
    inp2.init();

    events1.keydown({ key: 'w', preventDefault: () => {} });
    events2.keydown({ key: 'ArrowUp', preventDefault: () => {} });

    expect(inp1.held(BTN_UP)).toBe(true);
    expect(inp2.held(BTN_UP)).toBe(true);

    expect(inp1.held(BTN_DOWN)).toBe(false);
    expect(inp2.held(BTN_DOWN)).toBe(false);

    events1.keyup({ key: 'w', preventDefault: () => {} });
    inp1.update();
    inp2.update();

    expect(inp1.held(BTN_UP)).toBe(false);
    expect(inp2.held(BTN_UP)).toBe(true);

    events2.keyup({ key: 'ArrowUp', preventDefault: () => {} });
    inp2.update();
    expect(inp2.held(BTN_UP)).toBe(false);

    delete globalThis.window;
  });

  it('get_movement works on factory-created inputs', () => {
    const h = makeHandlers();
    const inp = createInput(KEY_MAP_P2, false);
    inp.init();
    pressKey(h, 'ArrowUp');
    pressKey(h, 'ArrowRight');
    const [dx, dz] = inp.get_movement();
    expect(dx).toBe(1);
    expect(dz).toBe(1);
    cleanup(h);
  });
});

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
});
