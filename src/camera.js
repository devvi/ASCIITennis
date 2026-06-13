import { SCREEN_W, SCREEN_H, COURT_LENGTH, COURT_WIDTH, HUD_HEIGHT, STATUS_HEIGHT, COURT_PADDING } from './constants.js';

let printChar = () => {};

export function setDrawChar(fn) {
  printChar = fn;
}

export const camera = {
  scaleX: 1,
  scaleZ: 1,
  offsetX: 0,
  offsetY: 0,

  init() {
    const availW = SCREEN_W - COURT_PADDING * 2;
    const availH = SCREEN_H - HUD_HEIGHT - STATUS_HEIGHT;
    this.scaleX = availW / COURT_WIDTH;
    this.scaleZ = availH / COURT_LENGTH;
    this.offsetX = COURT_PADDING;
    this.offsetY = HUD_HEIGHT;
  },

  world_to_screen(x, z) {
    const sx = this.offsetX + (x + COURT_WIDTH / 2) * this.scaleX;
    const sy = this.offsetY + z * this.scaleZ;
    return { sx, sy };
  },

  draw_char(x, z, ch) {
    const p = this.world_to_screen(x, z);
    const ix = Math.round(p.sx);
    const iy = Math.round(p.sy);
    if (ix >= 0 && ix < SCREEN_W && iy >= 0 && iy < SCREEN_H) {
      printChar(ch, ix, iy);
    }
  },

  draw_line(x1, z1, x2, z2, ch) {
    const p1 = this.world_to_screen(x1, z1);
    const p2 = this.world_to_screen(x2, z2);
    const steps = Math.max(1, Math.round(Math.max(Math.abs(p2.sx - p1.sx), Math.abs(p2.sy - p1.sy))));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const sx = Math.round(p1.sx + (p2.sx - p1.sx) * t);
      const sy = Math.round(p1.sy + (p2.sy - p1.sy) * t);
      if (sx >= 0 && sx < SCREEN_W && sy >= 0 && sy < SCREEN_H) {
        printChar(ch, sx, sy);
      }
    }
  },
};
