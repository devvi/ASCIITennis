import {
  BTN_UP, BTN_DOWN, BTN_LEFT, BTN_RIGHT, BTN_A, BTN_B, BTN_X,
  HIT_TOPSPIN, HIT_SLICE, HIT_FLAT, MAX_MOUSE_HOLD_FRAMES,
  DIRECTIONAL_ANGLE,
} from './constants.js';

const NUM_BUTTONS = 8;

export const KEY_MAP_P1 = {
  "w": BTN_UP, "W": BTN_UP,
  "s": BTN_DOWN, "S": BTN_DOWN,
  "a": BTN_LEFT, "A": BTN_LEFT,
  "d": BTN_RIGHT, "D": BTN_RIGHT,
  " ": BTN_B,
  "e": BTN_X, "E": BTN_X,
};

export const KEY_MAP_P2 = {
  "ArrowUp": BTN_UP,
  "ArrowDown": BTN_DOWN,
  "ArrowLeft": BTN_LEFT,
  "ArrowRight": BTN_RIGHT,
  "Enter": BTN_B,
  "Shift": BTN_A,
  "e": BTN_X, "E": BTN_X,
};

const KEY_MAP_BOTH = {
  "w": BTN_UP, "W": BTN_UP, "ArrowUp": BTN_UP,
  "s": BTN_DOWN, "S": BTN_DOWN, "ArrowDown": BTN_DOWN,
  "a": BTN_LEFT, "A": BTN_LEFT, "ArrowLeft": BTN_LEFT,
  "d": BTN_RIGHT, "D": BTN_RIGHT, "ArrowRight": BTN_RIGHT,
  " ": BTN_B, "Enter": BTN_B,
  "e": BTN_X, "E": BTN_X,
};

export function createInput(keyMap, useMouse = true) {
  let prev = new Array(NUM_BUTTONS).fill(false);
  let curr = new Array(NUM_BUTTONS).fill(false);
  let mouse_hold_frames = 0;

  function onKeyDown(e) {
    const btn = keyMap[e.key];
    if (btn !== undefined) {
      e.preventDefault();
      curr[btn] = true;
    }
  }

  function onKeyUp(e) {
    const btn = keyMap[e.key];
    if (btn !== undefined) {
      e.preventDefault();
      curr[btn] = false;
    }
  }

  function onMouseDown(e) {
    e.preventDefault();
    curr[BTN_A] = true;
    curr[BTN_B] = false;
    mouse_hold_frames = 0;
  }

  function onMouseUp(e) {
    e.preventDefault();
    curr[BTN_A] = false;
    curr[BTN_B] = true;
  }

  function onTouchStart(e) {
    e.preventDefault();
    curr[BTN_A] = true;
    curr[BTN_B] = false;
    mouse_hold_frames = 0;
  }

  function onTouchEnd(e) {
    e.preventDefault();
    curr[BTN_A] = false;
    curr[BTN_B] = true;
  }

  return {
    reset() {
      for (let i = 0; i < NUM_BUTTONS; i++) {
        prev[i] = false;
        curr[i] = false;
      }
      mouse_hold_frames = 0;
    },

    init(canvas) {
      this.reset();

      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);

      if (useMouse && canvas) {
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("contextmenu", (e) => e.preventDefault());
        canvas.addEventListener("touchstart", onTouchStart, { passive: false });
        canvas.addEventListener("touchend", onTouchEnd, { passive: false });
        canvas.addEventListener("touchcancel", onTouchEnd, { passive: false });
      }
    },

    update() {
      for (let i = 0; i < NUM_BUTTONS; i++) {
        prev[i] = curr[i];
      }
      if (curr[BTN_A]) {
        mouse_hold_frames++;
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
      const t = Math.min(1, mouse_hold_frames / MAX_MOUSE_HOLD_FRAMES);
      if (t > 0) {
        if (this.held(BTN_LEFT)) return -Math.sqrt(t);
        if (this.held(BTN_RIGHT)) return Math.sqrt(t);
        return 0;
      }
      if (this.held(BTN_LEFT)) return -DIRECTIONAL_ANGLE;
      if (this.held(BTN_RIGHT)) return DIRECTIONAL_ANGLE;
      return 0;
    },

    get_shot_type() {
      if (!this.pressed(BTN_B)) return null;
      if (this.held(BTN_UP)) return HIT_TOPSPIN;
      if (this.held(BTN_DOWN)) return HIT_SLICE;
      return HIT_FLAT;
    },
  };
}

export const input = createInput(KEY_MAP_BOTH, true);
