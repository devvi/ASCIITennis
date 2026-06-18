import {
  BTN_UP, BTN_DOWN, BTN_LEFT, BTN_RIGHT, BTN_A, BTN_B,
  HIT_TOPSPIN, HIT_SLICE, HIT_LOB, HIT_FLAT,
} from './constants.js';

const NUM_BUTTONS = 8;

function createState() {
  return {
    prev: new Array(NUM_BUTTONS).fill(false),
    curr: new Array(NUM_BUTTONS).fill(false),
  };
}

const p1_state = createState();
const p2_state = createState();

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

function makeAPI(state) {
  return {
    pressed(btn_id) {
      return state.curr[btn_id] && !state.prev[btn_id];
    },

    held(btn_id) {
      return state.curr[btn_id];
    },

    released(btn_id) {
      return !state.curr[btn_id] && state.prev[btn_id];
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

    get_serve() {
      return this.pressed(BTN_A) || this.pressed(BTN_B);
    },
  };
}

const apiP1 = makeAPI(p1_state);
const apiP2 = makeAPI(p2_state);

function onKeyDown(e) {
  const btn1 = KEY_MAP_P1[e.key];
  if (btn1 !== undefined) {
    e.preventDefault();
    p1_state.curr[btn1] = true;
  }
  const btn2 = KEY_MAP_P2[e.key];
  if (btn2 !== undefined) {
    e.preventDefault();
    p2_state.curr[btn2] = true;
  }
}

function onKeyUp(e) {
  const btn1 = KEY_MAP_P1[e.key];
  if (btn1 !== undefined) {
    e.preventDefault();
    p1_state.curr[btn1] = false;
  }
  const btn2 = KEY_MAP_P2[e.key];
  if (btn2 !== undefined) {
    e.preventDefault();
    p2_state.curr[btn2] = false;
  }
}

function onMouseDown(e) {
  e.preventDefault();
  p1_state.curr[BTN_A] = true;
  p1_state.curr[BTN_B] = true;
  p2_state.curr[BTN_A] = true;
  p2_state.curr[BTN_B] = true;
}

function onMouseUp(e) {
  e.preventDefault();
  p1_state.curr[BTN_A] = false;
  p1_state.curr[BTN_B] = false;
  p2_state.curr[BTN_A] = false;
  p2_state.curr[BTN_B] = false;
}

function onTouchStart(e) {
  e.preventDefault();
  p1_state.curr[BTN_A] = true;
  p1_state.curr[BTN_B] = true;
  p2_state.curr[BTN_A] = true;
  p2_state.curr[BTN_B] = true;
}

function onTouchEnd(e) {
  e.preventDefault();
  p1_state.curr[BTN_A] = false;
  p1_state.curr[BTN_B] = false;
  p2_state.curr[BTN_A] = false;
  p2_state.curr[BTN_B] = false;
}

export const input = {
  init(canvas) {
    for (let i = 0; i < NUM_BUTTONS; i++) {
      p1_state.prev[i] = false;
      p1_state.curr[i] = false;
      p2_state.prev[i] = false;
      p2_state.curr[i] = false;
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
      p1_state.prev[i] = p1_state.curr[i];
      p2_state.prev[i] = p2_state.curr[i];
    }
  },

  pressed(btn_id) { return apiP1.pressed(btn_id); },
  held(btn_id) { return apiP1.held(btn_id); },
  released(btn_id) { return apiP1.released(btn_id); },
  get_movement() { return apiP1.get_movement(); },
  get_aim_angle() { return apiP1.get_aim_angle(); },
  get_shot_type() { return apiP1.get_shot_type(); },

  p1: apiP1,
  p2: apiP2,
};
