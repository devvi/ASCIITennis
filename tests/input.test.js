import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BTN_UP, BTN_DOWN, BTN_LEFT, BTN_RIGHT, BTN_A, BTN_B,
  HIT_TOPSPIN, HIT_SLICE, HIT_FLAT, MAX_MOUSE_HOLD_FRAMES, DIRECTIONAL_ANGLE,
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
    expect(inp.held(BTN_B)).toBe(false);
    h.mouseup({ preventDefault: () => {} });
    expect(inp.held(BTN_A)).toBe(false);
    expect(inp.held(BTN_B)).toBe(true);
    delete globalThis.window;
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

  it('get_aim_angle returns -DIRECTIONAL_ANGLE when A held without mouse hold', () => {
    pressKey('a');
    const angle = input.get_aim_angle();
    expect(angle).toBe(-DIRECTIONAL_ANGLE);
  });

  it('get_aim_angle returns DIRECTIONAL_ANGLE when D held without mouse hold', () => {
    pressKey('d');
    const angle = input.get_aim_angle();
    expect(angle).toBe(DIRECTIONAL_ANGLE);
  });

  it('get_aim_angle returns 0 when no horiz keys held', () => {
    pressKey('w');
    const angle = input.get_aim_angle();
    expect(angle).toBe(0);
  });

  it('get_aim_angle returns 0 when no keys held', () => {
    const angle = input.get_aim_angle();
    expect(angle).toBe(0);
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

  it('get_shot_type returns HIT_FLAT when LEFT+BTN_B (A/D no longer lob)', () => {
    pressKey(' ');
    pressKey('a');
    expect(input.get_shot_type()).toBe(HIT_FLAT);
  });

  it('get_shot_type returns HIT_FLAT when RIGHT+BTN_B (A/D no longer lob)', () => {
    pressKey(' ');
    pressKey('d');
    expect(input.get_shot_type()).toBe(HIT_FLAT);
  });

  it('mouse mousedown sets BTN_A only (BTN_B cleared for shot-on-release)', () => {
    handlers.mousedown({ preventDefault: () => {} });
    expect(input.held(BTN_A)).toBe(true);
    expect(input.held(BTN_B)).toBe(false);
  });

  it('mouse mouseup clears BTN_A and sets BTN_B (shot trigger)', () => {
    handlers.mousedown({ preventDefault: () => {} });
    input.update();
    handlers.mouseup({ preventDefault: () => {} });
    expect(input.held(BTN_A)).toBe(false);
    expect(input.held(BTN_B)).toBe(true);
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

describe('mouse hold duration tracking', () => {
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
    if (handlers.mouseup) handlers.mouseup({ preventDefault: () => {} });
    input.update();
  });

  it('mouse_hold_frames starts at 0 on mousedown (no updates)', () => {
    handlers.mousedown({ preventDefault: () => {} });
    handlers.keydown({ key: 'a', preventDefault: () => {} });
    const angle = input.get_aim_angle();
    expect(angle).toBe(0);
  });

  it('mouse_hold_frames accumulates during update cycles while mouse held', () => {
    handlers.keydown({ key: 'a', preventDefault: () => {} });
    handlers.mousedown({ preventDefault: () => {} });
    for (let i = 0; i < 30; i++) input.update();
    expect(input.get_aim_angle()).toBeCloseTo(-Math.sqrt(30 / MAX_MOUSE_HOLD_FRAMES), 4);
  });

  it('mouse_hold_frames approaches -1 after MAX_MOUSE_HOLD_FRAMES updates with A held', () => {
    handlers.keydown({ key: 'a', preventDefault: () => {} });
    handlers.mousedown({ preventDefault: () => {} });
    for (let i = 0; i < MAX_MOUSE_HOLD_FRAMES; i++) input.update();
    const angle = input.get_aim_angle();
    expect(angle).toBeCloseTo(-1, 4);
  });

  it('mouse_hold_frames clamped at MAX_MOUSE_HOLD_FRAMES', () => {
    handlers.keydown({ key: 'a', preventDefault: () => {} });
    handlers.mousedown({ preventDefault: () => {} });
    for (let i = 0; i < MAX_MOUSE_HOLD_FRAMES * 2; i++) input.update();
    expect(input.get_aim_angle()).toBeCloseTo(-1, 4);
  });

  it('mouse_hold_frames resets on next mousedown', () => {
    handlers.keydown({ key: 'a', preventDefault: () => {} });
    handlers.mousedown({ preventDefault: () => {} });
    for (let i = 0; i < 30; i++) input.update();
    expect(input.get_aim_angle()).toBeCloseTo(-Math.sqrt(30 / MAX_MOUSE_HOLD_FRAMES), 4);
    handlers.mousedown({ preventDefault: () => {} });
    const angle = input.get_aim_angle();
    expect(angle).toBe(0);
  });
});

describe('continuous get_aim_angle()', () => {
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
    if (handlers.mouseup) handlers.mouseup({ preventDefault: () => {} });
    input.update();
  });

  it('returns 0 when no horizontal key held regardless of mouse hold', () => {
    handlers.mousedown({ preventDefault: () => {} });
    for (let i = 0; i < 30; i++) input.update();
    expect(input.get_aim_angle()).toBeCloseTo(0);
  });

  it('A held + short mouse hold produces small negative angle', () => {
    handlers.keydown({ key: 'a', preventDefault: () => {} });
    handlers.mousedown({ preventDefault: () => {} });
    for (let i = 0; i < 5; i++) input.update();
    const angle = input.get_aim_angle();
    expect(angle).toBeLessThan(0);
    expect(angle).toBeGreaterThan(-0.35);
    expect(angle).toBeCloseTo(-Math.sqrt(5 / MAX_MOUSE_HOLD_FRAMES), 4);
  });

  it('D held + short mouse hold produces small positive angle', () => {
    handlers.keydown({ key: 'd', preventDefault: () => {} });
    handlers.mousedown({ preventDefault: () => {} });
    for (let i = 0; i < 5; i++) input.update();
    const angle = input.get_aim_angle();
    expect(angle).toBeGreaterThan(0);
    expect(angle).toBeLessThan(0.35);
    expect(angle).toBeCloseTo(Math.sqrt(5 / MAX_MOUSE_HOLD_FRAMES), 4);
  });

  it('A held + long mouse hold approaches -1', () => {
    handlers.keydown({ key: 'a', preventDefault: () => {} });
    handlers.mousedown({ preventDefault: () => {} });
    for (let i = 0; i < 50; i++) input.update();
    expect(input.get_aim_angle()).toBeCloseTo(-Math.sqrt(50 / MAX_MOUSE_HOLD_FRAMES), 4);
  });

  it('D held + long mouse hold approaches 1', () => {
    handlers.keydown({ key: 'd', preventDefault: () => {} });
    handlers.mousedown({ preventDefault: () => {} });
    for (let i = 0; i < 50; i++) input.update();
    expect(input.get_aim_angle()).toBeCloseTo(Math.sqrt(50 / MAX_MOUSE_HOLD_FRAMES), 4);
  });

  it('angle values stay within [-1, 1] range', () => {
    handlers.keydown({ key: 'a', preventDefault: () => {} });
    handlers.mousedown({ preventDefault: () => {} });
    for (let i = 0; i < MAX_MOUSE_HOLD_FRAMES * 3; i++) input.update();
    expect(input.get_aim_angle()).toBeGreaterThanOrEqual(-1);
    expect(input.get_aim_angle()).toBeLessThanOrEqual(0);
    handlers.keyup({ key: 'a', preventDefault: () => {} });
    handlers.keydown({ key: 'd', preventDefault: () => {} });
    for (let i = 0; i < MAX_MOUSE_HOLD_FRAMES * 3; i++) input.update();
    expect(input.get_aim_angle()).toBeGreaterThanOrEqual(0);
    expect(input.get_aim_angle()).toBeLessThanOrEqual(1);
  });
});

