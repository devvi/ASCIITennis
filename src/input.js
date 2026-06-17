import {
  BTN_UP, BTN_DOWN, BTN_LEFT, BTN_RIGHT, BTN_A, BTN_B,
  HIT_TOPSPIN, HIT_SLICE, HIT_LOB, HIT_FLAT,
} from './constants.js';

const NUM_BUTTONS = 8;
let prev = new Array(NUM_BUTTONS).fill(false);
let curr = new Array(NUM_BUTTONS).fill(false);

const KEY_MAP = {
  "w": BTN_UP, "W": BTN_UP, "ArrowUp": BTN_UP,
  "s": BTN_DOWN, "S": BTN_DOWN, "ArrowDown": BTN_DOWN,
  "a": BTN_LEFT, "A": BTN_LEFT, "ArrowLeft": BTN_LEFT,
  "d": BTN_RIGHT, "D": BTN_RIGHT, "ArrowRight": BTN_RIGHT,
  " ": BTN_B, "Enter": BTN_B,
};

function onKeyDown(e) {
  const btn = KEY_MAP[e.key];
  if (btn !== undefined) {
    e.preventDefault();
    curr[btn] = true;
  }
}

function onKeyUp(e) {
  const btn = KEY_MAP[e.key];
  if (btn !== undefined) {
    e.preventDefault();
    curr[btn] = false;
  }
}

function onMouseDown(e) {
  e.preventDefault();
  curr[BTN_A] = true;
  curr[BTN_B] = true;
}

function onMouseUp(e) {
  e.preventDefault();
  curr[BTN_A] = false;
  curr[BTN_B] = false;
}

function onTouchStart(e) {
  e.preventDefault();
  curr[BTN_A] = true;
  curr[BTN_B] = true;
}

function onTouchEnd(e) {
  e.preventDefault();
  curr[BTN_A] = false;
  curr[BTN_B] = false;
}

export const input = {
  init(canvas) {
    for (let i = 0; i < NUM_BUTTONS; i++) {
      prev[i] = false;
      curr[i] = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", onTouchEnd, { passive: false });
  },

  update() {
    for (let i = 0; i < NUM_BUTTONS; i++) {
      prev[i] = curr[i];
    }
  },

  pressed(btn_id) {
    return curr[btn_id] && !prev[btn_id];
  },

  held(btn_id) {
    return curr[btn_id];
  },

  released(btn_id) {
    return !curr[btn_id] && prev[btn_id];
  },

  get_movement() {
    let dx = 0, dz = 0;
    if (this.held(BTN_LEFT)) dx = -1;
    if (this.held(BTN_RIGHT)) dx = 1;
    if (this.held(BTN_UP)) dz = 1;
    if (this.held(BTN_DOWN)) dz = -1;
    return [dx, dz];
  },

  get_aim_angle() {
    if (this.held(BTN_LEFT)) return -1;
    if (this.held(BTN_RIGHT)) return 1;
    return 0;
  },

  get_shot_type() {
    if (!this.pressed(BTN_B)) return null;

    if (this.held(BTN_UP)) return HIT_TOPSPIN;
    if (this.held(BTN_DOWN)) return HIT_SLICE;
    if (this.held(BTN_LEFT) || this.held(BTN_RIGHT)) return HIT_LOB;

    return HIT_FLAT;
  },
};
