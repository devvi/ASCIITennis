import { SCREEN_W, SCREEN_H, FOCAL, CAM_HEIGHT, CAM_Z, HORIZON_Y, CAM_PITCH } from './constants.js';

let printChar = () => {};

export function setDrawChar(fn) {
  printChar = fn;
}

export const camera = {
  init(pitch = CAM_PITCH) {
    this.pitch = pitch;
  },

  init_pong() {
    this.pitch = 0;
  },

  project(x, y, z) {
    const dx = x;
    const dy = y - CAM_HEIGHT;
    const dz = z - CAM_Z;
    const pitch = this.pitch;
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const dyR = dy * cosP - dz * sinP;
    const dzR = dy * sinP + dz * cosP;
    if (dzR <= 0.01) return null;
    const scale = FOCAL / dzR;
    const sx = SCREEN_W / 2 + dx * scale;
    const sy = HORIZON_Y - dyR * scale;
    return { sx, sy, scale };
  },

  draw_char(x, y, z, ch) {
    const p = this.project(x, y, z);
    if (!p) return;
    const ix = Math.round(p.sx);
    const iy = Math.round(p.sy);
    if (ix >= 0 && ix < SCREEN_W && iy >= 0 && iy < SCREEN_H) {
      printChar(ch, ix, iy);
    }
  },

  draw_line(x1, y1, z1, x2, y2, z2, ch) {
    const p1 = this.project(x1, y1, z1);
    const p2 = this.project(x2, y2, z2);
    if (!p1 || !p2) return;
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