describe('get_shot_type() without A/D lob', () => {
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
    const keys = ['w', 's', 'a', 'd', ' '];
    for (const key of keys) {
      if (handlers.keyup) handlers.keyup({ key, preventDefault: () => {} });
    }
    input.update();
  });

  it('A held + BTN_B pressed returns HIT_FLAT (no lob)', () => {
    handlers.keydown({ key: ' ', preventDefault: () => {} });
    handlers.keydown({ key: 'a', preventDefault: () => {} });
    expect(input.get_shot_type()).toBe(HIT_FLAT);
  });

  it('D held + BTN_B pressed returns HIT_FLAT (no lob)', () => {
    handlers.keydown({ key: ' ', preventDefault: () => {} });
    handlers.keydown({ key: 'd', preventDefault: () => {} });
    expect(input.get_shot_type()).toBe(HIT_FLAT);
  });

  it('W held + BTN_B pressed returns HIT_TOPSPIN (unchanged)', () => {
    handlers.keydown({ key: ' ', preventDefault: () => {} });
    handlers.keydown({ key: 'w', preventDefault: () => {} });
    expect(input.get_shot_type()).toBe(HIT_TOPSPIN);
  });

  it('S held + BTN_B pressed returns HIT_SLICE (unchanged)', () => {
    handlers.keydown({ key: ' ', preventDefault: () => {} });
    handlers.keydown({ key: 's', preventDefault: () => {} });
    expect(input.get_shot_type()).toBe(HIT_SLICE);
  });

  it('A+W held + BTN_B pressed returns HIT_TOPSPIN (W takes priority)', () => {
    handlers.keydown({ key: ' ', preventDefault: () => {} });
    handlers.keydown({ key: 'w', preventDefault: () => {} });
    handlers.keydown({ key: 'a', preventDefault: () => {} });
    expect(input.get_shot_type()).toBe(HIT_TOPSPIN);
  });

  it('D+W held + BTN_B pressed returns HIT_TOPSPIN (W takes priority)', () => {
    handlers.keydown({ key: ' ', preventDefault: () => {} });
    handlers.keydown({ key: 'w', preventDefault: () => {} });
    handlers.keydown({ key: 'd', preventDefault: () => {} });
    expect(input.get_shot_type()).toBe(HIT_TOPSPIN);
  });

  it('D+S held + BTN_B pressed returns HIT_SLICE (S takes priority)', () => {
    handlers.keydown({ key: ' ', preventDefault: () => {} });
    handlers.keydown({ key: 's', preventDefault: () => {} });
    handlers.keydown({ key: 'd', preventDefault: () => {} });
    expect(input.get_shot_type()).toBe(HIT_SLICE);
  });

  it('No keys + BTN_B pressed returns HIT_FLAT (unchanged)', () => {
    handlers.keydown({ key: ' ', preventDefault: () => {} });
    expect(input.get_shot_type()).toBe(HIT_FLAT);
  });
});

