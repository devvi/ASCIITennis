import {
  BTN_UP, BTN_DOWN, BTN_LEFT, BTN_RIGHT, BTN_A, BTN_B,
  HIT_TOPSPIN, HIT_SLICE, HIT_LOB, HIT_FLAT,
} from './constants.js';

const NUM_BUTTONS = 8;
let prev1 = new Array(NUM_BUTTONS).fill(false);
let curr1 = new Array(NUM_BUTTONS).fill(false);
let prev2 = new Array(NUM_BUTTONS).fill(false);
let curr2 = new Array(NUM_BUTTONS).fill(false);

const KEY_MAP_P1 = {
  "w": BTN_UP, "W": BTN_UP,
  "s": BTN_DOWN, "S": BTN_DOWN,
  "a": BTN_LEFT, "A": BTN_LEFT,
  "d": BTN_RIGHT, "D": BTN_RIGHT,
  " ": BTN_B,
};

const KEY_MAP_P2 = {
  "ArrowUp": BTN_UP,
  "ArrowDown": BTN_DOWN,
  "ArrowLeft": BTN_LEFT,
  "ArrowRight": BTN_RIGHT,
  "Enter": BTN_B,
};

function onKeyDown(e) {
  const btn1 = KEY_MAP_P1[e.key];
  if (btn1 !== undefined) {
    e.preventDefault();
    curr1[btn1] = true;
  }
  const btn2 = KEY_MAP_P2[e.key];
  if (btn2 !== undefined) {
    e.preventDefault();
    curr2[btn2] = true;
  }
}

function onKeyUp(e) {
  const btn1 = KEY_MAP_P1[e.key];
  if (btn1 !== undefined) {
    e.preventDefault();
    curr1[btn1] = false;
  }
  const btn2 = KEY_MAP_P2[e.key];
  if (btn2 !== undefined) {
    e.preventDefault();
    curr2[btn2] = false;
  }
}

function onMouseDown(e) {
  e.preventDefault();
  curr1[BTN_A] = true;
  curr1[BTN_B] = true;
  curr2[BTN_A] = true;
  curr2[BTN_B] = true;
}

function onMouseUp(e) {
  e.preventDefault();
  curr1[BTN_A] = false;
  curr1[BTN_B] = false;
  curr2[BTN_A] = false;
  curr2[BTN_B] = false;
}

function onTouchStart(e) {
  e.preventDefault();
  curr1[BTN_A] = true;
  curr1[BTN_B] = true;
  curr2[BTN_A] = true;
  curr2[BTN_B] = true;
}

function onTouchEnd(e) {
  e.preventDefault();
  curr1[BTN_A] = false;
  curr1[BTN_B] = false;
  curr2[BTN_A] = false;
  curr2[BTN_B] = false;
}

export const input = {
  init(canvas) {
    for (let i = 0; i < NUM_BUTTONS; i++) {
      prev1[i] = false;
      curr1[i] = false;
      prev2[i] = false;
      curr2[i] = false;
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
      prev1[i] = curr1[i];
      prev2[i] = curr2[i];
    }
  },

  pressed(btn_id) {
    return curr1[btn_id] && !prev1[btn_id];
  },

  held(btn_id) {
    return curr1[btn_id];
  },

  released(btn_id) {
    return !curr1[btn_id] && prev1[btn_id];
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

  pressed_p2(btn_id) {
    return curr2[btn_id] && !prev2[btn_id];
  },

  held_p2(btn_id) {
    return curr2[btn_id];
  },

  released_p2(btn_id) {
    return !curr2[btn_id] && prev2[btn_id];
  },

  get_movement_p2() {
    let dx = 0, dz = 0;
    if (this.held_p2(BTN_LEFT)) dx = -1;
    if (this.held_p2(BTN_RIGHT)) dx = 1;
    if (this.held_p2(BTN_UP)) dz = 1;
    if (this.held_p2(BTN_DOWN)) dz = -1;
    return [dx, dz];
  },

  get_aim_angle_p2() {
    if (this.held_p2(BTN_LEFT)) return -1;
    if (this.held_p2(BTN_RIGHT)) return 1;
    return 0;
  },

  get_shot_type_p2() {
    if (!this.pressed_p2(BTN_B)) return null;

    if (this.held_p2(BTN_UP)) return HIT_TOPSPIN;
    if (this.held_p2(BTN_DOWN)) return HIT_SLICE;
    if (this.held_p2(BTN_LEFT) || this.held_p2(BTN_RIGHT)) return HIT_LOB;

    return HIT_FLAT;
  },
};
