import { SCREEN_W, SCREEN_H, FOV, COURT_LENGTH, DEPTH_CHARS } from "./constants.js";
import { printChar } from "./render.js";

export const camera = {
  x: 0, y: 0, z: 0,

  init(cx, cy, cz) {
    this.x = cx;
    this.y = cy;
    this.z = cz;
  },

  project(world_x, world_y, world_z) {
    const dz = world_z - this.z;
    if (dz <= 0.01) return null;

    const dx = world_x - this.x;
    const dy = this.y - world_y;

    const scale = FOV / dz;
    const sx = SCREEN_W / 2 + dx * scale;
    const sy = SCREEN_H / 2 - dy * scale;

    if (sx < -SCREEN_W*2 || sx > SCREEN_W*3) return null;
    if (sy < -SCREEN_H*2 || sy > SCREEN_H*3) return null;

    const depth = dz / (COURT_LENGTH * 1.5);
    return { sx, sy, depth };
  },

  depth_char(depth) {
    if (depth < 0) depth = 0;
    if (depth > 1) depth = 1;
    const idx = Math.floor(depth * (DEPTH_CHARS.length - 1));
    return DEPTH_CHARS[idx];
  },

  project_char(world_x, world_y, world_z) {
    const p = this.project(world_x, world_y, world_z);
    if (!p) return null;
    return { sx: p.sx, sy: p.sy, ch: this.depth_char(p.depth) };
  },

  draw_line(x1, y1, z1, x2, y2, z2) {
    const near = 0.02;
    if ((z1 - this.z <= near) && (z2 - this.z <= near)) return;

    if (z1 - this.z <= near) {
      const t = (near - (z1 - this.z)) / ((z2 - this.z) - (z1 - this.z) + 0.001);
      x1 = x1 + (x2 - x1) * t;
      y1 = y1 + (y2 - y1) * t;
      z1 = this.z + near;
    }
    if (z2 - this.z <= near) {
      const t = (near - (z2 - this.z)) / ((z1 - this.z) - (z2 - this.z) + 0.001);
      x2 = x2 + (x1 - x2) * t;
      y2 = y2 + (y1 - y2) * t;
      z2 = this.z + near;
    }

    const p1 = this.project(x1, y1, z1);
    const p2 = this.project(x2, y2, z2);
    if (!p1 || !p2) return;

    let steps = Math.max(1, Math.abs(p2.sx - p1.sx), Math.abs(p2.sy - p1.sy));
    if (steps > 50) steps = 50;
    const n = Math.floor(steps);

    for (let i = 0; i <= n; i++) {
      const t = i / steps;
      const sx = p1.sx + (p2.sx - p1.sx) * t;
      const sy = p1.sy + (p2.sy - p1.sy) * t;
      const depth = p1.depth + (p2.depth - p1.depth) * t;
      const ch = this.depth_char(depth);

      const ix = Math.floor(sx + 0.5);
      const iy = Math.floor(sy + 0.5);
      if (ix >= 0 && ix < SCREEN_W && iy >= 0 && iy < SCREEN_H) {
        printChar(ch, ix, iy);
      }
    }
  },

  draw_rect(x1, z1, x2, z2, y) {
    y = y || 0;
    this.draw_line(x1, y, z1, x2, y, z1);
    this.draw_line(x2, y, z1, x2, y, z2);
    this.draw_line(x2, y, z2, x1, y, z2);
    this.draw_line(x1, y, z2, x1, y, z1);
  },
};