describe('P2 directional control via Shift+Arrow keys', () => {
  let handlers;
  let p2Input;

  function makeHandlers() {
    const h = {};
    globalThis.window = {
      addEventListener: (ev, fn) => { h[ev] = fn; },
    };
    return h;
  }

  function cleanup() {
    delete globalThis.window;
    for (const key of ['Shift', 'ArrowLeft', 'ArrowRight']) {
      if (handlers.keyup) handlers.keyup({ key, preventDefault: () => {} });
    }
    p2Input.update();
  }

  function pressKey(key) {
    handlers.keydown({ key, preventDefault: () => {} });
  }

  beforeEach(() => {
    handlers = makeHandlers();
    p2Input = createInput(KEY_MAP_P2, false);
    p2Input.init();
  });

  afterEach(() => {
    cleanup();
  });

  it('Shift held + ArrowLeft produces proportional negative angle', () => {
    pressKey('Shift');
    pressKey('ArrowLeft');
    for (let i = 0; i < 30; i++) p2Input.update();
    const angle = p2Input.get_aim_angle();
    expect(angle).toBeLessThan(0);
    expect(angle).toBeCloseTo(-Math.sqrt(30 / MAX_MOUSE_HOLD_FRAMES), 4);
  });

  it('Shift held + ArrowRight produces proportional positive angle', () => {
    pressKey('Shift');
    pressKey('ArrowRight');
    for (let i = 0; i < 30; i++) p2Input.update();
    const angle = p2Input.get_aim_angle();
    expect(angle).toBeGreaterThan(0);
    expect(angle).toBeCloseTo(Math.sqrt(30 / MAX_MOUSE_HOLD_FRAMES), 4);
  });

  it('No Shift + ArrowLeft returns -DIRECTIONAL_ANGLE', () => {
    pressKey('ArrowLeft');
    const angle = p2Input.get_aim_angle();
    expect(angle).toBe(-DIRECTIONAL_ANGLE);
  });

  it('No Shift + ArrowRight returns DIRECTIONAL_ANGLE', () => {
    pressKey('ArrowRight');
    const angle = p2Input.get_aim_angle();
    expect(angle).toBe(DIRECTIONAL_ANGLE);
  });
});

describe('mouse release triggers shot with accumulated directional angle', () => {
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
    const keys = ['w', 's', 'a', 'd'];
    for (const key of keys) {
      if (handlers.keyup) handlers.keyup({ key, preventDefault: () => {} });
    }
    input.update();
  });

  it('mouseup triggers pressed(BTN_B) which fires get_shot_type', () => {
    handlers.keydown({ key: 'a', preventDefault: () => {} });
    handlers.mousedown({ preventDefault: () => {} });
    for (let i = 0; i < 30; i++) input.update();
    handlers.mouseup({ preventDefault: () => {} });
    expect(input.get_shot_type()).toBe(HIT_FLAT);
    const angle = input.get_aim_angle();
    expect(angle).toBeCloseTo(-Math.sqrt(30 / MAX_MOUSE_HOLD_FRAMES), 4);
  });

  it('fast click (no updates between down/up) with D held gives DIRECTIONAL_ANGLE', () => {
    handlers.keydown({ key: 'd', preventDefault: () => {} });
    handlers.mousedown({ preventDefault: () => {} });
    handlers.mouseup({ preventDefault: () => {} });
    expect(input.get_shot_type()).toBe(HIT_FLAT);
    const angle = input.get_aim_angle();
    expect(angle).toBe(DIRECTIONAL_ANGLE);
  });
});
